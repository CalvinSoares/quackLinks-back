import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

import { PageRepository } from "../modules/pages/pages.repository";

import { PageService } from "../modules/pages/pages.service";
import { AnalyticsService } from "../modules/analytics/analytics.service";
import { UserService } from "../modules/users/user.service";
import { UserRepository } from "../modules/users/user.repository";
import { AuthService } from "../modules/auth/auth.service";
import { AuthRepository } from "../modules/auth/auth.repository";
import { AccountRepository } from "../modules/auth/account.repository";
import { AnalyticsRepository } from "../modules/analytics/analytics.repository";
import { AudioService } from "../modules/audios/audios.service";
import { AudioRepository } from "../modules/audios/audios.repository";
import { TemplateService } from "../modules/templates/templates.service";
import { TemplateRepository } from "../modules/templates/templates.repository";
import { UploadService } from "../modules/uploads/upload.service";
import { LinkService } from "../modules/links/links.service";
import { LinkRepository } from "../modules/links/links.repository";
import { BillingService } from "../modules/billing/billing.service";
import { DomainService } from "../modules/domains/domains.service";
import { DomainRepository } from "../modules/domains/domains.repository";

declare module "fastify" {
  interface FastifyInstance {
    pageService: PageService;
    analyticsService: AnalyticsService;
    userService: UserService;
    authService: AuthService;
    audioService: AudioService;
    templateService: TemplateService;
    uploadService: UploadService;
    linkService: LinkService;
    billingService: BillingService;
    domainService: DomainService;
  }
}

const dependenciesPlugin: FastifyPluginAsync = async (fastify, opts) => {
  const prisma = new PrismaClient();
  fastify.decorate("prisma", prisma);

  const pageRepository = new PageRepository(prisma);
  const userRepository = new UserRepository(prisma);
  const authRepository = new AuthRepository(prisma);
  const accountRepository = new AccountRepository(prisma);
  const analyticsRepository = new AnalyticsRepository(prisma);
  const audioRepository = new AudioRepository(prisma);
  const templateRepository = new TemplateRepository(prisma);
  const linkRepository = new LinkRepository(prisma);
  const domainRepository = new DomainRepository(prisma);

  const pageService = new PageService(pageRepository);
  const userService = new UserService(userRepository);
  const authService = new AuthService(
    userRepository,
    authRepository,
    accountRepository
  );
  const analyticsService = new AnalyticsService(
    analyticsRepository,
    pageRepository
  );
  const audioService = new AudioService(audioRepository, pageRepository);
  const templateService = new TemplateService(
    templateRepository,
    pageRepository
  );
  const uploadService = new UploadService();
  const linkService = new LinkService(linkRepository, pageRepository);
  const billingService = new BillingService(userRepository);
  const domainService = new DomainService(domainRepository);

  fastify.decorate("pageService", pageService);
  fastify.decorate("userService", userService);
  fastify.decorate("authService", authService);
  fastify.decorate("analyticsService", analyticsService);
  fastify.decorate("audioService", audioService);
  fastify.decorate("templateService", templateService);
  fastify.decorate("uploadService", uploadService);
  fastify.decorate("linkService", linkService);
  fastify.decorate("billingService", billingService);
  fastify.decorate("domainService", domainService);
};

export default fp(dependenciesPlugin);
