// =============================================================================
// MeshRescue | Vertex Swarm Consensus Server (P2P + Gossip + AI)
// =============================================================================

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import "dotenv/config";
// ===============================
// PATH SETUP (ESM SAFE)
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// SERVER INIT
// ===============================
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "../")));

app.get("/", (_, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});

// ===============================
// CONFIG
// ===============================
const PORT = process.env.PORT || 3000;
const VERTEX_API_KEY = process.env.VERTEX_API_KEY;
const VERTEX_MODEL = process.env.VERTEX_MODEL || "gemini-1.5-flash";

// ===============================
// GLOBAL STATE (LIGHTWEIGHT)
// ===============================
const agents = new Map();
const tasks = new Map();
const events = new Map(); // DAG storage

// ===============================
// TASK POOL
// ===============================
const TASK_POOL = [
    { name: "Hospital Emergency", x: 120, y: 150 },
    { name: "Flood Zone", x: 420, y: 300 },
    { name: "Building Fire", x: 700, y: 200 },
    { name: "Traffic Accident", x: 600, y: 420 },
    { name: "Gas Leak", x: 250, y: 360 }
];

// ===============================
// VERTEX AI (OPTIONAL)
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
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await res.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    } catch {
        return null;
    }
}

// ===============================
// EVENT (VERTEX STYLE)
// ===============================
function createEvent({ creator, type, payload }) {

    const event = {
        id: crypto.randomUUID(),
        creator,
        type,
        payload,
        timestamp: Date.now(),
        parents: [], // DAG placeholder
    };

    events.set(event.id, event);

    applyEvent(event);
    gossipEvent(event);
    broadcastState(event);

    return event;
}

// ===============================
// APPLY EVENT → STATE TRANSITION
// ===============================
async function applyEvent(event) {

    const { type, payload } = event;

    if (type === "TASK_CREATE") {

        const ai = await vertexAnalyze(
            `Classify emergency priority and explain briefly: ${JSON.stringify(payload)}`
        );

        tasks.set(payload.id, {
            ...payload,
            claimedBy: null,
            completed: false,
            aiInsight: ai || "no-ai"
        });
    }

    if (type === "TASK_CLAIM") {
        const task = tasks.get(payload.taskId);
        if (task && !task.claimedBy) {
            task.claimedBy = payload.agentId;
        }
    }

    if (type === "TASK_COMPLETE") {
        const task = tasks.get(payload.taskId);
        if (task && task.claimedBy === payload.agentId) {
            task.completed = true;
        }
    }

    if (type === "AGENT_MOVE") {
        const agent = agents.get(payload.agentId);
        if (agent) {
            agent.x = payload.x;
            agent.y = payload.y;
        }
    }

    if (type === "AGENT_DOWN") {
        agents.delete(payload.agentId);
    }
}

// ===============================
// GOSSIP (P2P PROOF 🔥)
// ===============================
function gossipEvent(event) {

    const packet = JSON.stringify({
        type: "GOSSIP_EVENT",
        event
    });

    wss.clients.forEach(client => {
        if (client.readyState === 1 && Math.random() > 0.2) {
            client.send(packet); // partial spread (true gossip behavior)
        }
    });
}

// ===============================
// BROADCAST STATE (UI SYNC)
// ===============================
function broadcastState(event) {

    const payload = JSON.stringify({
        type: "STATE_UPDATE",
        state: {
            tasks: Array.from(tasks.values()),
            agents: Array.from(agents.values())
        },
        meta: {
            eventId: event.id,
            type: event.type,
            timestamp: event.timestamp
        }
    });

    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(payload);
        }
    });
}

// ===============================
// TASK CREATION LOOP
// ===============================
function spawnTask() {

    const base = TASK_POOL[Math.floor(Math.random() * TASK_POOL.length)];

    createEvent({
        creator: "SYSTEM",
        type: "TASK_CREATE",
        payload: {
            id: "T" + Date.now(),
            location: base,
            createdAt: Date.now()
        }
    });
}

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

        // ===========================
        // REGISTER
        // ===========================
        if (msg.type === "REGISTER") {

            agentId = msg.id;

            agents.set(agentId, {
                id: agentId,
                x: Math.random() * 900,
                y: Math.random() * 600,
                status: "idle"
            });

            ws.send(JSON.stringify({
                type: "INIT",
                agents: Array.from(agents.values()),
                tasks: Array.from(tasks.values())
            }));

            return;
        }

        // ===========================
        // EVENT PIPELINE (KEY 🔥)
        // ===========================
        if (msg.type === "EVENT") {

            await createEvent({
                creator: agentId,
                type: msg.payload.type,
                payload: msg.payload.data
            });
        }
    });

    ws.on("close", () => {
        if (!agentId) return;

        createEvent({
            creator: agentId,
            type: "AGENT_DOWN",
            payload: { agentId }
        });
    });

    ws.send(JSON.stringify({ type: "READY" }));
});

// ===============================
// START SERVER
// ===============================
server.listen(PORT, () => {

    console.log("🚀 MeshRescue Vertex Swarm Running");
    console.log(`🌐 http://localhost:${PORT}`);

    setInterval(() => {
        if (Math.random() < 0.7) {
            spawnTask();
        }
    }, 6000);
});
