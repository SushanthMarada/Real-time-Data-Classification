require('dotenv').config();

const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');
const Rule = require('./models/ruleModel');
const websocketPlugin = require('./plugins/websocket')

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Middleware for JWT authentication
fastify.register(require('fastify-jwt'), {
  secret: process.env.JWT_SECRET,
});

fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Routes for user management
fastify.register(require('./routes/users'));

// Routes for rule management (CRUD operations)
fastify.register(require('./routes/classify'));

fastify.register(websocketPlugin);
// Start the server
const start = async () => {
  try {
    await fastify.listen(process.env.PORT || 3000, '0.0.0.0');
    fastify.log.info(`Server listening at http://0.0.0.0:${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
