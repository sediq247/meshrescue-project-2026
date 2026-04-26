// =============================================================================
// MeshRescue | Vertex Swarm Consensus Server (FINAL HACKATHON VERSION)
// =============================================================================

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import "dotenv/config";

// ===============================
// PATH SETUP
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
// STATE (DERIVED FROM EVENTS)
// ===============================
const agents = new Map();
const tasks = new Map();
const events = new Map();

// latest known event pointer (DAG head)
let lastEventId = null;

// ===============================
// TASK SEED POOL
// ===============================
const TASK_POOL = [
    { name: "Hospital Emergency", x: 120, y: 150, priority: "high" },
    { name: "Flood Zone", x: 420, y: 300, priority: "high" },
    { name: "Building Fire", x: 700, y: 200, priority: "critical" },
    { name: "Traffic Accident", x: 600, y: 420, priority: "medium" },
    { name: "Gas Leak", x: 250, y: 360, priority: "critical" }
];

// ===============================
// BROADCAST
// ===============================
function broadcast(msg) {
    const data = JSON.stringify(msg);

    for (const client of wss.clients) {
        if (client.readyState === 1) {
            client.send(data);
        }
    }
}

// ===============================
// VERTEX AI (REAL USE)
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
// DAG EVENT CREATION (CORE UPGRADE)
// ===============================
async function createEvent({ creator, type, payload }) {

    const event = {
        id: crypto.randomUUID(),
        creator,
        type,
        payload,
        timestamp: Date.now(),
        parents: lastEventId ? [lastEventId] : [],
        height: events.size
    };

    // update DAG pointer
    lastEventId = event.id;

    // store event
    events.set(event.id, event);

    // apply deterministic state transition
    await applyEvent(event);

    // propagate
    gossip(event);
    syncState(event);

    return event;
}

// ===============================
// VALIDATION LAYER (LIGHT CONSENSUS)
// ===============================
function isValidEvent(event) {

    if (!event || !event.type) return false;

    if (event.type === "TASK_CLAIM") {
        const task = tasks.get(event.payload.taskId);
        if (!task || task.claimedBy) return false;
    }

    if (event.type === "TASK_COMPLETE") {
        const task = tasks.get(event.payload.taskId);
        if (!task || task.claimedBy !== event.payload.agentId) return false;
    }

    return true;
}

// ===============================
// STATE TRANSITION ENGINE
// ===============================
async function applyEvent(event) {

    if (!isValidEvent(event)) return;

    const { type, payload } = event;

    // =========================
    // TASK CREATE (AI PRIORITY)
    // =========================
    if (type === "TASK_CREATE") {

        const ai = await vertexAnalyze(
            `Rank emergency severity (low/medium/high/critical) and justify briefly: ${JSON.stringify(payload)}`
        );

        tasks.set(payload.id, {
            ...payload,
            claimedBy: null,
            completed: false,
            aiInsight: ai || payload.location?.priority || "medium"
        });
    }

    // =========================
    // TASK CLAIM
    // =========================
    if (type === "TASK_CLAIM") {
        const task = tasks.get(payload.taskId);
        if (task && !task.claimedBy) {
            task.claimedBy = payload.agentId;
        }
    }

    // =========================
    // TASK COMPLETE
    // =========================
    if (type === "TASK_COMPLETE") {
        const task = tasks.get(payload.taskId);
        if (task && task.claimedBy === payload.agentId) {
            task.completed = true;
        }
    }

    // =========================
    // AGENT MOVE
    // =========================
    if (type === "AGENT_MOVE") {
        const agent = agents.get(payload.agentId);
        if (agent) {
            agent.x = payload.x;
            agent.y = payload.y;
            agent.status = payload.status || agent.status;
        }
    }

    // =========================
    // AGENT DOWN
    // =========================
    if (type === "AGENT_DOWN") {

        agents.delete(payload.agentId);

        // release tasks (auto-recovery)
        for (const t of tasks.values()) {
            if (t.claimedBy === payload.agentId) {
                t.claimedBy = null;
            }
        }
    }
}

// ===============================
// GOSSIP (DETERMINISTIC TTL STYLE)
// ===============================
function gossip(event) {

    const packet = JSON.stringify({
        type: "GOSSIP_EVENT",
        event,
        ttl: 3
    });

    for (const client of wss.clients) {
        if (client.readyState === 1) {
            client.send(packet);
        }
    }
}

// ===============================
// STATE SYNC (SOURCE OF TRUTH)
// ===============================
function syncState(event) {

    broadcast({
        type: "STATE_UPDATE",
        state: {
            tasks: Array.from(tasks.values()),
            agents: Array.from(agents.values())
        },
        meta: {
            eventId: event.id,
            parents: event.parents,
            timestamp: event.timestamp
        }
    });
}

// ===============================
// TASK GENERATION (AI AWARE)
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

        // REGISTER
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

            syncState({ id: "INIT", type: "INIT", timestamp: Date.now() });
            return;
        }

        // EVENT PIPELINE
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
// TASK LOOP
// ===============================
setInterval(() => {
    if (Math.random() < 0.7) spawnTask();
}, 6000);

// ===============================
// START
// ===============================
server.listen(PORT, () => {
    console.log("🚀 MeshRescue Vertex Swarm (FINAL MODE)");
    console.log(`🌐 http://localhost:${PORT}`);
});
