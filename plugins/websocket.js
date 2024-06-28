const fp = require('fastify-plugin');
const classifyController = require('../controllers/classifyController');

async function websocketPlugin(fastify, options) {
  fastify.register(require('fastify-websocket'));

  fastify.decorate('sendToClients', function (message) {
    fastify.websocketServer.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });
  });

  fastify.get('/stream', { websocket: true }, (connection, req) => {
    connection.socket.on('message', async message => {
      const data = JSON.parse(message);
      console.log('Received message:', data);

      const userId = req.user.id;

      try {
        const classificationResult = await classifyController.classifyText(userId, data);
        if (classificationResult.satisfyingData.length > 0) {
          classificationResult.satisfyingData.forEach(classifiedData => {
            fastify.sendToClients(classifiedData);
          });
        }
        if (classificationResult.notSatisfyingData.length > 0) {
          classificationResult.notSatisfyingData.forEach(classifiedData => {
            fastify.sendToClients(classifiedData);
          });
        }
      } catch (err) {
        console.error('Failed to classify:', err);
      }
    });
  });
}

module.exports = fp(websocketPlugin);
