// =============================================================================
// MeshRescue | Event Schema (Vertex-Aligned Contract Layer)
// =============================================================================
// Single source of truth for ALL system events:
// - frontend (protocol.js, agents.js)
// - backend (server.js)
// - consensus engine
// - Vertex AI layer (analysis only)
// =============================================================================

import crypto from "crypto";

// ===============================
// CORE EVENT TYPES
// ===============================
export const EVENT_TYPES = Object.freeze({

    // ===============================
    // AGENT LIFECYCLE
    // ===============================
    AGENT_JOIN: "AGENT_JOIN",
    AGENT_MOVE: "AGENT_MOVE",
    AGENT_DOWN: "AGENT_DOWN",

    // ===============================
    // TASK SYSTEM
    // ===============================
    TASK_ANNOUNCE: "TASK_ANNOUNCE",
    TASK_CLAIM: "TASK_CLAIM",
    TASK_COMPLETE: "TASK_COMPLETE",
    TASK_RELEASE: "TASK_RELEASE",

    // ===============================
    // NETWORK / SWARM LAYER
    // ===============================
    DISCOVERY: "DISCOVERY",
    HEARTBEAT: "HEARTBEAT",
    NODE_DOWN: "NODE_DOWN",

    // ===============================
    // GOSSIP / DAG CONSENSUS
    // ===============================
    GOSSIP_EVENT: "GOSSIP_EVENT",
    SYNC_REQUEST: "SYNC_REQUEST",
    SYNC_RESPONSE: "SYNC_RESPONSE",

    // ===============================
    // 🔥 VERTEX / CONSENSUS LAYER (NEW)
    // ===============================
    CONSENSUS_ROUND_START: "CONSENSUS_ROUND_START",
    CONSENSUS_ROUND_END: "CONSENSUS_ROUND_END",

    STATE_SYNC: "STATE_SYNC",
    STATE_SNAPSHOT: "STATE_SNAPSHOT",

    VERTEX_GOSSIP: "VERTEX_GOSSIP",

    BYZANTINE_DETECTED: "BYZANTINE_DETECTED",
    ANOMALY_ALERT: "ANOMALY_ALERT"
});

// ===============================
// EVENT FACTORY (SAFE CREATION)
// ===============================
export const createEvent = (type, payload = {}, meta = {}) => {

    return {
        id: crypto.randomUUID(),
        type,
        payload,

        timestamp: Date.now(),

        // DAG / lineage tracking (important for Vertex-style graph)
        parents: meta.parents || [],

        meta: {
            createdBy: meta.createdBy || "system",
            round: meta.round || 0,
            confidence: meta.confidence ?? null,
            ...meta
        }
    };
};

export const isValidEvent = (event) => {
    if (!event) return false;
    if (!event.id || !event.type) return false;
    if (!Object.values(EVENT_TYPES).includes(event.type)) return false;
    return true;
};
