// MeshRescue | WebSocket + Swarm Hybrid Intelligence (CONTROLLED FINAL BUILD)

(function () {

    if (!window.MeshProtocol) {
        console.error("Protocol not loaded!");
        return;
    }

    const Protocol = window.MeshProtocol;

    // ===============================
    // GLOBAL STATE
    // ===============================
    window.swarmAgents = [];
    window.globalTasks = [];

    const agentNames = [
        "Aegis-01", "Vanguard-02", "Sentinel-03", "Orion-04", "Atlas-05",
        "Nova-06", "Echo-07", "Helix-08", "Pulse-09", "Titan-10"
    ];

    // ===============================
    // WEBSOCKET (AUTO RECONNECT)
    // ===============================
    let socket;

    function connectSocket() {

        socket = new WebSocket(
            location.protocol === "https:"
                ? "wss://" + location.host
                : "ws://" + location.host
        );

        socket.onopen = () => {
            console.log("🟢 Connected to Swarm Server");
        };

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            handleServerMessage(msg);
        };

        socket.onclose = () => {
            console.log("🔴 Disconnected... reconnecting");
            setTimeout(connectSocket, 2000);
        };
    }

    function safeSend(data) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
        } else {
            setTimeout(() => safeSend(data), 100);
        }
    }

    connectSocket();

    // ===============================
    // SERVER MESSAGE HANDLER
    // ===============================
    function handleServerMessage(msg) {

        switch (msg.type) {

            case "INIT":
                window.globalTasks = msg.tasks || [];
                break;

            case "TASK_CREATED":
                window.globalTasks.push(msg.task);
                Protocol.announceTask(msg.task);
                break;

            case "TASK_CLAIMED":
                updateTask(msg.taskId, { claimedBy: msg.agentId });
                Protocol.claimTask(msg.agentId, msg.taskId);
                break;

            case "TASK_COMPLETED":
                updateTask(msg.taskId, { completed: true });
                Protocol.completeTask(msg.agentId, msg.taskId);
                break;

            case "TASK_RELEASED":
                updateTask(msg.taskId, { claimedBy: null });
                break;
        }
    }

    function updateTask(taskId, updates) {
        const task = window.globalTasks.find(t => t.id === taskId);
        if (!task) return;
        Object.assign(task, updates);
    }

    // ===============================
    // CREATE AGENTS
    // ===============================
    function createAgents(count = 10) {

        window.swarmAgents = [];

        for (let i = 0; i < count; i++) {

            const agent = {
                id: agentNames[i],
                x: Math.random() * 900,
                y: Math.random() * 600,
                status: "idle",
                speed: 1.5 + Math.random(),

                target: null,
                claimedTask: null,

                knownTasks: new Map(),
                knownPeers: new Set(),
                lastClaimTime: 0
            };

            window.swarmAgents.push(agent);

            safeSend({
                type: "REGISTER",
                id: agent.id
            });

            Protocol.registerAgent(agent);
        }
    }

    // ===============================
    // DECISION ENGINE
    // ===============================
    function agentDecision(agent) {

        if (agent.status !== "idle") return;

        let bestTask = null;
        let bestScore = Infinity;

        window.globalTasks.forEach(task => {

            if (!task || task.claimedBy || task.completed) return;

            const dx = task.location.x - agent.x;
            const dy = task.location.y - agent.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const score = dist + (Math.random() * 5);

            if (score < bestScore) {
                bestScore = score;
                bestTask = task;
            }
        });

        if (!bestTask) return;

        const now = Date.now();
        if (now - agent.lastClaimTime < 250) return;

        agent.status = "busy";
        agent.target = bestTask.location;
        agent.claimedTask = bestTask;
        agent.lastClaimTime = now;

        safeSend({
            type: "CLAIM_TASK",
            taskId: bestTask.id
        });

        Protocol.claimTask(agent.id, bestTask.id);
    }

    // ===============================
    // MOVEMENT ENGINE
    // ===============================
    function moveAgent(agent) {

        if (agent.status === "busy" && agent.target) {

            const dx = agent.target.x - agent.x;
            const dy = agent.target.y - agent.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 3) {

                if (agent.claimedTask) {

                    safeSend({
                        type: "COMPLETE_TASK",
                        taskId: agent.claimedTask.id
                    });

                    Protocol.completeTask(agent.id, agent.claimedTask.id);
                }

                agent.status = "idle";
                agent.target = null;
                agent.claimedTask = null;

            } else {
                agent.x += (dx / dist) * agent.speed;
                agent.y += (dy / dist) * agent.speed;

                safeSend({
                    type: "MOVE",
                    x: agent.x,
                    y: agent.y
                });
            }

        } else {
            agent.x += (Math.random() - 0.5) * 1.2;
            agent.y += (Math.random() - 0.5) * 1.2;
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
    // SWARM LOOP
    // ===============================
    function swarmLoop() {

        window.swarmAgents.forEach(agent => {
            if (agent.status === "dead") return;

            agentDecision(agent);
            moveAgent(agent);
        });

        randomFailure();
    }

    // ===============================
    // CONTROL SYSTEM (IMPORTANT FIX)
    // ===============================
    let swarmInterval = null;
    let initialized = false;

    function startSwarmSystem() {

        if (swarmInterval) return;

        if (!initialized) {
            createAgents(10);
            initialized = true;
            console.log("🧠 Agents initialized");
        }

        swarmInterval = setInterval(swarmLoop, 50);
        console.log("🚀 Swarm Engine Started");
    }

    function stopSwarmSystem() {

        if (!swarmInterval) return;

        clearInterval(swarmInterval);
        swarmInterval = null;

        console.log("⏸️ Swarm Engine Stopped");
    }

    function resetSwarmSystem() {

        stopSwarmSystem();

        window.swarmAgents = [];
        window.globalTasks = [];

        initialized = false;

        console.log("🔄 Swarm Reset Complete");
    }

    // ===============================
    // GLOBAL EXPORT
    // ===============================
    window.SwarmControl = {
        start: startSwarmSystem,
        stop: stopSwarmSystem,
        reset: resetSwarmSystem
    };

})();