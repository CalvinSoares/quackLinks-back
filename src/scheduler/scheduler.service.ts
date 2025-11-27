import { PrismaClient } from "@prisma/client";

export class SchedulerService {
  constructor(private prisma: PrismaClient) {}

  public async updateLinkStatus() {
    const now = new Date();
    console.log(
      `[Scheduler] Running link status update at ${now.toISOString()}`
    );

    // Ativa links agendados que ainda não estão ativos
    const activatedLinks = await this.prisma.link.updateMany({
      where: {
        isActive: false,
        scheduledAt: {
          lte: now,
        },
      },
      data: {
        isActive: true,
      },
    });

    if (activatedLinks.count > 0) {
      console.log(`[Scheduler] Activated ${activatedLinks.count} links.`);
    }

    // Desativa links expirados que ainda estão ativos
    const deactivatedLinks = await this.prisma.link.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: now,
        },
      },
      data: {
        isActive: false,
      },
    });

    if (deactivatedLinks.count > 0) {
      console.log(`[Scheduler] Deactivated ${deactivatedLinks.count} links.`);
    }
  }
}
