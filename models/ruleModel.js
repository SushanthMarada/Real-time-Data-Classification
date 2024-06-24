const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rule: { type: String, required: true, maxlength: 255 }
});

const Rule = mongoose.model('Rule', ruleSchema);

module.exports = Rule;
