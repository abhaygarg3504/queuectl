// src/models/Worker.js
const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  pid: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'stopped'],
    default: 'active'
  },
  current_job: { type: String, default: null },
  started_at: { type: Date, default: Date.now },
  last_heartbeat: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Worker', workerSchema);
