export const CONFIG = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",

    // ===============================
    // VERTEX / AI LAYER
    // ===============================
    VERTEX: {
        API_KEY: process.env.VERTEX_API_KEY,
        MODEL: process.env.VERTEX_MODEL || "gemini-1.5-flash",
        ENDPOINT: process.env.VERTEX_ENDPOINT,

        ENABLE_REASONING: process.env.VERTEX_REASONING_ENABLED === "true",
        REASONING_LEVEL: process.env.VERTEX_REASONING_DETAIL_LEVEL || "high",
        CONFIDENCE_THRESHOLD: Number(process.env.VERTEX_CONFIDENCE_THRESHOLD || 0.6)
    },

    // ===============================
    // AI UI / JUDGE FEATURES
    // ===============================
    AI_PANEL: {
        ENABLE: process.env.ENABLE_AI_EXPLANATION_PANEL === "true",
        ENABLE_STREAM: process.env.ENABLE_VERTEX_REASONING_STREAM === "true",
        ENABLE_LOGS: process.env.ENABLE_VERTEX_AI_LOGS === "true"
    },

    // ===============================
    // SIMULATION ENGINE
    // ===============================
    SIMULATION: {
        TASK_SPAWN_INTERVAL: Number(process.env.TASK_SPAWN_INTERVAL || 6000),
        TASK_SPAWN_CHANCE: Number(process.env.TASK_SPAWN_CHANCE || 0.7)
    },

    // ===============================
    // NETWORK LAYER
    // ===============================
    NETWORK: {
        LATENCY: Number(process.env.LATENCY_MS || 35),
        PACKET_LOSS: Number(process.env.PACKET_LOSS_RATE || 0.02),
        HEARTBEAT: Number(process.env.HEARTBEAT_INTERVAL_MS || 100),
        GOSSIP: Number(process.env.GOSSIP_INTERVAL_MS || 50)
    },

    // ===============================
    // CONSENSUS ENGINE
    // ===============================
    CONSENSUS: {
        EPOCH_SIZE: Number(process.env.EPOCH_SIZE || 10),
        BYZANTINE_FRACTION: Number(process.env.BYZANTINE_FRACTION || 0.33),
        SUPERMAJORITY: Number(process.env.SUPERMAJORITY_RATIO || 0.67)
    },

    // ===============================
    // FEATURE FLAGS
    // ===============================
    FEATURES: {
        VERTEX_SIMULATION: process.env.ENABLE_VERTEX_SIMULATION === "true",
        BYZANTINE_SIMULATION: process.env.ENABLE_BYZANTINE_SIMULATION === "true",
        REALTIME_VISUALIZATION: process.env.ENABLE_REALTIME_VISUALIZATION === "true",
        DAG_REPLAY: process.env.ENABLE_DAG_REPLAY === "true"
    }
};
