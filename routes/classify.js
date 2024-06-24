const classifyController = require('../controllers/classifyController');

async function routes(fastify, options) {
  fastify.post('/rules', { preValidation: [fastify.authenticate] }, classifyController.createRule);
  fastify.get('/rules/:ruleId', { preValidation: [fastify.authenticate] }, classifyController.getRule);
  fastify.put('/rules/:ruleId', { preValidation: [fastify.authenticate] }, classifyController.updateRule);
  fastify.delete('/rules/:ruleId', { preValidation: [fastify.authenticate] }, classifyController.deleteRule);
  fastify.post('/classify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id; // Assuming user is authenticated
    const inputText = request.body.text; // Assuming input text is provided in request body

    try {
      const classificationResult = await classifyController.classifyText(userId, inputText);
      reply.send({ classificationResult });
    } catch (err) {
      reply.status(500).send({ error: 'Failed to classify text', message: err.message });
    }
  });
}

module.exports = routes;
