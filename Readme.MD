# MeshRescue System

**MeshRescue** is a Vertex-aligned swarm intelligence simulation system that models decentralized coordination using a DAG-inspired event structure, real-time agent behavior, and consensus-style task execution.

It simulates how autonomous agents communicate, claim tasks, recover from failures, and reach coordinated outcomes through a lightweight Vertex-inspired protocol layer.

---

## 🚀 What MeshRescue Does

MeshRescue is not just a visualization — it is a **distributed swarm simulation engine**.

It demonstrates:

- 🧠 Autonomous agent decision-making (task selection + movement logic)
- 🌐 Peer-to-peer style communication via event propagation
- 📡 Vertex-inspired DAG event linking (parent/child event structure simulation)
- ⚡ Real-time task claiming and completion
- 🧩 Consensus-style state reconciliation between agents and server
- 💥 Byzantine fault simulation (agent failure injection)
- 📊 Live visualization of swarm state and network behavior
- 🔁 Continuous sync between frontend protocol layer and backend state

In short:

> MeshRescue simulates how a decentralized intelligent system behaves under real-world conditions like delay, failure, and partial agreement.

---

## 🧬 System Architecture
Frontend Layer ├── main.js (Visualization Engine) ├── agents.js (Swarm Intelligence Layer) ├── protocol.js (Vertex Swarm Protocol) └── style.css (UI + Dashboard)
Shared Layer ├── config.js (Environment configuration) ├── events.js (Event schema definitions) └── logger.js (Logging system)
Backend Layer ├── server.js (WebSocket + swarm coordinator) ├── vertex.js (Vertex abstraction layer) └── consensus engine (task resolution logic)

---

## ⚙️ Core Features

### 🤖 Swarm Intelligence
Each agent:
- Moves in a simulated 2D space
- Evaluates nearby tasks
- Selects optimal task based on distance + randomness
- Claims and completes tasks independently

---

### 🌐 Vertex Protocol Simulation
MeshRescue simulates a Vertex-like system where:
- Events are created with parent references (DAG-style)
- Events propagate across peers
- State is eventually reconciled across the swarm

---

### 📡 Network Simulation
The system includes realistic network behavior:

- Latency simulation
- Packet loss simulation
- Heartbeat intervals
- Gossip propagation delays

---

### 💥 Byzantine Fault Injection
To simulate real-world distributed systems:
- Random agent failure
- Node removal mid-task
- Recovery via consensus reconciliation

---

### 🧩 Consensus Engine
The system resolves:
- Task assignment conflicts
- Duplicate claims
- Completed task validation
- Agent-state synchronization

---

## 🎮 UI Features

- Real-time swarm map visualization
- Live agent tracking
- Task execution visualization
- Event stream panel (Vertex event log)
- System metrics dashboard
- Network status indicators
- Failure injection controls

---

## 🔧 Tech Stack

- HTML5 Canvas (visualization engine)
- Vanilla JavaScript (no frameworks)
- WebSockets (real-time sync)
- Node.js backend
- Vertex-inspired event model (custom implementation)

---

## 📦 Installation

```bash
git clone https://github.com/your-username/meshrescue.git
cd meshrescue
npm install


**Key Idea Behind MeshRescue**
MeshRescue is designed to demonstrate:
How decentralized systems can coordinate intelligence without a single point of control.
It combines:
Swarm robotics concepts
Distributed systems theory
DAG-based event propagation
Real-time simulation rendering