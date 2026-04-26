(function () {
    
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    let socket;
    let connected = false;
    let reconnectAttempts = 0;

    function connect() {
        socket = new WebSocket(`${protocol}://${location.host}`);

        socket.onopen = () => {
            connected = true;
            reconnectAttempts = 0;
            console.log("🟢 Vertex P2P Connected");
        };

        socket.onclose = () => {
            connected = false;
            console.log("🔴 Disconnected — retrying...");
            reconnect();
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
    }

    function reconnect() {
        if (reconnectAttempts > 10) return;

        setTimeout(() => {
            reconnectAttempts++;
            connect();
        }, 1000 * reconnectAttempts);
    }

    connect();

    // ===============================
    // CLIENT STATE (VERTEX OBSERVATION LAYER)
    // ===============================
    const state = {
        peers: new Map(),
        lastEvent: null,
        eventLog: [],
        gossipCount: 0
    };

    // ===============================
    // SAFE SEND
    // ===============================
    function send(type, data = {}) {
        if (socket && socket.readyState === 1) {
            socket.send(JSON.stringify({ type, ...data }));
        }
    }

    // ===============================
    // ARRAY SAFE OPS (FIX DESYNC BUG)
    // ===============================
    function upsert(arr, item, key = "id") {
        const i = arr.findIndex(x => x?.[key] === item?.[key]);
        if (i === -1) arr.push(item);
        else arr[i] = { ...arr[i], ...item };
    }

    function remove(arr, id) {
        return arr.filter(x => x.id !== id);
    }

    // ===============================
    // MESSAGE HANDLER (VERTEX SYNC CORE)
    // ===============================
    function handle(msg) {

        if (!msg?.type) return;

        state.lastEvent = msg;
        state.eventLog.push(msg);

        if (state.eventLog.length > 200) {
            state.eventLog.shift();
        }

        switch (msg.type) {

            // =========================
            // BOOTSTRAP
            // =========================
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

            // =========================
            // GOSSIP LAYER (P2P PROOF)
            // =========================
            case "GOSSIP_EVENT":
                state.gossipCount++;

                window.dispatchEvent(new CustomEvent("gossip-event", {
                    detail: msg.event
                }));
                break;

            // =========================
            // TASK EVENTS (UNIFIED FIX)
            // =========================
            case "TASK_CREATE":
            case "TASK_CREATED":
                window.globalTasks = window.globalTasks || [];
                upsert(window.globalTasks, msg.task || msg.payload);
                break;

            case "TASK_CLAIM":
            case "TASK_CLAIMED":
                {
                    const t = window.globalTasks?.find(t => t.id === (msg.taskId || msg.payload?.taskId));
                    if (t) t.claimedBy = msg.agentId || msg.payload?.agentId;
                }
                break;

            case "TASK_COMPLETE":
            case "TASK_COMPLETED":
                {
                    const t = window.globalTasks?.find(t => t.id === (msg.taskId || msg.payload?.taskId));
                    if (t) t.completed = true;
                }
                break;

            // =========================
            // AGENTS
            // =========================
            case "AGENT_JOINED":
                window.swarmAgents = window.swarmAgents || [];
                upsert(window.swarmAgents, msg.agent);
                break;

            case "AGENT_MOVED":
                {
                    const a = window.swarmAgents?.find(a => a.id === (msg.id || msg.agentId));
                    if (a) {
                        a.x = msg.x;
                        a.y = msg.y;
                    }
                }
                break;

            case "AGENT_DOWN":
            case "AGENT_LEFT":
                window.swarmAgents = remove(
                    window.swarmAgents || [],
                    msg.id || msg.agentId
                );
                break;

            // =========================
            // VERTEX AI EVENTS
            // =========================
            case "ANOMALY_ALERT":
            case "VERTEX_REASONING":
                window.dispatchEvent(new CustomEvent("vertex-ai", {
                    detail: msg.payload
                }));
                break;
        }
    }

    // ===============================
    // PUBLIC API (VERTEX INTENT LAYER)
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

        move(agentId, x, y, status = "idle") {
            send("EVENT", {
                payload: {
                    type: "AGENT_MOVE",
                    data: { agentId, x, y, status }
                }
            });
        },

        // ===============================
        // DEBUG / JUDGE HOOKS
        // ===============================
        isConnected: () => connected,
        getPeers: () => state.peers,
        getEventLog: () => state.eventLog,
        getLastEvent: () => state.lastEvent,
        getGossipCount: () => state.gossipCount
    };

})();
