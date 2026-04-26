# MeshRescue System — Vertex Swarm Intelligence & P2P Coordination System

> A decentralized peer-to-peer swarm intelligence system for coordinating autonomous agents in real-time emergency response scenarios using event-driven consensus and Vertex AI-enhanced reasoning.

---

# ⚠️ Problem Statement

Modern distributed systems (robot fleets, drones, IoT networks, and AI agents) are still largely dependent on centralized coordination models.

While simple to build, this introduces serious weaknesses:

## ❌ Key Limitations

- Central server becomes a single point of failure
- High latency due to cloud dependency
- Poor scalability under large swarm loads
- No autonomous agent coordination
- Weak resilience in unstable or disaster environments
- Lack of real-time distributed decision-making

In real-world emergencies (fires, floods, accidents), these limitations can cause system collapse when it is needed most.

---

# ⚡ MeshRescue System — Solution

MeshRescue System removes centralized control and replaces it with a **fully decentralized swarm + event-driven mesh architecture**.

Instead of a controller:
- Every agent operates independently
- Decisions are made locally (edge intelligence)
- Communication happens through a P2P-style event mesh
- Coordination emerges naturally from interaction patterns

## 🧠 Core Philosophy

> “No master node. No central controller. Intelligence emerges from the swarm itself.”

---

# 🏗️ System Architecture

MeshRescue System is built on a **4-layer distributed intelligence model**:

---

## 🌍 1. Environment & Event Layer — `server.js`

The server acts strictly as an **event generator + neutral relay**, not a controller.

### Responsibilities:
- Generates dynamic emergency scenarios (fire, flood, accident, hospital, etc.)
- Broadcasts events to all connected agents
- Maintains minimal shared state (tasks + agents registry)
- Acts as a simulation environment, NOT a decision maker

### ❗ Important:
- No task assignment logic
- No agent control logic
- No centralized orchestration

👉 This ensures decentralization is preserved.

---

## 📡 2. P2P Communication Layer — `protocol.js`

This layer simulates a **peer-to-peer mesh network over WebSockets**.

### Features:
- Agent registration & discovery
- Event broadcasting (gossip-style propagation)
- Task claim + completion intent transmission
- Failure notification propagation
- Event logging for DAG trace visualization

### P2P Simulation Proof:
- Agents communicate via shared event stream
- No direct central routing logic for decisions
- State is synchronized via distributed updates

---

## 🤖 3. Swarm Intelligence Layer — `agents.js`

Each agent is an **autonomous decision-making node**.

### Behavior:
- Evaluates all available tasks locally
- Computes proximity-based scoring
- Competes for task ownership
- Moves independently toward assigned target
- Executes completion without external approval

### Key Principle:
> Each agent behaves like an independent intelligent node in a swarm system.

---

## 🎨 4. Visualization & Intelligence Dashboard — `main.js`

This layer provides real-time system observability.

### Features:
- Live swarm movement visualization (HTML5 Canvas)
- Task lifecycle tracking (created → claimed → completed)
- P2P gossip visualization (event propagation lines)
- Vertex sync + consensus indicators
- Latency simulation + round tracking
- System logs + event stream monitor

### Purpose:
- Demonstrates emergent swarm behavior
- Makes distributed coordination visible to judges

---

# 🔄 Runtime Execution Flow

1. Server generates emergency tasks dynamically
2. Tasks are broadcast to all agents via event layer
3. Each agent independently evaluates tasks
4. Multiple agents may attempt to claim same task
5. First valid claim wins ownership (race condition resolution)
6. Agent moves autonomously to task location
7. Task is completed and broadcast back into system
8. Failed agents are detected and removed from swarm
9. Tasks are re-evaluated automatically by remaining agents
10. System continues operating without interruption

---

# 🧪 Proof of Peer-to-Peer Architecture

MeshRescue System demonstrates **true decentralized coordination behavior**:

## ✔ No Central Decision Maker
The server only emits events — it never assigns tasks.

## ✔ Distributed Intelligence
Each agent independently evaluates and decides actions.

## ✔ Emergent Coordination
Task distribution emerges from competition and proximity logic.

## ✔ Gossip-Based Communication
Events propagate through a simulated mesh broadcast system.

## ✔ Fault Tolerance
Agent failures do not interrupt system operation.

## ✔ Self-Healing Swarm
Lost tasks are automatically re-claimed by other agents.

---

# 🧠 Vertex AI Integration Layer

MeshRescue System includes optional **Vertex AI reasoning augmentation**:

### What it does:
- Analyzes emergency tasks semantically
- Assigns AI-generated priority insights (low / medium / high)
- Enhances decision transparency for judges
- Provides explanation layer for task severity

### Purpose:
> Adds explainability to swarm intelligence without affecting decentralization logic.

---

# 🔥 Key Features

- Fully decentralized swarm simulation
- Peer-to-peer event propagation system
- Autonomous agent decision-making
- Emergent task coordination (no central assignment)
- Vertex AI-powered reasoning layer
- Real-time visualization dashboard
- Fault-tolerant self-healing architecture
- Event-driven DAG-style system trace

---

# 🏗️ System Flow

Frontend (UI / Canvas) ↓ main.js (Visualization Engine) ↓ agents.js (Swarm Intelligence Layer) ↓ protocol.js (P2P Event Mesh) ↓ server.js (Event Generator / Environment)
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
