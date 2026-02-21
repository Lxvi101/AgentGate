// src/core/approval.ts
import type { AppContext } from "./context";

export async function waitForApproval(
  ctx: AppContext,
  description: string
): Promise<boolean> {
  const approvalId = crypto.randomUUID();

  // 1. Emit event (Telegram listens for this)
  ctx.bus.emit("approval:requested", {
    id: approvalId,
    description,
  });

  console.log(`⏸️  Waiting for approval: ${description} (${approvalId})`);

  // 2. Return Promise that resolves when the Event Bus fires back
  return new Promise((resolve) => {
    const handler = ({ id, approved }: { id: string; approved: boolean }) => {
      if (id === approvalId) {
        ctx.bus.off("approval:decision", handler); // Cleanup listener
        resolve(approved);
      }
    };

    // Listen for the decision
    ctx.bus.on("approval:decision", handler);

    // Auto-deny after 5 minutes to prevent hanging promises
    setTimeout(() => {
      ctx.bus.off("approval:decision", handler);
      resolve(false);
    }, 300_000);
  });
}
