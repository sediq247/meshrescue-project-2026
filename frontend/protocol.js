(function () {

    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${location.host}`);

    let connected = false;

    // ===============================
    // CLIENT STATE (P2P OBSERVATION)
    // ===============================
    const state = {
        peers: new Map(),
        lastEvent: null,
        eventLog: [],
        gossipCount: 0
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
        console.log("🟢 P2P Vertex Connected");
    };

    socket.onclose = () => {
        connected = false;
        console.log("🔴 Disconnected");
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

        // 🔥 Track ALL events (for DAG / judge panel)
        state.lastEvent = msg;
        state.eventLog.push(msg);

        if (state.eventLog.length > 200) {
            state.eventLog.shift();
        }

        switch (msg.type) {

            case "READY":
                break;

            case "INIT":
                window.globalTasks = msg.tasks || [];
                window.swarmAgents = msg.agents || [];
                break;

            case "STATE_UPDATE":
                window.globalTasks = msg.state?.tasks || [];
                window.swarmAgents = msg.state?.agents || [];

                // 🔥 Notify UI (important for real-time proof)
                window.dispatchEvent(new CustomEvent("swarm-update"));
                break;

            // ===============================
            // 🔥 GOSSIP (CORE P2P PROOF)
            // ===============================
            case "GOSSIP_EVENT":

                state.gossipCount++;

                // send to UI (draw lines / event stream)
                window.dispatchEvent(new CustomEvent("gossip-event", {
                    detail: msg.event
                }));

                break;

            // ===============================
            // OPTIONAL DIRECT EVENTS (BACKWARD SAFE)
            // ===============================
            case "TASK_CREATED":
                window.globalTasks.push(msg.task);
                break;

            case "AGENT_JOINED":
                window.swarmAgents.push(msg.agent);
                break;

            case "AGENT_MOVED":
                {
                    const a = window.swarmAgents.find(a => a.id === msg.id);
                    if (a) {
                        a.x = msg.x;
                        a.y = msg.y;
                    }
                }
                break;

            case "TASK_CLAIMED":
                {
                    const t = window.globalTasks.find(t => t.id === msg.taskId);
                    if (t) t.claimedBy = msg.agentId;
                }
                break;

            case "TASK_COMPLETED":
                {
                    const t = window.globalTasks.find(t => t.id === msg.taskId);
                    if (t) t.completed = true;
                }
                break;

            case "AGENT_LEFT":
                window.swarmAgents = window.swarmAgents.filter(a => a.id !== msg.id);
                break;

            // ===============================
            // 🔥 AI / VERTEX EXTENSION
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
    // PUBLIC API (INTENT ONLY)
    // ===============================
    window.MeshProtocol = {

        registerAgent(agent) {
            state.peers.set(agent.id, agent);
            send("REGISTER", { id: agent.id });
        },

        removeAgent(agentId) {
            state.peers.delete(agentId);
            send("EVENT", {
                payload: {
                    type: "AGENT_DOWN",
                    data: { agentId }
                }
            });
        },

        // ===============================
        // 🔥 CORE SWARM ACTIONS
        // ===============================
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

        move(agentId, x, y) {
            send("EVENT", {
                payload: {
                    type: "AGENT_MOVE",
                    data: { agentId, x, y }
                }
            });
        },

        // ===============================
        // STATUS / DEBUG (FOR JUDGES)
        // ===============================
        isConnected: () => connected,

        getPeers: () => state.peers,

        getEventLog: () => state.eventLog,

        getLastEvent: () => state.lastEvent,

        getGossipCount: () => state.gossipCount
    };

})();
