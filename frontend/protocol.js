protocol 
(function () {

    const socket = new WebSocket(`ws://${location.host}`);
    let connected = false;

    // ===============================
    // CLIENT STATE (SYNCED FROM SERVER)
    // ===============================
    const state = {
        peers: new Map(),
        lastEvent: null,
        eventLog: []
    };

    function send(type, data = {}) {
        if (socket.readyState === 1) {
            socket.send(JSON.stringify({ type, ...data }));
        }
    }

    // ===============================
    // SOCKET EVENTS
    // ===============================
    socket.onopen = () => {
        connected = true;
        console.log("🟢 Vertex connected");
    };

    socket.onclose = () => {
        connected = false;
        console.log("🔴 Vertex disconnected");
    };

    socket.onerror = () => {
        connected = false;
    };

    socket.onmessage = (e) => {
        try {
            const msg = JSON.parse(e.data);
            handle(msg);
        } catch (err) {
            console.warn("Invalid message", err);
        }
    };

    // ===============================
    // MESSAGE HANDLER
    // ===============================
    function handle(msg) {

        // store last event (for DAG trace UI)
        state.lastEvent = msg;
        state.eventLog.push(msg);

        if (state.eventLog.length > 100) {
            state.eventLog.shift();
        }

        switch (msg.type) {

            case "READY":
                break;

            case "STATE_UPDATE":
                window.globalTasks = msg.state?.tasks || [];
                window.swarmAgents = msg.state?.agents || [];
                break;

            case "INIT":
                window.globalTasks = msg.tasks || [];
                window.swarmAgents = msg.agents || [];
                break;

            case "GOSSIP_EVENT":
                break;

            // ===============================
            // 🔥 VERTEX AI / JUDGE EXTENSION
            // ===============================
            case "ANOMALY_ALERT":
            case "VERTEX_REASONING":
                window.dispatchEvent(new CustomEvent("vertex-ai", {
                    detail: msg.payload
                }));
                break;
        }
    }

    // ===============================
    // PUBLIC API (INTENT LAYER ONLY)
    // ===============================
    window.MeshProtocol = {

        registerAgent(agent) {
            state.peers.set(agent.id, agent);
            send("REGISTER", { id: agent.id });
        },

        removeAgent(agentId) {
            state.peers.delete(agentId);
            send("AGENT_DOWN", { agentId });
        },

        announceTask(task) {
            send("EVENT", {
                payload: {
                    type: "TASK_ANNOUNCE",
                    data: task
                }
            });
        },

        claimTask(agentId, taskId) {
            send("EVENT", {
                payload: {
                    type: "TASK_CLAIM",
                    data: { agentId, taskId }
                }
            });
        },

        completeTask(agentId, taskId) {
            send("EVENT", {
                payload: {
                    type: "TASK_COMPLETE",
                    data: { agentId, taskId }
                }
            });
        },

        isConnected: () => connected,

        getPeers: () => state.peers,

        getEventLog: () => state.eventLog,

        getLastEvent: () => state.lastEvent
    };

})();