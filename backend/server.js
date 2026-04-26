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
// STATE
// ===============================
const agents = new Map();
const tasks = new Map();
const events = new Map();

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
// BROADCAST UTIL
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
// VERTEX AI
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
// EVENT ENGINE (DAG + P2P)
// ===============================
async function createEvent({ creator, type, payload }) {

    const event = {
        id: crypto.randomUUID(),
        creator,
        type,
        payload,
        timestamp: Date.now(),
        parents: []
    };

    events.set(event.id, event);

    await applyEvent(event);

    gossip(event);
    syncState(event);

    return event;
}

// ===============================
// STATE TRANSITIONS
// ===============================
async function applyEvent(event) {

    const { type, payload } = event;

    if (type === "TASK_CREATE") {

        const ai = await vertexAnalyze(
            `Classify emergency priority (low, medium, high): ${JSON.stringify(payload)}`
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

        // release tasks owned by dead agent
        for (const t of tasks.values()) {
            if (t.claimedBy === payload.agentId) {
                t.claimedBy = null;
            }
        }
    }
}

// ===============================
// GOSSIP (P2P SIMULATION)
// ===============================
function gossip(event) {

    const packet = JSON.stringify({
        type: "GOSSIP_EVENT",
        event
    });

    for (const client of wss.clients) {
        if (client.readyState === 1 && Math.random() > 0.25) {
            client.send(packet);
        }
    }
}

// ===============================
// STATE SYNC (FIXED CRITICAL BUG)
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
            type: event.type,
            timestamp: event.timestamp
        }
    });
}

// ===============================
// TASK GENERATION
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
// WEBSOCKET
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

        // REGISTER AGENT (FIXED SYNC ISSUE)
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

            // immediate sync to all clients
            syncState({ id: "init", type: "INIT", timestamp: Date.now() });

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
    console.log("🚀 MeshRescue Vertex Swarm Running");
    console.log(`🌐 http://localhost:${PORT}`);
});
