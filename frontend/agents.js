(function () {

    if (!window.MeshProtocol) {
        console.error("MeshProtocol not loaded!");
        return;
    }

    const Protocol = window.MeshProtocol;

    const agentNames = [
        "Aegis-01", "Vanguard-02", "Sentinel-03", "Orion-04", "Atlas-05",
        "Nova-06", "Echo-07", "Helix-08", "Pulse-09", "Titan-10"
    ];

    window.swarmAgents = [];

    // ===============================
    // AGENT FACTORY
    // ===============================
    function createAgents(count = 10) {

        window.swarmAgents = [];

        for (let i = 0; i < count; i++) {

            const agent = {
                id: agentNames[i],
                x: Math.random() * 900,
                y: Math.random() * 600,
                status: "idle",
                speed: 1.2 + Math.random(),
                target: null,
                claimedTask: null,
                lastAction: 0
            };

            window.swarmAgents.push(agent);

            Protocol.registerAgent(agent);
        }
    }

    // ===============================
    // DECISION ENGINE
    // ===============================
    function decide(agent) {

        if (agent.status !== "idle") return;

        const tasks = window.globalTasks || [];

        let best = null;
        let bestScore = Infinity;

        for (const task of tasks) {

            if (!task || task.claimedBy || task.completed) continue;

            const dx = task.location.x - agent.x;
            const dy = task.location.y - agent.y;

            const dist = dx * dx + dy * dy;
            const score = dist + Math.random() * 10;

            if (score < bestScore) {
                bestScore = score;
                best = task;
            }
        }

        if (!best) return;
        if (Date.now() - agent.lastAction < 300) return;

        agent.status = "busy";
        agent.target = best.location;
        agent.claimedTask = best;
        agent.lastAction = Date.now();

        Protocol.claimTask(agent.id, best.id);
    }

    // ===============================
    // MOVEMENT ENGINE (P2P ENABLED)
    // ===============================
    function move(agent) {

        if (agent.status === "dead") return;

        if (agent.status === "busy" && agent.target) {

            const dx = agent.target.x - agent.x;
            const dy = agent.target.y - agent.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 4) {

                if (agent.claimedTask) {
                    Protocol.completeTask(agent.id, agent.claimedTask.id);
                }

                agent.status = "idle";
                agent.target = null;
                agent.claimedTask = null;

            } else {
                agent.x += (dx / dist) * agent.speed;
                agent.y += (dy / dist) * agent.speed;
            }

        } else {
            agent.x += (Math.random() - 0.5) * 1.0;
            agent.y += (Math.random() - 0.5) * 1.0;
        }

        // 🔥 CRITICAL: BROADCAST MOVEMENT (P2P PROOF)
        Protocol.sendMove?.(agent.id, agent.x, agent.y);
    }

    // ===============================
    // SERVER RECONCILIATION
    // ===============================
    function reconcile() {

        const tasks = window.globalTasks || [];

        for (const agent of window.swarmAgents) {

            if (!agent.claimedTask) continue;

            const serverTask = tasks.find(t => t.id === agent.claimedTask.id);

            if (!serverTask || serverTask.completed || serverTask.claimedBy !== agent.id) {
                agent.status = "idle";
                agent.target = null;
                agent.claimedTask = null;
            }
        }
    }

    // ===============================
    // FAILURE SIMULATION
    // ===============================
    function randomFailure() {

        if (Math.random() < 0.004) {

            const alive = window.swarmAgents.filter(a => a.status !== "dead");
            if (!alive.length) return;

            const agent = alive[Math.floor(Math.random() * alive.length)];

            agent.status = "dead";

            Protocol.removeAgent(agent.id);
        }
    }

    // ===============================
    // LOOP
    // ===============================
    function loop() {

        for (const agent of window.swarmAgents) {
            if (agent.status === "dead") continue;

            decide(agent);
            move(agent);
        }

        reconcile();
        randomFailure();
    }

    // ===============================
    // CONTROL
    // ===============================
    let interval = null;
    let initialized = false;

    function start() {

        if (interval) return;

        if (!initialized) {
            createAgents(10);
            initialized = true;
            console.log("🧠 Swarm initialized");
        }

        interval = setInterval(loop, 50);
        console.log("🚀 Swarm started");
    }

    function stop() {
        clearInterval(interval);
        interval = null;
    }

    function reset() {
        stop();
        window.swarmAgents = [];
        window.globalTasks = [];
        initialized = false;
    }

    window.SwarmControl = {
        start,
        stop,
        reset
    };

})();
