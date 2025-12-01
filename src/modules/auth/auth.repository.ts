import { PrismaClient, VerificationToken } from "@prisma/client";

export interface IAuthRepository {
  createVerificationToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<VerificationToken>;
  findVerificationToken(
    userId: string,
    token: string
  ): Promise<VerificationToken | null>;
  deleteVerificationToken(id: string): Promise<void>;
}

export class AuthRepository implements IAuthRepository {
  constructor(private prisma: PrismaClient) {}

  async createVerificationToken(
    userId: string,
    token: string,
    expires: Date
  ): Promise<VerificationToken> {
    return this.prisma.verificationToken.create({
      data: { userId, token, expires },
    });
  }

  async findVerificationToken(
    userId: string,
    token: string
  ): Promise<VerificationToken | null> {
    return this.prisma.verificationToken.findFirst({
      where: { userId, token },
    });
  }

  async deleteVerificationToken(id: string): Promise<void> {
    await this.prisma.verificationToken.delete({
      where: { id },
    });
  }
}
