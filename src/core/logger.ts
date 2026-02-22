// src/core/logger.ts
import type { AppContext } from "./context";

export function initNodeNetLogger(ctx: AppContext) {
  console.log("🕸️ Node Net Logging Framework Initialized");

  // 1. Spin up the Bun WebSocket Server
  const server = Bun.serve({
    port: 8080,
    fetch(req, server) {
      // Upgrade incoming HTTP requests to WebSockets
      if (server.upgrade(req)) return;
      return new Response("WebSocket Server is running.", { status: 200 });
    },
    websocket: {
      open(ws) {
        console.log("👀 React Dashboard connected!");
        // IMPORTANT: Subscribe this connection to the "logs" channel
        ws.subscribe("logs"); 
      },
      message(ws, message) {}, // We don't expect messages from the UI
      close(ws) {
        console.log("🙈 React Dashboard disconnected.");
      },
    },
  });

  console.log(`📡 Log Broadcaster running on ws://localhost:${server.port}`);

  // 2. Listen to AgentGate's internal event bus
  ctx.bus.on("node:log", (event) => {
    const timestamp = event.timestamp || new Date().toISOString();

    const nodeEvent = {
      id: crypto.randomUUID(),
      timestamp,
      source: event.source,
      target: event.target,
      action: event.action,
      payload: event.payload,
    };

    // Print to terminal as usual
    console.log(`\n[NODE NET] 🌐 ${nodeEvent.source} ➔ ${nodeEvent.target} [${nodeEvent.action.toUpperCase()}]`);

    // 3. Broadcast the log to all subscribed React clients
    server.publish("logs", JSON.stringify(nodeEvent));
  });
}