import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { analysisRoutes } from './routes/analysis.js';
import { artifactsRoutes } from './routes/artifacts.js';
import { demoPackRoutes } from './routes/demo-pack.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function buildServer() {
  const fastify = Fastify({
    logger: true,
  });

  // CORS
  await fastify.register(cors, {
    origin: true,
  });

  // Routes
  await fastify.register(healthRoutes);
  await fastify.register(analysisRoutes);
  await fastify.register(artifactsRoutes);
  await fastify.register(demoPackRoutes);

  return fastify;
}

async function main() {
  const server = await buildServer();
  
  try {
    // Use localhost in sandboxed environments (Cursor), 0.0.0.0 otherwise
    const host = process.env.HOST || '127.0.0.1';
    await server.listen({ port: PORT, host });
    console.log(`REFLEXIVE API server listening on port ${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { buildServer };
