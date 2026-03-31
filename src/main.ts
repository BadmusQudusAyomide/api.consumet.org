require('dotenv').config();
import Redis from 'ioredis';
import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';
import chalk from 'chalk';

import dramacool from './routes/movies/dramacool';

export const redis =
  process.env.REDIS_HOST &&
  new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  });

const fastify = Fastify({
  maxParamLength: 1000,
  logger: true,
});

export const tmdbApi = process.env.TMDB_KEY && process.env.TMDB_KEY;

(async () => {
  const PORT = Number(process.env.PORT) || 3000;

  await fastify.register(FastifyCors, {
    origin: '*',
    methods: 'GET',
  });

  console.log(chalk.green(`Starting server on port ${PORT}... 🚀`));

  if (!process.env.REDIS_HOST) {
    console.warn(chalk.yellowBright('Redis not found. Cache disabled.'));
  }

  if (!process.env.TMDB_KEY) {
    console.warn(
      chalk.yellowBright('TMDB api key not found. the TMDB meta route may not work.')
    );
  }

  await fastify.register(dramacool, { prefix: '/movies/dramacool' });

  try {
    fastify.get('/', (_, reply) => {
      reply.status(200).send('Welcome to consumet api! 🎉');
    });

    fastify.get('*', (_request, reply) => {
      reply.status(404).send({
        message: '',
        error: 'page not found',
      });
    });

    fastify.listen({ port: PORT, host: '0.0.0.0' }, (error, address) => {
      if (error) throw error;
      console.log(`server listening on ${address}`);
    });
  } catch (err: any) {
    fastify.log.error(err);
    process.exit(1);
  }
})();

export default async function handler(req: any, res: any) {
  await fastify.ready();
  fastify.server.emit('request', req, res);
}
