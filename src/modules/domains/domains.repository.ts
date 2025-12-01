import { PrismaClient, CustomDomain } from "@prisma/client";

export interface IDomainRepository {
  findByUserId(userId: string): Promise<CustomDomain | null>;
  findByDomain(domain: string): Promise<CustomDomain | null>;
  create(userId: string, domain: string): Promise<CustomDomain>;
  deleteByUserId(userId: string): Promise<void>;
  update(userId: string, data: { verified: boolean }): Promise<CustomDomain>;
}

export class DomainRepository implements IDomainRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<CustomDomain | null> {
    return this.prisma.customDomain.findUnique({ where: { userId } });
  }
  async findByDomain(domain: string): Promise<CustomDomain | null> {
    return this.prisma.customDomain.findUnique({ where: { domain } });
  }
  async create(userId: string, domain: string): Promise<CustomDomain> {
    return this.prisma.customDomain.create({ data: { userId, domain } });
  }
  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.customDomain.delete({ where: { userId } });
  }
  async update(
    userId: string,
    data: { verified: boolean }
  ): Promise<CustomDomain> {
    return this.prisma.customDomain.update({ where: { userId }, data });
  }
}
