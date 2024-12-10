const mongoose = require('mongoose');

const MetadataSchema = new mongoose.Schema({
  contractAddress: { type: String, required: true },
  tokenId: { type: String, required: true },
  name: String,
  description: String,
  image: String,
});

module.exports = mongoose.model('Metadata', MetadataSchema);
