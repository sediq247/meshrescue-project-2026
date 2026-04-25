/// ============================================================
/// MeshRescue | Structured Logger (Vertex Observability Layer)
/// ============================================================
/// Provides consistent logs across:
/// - frontend swarm
/// - protocol engine
/// - backend consensus node
/// ============================================================

export const Logger = {

    info(msg, data = {}) {
        console.log(`🟦 [INFO] ${msg}`, data);
    },

    warn(msg, data = {}) {
        console.warn(`🟨 [WARN] ${msg}`, data);
    },

    error(msg, data = {}) {
        console.error(`🟥 [ERROR] ${msg}`, data);
    },

    swarm(msg, data = {}) {
        console.log(`🧠 [SWARM] ${msg}`, data);
    },

    consensus(msg, data = {}) {
        console.log(`⚖️ [CONSENSUS] ${msg}`, data);
    },

    event(msg, data = {}) {
        console.log(`📡 [EVENT] ${msg}`, data);
    }
};