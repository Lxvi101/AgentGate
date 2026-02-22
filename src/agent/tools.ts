import type { AppContext } from "../core/context";
import { createReminderTools } from "../domains/reminders/tools";
import { createSwarmTools } from "../domains/swarm/tools";
import { createAgentHubTools } from "../domains/agenthub/tools";

/** Tools for sub-agents (no dispatch_swarm to prevent recursion) */
export const createChildAgentTools = (ctx: AppContext) => {
  return {
    ...createReminderTools(ctx),
  };
};

/** Full tool set for Samantha (Mother Agent) including swarm and AgentHub */
export const createAgentTools = (ctx: AppContext) => {
  return {
    ...createChildAgentTools(ctx),
    ...createSwarmTools(ctx),
    ...createAgentHubTools(ctx),
  };
};
