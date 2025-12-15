import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { BlockController } from "./blocks.controller";
import {
  createBlockSchema,
  deleteBlockSchema,
  reorderBlocksSchema,
  updateBlockSchema,
} from "./blocks.schema";
import { authenticateJwt } from "../../plugins/authenticate";

const blockRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // Como BlockService não foi injetado no index principal ainda (vamos fazer no passo 6),
  // precisamos instanciar ou pegar do decorator se já tivermos feito.
  // Assumindo que faremos a injeção correta:
  const blockController = new BlockController(server.blockService);

  server.register(async (privateRoutes) => {
    privateRoutes.addHook("preHandler", authenticateJwt);

    // POST /blocks
    privateRoutes.post(
      "/",
      { schema: createBlockSchema },
      blockController.createHandler
    );

    // PUT /blocks/reorder (Deve vir antes do :id para não conflitar rota)
    privateRoutes.put(
      "/reorder",
      { schema: reorderBlocksSchema },
      blockController.reorderHandler
    );

    // PUT /blocks/:id
    privateRoutes.put(
      "/:id",
      { schema: updateBlockSchema },
      blockController.updateHandler
    );

    // DELETE /blocks/:id
    privateRoutes.delete(
      "/:id",
      { schema: deleteBlockSchema },
      blockController.deleteHandler
    );
  });
};

export default blockRoutes;
