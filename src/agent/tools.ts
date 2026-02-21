import type { AppContext } from "../core/context";
import { createReminderTools } from "../domains/reminders/tools";
import { createSwarmTools } from "../domains/swarm/tools";

/** Tools for sub-agents (no dispatch_swarm to prevent recursion) */
export const createChildAgentTools = (ctx: AppContext) => {
  return {
    ...createReminderTools(ctx),
  };
};

/** Full tool set for Claire (Mother Agent) including swarm */
export const createAgentTools = (ctx: AppContext) => {
  return {
    ...createChildAgentTools(ctx),
    ...createSwarmTools(ctx),
  };
};
