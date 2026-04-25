// =============================================================================
// MeshRescue | Vertex AI Layer (Gemini Integration)
// =============================================================================
// Central AI reasoning engine for swarm decisions, anomaly detection,
// and consensus intelligence.
// =============================================================================

import { CONFIG } from "./config.js";
export class VertexAI {

    static endpoint() {
        return "https://generativelanguage.googleapis.com/v1beta/models";
    }

    static apiKey() {
        return CONFIG?.VERTEX?.API_KEY;
    }

    static model() {
        return CONFIG?.VERTEX?.MODEL || "gemini-1.5-flash";
    }

    // ===============================
    // BASIC GENERATION
    // ===============================
    static async generate(prompt, options = {}) {

        if (!this.apiKey()) {
            console.warn("⚠️ Vertex AI: Missing API Key");
            return {
                success: false,
                error: "Missing API key"
            };
        }

        try {
            const url = `${this.endpoint()}/${this.model()}:generateContent?key=${this.apiKey()}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: options.temperature ?? 0.4,
                        topK: options.topK ?? 32,
                        topP: options.topP ?? 0.9,
                        maxOutputTokens: options.maxTokens ?? 512
                    }
                })
            });

            const data = await response.json();

            const text =
                data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

            return {
                success: true,
                output: text,
                raw: data
            };

        } catch (err) {
            console.error("VertexAI Error:", err);

            return {
                success: false,
                error: err.message
            };
        }
    }

    // ===============================
    // SWARM TASK INTELLIGENCE
    // ===============================
    static async evaluateTask(task, agents) {

        const prompt = `
You are the Vertex Swarm Consensus Engine.

Your job is to assign the BEST agent to a task.

TASK:
${JSON.stringify(task, null, 2)}

AVAILABLE AGENTS:
${JSON.stringify(agents, null, 2)}

Return STRICT JSON ONLY:

{
  "bestAgent": "agent_id",
  "reason": "short explanation",
  "confidence": 0.0-1.0
}
        `;

        return await this.generate(prompt, {
            temperature: 0.2,
            maxTokens: 300
        });
    }

    // ===============================
    // BYZANTINE / ANOMALY DETECTION
    // ===============================
    static async detectAnomaly(events) {

        const prompt = `
You are a security analysis engine for a distributed swarm system.

Analyze the event stream below and detect:
- suspicious agents
- conflicting claims
- abnormal behavior patterns
- possible Byzantine faults

EVENT STREAM:
${JSON.stringify(events.slice(-25), null, 2)}

Return STRICT JSON ONLY:

{
  "suspiciousAgents": [],
  "anomalies": [],
  "riskLevel": "low | medium | high",
  "summary": "short explanation"
}
        `;

        return await this.generate(prompt, {
            temperature: 0.1,
            maxTokens: 400
        });
    }

    // ===============================
    // CONSENSUS REASONING (FUTURE-READY)
    // ===============================
    static async consensusDecision(state) {

        const prompt = `
You are a distributed consensus engine (Vertex DAG model).

Analyze system state and suggest consensus outcome.

STATE:
${JSON.stringify(state, null, 2)}

Return STRICT JSON:

{
  "decision": "string",
  "confidence": 0.0-1.0,
  "reasoning": "short explanation"
}
        `;

        return await this.generate(prompt, {
            temperature: 0.3,
            maxTokens: 400
        });
    }
}