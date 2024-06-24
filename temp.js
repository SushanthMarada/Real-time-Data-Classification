// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');

// MongoDB connection setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected'); // Add this log statement
})
.catch(err => console.error('MongoDB connection error:', err));

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
