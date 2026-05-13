import Dexie from 'dexie'

// IndexedDB database for offline-first capability
const db = new Dexie('OncoSenseOffline')

db.version(1).stores({
  pendingAssessments: '++id, userId, createdAt, synced',
  cachedResults: 'id, userId, riskLevel, createdAt',
  cachedClinics: 'id, country, region',
  pendingConsultations: '++id, userId, createdAt, synced',
  userProfile: 'userId',
  offlineMessages: '++id, consultationId, createdAt, synced',
})

// ── Offline Assessment Queue
export const offlineQueue = {
  async saveAssessment(userId, data) {
    return await db.pendingAssessments.add({
      userId,
      data,
      createdAt: new Date().toISOString(),
      synced: false
    })
  },

  async getPending(userId) {
    return await db.pendingAssessments
      .where('userId').equals(userId)
      .and(item => !item.synced)
      .toArray()
  },

  async markSynced(id) {
    return await db.pendingAssessments.update(id, { synced: true })
  },

  async clearSynced() {
    return await db.pendingAssessments.where('synced').equals(1).delete()
  }
}

// ── Cache assessment results
export const cacheManager = {
  async saveResult(result) {
    return await db.cachedResults.put(result)
  },

  async getResults(userId) {
    return await db.cachedResults.where('userId').equals(userId).toArray()
  },

  async saveClinics(clinics) {
    await db.cachedClinics.clear()
    return await db.cachedClinics.bulkPut(clinics)
  },

  async getClinics() {
    return await db.cachedClinics.toArray()
  },

  async saveProfile(userId, profile) {
    return await db.userProfile.put({ userId, ...profile })
  },

  async getProfile(userId) {
    return await db.userProfile.get(userId)
  }
}

// ── Sync manager — syncs when online
export const syncManager = {
  async syncPending(userId, api) {
    if (!navigator.onLine) return { synced: 0, failed: 0 }

    const pending = await offlineQueue.getPending(userId)
    let synced = 0, failed = 0

    for (const item of pending) {
      try {
        const res = await api.post('/assessments', item.data)
        await offlineQueue.markSynced(item.id)
        await cacheManager.saveResult(res.data)
        synced++
      } catch {
        failed++
      }
    }

    return { synced, failed }
  }
}

// Listen for online event to trigger sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('OncoSense: Back online — syncing pending data...')
    // Trigger sync via event
    window.dispatchEvent(new CustomEvent('oncosense:sync'))
  })
}

export default db
