# MeshRescue Swarm System — P2P Coordination System

> A decentralized peer-to-peer swarm intelligence system for coordinating autonomous agents in emergency response environments without centralized control.

---

# ⚠️ Problem Statement

Modern multi-agent systems (robot fleets, drones, IoT devices, and AI agents) are typically built on centralized architectures. While this approach is simple, it introduces serious limitations:

## ❌ Key Problems

- A central server assigns and controls all tasks
- System failure occurs if the central node goes down
- Cloud dependency introduces latency and fragility
- Agents cannot independently coordinate in real time
- Poor scalability in distributed or disaster environments
- No resilience under network disruptions or partial failures

In real-world emergency scenarios like floods, fires, or large-scale accidents, these weaknesses become critical failure points.

---

# ⚡ MeshRescue Solution

MeshRescue replaces centralized orchestration with a **fully decentralized swarm model**.

Instead of a single controller:
- Every agent is independent
- Decisions are made locally
- Communication happens through a mesh protocol
- Coordination emerges from interaction, not instruction

## 🧠 Core Idea

> “Remove the master controller. Let intelligence emerge from the swarm.”

MeshRescue demonstrates how autonomous systems can self-organize in real time without relying on cloud-based coordination.

---

# 🏗️ How MeshRescue is Built

MeshRescue is designed as a 4-layer system:

---

## 🌍 1. Environment Layer — `server.js`

The server acts only as a **neutral event generator**:

- Generates emergency tasks (fire, flood, hospital, accident, etc.)
- Broadcasts events to all connected agents
- Maintains minimal shared state
- Does NOT assign tasks or make decisions

👉 It behaves like a real-world environment simulator, not a controller.

---

## 📡 2. Communication Layer — `protocol.js`

This layer simulates a **peer-to-peer mesh network**:

- Agent discovery (who is in the swarm)
- Message broadcasting across all nodes
- Direct messaging support
- Heartbeat system for liveness detection
- Failure detection and recovery propagation

👉 This is the “coordination fabric” of the swarm.

---

## 🤖 3. Swarm Intelligence Layer — `agents.js`

Each agent operates independently with local intelligence:

- Evaluates available tasks
- Calculates proximity and priority
- Competes with other agents for task ownership
- Moves autonomously toward targets
- Completes tasks without external instructions

👉 There is no central decision-making system.

---

## 🎨 4. Visualization Layer — `main.js`

The frontend provides real-time visualization:

- Live agent movement on a canvas
- Task generation and status tracking
- Swarm behavior representation
- System metrics and UI interaction

👉 This layer is purely visual and does not influence logic.

---

# 🔄 How the System Works (Runtime Flow)

1. The server generates emergency tasks dynamically
2. Tasks are broadcast to all agents through the protocol layer
3. Each agent independently evaluates tasks
4. Multiple agents may attempt to claim the same task
5. The first valid claim wins ownership
6. The agent moves to the location and completes the task
7. If an agent fails or disconnects:
   - The system detects failure via heartbeat loss
   - Tasks are released back into the swarm
   - Other agents re-claim automatically
8. The swarm continues operating without interruption

---

# 🧪 Proof of Peer-to-Peer Coordination

MeshRescue demonstrates true P2P swarm behavior:

## ✔ No Central Controller
The server does NOT assign tasks or control agents.

## ✔ Distributed Intelligence
Each agent makes independent decisions based on local data.

## ✔ Emergent Coordination
Task ownership emerges naturally through competition.

## ✔ Mesh Communication
Agents communicate through a distributed message propagation system.

## ✔ Fault Tolerance
The system self-recovers from agent failure without external intervention.

---

# 🔥 Key Features

- Decentralized swarm intelligence
- Real-time task competition
- Peer-to-peer mesh communication simulation
- Self-healing failure recovery system
- Live swarm visualization dashboard
- Emergent coordination behavior

---

## 🏗️ Architecture

Frontend (UI)
   ↓
main.js
   ↓
agents.js
   ↓
protocol.js
   ↓
server.js

---

## 🧰 Tech Stack

- Node.js
- WebSockets (ws)
- Vanilla JavaScript
- HTML5 Canvas
- CSS3