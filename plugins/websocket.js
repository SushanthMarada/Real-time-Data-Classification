const fp = require('fastify-plugin');
const Rule = require('../models/ruleModel');

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
      const rules = await Rule.find({ userId });

      let satisfyingData = [];
      let notSatisfyingData = [];

      rules.forEach(rule => {
        if (evaluateRule(rule.rule, data)) {
          satisfyingData.push({ userId, ruleId: rule._id, data, classification: 'satisfying' });
        } else {
          notSatisfyingData.push({ userId, ruleId: rule._id, data, classification: 'not_satisfying' });
        }
      });

      satisfyingData.forEach(classifiedData => {
        fastify.sendToClients(classifiedData);
      });

      notSatisfyingData.forEach(classifiedData => {
        fastify.sendToClients(classifiedData);
      });
    });
  });


  function evaluateRule(rule, data) {
    const tokens = tokenize(rule);
    const ast = parse(tokens);
    return evaluateAST(ast, data);
  }

  function tokenize(rule) {
    // Tokenization of rule
    return rule.match(/(?:count\([a-zA-Z]\)|sum|max|min|[<=>])/g);
  }

  function parse(tokens) {
    // Parsing the rule
    return parseExpression(tokens);
  }

  function parseExpression(tokens) {
  // Parse tokens into AST nodes
  // Simplified example for demonstration
  if (tokens[0] === 'max' || tokens[0] === 'min') {
    const operator = tokens.shift();
    const left = parseTerm(tokens);
    const right = parseTerm(tokens);
    return { type: 'comparison', operator, left, right };
  } else if (tokens[0] === 'sum') {
    tokens.shift();
    return { type: 'sum', terms: parseTerms(tokens) };
  } else if (tokens[0] === 'count') {
    tokens.shift();
    const operand = tokens.shift().charAt(6); // Extract the letter inside count(a)
    return { type: 'count', operand };
  } else {
    throw new Error('Unexpected token: ' + tokens[0]);
  }
}

function parseTerm(tokens) {
  if (tokens[0] === '(') {
    tokens.shift(); // Remove '('
    const expr = parseExpression(tokens);
    if (tokens[0] !== ')') {
      throw new Error('Expected closing parenthesis');
    }
    tokens.shift(); // Remove ')'
    return expr;
  } else {
    return tokens.shift();
  }
}

function parseTerms(tokens) {
  // Parse multiple terms for sum
  const terms = [];
  while (tokens[0] !== ')') {
    terms.push(parseTerm(tokens));
  }
  return terms;
}

function evaluateAST(ast, data) {
  switch (ast.type) {
    case 'comparison':
      const leftValue = evaluateNode(ast.left, data);
      const rightValue = evaluateNode(ast.right, data);
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
      return ast.terms.reduce((sum, term) => sum + evaluateNode(term, data), 0);
    case 'count':
      return countOccurrences(ast.operand, data);
    default:
      throw new Error('Unknown AST node type: ' + ast.type);
  }
}

function evaluateNode(node, data) {
  // Evaluate individual node in ST
  if (typeof node === 'object') {
    return evaluateAST(node, data);
  } else if (node.startsWith('count(')) {
    const operand = node.charAt(6); // Extract the letter inside count(a)
    return countOccurrences(operand, data);
  } else {
    return parseInt(node);
  }
}

function countOccurrences(operand, data) {
    const escapedOperand = operand.replace(/[+()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escapedOperand, 'g');
    const matches = data.match(pattern);
    return matches ? matches.length : 0;
  }
  
}

module.exports = fp(websocketPlugin);
