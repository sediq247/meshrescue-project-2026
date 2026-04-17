protocol.js
// MeshRescue | Vertex Swarm Protocol Layer 

(function () {

    // ===============================
    // CORE MESH STATE
    // ===============================
    const peers = new Map();        // agentId -> agent state
    const messageQueue = [];        // simulated network buffer

    const LATENCY = 35;             // realistic network delay (ms)
    const PACKET_LOSS = 0.02;       // optimized realism (less chaos, more stability)

    // ===============================
    // SAFE UTIL
    // ===============================
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
    // REGISTER / REMOVE AGENTS
    // ===============================
    function registerAgent(agent) {
        if (!agent?.id) return;

        peers.set(agent.id, agent);

        broadcast({
            type: "DISCOVERY",
            from: agent.id,
            payload: { id: agent.id }
        });
    }

    function removeAgent(agentId) {
        peers.delete(agentId);

        broadcast({
            type: "NODE_DOWN",
            from: agentId
        });
    }

    // ===============================
    // NETWORK EMULATION LAYER
    // ===============================
    function broadcast(message) {

        setTimeout(() => {

            // simulate packet loss (real-world realism, but controlled)
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

            // optional visibility for judges/debugging
            console.log(`📡 [MESH] ${msg.type}`, msg.from || "system");

            peers.forEach((agent, id) => {

                if (msg.to && msg.to !== id) return;

                handleMessage(agent, msg);
            });
        }
    }

    // ===============================
    // MESSAGE HANDLER (CORE INTELLIGENCE)
    // ===============================
    function handleMessage(agent, msg) {

        if (!agent) return;

        // ensure structures exist
        if (!agent.knownTasks) agent.knownTasks = new Map();
        if (!agent.knownPeers) agent.knownPeers = new Set();
        if (!agent.lastSeen) agent.lastSeen = {};

        switch (msg.type) {

            // -------------------------------
            // NODE DISCOVERY
            // -------------------------------
            case "DISCOVERY":
                agent.knownPeers.add(msg.payload.id);
                break;

            // -------------------------------
            // TASK PROPAGATION
            // -------------------------------
            case "TASK_ANNOUNCE":
                agent.knownTasks.set(msg.payload.id, msg.payload);
                break;

            // -------------------------------
            // TASK CLAIM (FIRST-COME RULE)
            // -------------------------------
            case "TASK_CLAIM": {
                const taskId = msg.payload.taskId;
                const task = agent.knownTasks.get(taskId);

                if (task && !task.claimedBy) {
                    task.claimedBy = msg.from;
                }
                break;
            }

            // -------------------------------
            // TASK COMPLETION
            // -------------------------------
            case "TASK_COMPLETE": {
                const taskId = msg.payload.taskId;
                const task = agent.knownTasks.get(taskId);

                if (task) {
                    task.completed = true;
                }
                break;
            }

            // -------------------------------
            // HEARTBEAT SIGNALS
            // -------------------------------
            case "HEARTBEAT":
                agent.lastSeen[msg.from] = now();
                break;

            // -------------------------------
            // NODE FAILURE HANDLING
            // -------------------------------
            case "NODE_DOWN":

                agent.knownPeers.delete(msg.from);

                // release tasks held by failed node
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
    // HEARTBEAT SYSTEM (OPTIMIZED)
    // ===============================
    function heartbeat() {

        peers.forEach((agent, id) => {

            // reduced spam → more realistic network behavior
            if (Math.random() < 0.15) {
                broadcast({
                    type: "HEARTBEAT",
                    from: id
                });
            }
        });
    }

    // ===============================
    // FAILURE DETECTION (CONSENSUS CLEANUP)
    // ===============================
    function detectFailures() {

        const current = now();

        peers.forEach((agent) => {

            Object.keys(agent.lastSeen).forEach(peerId => {

                if (current - agent.lastSeen[peerId] > 7000) {

                    broadcast({
                        type: "NODE_DOWN",
                        from: peerId
                    });

                    delete agent.lastSeen[peerId];
                }
            });
        });
    }

    // ===============================
    // TASK API LAYER (IMPORTANT BINDING)
    // ===============================
    function announceTask(task) {

        broadcast({
            type: "TASK_ANNOUNCE",
            from: "system",
            payload: task
        });
    }

    function claimTask(agentId, taskId) {

        broadcast({
            type: "TASK_CLAIM",
            from: agentId,
            payload: { taskId }
        });
    }

    function completeTask(agentId, taskId) {

        broadcast({
            type: "TASK_COMPLETE",
            from: agentId,
            payload: { taskId }
        });
    }

    // ===============================
    // MAIN SWARM PROTOCOL LOOP
    // ===============================
    function protocolLoop() {
        processMessages();
        heartbeat();
        detectFailures();
    }

    setInterval(protocolLoop, 120);

    // ===============================
    // EXPORT GLOBAL API
    // ===============================
    window.MeshProtocol = {
        registerAgent,
        removeAgent,
        announceTask,
        claimTask,
        completeTask,
        send,
        broadcast
    };

})();