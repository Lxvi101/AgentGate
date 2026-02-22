// src/core/events.ts
import { EventEmitter } from "events";

export type ApprovalRequest = {
  id: string;
  description: string;
  metadata?: Record<string, any>;
};

export type ApprovalDecision = {
  id: string;
  approved: boolean;
};

type AppEventMap = {
  // AI Events
  "agent:log": { role: "system" | "user" | "assistant"; content: string };
  "agent:error": { error: Error };
  // UPDATED: Added images array (base64 strings)
  "agent:message_received": {
    text: string;
    images?: string[];
    chatId: number;
    userId: string;
  };
  
  // Human-in-the-loop Flow
  "approval:requested": ApprovalRequest;
  "approval:decision": ApprovalDecision;
  
  // Domain Events (Examples)
  "order:created": { orderId: string; total: string };
  
  // NEW EVENTS
  "email:raw_received": {
    from: string;
    subject: string;
    body: string;
    conversationId: string;
    messageId: string;
  };
  "email:actionable": {
    from: string;
    subject: string;
    category: "support" | "offer";
    summary: string;
    orderId?: string;
    enrichedContext?: string;
    conversationId: string;
  };
  "reminder:triggered": { id: string; note: string };

  // --- Node Net Logging Framework ---
  "node:log": {
    source: string;       // e.g., "User", "Samantha", "AgentHub"
    target: string;       // e.g., "Samantha", "AgentHub", "HelperAgent-12"
    action: string;       // e.g., "message", "delegate", "tool_call"
    payload: any;         // The actual data (intent, text, etc.)
    timestamp?: string;
  };

  // --- AgentHub Events ---
  "agenthub:search": {
    searchId: string;
    intent: string;
    capabilities: string[];
  };
};

// Type definitions to make EventEmitter type-safe
export class AppEventBus extends EventEmitter {
  override emit<K extends keyof AppEventMap>(
    eventName: K,
    params: AppEventMap[K]
  ): boolean {
    return super.emit(eventName, params);
  }

  override on<K extends keyof AppEventMap>(
    eventName: K,
    listener: (params: AppEventMap[K]) => void
  ): this {
    return super.on(eventName, listener);
  }

  override off<K extends keyof AppEventMap>(
    eventName: K,
    listener: (params: AppEventMap[K]) => void
  ): this {
    return super.off(eventName, listener);
  }
}