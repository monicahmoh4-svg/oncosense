const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET || "oncosense_jwt_secret_dev";

let io;

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("No token"));

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // ── Join consultation room
    socket.on("join_consultation", async ({ consultation_id }) => {
      try {
        // Verify user is part of this consultation
        const result = await query(
          `SELECT id FROM consultations
           WHERE id = $1 AND (patient_id = $2 OR clinician_id = $2 OR health_worker_id = $2)`,
          [consultation_id, socket.userId]
        );

        if (result.rows.length === 0) {
          socket.emit("error", { message: "Not authorized for this consultation" });
          return;
        }

        socket.join(`consultation:${consultation_id}`);
        socket.emit("joined_consultation", { consultation_id });

        // Notify others
        socket.to(`consultation:${consultation_id}`).emit("participant_joined", {
          user_id: socket.userId,
          role: socket.userRole
        });

        // Update consultation status if clinician joins
        if (socket.userRole === "clinician") {
          await query(
            `UPDATE consultations SET status = 'active', started_at = COALESCE(started_at, NOW())
             WHERE id = $1 AND status = 'pending'`,
            [consultation_id]
          );
        }
      } catch (err) {
        logger.error("join_consultation error:", err);
      }
    });

    // ── Send message
    socket.on("send_message", async ({ consultation_id, content, message_type = "text" }) => {
      try {
        if (!content?.trim()) return;

        const msgId = uuidv4();
        await query(
          `INSERT INTO messages (id, consultation_id, sender_id, content, message_type)
           VALUES ($1, $2, $3, $4, $5)`,
          [msgId, consultation_id, socket.userId, content.trim(), message_type]
        );

        // Get sender info
        const userResult = await query(
          "SELECT first_name, last_name, role FROM users WHERE id = $1",
          [socket.userId]
        );
        const sender = userResult.rows[0];

        const message = {
          id: msgId,
          consultation_id,
          sender_id: socket.userId,
          sender_name: `${sender.first_name} ${sender.last_name}`,
          sender_role: sender.role,
          content: content.trim(),
          message_type,
          created_at: new Date().toISOString()
        };

        // Broadcast to consultation room
        io.to(`consultation:${consultation_id}`).emit("new_message", message);

      } catch (err) {
        logger.error("send_message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── WebRTC signaling
    socket.on("webrtc_offer", ({ consultation_id, offer }) => {
      socket.to(`consultation:${consultation_id}`).emit("webrtc_offer", { offer, from: socket.userId });
    });

    socket.on("webrtc_answer", ({ consultation_id, answer }) => {
      socket.to(`consultation:${consultation_id}`).emit("webrtc_answer", { answer, from: socket.userId });
    });

    socket.on("webrtc_ice_candidate", ({ consultation_id, candidate }) => {
      socket.to(`consultation:${consultation_id}`).emit("webrtc_ice_candidate", { candidate, from: socket.userId });
    });

    socket.on("call_started", ({ consultation_id }) => {
      socket.to(`consultation:${consultation_id}`).emit("incoming_call", { from: socket.userId });
    });

    socket.on("call_ended", ({ consultation_id }) => {
      socket.to(`consultation:${consultation_id}`).emit("call_ended");
    });

    // ── Typing indicator
    socket.on("typing", ({ consultation_id }) => {
      socket.to(`consultation:${consultation_id}`).emit("user_typing", { user_id: socket.userId });
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

exports.getIO = () => io;
