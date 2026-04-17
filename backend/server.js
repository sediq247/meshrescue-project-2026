// MeshRescue | WebSocket Swarm Coordination Core (FINAL DEPLOY VERSION)

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

// ===============================
// INITIALIZATION
// ===============================
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Required for ES modules (handling backend/ subfolder)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// STATIC FRONTEND (ROOT PROJECT)
// ===============================
app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});

// ===============================
// STATE & CONFIG
// ===============================
const agents = new Map();   
const tasks = [];           

const TASK_POOL = [
    { name: "Hospital Emergency", x: 120, y: 150 },
    { name: "Flood Zone", x: 420, y: 300 },
    { name: "Building Fire", x: 700, y: 200 },
    { name: "Traffic Accident", x: 600, y: 420 },
    { name: "Gas Leak", x: 250, y: 360 }
];

// ===============================
// CORE FUNCTIONS
// ===============================

function broadcast(payload) {
    // Safety check to prevent "cannot access before initialization"
    if (!wss || !wss.clients) return;

    const data = JSON.stringify(payload);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(data);
        }
    });
}

function createTask() {
    const base = TASK_POOL[Math.floor(Math.random() * TASK_POOL.length)];
    const task = {
        id: "T" + Date.now(),
        location: base,
        claimedBy: null,
        completed: false,
        createdAt: Date.now()
    };

    tasks.push(task);
    broadcast({ type: "TASK_CREATED", task });
    console.log(`📍 Task injected into swarm: ${task.id}`);
}

function cleanupTasks() {
    for (const task of tasks) {
        if (task.claimedBy && !agents.has(task.claimedBy)) {
            task.claimedBy = null;
            broadcast({ type: "TASK_RELEASED", taskId: task.id });
        }
    }
}

// ===============================
// WEBSOCKET LOGIC
// ===============================
wss.on("connection", (ws) => {
    let agentId = null;
    console.log("🟢 New WebSocket agent connected");

    ws.on("message", (raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch { return; }

        if (msg.type === "REGISTER") {
            agentId = msg.id;
            agents.set(agentId, { id: agentId, x: 0, y: 0, status: "idle" });
            
            ws.send(JSON.stringify({
                type: "INIT",
                agents: Array.from(agents.values()),
                tasks
            }));

            broadcast({ type: "AGENT_JOINED", agent: agents.get(agentId) });
        }

        if (msg.type === "MOVE") {
            const agent = agents.get(agentId);
            if (!agent) return;
            agent.x = msg.x;
            agent.y = msg.y;
            broadcast({ type: "AGENT_MOVED", id: agentId, x: msg.x, y: msg.y });
        }

        if (msg.type === "CLAIM_TASK") {
            const task = tasks.find(t => t.id === msg.taskId);
            if (task && !task.claimedBy) {
                task.claimedBy = agentId;
                broadcast({ type: "TASK_CLAIMED", taskId: task.id, agentId });
            }
        }

        if (msg.type === "COMPLETE_TASK") {
            const task = tasks.find(t => t.id === msg.taskId);
            if (task && !task.completed) {
                task.completed = true;
                broadcast({ type: "TASK_COMPLETED", taskId: task.id, agentId });
            }
        }
    });

    ws.on("close", () => {
        if (!agentId) return;
        agents.delete(agentId);
        broadcast({ type: "AGENT_LEFT", id: agentId });
        cleanupTasks();
        console.log(`🔴 Agent disconnected: ${agentId}`);
    });
});

// ===============================
// SERVER STARTUP
// ===============================
const PORT = process.env.PORT || 3007;

server.listen(PORT, () => {
    console.log("⚡ MeshRescue WebSocket Swarm Engine Initializing...");
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    setInterval(() => {
        if (Math.random() < 0.7) {
            createTask();
        }
    }, 6000);
});