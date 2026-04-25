import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

import { CONFIG } from "../shared/config.js";
import { EVENT_TYPES } from "../shared/events.js";
import { Logger } from "../shared/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// VERTEX AI CONFIG
// ===============================
const VERTEX_API_KEY = process.env.VERTEX_API_KEY;
const VERTEX_MODEL = process.env.VERTEX_MODEL || "gemini-1.5-flash";

// ===============================
// EXPRESS SERVER INIT
// ===============================
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "../")));

app.get("/", (_, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});

// ===============================
// VERTEX AI FUNCTION LAYER
// ===============================
async function vertexAnalyze(prompt) {
    if (!VERTEX_API_KEY) return null;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${VERTEX_MODEL}:generateContent?key=${VERTEX_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ]
                })
            }
        );

        const data = await res.json();

        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    } catch (err) {
        Logger.error("Vertex AI Error", err);
        return null;
    }
}

// ===============================
// EVENT STRUCTURE
// ===============================
class HashgraphEvent {
    constructor({ creator, type, payload }) {
        this.id = crypto.randomUUID();
        this.creator = creator;
        this.type = type;
        this.payload = payload;

        this.timestamp = Date.now();
        this.signature = crypto.randomBytes(12).toString("hex");

        this.consensusTimestamp = null;
    }
}

// ===============================
// CONSENSUS ENGINE
// ===============================
class ConsensusEngine {
    constructor() {
        this.events = new Map();
        this.peers = new Map();

        this.state = {
            tasks: new Map(),
            agents: new Map(),
        };
    }

    // ===============================
    // PEER MANAGEMENT
    // ===============================
    registerPeer(ws, agentId) {
        const peer = {
            ws,
            agentId,
            events: new Set(),
            lastSeen: Date.now()
        };

        this.peers.set(agentId, peer);

        this.state.agents.set(agentId, {
            id: agentId,
            x: 0,
            y: 0,
            status: "idle"
        });

        Logger.info("Agent joined", { agentId });

        return peer;
    }

    removePeer(agentId) {
        this.peers.delete(agentId);
        this.state.agents.delete(agentId);

        Logger.warn("Agent removed", { agentId });
    }

    // ===============================
    // EVENT CREATION
    // ===============================
    async createEvent(creator, type, payload) {

        const event = new HashgraphEvent({
            creator,
            type,
            payload
        });

        this.events.set(event.id, event);

        // ===============================
        // VERTEX AI INTELLIGENCE LAYER
        // ===============================
        if (type === EVENT_TYPES.TASK_ANNOUNCE) {

            const ai = await vertexAnalyze(
                `Rate emergency priority (low, medium, high) and explain briefly:
                ${JSON.stringify(payload)}`
            );

            payload.aiInsight = ai || "no-ai-response";

            this.state.tasks.set(payload.id, {
                ...payload,
                claimedBy: null,
                completed: false
            });
        }

        if (type === EVENT_TYPES.TASK_CLAIM) {
            const task = this.state.tasks.get(payload.taskId);
            if (task && !task.claimedBy) {
                task.claimedBy = payload.agentId;
            }
        }

        if (type === EVENT_TYPES.TASK_COMPLETE) {
            const task = this.state.tasks.get(payload.taskId);
            if (task && task.claimedBy === payload.agentId) {
                task.completed = true;
            }
        }

        if (type === EVENT_TYPES.AGENT_MOVE) {
            const agent = this.state.agents.get(payload.agentId);
            if (agent) {
                agent.x = payload.x;
                agent.y = payload.y;
            }
        }

        if (type === EVENT_TYPES.AGENT_DOWN) {
            this.state.agents.delete(payload.agentId);
        }

        this.gossip(event);
        this.broadcast(event);

        return event;
    }

    // ===============================
    // GOSSIP SYSTEM
    // ===============================
    gossip(event) {
        const packet = JSON.stringify({
            type: EVENT_TYPES.GOSSIP_EVENT,
            event
        });

        for (const peer of this.peers.values()) {
            if (peer.ws.readyState === 1) {
                peer.ws.send(packet);
            }
        }
    }

    // ===============================
    // STATE BROADCAST
    // ===============================
    broadcast(event) {
        const payload = JSON.stringify({
            type: "STATE_UPDATE",
            state: {
                tasks: Array.from(this.state.tasks.values()),
                agents: Array.from(this.state.agents.values())
            },
            meta: {
                eventId: event.id,
                type: event.type,
                timestamp: event.timestamp
            }
        });

        for (const peer of this.peers.values()) {
            if (peer.ws.readyState === 1) {
                peer.ws.send(payload);
            }
        }
    }
}

// ===============================
// ENGINE INSTANCE
// ===============================
const consensus = new ConsensusEngine();

// ===============================
// WEBSOCKET LAYER
// ===============================
wss.on("connection", (ws) => {

    let agentId = null;

    ws.on("message", async (raw) => {

        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }

        if (msg.type === "REGISTER") {
            agentId = msg.id;
            consensus.registerPeer(ws, agentId);
            return;
        }

        if (msg.type === "EVENT") {
            await consensus.createEvent(
                agentId,
                msg.payload.type,
                msg.payload.data
            );
        }
    });

    ws.on("close", () => {
        if (agentId) consensus.removePeer(agentId);
    });

    ws.send(JSON.stringify({ type: "READY" }));
});

// ===============================
// START SERVER
// ===============================
server.listen(CONFIG.PORT, () => {
    Logger.info("MeshRescue Vertex AI Node running", {
        url: `http://localhost:${CONFIG.PORT}`,
        mode: "AI + Consensus Hybrid System"
    });
});