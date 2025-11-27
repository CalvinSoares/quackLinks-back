import { PrismaClient } from "@prisma/client";
import { promises as dns } from "node:dns";

const APP_TARGET_DOMAIN = process.env.APP_DOMAIN!;

const domainRegex = /^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/;

export class DomainService {
  constructor(private prisma: PrismaClient) {}

  private normalizeDomain(domain: string): string {
    return domain
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
  }

  async getMyDomain(userId: string) {
    return this.prisma.customDomain.findUnique({ where: { userId } });
  }

  async addDomain(userId: string, domain: string) {
    const normalizedDomain = this.normalizeDomain(domain);

    if (!domainRegex.test(normalizedDomain)) {
      throw new Error("Formato de domínio inválido.");
    }

    // VERIFICAÇÃO 1: O usuário já tem um domínio?
    const existingUserDomain = await this.prisma.customDomain.findUnique({
      where: { userId },
    });
    if (existingUserDomain) {
      throw new Error(
        "Você já possui um domínio configurado. Remova o atual para adicionar um novo."
      );
    }

    // VERIFICAÇÃO 2: O domínio já está em uso por outra pessoa?
    const domainInUse = await this.prisma.customDomain.findUnique({
      where: { domain: normalizedDomain },
    });
    if (domainInUse) {
      throw new Error("Este domínio já está em uso por outro usuário.");
    }

    return this.prisma.customDomain.create({
      data: { userId, domain: normalizedDomain },
    });
  }

  async removeDomain(userId: string) {
    return this.prisma.customDomain.delete({
      where: { userId },
    });
  }

  async verifyDomain(
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const customDomain = await this.prisma.customDomain.findUnique({
      where: { userId },
    });

    if (!customDomain) {
      return { success: false, message: "Nenhum domínio configurado." };
    }

    try {
      const cnameRecords = await dns.resolveCname(customDomain.domain);
      if (cnameRecords.includes(APP_TARGET_DOMAIN)) {
        await this.prisma.customDomain.update({
          where: { userId },
          data: { verified: true },
        });
        return { success: true, message: "Domínio verificado com sucesso!" };
      } else {
        return {
          success: false,
          message: `O registro CNAME aponta para '${cnameRecords.join(
            ", "
          )}', mas esperava '${APP_TARGET_DOMAIN}'.`,
        };
      }
    } catch (error: any) {
      if (error.code === "ENODATA" || error.code === "ENOTFOUND") {
        return {
          success: false,
          message: `Não foi possível encontrar um registro CNAME para '${customDomain.domain}'.`,
        };
      }
      console.error("DNS verification error:", error);
      return {
        success: false,
        message: "Ocorreu um erro ao verificar o domínio.",
      };
    }
  }
}
