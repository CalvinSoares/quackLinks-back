import { PrismaClient, Account, User } from "@prisma/client";

// O tipo de retorno que inclui o usuário
type AccountWithUser = Account & { user: User };

export interface IAccountRepository {
  findByProviderAccountId(
    provider: string,
    providerAccountId: string
  ): Promise<AccountWithUser | null>;
  create(data: {
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    accessToken: string;
  }): Promise<Account>;
}

export class AccountRepository implements IAccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findByProviderAccountId(
    provider: string,
    providerAccountId: string
  ): Promise<AccountWithUser | null> {
    return this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: { user: true },
    });
  }

  async create(data: {
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    accessToken: string;
  }): Promise<Account> {
    return this.prisma.account.create({
      data: {
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        access_token: data.accessToken,
      },
    });
  }
}
