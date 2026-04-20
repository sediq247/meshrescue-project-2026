// MeshRescue | Vertex Swarm Protocol Layer (STABLE FINAL BUILD)

(function () {

    const peers = new Map();       
    const messageQueue = [];        

    const LATENCY = 35;
    const PACKET_LOSS = 0.02;

    function now() {
        return Date.now();
    }

    function pushMessage(msg) {
        messageQueue.push({
            ...msg,
            timestamp: now()
        });
    }

    // ===============================
    // AGENT MANAGEMENT
    // ===============================
    function registerAgent(agent) {
        if (!agent?.id) return;

        peers.set(agent.id, agent);

        simulateBroadcast({
            type: "DISCOVERY",
            from: agent.id,
            payload: { id: agent.id }
        });
    }

    function removeAgent(agentId) {
        peers.delete(agentId);

        simulateBroadcast({
            type: "NODE_DOWN",
            from: agentId
        });
    }

    // ===============================
    // NETWORK LAYER (SIMULATED)
    // ===============================
    function simulateBroadcast(message) {

        setTimeout(() => {

            if (Math.random() < PACKET_LOSS) return;

            pushMessage(message);

        }, LATENCY);
    }

    function send(to, message) {

        setTimeout(() => {

            pushMessage({
                ...message,
                to
            });

        }, LATENCY);
    }

    // ===============================
    // MESSAGE PROCESSOR
    // ===============================
    function processMessages() {

        const queue = [...messageQueue];
        messageQueue.length = 0;

        for (const msg of queue) {

            console.log(`📡 [MESH] ${msg.type}`, msg.from || "system");

            peers.forEach((agent) => {

                if (msg.to && msg.to !== agent.id) return;

                handleMessage(agent, msg);
            });
        }
    }

    // ===============================
    // MESSAGE HANDLER
    // ===============================
    function handleMessage(agent, msg) {

        if (!agent) return;

        // SAFE INIT (CRITICAL FIX)
        agent.knownTasks = agent.knownTasks || new Map();
        agent.knownPeers = agent.knownPeers || new Set();
        agent.lastSeen = agent.lastSeen || {};

        switch (msg.type) {

            case "DISCOVERY":
                agent.knownPeers.add(msg.payload.id);
                break;

            case "TASK_ANNOUNCE":
                agent.knownTasks.set(msg.payload.id, msg.payload);
                break;

            case "TASK_CLAIM": {
                const task = agent.knownTasks.get(msg.payload.taskId);
                if (task && !task.claimedBy) {
                    task.claimedBy = msg.from;
                }
                break;
            }

            case "TASK_COMPLETE": {
                const task = agent.knownTasks.get(msg.payload.taskId);
                if (task) {
                    task.completed = true;
                }
                break;
            }

            case "HEARTBEAT":
                agent.lastSeen[msg.from] = now();
                break;

            case "NODE_DOWN":

                agent.knownPeers.delete(msg.from);

                agent.knownTasks.forEach(task => {
                    if (task.claimedBy === msg.from) {
                        task.claimedBy = null;
                    }
                });

                delete agent.lastSeen[msg.from];
                break;
        }
    }

    // ===============================
    // HEARTBEAT (STABLE VERSION)
    // ===============================
    function heartbeat() {

        peers.forEach((agent, id) => {

            simulateBroadcast({
                type: "HEARTBEAT",
                from: id
            });

        });
    }

    // ===============================
    // FAILURE DETECTION (SAFE)
    // ===============================
    function detectFailures() {

        const current = now();

        peers.forEach((agent) => {

            Object.keys(agent.lastSeen || {}).forEach(peerId => {

                if (current - agent.lastSeen[peerId] > 7000) {

                    simulateBroadcast({
                        type: "NODE_DOWN",
                        from: peerId
                    });

                    delete agent.lastSeen[peerId];
                }
            });
        });
    }

    // ===============================
    // TASK API
    // ===============================
    function announceTask(task) {

        simulateBroadcast({
            type: "TASK_ANNOUNCE",
            from: "system",
            payload: task
        });
    }

    function claimTask(agentId, taskId) {

        simulateBroadcast({
            type: "TASK_CLAIM",
            from: agentId,
            payload: { taskId }
        });
    }

    function completeTask(agentId, taskId) {

        simulateBroadcast({
            type: "TASK_COMPLETE",
            from: agentId,
            payload: { taskId }
        });
    }

    // ===============================
    // MAIN LOOP (SAFE INIT)
    // ===============================
    function protocolLoop() {
        processMessages();
        heartbeat();
        detectFailures();
    }

    // Prevent duplicate intervals (IMPORTANT FIX)
    if (!window.__protocolLoopStarted) {
        window.__protocolLoopStarted = true;
        setInterval(protocolLoop, 120);
    }

    // ===============================
    // GLOBAL EXPORT
    // ===============================
    window.MeshProtocol = {
        registerAgent,
        removeAgent,
        announceTask,
        claimTask,
        completeTask,
        send,
        broadcast: simulateBroadcast
    };

})();