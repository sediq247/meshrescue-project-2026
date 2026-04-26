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
            handle(JSON.parse(e.data));
        } catch (err) {
            console.warn("Invalid message", err);
        }
    };

    // ===============================
    // SAFE ARRAY HELPERS (FIX DUPLICATION BUG)
    // ===============================
    function upsert(arr, item, key = "id") {
        const index = arr.findIndex(x => x[key] === item[key]);
        if (index === -1) arr.push(item);
        else arr[index] = { ...arr[index], ...item };
    }

    function remove(arr, id) {
        return arr.filter(x => x.id !== id);
    }

    // ===============================
    // MESSAGE HANDLER
    // ===============================
    function handle(msg) {

        if (!msg?.type) return;

        state.lastEvent = msg;
        state.eventLog.push(msg);

        if (state.eventLog.length > 200) {
            state.eventLog.shift();
        }

        switch (msg.type) {

            // ===============================
            // BOOT SYNC
            // ===============================
            case "READY":
                break;

            case "INIT":
                window.globalTasks = msg.tasks || [];
                window.swarmAgents = msg.agents || [];
                window.dispatchEvent(new CustomEvent("swarm-update"));
                break;

            case "STATE_UPDATE":
                window.globalTasks = msg.state?.tasks || [];
                window.swarmAgents = msg.state?.agents || [];
                window.dispatchEvent(new CustomEvent("swarm-update"));
                break;

            // ===============================
            // 🔥 P2P GOSSIP (CORE PROOF)
            // ===============================
            case "GOSSIP_EVENT":
                state.gossipCount++;

                window.dispatchEvent(new CustomEvent("gossip-event", {
                    detail: msg.event
                }));
                break;

            // ===============================
            // TASK EVENTS (FIXED CONSISTENCY)
            // ===============================
            case "TASK_CREATE":
            case "TASK_CREATED":
                if (!window.globalTasks) window.globalTasks = [];
                upsert(window.globalTasks, msg.task);
                break;

            case "TASK_CLAIMED":
                {
                    const t = window.globalTasks?.find(t => t.id === msg.taskId);
                    if (t) t.claimedBy = msg.agentId;
                }
                break;

            case "TASK_COMPLETED":
                {
                    const t = window.globalTasks?.find(t => t.id === msg.taskId);
                    if (t) t.completed = true;
                }
                break;

            // ===============================
            // AGENT EVENTS
            // ===============================
            case "AGENT_JOINED":
                if (!window.swarmAgents) window.swarmAgents = [];
                upsert(window.swarmAgents, msg.agent);
                break;

            case "AGENT_MOVED":
                {
                    const a = window.swarmAgents?.find(a => a.id === msg.id);
                    if (a) {
                        a.x = msg.x;
                        a.y = msg.y;
                    }
                }
                break;

            case "AGENT_LEFT":
            case "AGENT_DOWN":
                window.swarmAgents = remove(window.swarmAgents || [], msg.id || msg.agentId);
                break;

            // ===============================
            // VERTEX AI EVENTS
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
    // PUBLIC API (INTENT LAYER)
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
        // DEBUG 
        // ===============================
        isConnected: () => connected,
        getPeers: () => state.peers,
        getEventLog: () => state.eventLog,
        getLastEvent: () => state.lastEvent,
        getGossipCount: () => state.gossipCount
    };

})();
