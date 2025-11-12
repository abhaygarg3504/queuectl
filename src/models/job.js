// src/models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  command: { type: String, required: true },
  state: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'dead'],
    default: 'pending',
    index: true 
  },
  attempts: { type: Number, default: 0 },
  max_retries: { type: Number, default: 3 },
  locked_by: { type: String, default: null, index: true },
  locked_at: { type: Date, default: null },
  last_error: { type: String, default: null },
  next_retry_at: { type: Date, default: null, index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Job', jobSchema);