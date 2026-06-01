const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const logger     = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET || "oncosense_dev_secret";

let io;

// Track rooms: roomId -> Set of socket ids
const rooms = {};

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET","POST"],
      credentials: true
    },
    transports: ["websocket","polling"],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Auth middleware
  io.use(function(socket, next) {
    var token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      // Allow unauthenticated connections with limited access
      socket.userId = null;
      socket.userRole = "guest";
      return next();
    }
    try {
      var decoded = jwt.verify(token, JWT_SECRET);
      socket.userId   = decoded.id;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      next();
    } catch(err) {
      socket.userId = null;
      socket.userRole = "guest";
      next();
    }
  });

  io.on("connection", function(socket) {
    logger.info("Socket connected: " + socket.id + " user=" + (socket.userId || "guest"));

    // ── Join consultation room
    socket.on("join_consultation", function(data) {
      var consultationId = data.consultation_id;
      if (!consultationId) return;

      var roomKey = "consultation:" + consultationId;
      socket.join(roomKey);

      // Track room membership
      if (!rooms[roomKey]) rooms[roomKey] = new Set();
      rooms[roomKey].add(socket.id);

      logger.info("Joined room " + roomKey + " user=" + socket.userId);

      // Mark consultation as active if clinician joins
      if (socket.userRole === "clinician" || socket.userRole === "health_worker") {
        try {
          var { query } = require("../config/database");
          query(
            "UPDATE consultations SET status = 'active', started_at = COALESCE(started_at, NOW()) WHERE id = $1",
            [consultationId]
          ).catch(function(e) { logger.warn("Status update warn:", e.message); });
        } catch(e) {}
      }

      // Notify others in room that user joined
      socket.to(roomKey).emit("user_joined", {
        user_id: socket.userId,
        role: socket.userRole
      });
    });

    // ── Send message
    socket.on("send_message", async function(data) {
      var consultationId = data.consultation_id;
      var content        = data.content;

      if (!consultationId || !content || !content.trim()) return;
      if (!socket.userId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      var roomKey = "consultation:" + consultationId;
      var msgId   = uuidv4();

      try {
        var { query } = require("../config/database");

        // Get sender info
        var userRes = await query(
          "SELECT first_name, last_name, role FROM users WHERE id = $1",
          [socket.userId]
        );
        var sender = userRes.rows[0] || { first_name: "User", last_name: "", role: "patient" };

        // Save message to DB
        await query(
          `INSERT INTO messages (id, consultation_id, sender_id, content, message_type)
           VALUES ($1, $2, $3, $4, 'text')`,
          [msgId, consultationId, socket.userId, content.trim()]
        );

        var messagePayload = {
          id:             msgId,
          consultation_id: consultationId,
          sender_id:      socket.userId,
          content:        content.trim(),
          message_type:   "text",
          first_name:     sender.first_name,
          last_name:      sender.last_name,
          sender_role:    sender.role,
          created_at:     new Date().toISOString(),
          is_read:        false
        };

        // Broadcast to all in the room (including sender)
        io.to(roomKey).emit("new_message", messagePayload);
        logger.info("Message sent in " + roomKey + " by " + socket.userId);

      } catch(err) {
        logger.error("Message send error:", err.message);
        socket.emit("message_error", { error: "Failed to send message" });
      }
    });

    // ── Typing indicator
    socket.on("typing", function(data) {
      if (!data.consultation_id) return;
      var roomKey = "consultation:" + data.consultation_id;
      socket.to(roomKey).emit("user_typing", {
        user_id: socket.userId,
        role: socket.userRole
      });
    });

    // ── WebRTC signaling — relay offer/answer/ice between peers in the room
    socket.on("webrtc_offer", function(data) {
      if (!data.consultation_id) return;
      var roomKey = "consultation:" + data.consultation_id;
      logger.info("WebRTC offer in " + roomKey);
      socket.to(roomKey).emit("webrtc_offer", {
        offer: data.offer,
        from: socket.id
      });
      // Notify room a call has started
      socket.to(roomKey).emit("incoming_call", {
        from: socket.userId,
        consultation_id: data.consultation_id
      });
    });

    socket.on("webrtc_answer", function(data) {
      if (!data.consultation_id) return;
      var roomKey = "consultation:" + data.consultation_id;
      logger.info("WebRTC answer in " + roomKey);
      socket.to(roomKey).emit("webrtc_answer", {
        answer: data.answer,
        from: socket.id
      });
    });

    socket.on("webrtc_ice_candidate", function(data) {
      if (!data.consultation_id) return;
      var roomKey = "consultation:" + data.consultation_id;
      socket.to(roomKey).emit("webrtc_ice_candidate", {
        candidate: data.candidate,
        from: socket.id
      });
    });

    socket.on("call_started", function(data) {
      if (!data.consultation_id) return;
      var roomKey = "consultation:" + data.consultation_id;
      socket.to(roomKey).emit("call_started", { from: socket.userId });
    });

    socket.on("call_ended", function(data) {
      if (!data.consultation_id) return;
      var roomKey = "consultation:" + data.consultation_id;
      socket.to(roomKey).emit("call_ended", { from: socket.userId });
      logger.info("Call ended in " + roomKey);
    });

    // ── Leave room
    socket.on("leave_consultation", function(data) {
      if (!data.consultation_id) return;
      var roomKey = "consultation:" + data.consultation_id;
      socket.leave(roomKey);
      if (rooms[roomKey]) rooms[roomKey].delete(socket.id);
      socket.to(roomKey).emit("user_left", { user_id: socket.userId });
    });

    // ── Disconnect
    socket.on("disconnect", function(reason) {
      logger.info("Socket disconnected: " + socket.id + " reason=" + reason);
      // Clean up room tracking
      for (var key in rooms) {
        if (rooms[key].has(socket.id)) {
          rooms[key].delete(socket.id);
          socket.to(key).emit("user_left", { user_id: socket.userId });
        }
      }
    });
  });

  logger.info("Socket.IO initialized");
  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO not initialised");
  return io;
}

module.exports = { initSocket, getIO };
