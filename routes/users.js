const userController = require('../controllers/userController');

async function routes(fastify, options) {
  fastify.post('/signup', userController.signup);
  fastify.post('/login', userController.login);
}

module.exports = routes;
