import { Prisma, PrismaClient, User } from "@prisma/client";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  useDiscordAvatar: true,
  discordAvatarUrl: true,
  role: true,
  stripeCustomerId: true,
};

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export interface IUserRepository {
  findById(id: string): Promise<PublicUser | null>;
  findFullUserById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<PublicUser[]>;
  findByStripeCustomerId(stripeCustomerId: string): Promise<User | null>;
  updateByStripeCustomerId(
    stripeCustomerId: string,
    data: Prisma.UserUpdateInput
  ): Promise<User>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<PublicUser>;
  deleteById(id: string): Promise<PublicUser>;
  deleteDiscordAccount(userId: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findFullUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<PublicUser[]> {
    return this.prisma.user.findMany({
      select: publicUserSelect,
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<PublicUser> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });
  }

  async deleteById(id: string): Promise<PublicUser> {
    return this.prisma.user.delete({
      where: { id },
      select: publicUserSelect,
    });
  }

  async deleteDiscordAccount(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.account.deleteMany({
        where: { userId, provider: "discord" },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          discordAvatarUrl: null,
          useDiscordAvatar: false,
        },
      }),
    ]);
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { stripeCustomerId },
    });
  }

  async updateByStripeCustomerId(
    stripeCustomerId: string,
    data: Prisma.UserUpdateInput
  ): Promise<User> {
    return this.prisma.user.update({
      where: { stripeCustomerId },
      data,
    });
  }
}
