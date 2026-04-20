main.js
// MeshRescue | Enhanced Visualization Layer (CONTROLLED FINAL BUILD)

document.addEventListener("DOMContentLoaded", () => {

    const canvas = document.getElementById("swarmCanvas");
    const ctx = canvas.getContext("2d");

    const agentCountEl = document.getElementById("agentCount");
    const networkStatusEl = document.getElementById("networkStatus");
    const swarmStateEl = document.getElementById("swarmState");
    const zoneInfoEl = document.getElementById("zoneInfo");

    const activeAgentsEl = document.getElementById("activeAgents");
    const tasksAssignedEl = document.getElementById("tasksAssigned");
    const tasksCompletedEl = document.getElementById("tasksCompleted");

    const logsEl = document.getElementById("logs");

    const startBtn = document.getElementById("startBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const resetBtn = document.getElementById("resetBtn");
    const killAgentBtn = document.getElementById("killAgentBtn");

    // ===============================
    // LIVE STATE ACCESS
    // ===============================
    const getAgents = () => window.swarmAgents || [];
    const getTasks = () => window.globalTasks || [];

    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;

    let running = false;
    let autoFollow = true;

    // ===============================
    // LOG SYSTEM
    // ===============================
    function log(msg) {
        const p = document.createElement("p");
        p.textContent = `🛰️ [${new Date().toLocaleTimeString()}] ${msg}`;
        logsEl.appendChild(p);
        logsEl.scrollTop = logsEl.scrollHeight;
    }

    // ===============================
    // AUTO FIT CAMERA
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

        points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        });

        const padding = 150;

        const width = (maxX - minX) + padding;
        const height = (maxY - minY) + padding;

        const scaleX = canvas.width / width;
        const scaleY = canvas.height / height;

        zoom = Math.min(scaleX, scaleY, 1.8);

        offsetX = -(minX - padding / 2) * zoom;
        offsetY = -(minY - padding / 2) * zoom;
    }

    // ===============================
    // GRID
    // ===============================
    function drawGrid() {

        const size = 60;

        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;

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

    // ===============================
    // TASKS
    // ===============================
    function drawTasks() {

        const tasks = getTasks();

        tasks.forEach(task => {

            if (!task?.location) return;

            const loc = task.location;

            let color = "#ef4444";
            if (task.completed) color = "#64748b";
            else if (task.claimedBy) color = "#f59e0b";

            if (!task.claimedBy && !task.completed) {
                const pulse = 8 + Math.sin(Date.now() * 0.004) * 4;

                ctx.beginPath();
                ctx.arc(loc.x, loc.y, pulse, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(239,68,68,0.15)";
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(loc.x, loc.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.fillStyle = "#e2e8f0";
            ctx.font = "9px Arial";
            ctx.fillText(loc.name, loc.x + 8, loc.y - 6);

            if (task.claimedBy) {
                ctx.fillStyle = "#f59e0b";
                ctx.fillText(task.claimedBy, loc.x + 8, loc.y + 10);
            }
        });
    }

    // ===============================
    // AGENTS
    // ===============================
    function drawAgents() {

        const agents = getAgents();

        agents.forEach(agent => {

            if (!agent || agent.status === "dead") return;

            ctx.beginPath();
            ctx.arc(agent.x, agent.y, 6, 0, Math.PI * 2);

            ctx.fillStyle = agent.status === "busy" ? "#f59e0b" : "#22c55e";
            ctx.fill();

            ctx.fillStyle = "#94a3b8";
            ctx.font = "8px Arial";
            ctx.fillText(agent.id, agent.x + 6, agent.y - 6);
        });
    }

    // ===============================
    // CONNECTION LINES
    // ===============================
    function drawConnections() {

        const agents = getAgents();

        agents.forEach(agent => {

            if (!agent || agent.status !== "busy" || !agent.target) return;

            ctx.beginPath();
            ctx.moveTo(agent.x, agent.y);
            ctx.lineTo(agent.target.x, agent.target.y);

            ctx.strokeStyle = "rgba(245,158,11,0.4)";
            ctx.stroke();
        });
    }

    // ===============================
    // CAMERA
    // ===============================
    function updateCamera() {

        if (!autoFollow) return;

        const agents = getAgents();
        const tasks = getTasks();

        const all = [];

        tasks.forEach(t => t?.location && all.push(t.location));
        agents.forEach(a => all.push(a));

        if (!all.length) return;

        let sx = 0, sy = 0;

        all.forEach(p => {
            sx += p.x;
            sy += p.y;
        });

        const cx = sx / all.length;
        const cy = sy / all.length;

        offsetX = canvas.width / 2 - cx * zoom;
        offsetY = canvas.height / 2 - cy * zoom;
    }

    // ===============================
    // DRAW
    // ===============================
    function draw() {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(zoom, zoom);

        drawGrid();
        drawTasks();
        drawConnections();
        drawAgents();

        ctx.restore();
    }

    // ===============================
    // UI UPDATE
    // ===============================
    function updateUI() {

        const agents = getAgents();
        const tasks = getTasks();

        agentCountEl.textContent = agents.length;
        activeAgentsEl.textContent = agents.filter(a => a?.status !== "dead").length;

        tasksAssignedEl.textContent = tasks.length;
        tasksCompletedEl.textContent = tasks.filter(t => t?.completed).length;
    }

    // ===============================
    // MAIN LOOP
    // ===============================
    function animate() {

        if (!running) return;

        updateCamera();
        updateUI();
        draw();

        requestAnimationFrame(animate);
    }

    // ===============================
    // CONTROLS (🔥 FIXED CONNECTION)
    // ===============================
    startBtn.onclick = () => {

        if (running) return;

        running = true;

        // 🔥 START SWARM ENGINE
        window.SwarmControl?.start();

        swarmStateEl.textContent = "Running";
        networkStatusEl.textContent = "Online";

        log("🚀 Swarm system activated");
        log("🧠 Agents deploying into Vertex Grid");

        animate();
    };

    pauseBtn.onclick = () => {

        running = false;

        // 🔥 STOP SWARM ENGINE
        window.SwarmControl?.stop();

        swarmStateEl.textContent = "Paused";

        log("⏸️ Swarm paused");
    };

    resetBtn.onclick = () => {

        running = false;

        // 🔥 RESET ENGINE
        window.SwarmControl?.reset();

        zoom = 1;
        offsetX = 0;
        offsetY = 0;

        swarmStateEl.textContent = "Idle";
        networkStatusEl.textContent = "Offline";

        autoFit();
        draw();

        log("🔄 System reset complete");
    };

    killAgentBtn.onclick = () => {

        const agents = getAgents();
        const alive = agents.filter(a => a?.status !== "dead");

        if (!alive.length) return;

        const agent = alive[Math.floor(Math.random() * alive.length)];
        agent.status = "dead";

        log(`☠️ ${agent.id} disabled`);
    };

    // ===============================
    // INIT
    // ===============================
    zoneInfoEl.textContent = "Zones: Vertex Emergency Grid";

    autoFit();
    updateUI();
    draw();

    // 🔥 LIVE UI REFRESH
    setInterval(updateUI, 300);

});