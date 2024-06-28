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

  async classifyText(userId, inputText) {
    const rules = await Rule.find({ userId });

    let satisfyingData = [];
    let notSatisfyingData = [];

    for (const rule of rules) {
      if (this.evaluateRule(rule.rule, inputText)) {
        satisfyingData.push({ userId, ruleId: rule._id, inputText, classification: 'satisfying' });
      } else {
        notSatisfyingData.push({ userId, ruleId: rule._id, inputText, classification: 'not_satisfying' });
      }
    }

    return { satisfyingData, notSatisfyingData };
  }

  validateRule(rule) {
    // length check
    if (rule.length > 255) {
      throw new Error('Rule exceeds maximum length of 255 characters');
    }
  }

  evaluateRule(rule, inputText) {
    const tokens = this.tokenize(rule);
    const ast = this.parse(tokens);
    return this.evaluateAST(ast, inputText);
  }

  tokenize(rule) {
    // Tokenization logic to extract tokens from rule
    return rule.match(/(?:count\([a-zA-Z]\)|sum|max|min|[<=>])/g);
  }

  parse(tokens) {
    // Parsing logic to construct AST(Abstract Syntax Tree) from tokens
    return this.parseExpression(tokens);
  }

  parseExpression(tokens) {
    // Parsing expressions into AST nodes
    if (tokens[0] === 'max' || tokens[0] === 'min') {
      const operator = tokens.shift();
      const left = this.parseTerm(tokens);
      const right = this.parseTerm(tokens);
      return { type: 'comparison', operator, left, right };
    } else if (tokens[0] === 'sum') {
      tokens.shift();
      return { type: 'sum', terms: this.parseTerms(tokens) };
    } else if (tokens[0] === 'count') {
      tokens.shift();
      const operand = tokens.shift().charAt(6); // Extract the letter inside count(a)
      return { type: 'count', operand };
    } else {
      throw new Error('Unexpected token: ' + tokens[0]);
    }
  }

  parseTerm(tokens) {
    // Parsing terms into AST nodes
    if (tokens[0] === '(') {
      tokens.shift(); // Remove '('
      const expr = this.parseExpression(tokens);
      if (tokens[0] !== ')') {
        throw new Error('Expected closing parenthesis');
      }
      tokens.shift(); // Remove ')'
      return expr;
    } else {
      return tokens.shift();
    }
  }

  parseTerms(tokens) {
    // Parsing multiple terms for sum
    const terms = [];
    while (tokens[0] !== ')') {
      terms.push(this.parseTerm(tokens));
    }
    return terms;
  }

  evaluateAST(ast, inputText) {
    // Evaluating AST nodes
    switch (ast.type) {
      case 'comparison':
        const leftValue = this.evaluateNode(ast.left, inputText);
        const rightValue = this.evaluateNode(ast.right, inputText);
        switch (ast.operator) {
          case '<':
            return leftValue < rightValue;
          case '>':
            return leftValue > rightValue;
          case '=':
            return leftValue === rightValue;
          default:
            throw new Error('Unsupported operator: ' + ast.operator);
        }
      case 'sum':
        return ast.terms.reduce((sum, term) => sum + this.evaluateNode(term, inputText), 0);
      case 'count':
        return this.countOccurrences(ast.operand, inputText);
      default:
        throw new Error('Unknown AST node type: ' + ast.type);
    }
  }

  evaluateNode(node, inputText) {
    // Evaluating individual node in AST
    if (typeof node === 'object') {
      return this.evaluateAST(node, inputText);
    } else if (node.startsWith('count(')) {
      const operand = node.charAt(6); // Extract the letter inside count(a)
      return this.countOccurrences(operand, inputText);
    } else {
      return parseInt(node);
    }
  }

  countOccurrences(operand, inputText) {
    const escapedOperand = operand.replace(/[+()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escapedOperand, 'g');
    const matches = inputText.match(pattern);
    return matches ? matches.length : 0;
  }
}

module.exports = new ClassifyController();
