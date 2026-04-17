// MeshRescue | Vertex Swarm Intelligence (FINAL NETWORKED BUILD)

(function () {

    // ===============================
    // WEBSOCKET BRIDGE
    // ===============================
    const socket = new WebSocket(
        location.hostname === "localhost"
            ? "ws://localhost:3007"
            : `wss://${location.host}`
    );

    window.MeshSocket = socket;

    socket.onopen = () => {
        console.log("🟢 Swarm connected to server");
    };

    socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        window.dispatchEvent(new CustomEvent("mesh-msg", {
            detail: msg
        }));
    };

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
                lastClaimTime: 0
            };

            window.swarmAgents.push(agent);

            // REGISTER TO SERVER
            socket.send(JSON.stringify({
                type: "REGISTER",
                id: agent.id
            }));
        }
    }

    // ===============================
    // TASK DECISION ENGINE
    // ===============================
    function agentDecision(agent) {

        if (agent.status !== "idle") return;

        let bestTask = null;
        let bestScore = Infinity;

        agent.knownTasks.forEach(task => {

            if (!task || task.claimedBy || task.completed) return;

            const dx = task.location.x - agent.x;
            const dy = task.location.y - agent.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const score = dist + Math.random() * 5;

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

        // SEND CLAIM TO SERVER
        socket.send(JSON.stringify({
            type: "CLAIM_TASK",
            taskId: bestTask.id
        }));
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

                    socket.send(JSON.stringify({
                        type: "COMPLETE_TASK",
                        taskId: agent.claimedTask.id
                    }));
                }

                agent.status = "idle";
                agent.target = null;
                agent.claimedTask = null;

            } else {
                agent.x += (dx / dist) * agent.speed;
                agent.y += (dy / dist) * agent.speed;
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

        if (Math.random() < 0.003) {

            const alive = window.swarmAgents.filter(a => a.status !== "dead");
            if (!alive.length) return;

            const agent = alive[Math.floor(Math.random() * alive.length)];
            agent.status = "dead";

            // notify server
            socket.send(JSON.stringify({
                type: "AGENT_FAIL",
                id: agent.id
            }));
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
    // SERVER EVENT HANDLER
    // ===============================
    window.addEventListener("mesh-msg", (e) => {

        const msg = e.detail;

        switch (msg.type) {

            case "INIT":
                window.swarmAgents = msg.agents;
                window.globalTasks = msg.tasks;
                break;

            case "TASK_CREATED":
                window.globalTasks.push(msg.task);
                break;

            case "TASK_CLAIMED":
                const t1 = window.globalTasks.find(t => t.id === msg.taskId);
                if (t1) t1.claimedBy = msg.agentId;
                break;

            case "TASK_COMPLETED":
                const t2 = window.globalTasks.find(t => t.id === msg.taskId);
                if (t2) t2.completed = true;
                break;

            case "AGENT_LEFT":
                const a1 = window.swarmAgents.find(a => a.id === msg.id);
                if (a1) a1.status = "dead";
                break;

            case "AGENT_MOVED":
                const a2 = window.swarmAgents.find(a => a.id === msg.id);
                if (a2) {
                    a2.x = msg.x;
                    a2.y = msg.y;
                }
                break;
        }
    });

    // ===============================
    // START SYSTEM
    // ===============================
    function startSwarm() {
        setInterval(swarmLoop, 50);
    }

    // ===============================
    // INIT
    // ===============================
    createAgents(10);
    startSwarm();

})();