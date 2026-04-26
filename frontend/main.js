// ===============================================
// MeshRescue | Vertex Swarm Visualization Engine (FINALIST BUILD)
// ===============================================

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("swarmCanvas");
    const ctx = canvas.getContext("2d");

    // ===============================
    // UI ELEMENTS
    // ===============================
    const el = {
        bootStatus: document.getElementById("bootStatus"),

        agentCount: document.getElementById("agentCount"),
        networkStatus: document.getElementById("networkStatus"),
        swarmState: document.getElementById("swarmState"),

        vertexStatus: document.getElementById("vertexStatus"),
        syncStatus: document.getElementById("syncStatus"),
        latencyStatus: document.getElementById("latencyStatus"),
        roundStatus: document.getElementById("roundStatus"),

        activeAgents: document.getElementById("activeAgents"),
        tasksAssigned: document.getElementById("tasksAssigned"),
        tasksCompleted: document.getElementById("tasksCompleted"),
        failures: document.getElementById("failures"),

        logs: document.getElementById("logs"),
        eventStream: document.getElementById("eventStream"),
        peerCount: document.getElementById("peerCount"),
    };

    // ===============================
    // STATE
    // ===============================
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;

    let running = false;
    let vertexReady = false;

    let syncProgress = 0;
    let round = 0;
    let failures = 0;

    const gossipLines = [];

    // ===============================
    // DAG STATE (FINAL FIX)
    // ===============================
    const dagNodes = new Map();
    const dagEdges = [];

    const getAgents = () => window.swarmAgents || [];
    const getTasks = () => window.globalTasks || [];

    // ===============================
    // CANVAS RESIZE
    // ===============================
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    window.addEventListener("resize", resizeCanvas);

    // ===============================
    // BOOT SEQUENCE
    // ===============================
    function bootSequence() {

        const steps = [
            "Loading modules...",
            "Initializing DAG engine...",
            "Syncing swarm state...",
            "Connecting Vertex protocol...",
            "Finalizing consensus layer..."
        ];

        let i = 0;

        const interval = setInterval(() => {

            el.bootStatus.textContent = steps[i];

            i++;

            if (i >= steps.length) {
                clearInterval(interval);

                setTimeout(() => {
                    vertexReady = true;
                    el.vertexStatus.innerHTML = `<span class="dot online"></span> Active`;
                }, 500);
            }

        }, 400);
    }

    // ===============================
    // LOGGING
    // ===============================
    function log(msg) {
        const p = document.createElement("p");
        p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        el.logs.appendChild(p);
        el.logs.scrollTop = el.logs.scrollHeight;
    }

    function eventLog(msg) {
        const div = document.createElement("div");
        div.textContent = msg;
        el.eventStream.prepend(div);

        if (el.eventStream.children.length > 40) {
            el.eventStream.removeChild(el.eventStream.lastChild);
        }
    }

    // ===============================
    // 🔥 REAL DAG INGESTION (FINAL FIX)
    // ===============================
    window.addEventListener("swarm-update", () => {

        const meta = window.__lastEvent;
        if (!meta?.eventId) return;

        if (!dagNodes.has(meta.eventId)) {

            dagNodes.set(meta.eventId, {
                id: meta.eventId,
                type: meta.type,
                timestamp: meta.timestamp,
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height
            });

            const nodes = Array.from(dagNodes.values());

            if (nodes.length > 1) {
                dagEdges.push({
                    from: nodes[nodes.length - 2].id,
                    to: meta.eventId
                });
            }
        }
    });

    // ===============================
    // P2P GOSSIP VISUALIZATION
    // ===============================
    window.addEventListener("gossip-event", (e) => {

        const event = e.detail;
        if (!event?.creator) return;

        const agents = getAgents();
        const from = agents.find(a => a.id === event.creator);
        if (!from) return;

        const targets = agents
            .filter(a => a.id !== from.id && a.status !== "dead")
            .slice(0, 3);

        for (const t of targets) {
            gossipLines.push({
                from,
                to: t,
                life: 50,
                strength: Math.random()
            });
        }

        eventLog(`📡 ${event.type} → ${event.creator}`);
    });

    // ===============================
    // DAG RENDER (FINAL VERSION)
    // ===============================
    function drawDAG() {

        const nodes = Array.from(dagNodes.values());

        // EDGES
        ctx.strokeStyle = "rgba(56,189,248,0.25)";
        ctx.lineWidth = 1;

        for (const edge of dagEdges) {

            const from = dagNodes.get(edge.from);
            const to = dagNodes.get(edge.to);

            if (!from || !to) continue;

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }

        // NODES
        for (const node of nodes) {

            let color = "#38bdf8";

            if (node.type === "TASK_CREATE") color = "#22c55e";
            if (node.type === "TASK_CLAIM") color = "#f59e0b";
            if (node.type === "TASK_COMPLETE") color = "#10b981";
            if (node.type === "AGENT_DOWN") color = "#ef4444";

            ctx.beginPath();
            ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    // ===============================
    // GOSSIP LINES
    // ===============================
    function drawGossip() {

        for (let i = gossipLines.length - 1; i >= 0; i--) {

            const g = gossipLines[i];

            ctx.beginPath();
            ctx.moveTo(g.from.x, g.from.y);
            ctx.lineTo(g.to.x, g.to.y);

            ctx.strokeStyle = `rgba(34,197,94,${g.life / 50})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            g.life--;

            if (g.life <= 0) gossipLines.splice(i, 1);
        }
    }

    // ===============================
    // GRID
    // ===============================
    function drawGrid() {

        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;

        const size = 60;

        for (let x = 0; x < canvas.width; x += size) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < canvas.height; y += size) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    // ===============================
    // DRAW AGENTS + TASKS
    // ===============================
    function drawAgents() {

        for (const a of getAgents()) {

            ctx.beginPath();
            ctx.arc(a.x, a.y, 6, 0, Math.PI * 2);

            ctx.fillStyle =
                a.status === "busy" ? "#f59e0b" :
                a.status === "dead" ? "#ef4444" :
                "#22c55e";

            ctx.fill();

            ctx.fillStyle = "#fff";
            ctx.font = "8px Arial";
            ctx.fillText(a.id, a.x + 6, a.y - 6);
        }
    }

    function drawTasks() {

        for (const t of getTasks()) {

            if (!t?.location) continue;

            const l = t.location;

            let color = "#ef4444";
            if (t.completed) color = "#64748b";
            else if (t.claimedBy) color = "#f59e0b";

            ctx.beginPath();
            ctx.arc(l.x, l.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    function drawConnections() {

        for (const a of getAgents()) {
            if (!a.target) continue;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(a.target.x, a.target.y);
            ctx.strokeStyle = "rgba(245,158,11,0.3)";
            ctx.stroke();
        }
    }

    // ===============================
    // MAIN RENDER LOOP
    // ===============================
    function draw() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();

        ctx.translate(offsetX, offsetY);
        ctx.scale(zoom, zoom);

        drawGrid();
        drawDAG();        // 🔥 CORE FEATURE
        drawTasks();
        drawConnections();
        drawGossip();
        drawAgents();

        ctx.restore();
    }

    function updateUI() {

        const agents = getAgents();
        const tasks = getTasks();

        el.agentCount.textContent = agents.length;
        el.activeAgents.textContent = agents.filter(a => a.status !== "dead").length;
        el.tasksAssigned.textContent = tasks.length;
        el.tasksCompleted.textContent = tasks.filter(t => t.completed).length;

        el.latencyStatus.textContent = `${20 + Math.floor(Math.random() * 40)}ms`;

        if (running && Math.random() < 0.05) round++;
        el.roundStatus.textContent = round;

        el.peerCount.textContent = window.MeshProtocol?.getPeers?.()?.size || 0;

        el.networkStatus.textContent =
            window.MeshProtocol?.isConnected?.() ? "P2P Active" : "Local";

        el.networkStatus.style.color =
            window.MeshProtocol?.isConnected?.() ? "#22c55e" : "#f59e0b";

        el.failures.textContent = failures;

        if (vertexReady) {
            syncProgress = Math.min(100, syncProgress + Math.random() * 2);
        }

        el.syncStatus.textContent = `${Math.floor(syncProgress)}%`;
    }

    // ===============================
    // LOOP
    // ===============================
    function animate() {

        if (!running) return;

        updateUI();
        draw();

        requestAnimationFrame(animate);
    }

    // ===============================
    // INIT
    // ===============================
    resizeCanvas();
    bootSequence();
    updateUI();
    draw();

    setInterval(updateUI, 400);

    // ===============================
    // CONTROLS
    // ===============================
    document.getElementById("startBtn").onclick = () => {
        running = true;
        window.SwarmControl?.start();
        el.swarmState.textContent = "Running";
        log("Swarm started");
        animate();
    };

    document.getElementById("pauseBtn").onclick = () => {
        running = false;
        window.SwarmControl?.stop();
        el.swarmState.textContent = "Paused";
        log("Paused");
    };

    document.getElementById("resetBtn").onclick = () => {
        running = false;
        window.SwarmControl?.reset();

        dagNodes.clear();
        dagEdges.length = 0;

        el.swarmState.textContent = "Idle";
        log("System reset");
        draw();
    };

    document.getElementById("killAgentBtn").onclick = () => {

        const alive = getAgents().filter(a => a.status !== "dead");
        if (!alive.length) return;

        const agent = alive[Math.floor(Math.random() * alive.length)];
        failures++;

        window.MeshProtocol?.removeAgent(agent.id);

        log(`${agent.id} failed`);
    };
});
