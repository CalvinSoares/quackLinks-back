import { DomainService } from "./domains.service";

export class DomainController {
  constructor(private domainService: DomainService) {}

  async getMyDomain(userId: string) {
    return this.domainService.getMyDomain(userId);
  }

  async addDomain(userId: string, domain: string) {
    return this.domainService.addDomain(userId, domain);
  }

  async removeDomain(userId: string) {
    return this.domainService.removeDomain(userId);
  }

  async verifyDomain(userId: string) {
    return this.domainService.verifyDomain(userId);
  }
}
