import { tool } from "ai";
import { z } from "zod";
import type { AppContext } from "../../core/context";

export const createReminderTools = (ctx: AppContext) => {
  return {
    set_reminder: tool({
      description: "Set a recurring or one-time reminder using Cron format.",
      inputSchema: z.object({
        cron: z.string().describe("Cron expression (min hr day month dow). E.g. '0 9 * * 1-5' for weekdays at 9am."),
        note: z.string().describe("What to remind you about."),
      }),
      execute: async ({ cron, note }) => {
        const id = crypto.randomUUID();
        try {
          ctx.db.run(
            "INSERT INTO reminders (id, cron, note) VALUES (?, ?, ?)",
            [id, cron, note]
          );
          return `✅ Reminder set (ID: ${id})`;
        } catch (e: any) {
          return `Error setting reminder: ${e.message}`;
        }
      },
    }),

    list_reminders: tool({
      description: "List all active reminders.",
      inputSchema: z.object({}),
      execute: async () => {
        const rows = ctx.db.query("SELECT id, cron, note FROM reminders WHERE enabled = 1").all();
        if (rows.length === 0) return "No active reminders.";
        return JSON.stringify(rows, null, 2);
      },
    }),

    delete_reminder: tool({
      description: "Delete a reminder by ID.",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const res = ctx.db.run("DELETE FROM reminders WHERE id = ?", [id]);
        return res.changes > 0 ? "✅ Reminder deleted." : "❌ Reminder not found.";
      },
    }),
  };
};
