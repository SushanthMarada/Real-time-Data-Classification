const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');

class UserController {
  async signup(request, reply) {
    const { username, password } = request.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ username, password: hashedPassword });
      await newUser.save();
      reply.send({ message: 'User created successfully' });
    } catch (err) {
      reply.status(500).send({ error: 'User creation failed', message: err.message });
    }
  }

  async login(request, reply) {
    const { username, password } = request.body;
    try {
      const user = await User.findOne({ username });
      if (!user) {
        reply.status(401).send({ error: 'User not found' });
        return;
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        reply.status(401).send({ error: 'Invalid password' });
        return;
      }
      const token = jwt.sign({ id: user._id, username: user.username }, config.jwtSecret, { expiresIn: '1h' });
      reply.send({ token });
    } catch (err) {
      reply.status(500).send({ error: 'Login failed', message: err.message });
    }
  }
}

module.exports = new UserController();
