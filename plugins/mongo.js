const fp = require('fastify-plugin');
const mongoose = require('mongoose');

async function mongoPlugin(fastify, options) {
  try {
    await mongoose.connect(options.mongoUri, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true
    //   useCreateIndex: true,
    //   useFindAndModify: false
    });
    fastify.decorate('mongo', {
      db: mongoose.connection.db,
      Rule: mongoose.model('Rule'),
      User: mongoose.model('User')
    });
    fastify.log.info('Connected to MongoDB');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

module.exports = fp(mongoPlugin);
