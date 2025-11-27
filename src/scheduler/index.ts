import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { SchedulerService } from "./scheduler.service";

// É importante instanciar um novo cliente Prisma para o processo de longa duração
const prisma = new PrismaClient();
const schedulerService = new SchedulerService(prisma);

export function startSchedulers() {
  // Roda a cada minuto: '* * * * *'
  cron.schedule("* * * * *", () => {
    schedulerService.updateLinkStatus().catch((err) => {
      console.error("[Scheduler] Error during link status update:", err);
    });
  });

  console.log("🕒 Schedulers started.");
}
