const fp = require('fastify-plugin');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function authPlugin(fastify, options) {
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      const token = request.headers['authorization'].split(' ')[1];
      const decoded = jwt.verify(token, options.jwtSecret);
      request.user = decoded;
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}

module.exports = fp(authPlugin);
