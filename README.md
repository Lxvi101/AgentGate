We are building AgentGate, a demo to display how the future of the Agentic Internet will work.

/* Fundamental assumptions */
• Like having a smartphone is common nowadays, every human will have their personal AI assistant.
• These AI assistants have access to a lot of private context. This is very sensible data like health data or financial data. 
• To protect it, they can even be running locally, even on a smartphone or laptop.

/* How it will work */
The local, personal AI assistants are not powerful enough to use browser use features. They can't book trains, or take serious actions that require multiple tool calls and reasoning. They are more like an orchestrator, that knows how to reach out to **highly specialized agents**.

These highly special agents build up a new paradigm of the Internet. The Web 4.0. It's the internet where assistants can exchange and offload complicated tasks to Agents.

The highly special agents that make up the Agent Internet are called NetAgents. There are agentic search engines like AgentHub that are able to find them on the Agent Internet.

The AgentHub can be queried with an intent, to find suitable NetAgents. They are kind of like websites, but made for LLMs. AgentHub will return a ranked list of matches for the personal assistant to reach out to. The personal assistant can also save "bookmarks" of often used NetAgents. Each Netagent has an address like agentgate://deltaairlines.flights (agentgate://{name}.{domain})

The personal agent then can reach the netagent and discuss their intent in detail. They can have a multi step discussion and negotiate the exact requirements. The netagent, because it's so specialized can easily complete the task (like searching flights).

When sensitive data is involved, like auth or payments. The netagent can return a "schema" for the localagent to fill out. Kind of like filling out a form to buy something. This form is immediately sent to the booking service to avoid leaking credentials to netagents.

The Fix: Use Delegated Authorization and Zero-Knowledge Proofs (ZKPs). The LocalAgent gives the NetAgent a temporary, scoped token (e.g., "You can spend up to $500 on Delta Airlines, valid for 10 minutes") rather than raw credentials.

Experimental ideas:

1. Fixing the MCP Garbage & Handling Agent Identity
You are absolutely right. MCP has no robust authentication layer for cross-network communication. If you drop a session, how does the NetAgent know it's not a malicious bot pretending to be your LocalAgent?

To fix this, we ditch standard MCP and use Mutual TLS (mTLS) paired with Asymmetric Cryptography (RSA or Ed25519). Here is exactly how they know who they are talking to:

The Handshake (mTLS): When the LocalAgent connects to the NetAgent, they don't just say "hello." They exchange cryptographic certificates. The NetAgent proves it is actually owned by Delta Airlines, and your LocalAgent proves it is a valid AgentGate client.

Session Identity (Ed25519 Keys): When the conversation starts, your LocalAgent generates a temporary public/private key pair. It says to the NetAgent: "Here is my Public Key. For the next 30 minutes, I will cryptographically sign every single message I send you with my Private Key."

Bulletproof Continuity: If your phone loses connection and reconnects 5 minutes later, the LocalAgent sends a message signed with that same Private Key. The NetAgent verifies the signature using the Public Key. It is mathematically impossible for anyone else to fake that signature.

2. Vision Alignment (Incentives): For online Shopping?
Agents need to align on goals. If your LocalAgent's goal is "Save money" and the Delta NetAgent's goal is "Maximize profit," they are misaligned. They align through cryptographic contracts. Your LocalAgent can broadcast a "bounty" (e.g., "$200 for a flight to NYC"). Multiple NetAgents can bid on it. The vision is aligned because the rules of engagement are enforced by math and smart contracts, not trusting a corporation's API.
