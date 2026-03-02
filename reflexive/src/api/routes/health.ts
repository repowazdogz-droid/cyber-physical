import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      ok: true,
      version: '0.1.0',
      git_commit: process.env.GIT_COMMIT || undefined,
    };
  });
}
