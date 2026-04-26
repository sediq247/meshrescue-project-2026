// ===============================================
// MeshRescue | Vertex Swarm Visualization Engine
// ===============================================

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("swarmCanvas");
    const ctx = canvas.getContext("2d");

    const el = {
        bootStatus: document.getElementById("bootStatus"),

        agentCount: document.getElementById("agentCount"),
        networkStatus: document.getElementById("networkStatus"),
        swarmState: document.getElementById("swarmState"),

        vertexStatus: document.getElementById("vertexStatus"),
        syncStatus: document.getElementById("syncStatus"),
        latencyStatus: document.getElementById("latencyStatus"),
        roundStatus: document.getElementById("roundStatus"),

        zoneInfo: document.getElementById("zoneInfo"),

        activeAgents: document.getElementById("activeAgents"),
        tasksAssigned: document.getElementById("tasksAssigned"),
        tasksCompleted: document.getElementById("tasksCompleted"),
        failures: document.getElementById("failures"),

        logs: document.getElementById("logs"),
        eventStream: document.getElementById("eventStream"),
    };

    // ===============================
    // STATE
    // ===============================
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let running = false;
    let autoFollow = true;

    let vertexReady = false;
    let syncProgress = 0;
    let round = 0;
    let failures = 0;

    const gossipLines = [];

    const getAgents = () => window.swarmAgents || [];
    const getTasks = () => window.globalTasks || [];

    // ===============================
    // BOOT SEQUENCE
    // ===============================
    function bootSequence() {
        const steps = [
            "Loading modules...",
            "Initializing DAG...",
            "Syncing swarm state...",
            "Connecting Vertex protocol...",
            "Finalizing consensus engine..."
        ];

        let i = 0;

        const interval = setInterval(() => {
            if (el.bootStatus) el.bootStatus.textContent = steps[i];

            i++;

            if (i >= steps.length) {
                clearInterval(interval);

                setTimeout(() => {
                    vertexReady = true;
                    if (el.vertexStatus) {
                        el.vertexStatus.innerHTML = `<span class="dot online"></span> Active`;
                    }
                }, 400);
            }
        }, 400);
    }

    // ===============================
    // LOGGING
    // ===============================
    function log(msg) {
        if (!el.logs) return;
        const p = document.createElement("p");
        p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        el.logs.appendChild(p);
        el.logs.scrollTop = el.logs.scrollHeight;
    }

    function eventLog(msg) {
        if (!el.eventStream) return;
        const div = document.createElement("div");
        div.className = "event-item";
        div.textContent = msg;
        el.eventStream.appendChild(div);

        if (el.eventStream.children.length > 40) {
            el.eventStream.removeChild(el.eventStream.firstChild);
        }
    }

    // ===============================
    // CAMERA SYSTEM
    // ===============================
    function autoFit() {
        const agents = getAgents();
        const tasks = getTasks();

        const points = [
            ...tasks.map(t => t?.location).filter(Boolean),
            ...agents
        ];

        if (!points.length) return;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        for (const p of points) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }

        const padding = 150;
        const width = (maxX - minX) + padding;
        const height = (maxY - minY) + padding;

        zoom = Math.min(canvas.width / width, canvas.height / height, 1.6);

        offsetX = -(minX - padding / 2) * zoom;
        offsetY = -(minY - padding / 2) * zoom;
    }

    function updateCamera() {
        if (!autoFollow) return;

        const agents = getAgents();
        const tasks = getTasks();

        const all = [
            ...tasks.map(t => t?.location).filter(Boolean),
            ...agents
        ];

        if (!all.length) return;

        let cx = 0, cy = 0;

        for (const p of all) {
            cx += p.x;
            cy += p.y;
        }

        cx /= all.length;
        cy /= all.length;

        offsetX = canvas.width / 2 - cx * zoom;
        offsetY = canvas.height / 2 - cy * zoom;
    }

    // ===============================
    // GOSSIP LINES (P2P VISUALIZATION)
    // ===============================
    function drawGossip() {
        for (let i = gossipLines.length - 1; i >= 0; i--) {

            const g = gossipLines[i];

            if (!g.from || !g.to) {
                gossipLines.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.moveTo(g.from.x, g.from.y);
            ctx.lineTo(g.to.x, g.to.y);

            ctx.strokeStyle = `rgba(34,197,94,${g.life / 40})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            g.life--;

            if (g.life <= 0) {
                gossipLines.splice(i, 1);
            }
        }
    }

    // Listen for gossip events from protocol
    window.addEventListener("gossip-event", (e) => {

        const event = e.detail;
        if (!event?.creator) return;

        const agents = getAgents();
        const from = agents.find(a => a.id === event.creator);
        if (!from) return;

        const targets = agents
            .filter(a => a.id !== from.id && a.status !== "dead")
            .sort(() => 0.5 - Math.random())
            .slice(0, 2);

        for (const t of targets) {
            gossipLines.push({ from, to: t, life: 40 });
        }

        eventLog(`📡 ${event.type} from ${event.creator}`);
    });

    // ===============================
    // DRAW SYSTEM
    // ===============================
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(zoom, zoom);

        drawGrid();
        drawTasks();
        drawConnections();
        drawGossip(); // 🔥 P2P VISUAL LAYER
        drawAgents();

        ctx.restore();
    }

    function drawGrid() {
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;

        const size = 60;

        for (let x = -1000; x < canvas.width + 1000; x += size) {
            ctx.beginPath();
            ctx.moveTo(x, -1000);
            ctx.lineTo(x, canvas.height + 1000);
            ctx.stroke();
        }

        for (let y = -1000; y < canvas.height + 1000; y += size) {
            ctx.beginPath();
            ctx.moveTo(-1000, y);
            ctx.lineTo(canvas.width + 1000, y);
            ctx.stroke();
        }
    }

    function drawTasks() {
        const tasks = getTasks();

        for (const task of tasks) {
            if (!task?.location) continue;

            const loc = task.location;

            let color = "#ef4444";
            if (task.completed) color = "#64748b";
            else if (task.claimedBy) color = "#f59e0b";

            ctx.beginPath();
            ctx.arc(loc.x, loc.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.fillStyle = "#fff";
            ctx.font = "9px Arial";
            ctx.fillText(loc.name || "task", loc.x + 8, loc.y - 6);
        }
    }

    function drawAgents() {
        const agents = getAgents();

        for (const agent of agents) {
            if (!agent) continue;

            ctx.beginPath();
            ctx.arc(agent.x, agent.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = agent.status === "busy" ? "#f59e0b" : "#22c55e";
            ctx.fill();

            ctx.fillStyle = "#ccc";
            ctx.font = "8px Arial";
            ctx.fillText(agent.id, agent.x + 6, agent.y - 6);
        }
    }

    function drawConnections() {
        const agents = getAgents();

        for (const agent of agents) {
            if (!agent?.target) continue;

            ctx.beginPath();
            ctx.moveTo(agent.x, agent.y);
            ctx.lineTo(agent.target.x, agent.target.y);
            ctx.strokeStyle = "rgba(245,158,11,0.3)";
            ctx.stroke();
        }
    }

    // ===============================
    // UI UPDATE
    // ===============================
    function updateUI() {

        const agents = getAgents();
        const tasks = getTasks();

        el.agentCount.textContent = agents.length;
        el.activeAgents.textContent = agents.filter(a => a?.status !== "dead").length;
        el.tasksAssigned.textContent = tasks.length;
        el.tasksCompleted.textContent = tasks.filter(t => t?.completed).length;

        if (vertexReady) syncProgress = Math.min(100, syncProgress + Math.random() * 5);
        el.syncStatus.textContent = `${Math.floor(syncProgress)}%`;

        el.latencyStatus.textContent = `${Math.floor(20 + Math.random() * 40)}ms`;

        if (running && Math.random() < 0.05) round++;
        el.roundStatus.textContent = round;

        const Protocol = window.MeshProtocol;

        if (Protocol?.isConnected?.()) {
            el.networkStatus.textContent = "Connected";
            el.networkStatus.style.color = "#22c55e";
        } else {
            el.networkStatus.textContent = "Local";
            el.networkStatus.style.color = "#f59e0b";
        }

        el.failures.textContent = failures;
    }

    // ===============================
    // LOOP
    // ===============================
    function animate() {
        if (!running) return;

        updateCamera();
        updateUI();
        draw();

        requestAnimationFrame(animate);
    }

    // ===============================
    // CONTROLS
    // ===============================
    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const resetBtn = document.getElementById("resetBtn");
    const killAgentBtn = document.getElementById("killAgentBtn");

    startBtn.onclick = () => {
        running = true;
        window.SwarmControl?.start();
        el.swarmState.textContent = "Running";
        log("Swarm started");
        animate();
    };

    pauseBtn.onclick = () => {
        running = false;
        window.SwarmControl?.stop();
        el.swarmState.textContent = "Paused";
        log("Swarm paused");
    };

    resetBtn.onclick = () => {
        running = false;
        window.SwarmControl?.reset();

        zoom = 1;
        offsetX = 0;
        offsetY = 0;

        syncProgress = 0;
        round = 0;

        el.swarmState.textContent = "Idle";

        autoFit();
        draw();

        log("System reset");
    };

    killAgentBtn.onclick = () => {
        const agents = getAgents().filter(a => a?.status !== "dead");
        if (!agents.length) return;

        const agent = agents[Math.floor(Math.random() * agents.length)];

        failures++;

        window.MeshProtocol?.removeAgent(agent.id);

        log(`${agent.id} injected failure`);
    };

    // ===============================
    // INIT
    // ===============================
    el.zoneInfo.textContent = "Vertex Swarm Intelligence Field";

    bootSequence();
    autoFit();
    updateUI();
    draw();
    setInterval(updateUI, 400);
});
