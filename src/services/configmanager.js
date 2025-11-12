// src/services/ConfigManager.js
const Config = require('../models/config');

class ConfigManager {
  async get(key, defaultValue = null) {
    const config = await Config.findOne({ key });
    return config ? config.value : defaultValue;
  }

  async set(key, value) {
    await Config.findOneAndUpdate(
      { key },
      { $set: { value } },
      { upsert: true }
    );
  }

  async list() {
    return await Config.find({}).lean();
  }
}

module.exports = new ConfigManager();