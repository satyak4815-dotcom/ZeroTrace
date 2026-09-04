const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  fileType: String,
  status: String,
  parameters: {
    samplingFrequency: String,
    modulation: String,
    fec: String,
    interleaving: String
  },
  extractedData: {
    header: String,
    payload: String
  }
});

module.exports = mongoose.model('SignalAnalysis', schema);