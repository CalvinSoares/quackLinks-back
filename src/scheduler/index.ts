import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { SchedulerService } from "./scheduler.service";

export function startSchedulers(prisma: PrismaClient) {
  const schedulerService = new SchedulerService(prisma);

  cron.schedule("* * * * *", () => {
    schedulerService.updateLinkStatus().catch((err) => {
      console.error("[Scheduler] Error during link status update:", err);
    });
  });

  console.log("🕒 Schedulers started.");
}
