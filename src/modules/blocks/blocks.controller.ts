import { FastifyReply, FastifyRequest } from "fastify";
import { User as PrismaUser } from "@prisma/client";
import { BlockService } from "./blocks.service";
import {
  CreateBlockInput,
  ReorderBlocksInput,
  UpdateBlockInput,
} from "./blocks.schema";

export class BlockController {
  constructor(private blockService: BlockService) {}

  createHandler = async (
    req: FastifyRequest<{ Body: CreateBlockInput }>,
    reply: FastifyReply
  ) => {
    const user = req.user as PrismaUser;
    try {
      const block = await this.blockService.createBlock(user.id, req.body);
      return reply.code(201).send(block);
    } catch (err: any) {
      return reply.code(400).send({ message: err.message });
    }
  };

  updateHandler = async (
    req: FastifyRequest<{ Params: { id: string }; Body: UpdateBlockInput }>,
    reply: FastifyReply
  ) => {
    const user = req.user as PrismaUser;
    try {
      const block = await this.blockService.updateBlock(
        user.id,
        req.params.id,
        req.body
      );
      return block;
    } catch (err: any) {
      if (err.message.includes("not found"))
        return reply.code(404).send({ message: "Bloco não encontrado." });
      return reply.code(403).send({ message: "Não autorizado." });
    }
  };

  deleteHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const user = req.user as PrismaUser;
    try {
      await this.blockService.deleteBlock(user.id, req.params.id);
      return reply.code(204).send();
    } catch (err: any) {
      return reply.code(400).send({ message: err.message });
    }
  };

  reorderHandler = async (
    req: FastifyRequest<{ Body: ReorderBlocksInput }>,
    reply: FastifyReply
  ) => {
    const user = req.user as PrismaUser;
    try {
      await this.blockService.reorderBlocks(user.id, req.body);
      return reply.code(200).send({ message: "Ordem atualizada com sucesso." });
    } catch (err: any) {
      return reply.code(400).send({ message: err.message });
    }
  };
}
