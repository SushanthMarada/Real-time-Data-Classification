const Rule = require('../models/ruleModel');

class ClassifyController {
  async createRule(request, reply) {
    const { rule } = request.body;
    try {
      this.validateRule(rule);
      const newRule = new Rule({ userId: request.user.id, rule });
      await newRule.save();
      reply.send({ id: newRule._id });
    } catch (err) {
      reply.status(400).send({ error: 'Rule creation failed', message: err.message });
    }
  }

  async getRule(request, reply) {
    const { ruleId } = request.params;
    try {
      const rule = await Rule.findOne({ _id: ruleId, userId: request.user.id });
      if (!rule) {
        reply.status(404).send({ error: 'Rule not found' });
        return;
      }
      reply.send(rule);
    } catch (err) {
      reply.status(500).send({ error: 'Failed to fetch rule', message: err.message });
    }
  }

  async updateRule(request, reply) {
    const { ruleId } = request.params;
    const { rule } = request.body;
    try {
      this.validateRule(rule);
      const updatedRule = await Rule.findOneAndUpdate(
        { _id: ruleId, userId: request.user.id },
        { rule },
        { new: true }
      );
      if (!updatedRule) {
        reply.status(404).send({ error: 'Rule not found' });
        return;
      }
      reply.send({ id: updatedRule._id });
    } catch (err) {
      reply.status(500).send({ error: 'Failed to update rule', message: err.message });
    }
  }

  async deleteRule(request, reply) {
    const { ruleId } = request.params;
    try {
      const deletedRule = await Rule.findOneAndDelete({ _id: ruleId, userId: request.user.id });
      if (!deletedRule) {
        reply.status(404).send({ error: 'Rule not found' });
        return;
      }
      reply.send({ message: 'Rule deleted successfully' });
    } catch (err) {
      reply.status(500).send({ error: 'Failed to delete rule', message: err.message });
    }
  }

  validateRule(rule) {
    // Implement rule validation logic here
    if (rule.length > 255) {
      throw new Error('Rule exceeds maximum length of 255 characters');
    }
  }
}

module.exports = new ClassifyController();
