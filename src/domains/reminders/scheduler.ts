import type { AppContext } from "../../core/context";

// Simple Cron Logic (Minute-level precision)
function parseCron(expression: string, date: Date): boolean {
  const [min, hour, day, month, dow] = expression.split(" ") as [string, string, string, string, string];
  
  const check = (val: string, current: number) => 
    val === "*" || val.split(",").map(Number).includes(current);

  return (
    check(min, date.getMinutes()) &&
    check(hour, date.getHours()) &&
    check(day, date.getDate()) &&
    check(month, date.getMonth() + 1) &&
    check(dow, date.getDay())
  );
}

export function startScheduler(ctx: AppContext) {
  console.log("⏰ Reminder Scheduler started");

  setInterval(() => {
    const now = new Date();
    // Round to current minute string "YYYY-MM-DD HH:mm"
    const currentMinuteKey = now.toISOString().slice(0, 16);

    // 1. Fetch enabled reminders
    const reminders = ctx.db.query("SELECT * FROM reminders WHERE enabled = 1").all() as any[];

    for (const r of reminders) {
      // Prevent double firing in the same minute
      const lastFired = r.last_triggered ? r.last_triggered.slice(0, 16) : "";
      if (lastFired === currentMinuteKey) continue;

      // 2. Check if due
      if (parseCron(r.cron, now)) {
        console.log(`🔔 Reminder Triggered: ${r.note}`);

        // 3. Update DB (Mark as triggered)
        ctx.db.run("UPDATE reminders SET last_triggered = ? WHERE id = ?", [now.toISOString(), r.id]);

        // 4. Emit Event
        ctx.bus.emit("reminder:triggered", {
          id: r.id,
          note: r.note,
        });
      }
    }
  }, 15000); // Check every 15s to ensure we hit the minute
}
