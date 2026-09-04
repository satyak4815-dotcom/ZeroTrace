const { analyzeSignalData } = require('../services/aiService');

const processSignal = async (req, res) => {
  try {
    const { signalData } = req.body;
    if (!signalData) {
      return res.status(400).json({ error: 'Signal data is required' });
    }

    const analysisResult = await analyzeSignalData(signalData);
    res.status(200).json({ success: true, analysis: analysisResult });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process signal analysis' });
  }
};

module.exports = { processSignal };