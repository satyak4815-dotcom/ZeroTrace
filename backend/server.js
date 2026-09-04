require('dotenv').config();
const dns = require('dns');

// Configure reliable DNS servers to prevent local ISP/router querySrv ECONNREFUSED issues
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // fallback silently if not supported in environment
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { upload, uploadToCloud } = require('./services/uploadService');
const { processSignalWithAI } = require('./services/aiService');
const SignalAnalysis = require('./models/SignalAnalysis');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Connection Error:", err.message));
}

// Main Signal Analysis Endpoint
app.post('/api/analyze', upload.single('file'), async (req, res) => {
  console.log(">>> /api/analyze HIT! File:", req.file?.originalname, "Size:", req.file?.size, "bytes");
  try {
    // Extract the actual file extension (.iq, .wav, .sigmf-data, …)
    const fileType = '.' + req.file.originalname.split('.').pop().toLowerCase();

    // Upload binary to Cloudinary unchanged; result is a publicly accessible HTTPS URL
    const fileUrl = await uploadToCloud(req.file.buffer);
    console.log("UPLOAD FILE SIZE:", req.file?.size);
    console.log("UPLOAD MIME TYPE:", req.file?.mimetype);
    console.log("CLOUDINARY URL:", fileUrl);
    console.log("MAPPED DSP FILE TYPE:", fileType);
    console.log("SENDING TO DSP NOW...");

    let record = await SignalAnalysis.create({
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      fileType: fileType,
      status: 'processing'
    });

    // Collect optional signal metadata forwarded from the frontend.
    // These are only passed to the DSP when the frontend sends them.
    // Values belonging to a specific recording (e.g. WiFi_Day_1_meb_s4.sigmf-data)
    // must be supplied by the caller — nothing is hardcoded here.
    const metadata = {};
    const metadataFields = ['sample_rate', 'center_frequency', 'symbol_rate', 'freq_0', 'freq_1'];
    if (req.body) {
      for (const field of metadataFields) {
        const val = req.body[field];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const num = Number(val);
          if (!isNaN(num)) {
            metadata[field] = num;
          }
        }
      }
    }

    // Call DSP service — throws descriptive errors on timeout / unavailable / bad response
    const aiResult = await processSignalWithAI(fileUrl, fileType, metadata);

    // Map DSP response fields to the stored record.
    // Values are preserved exactly as returned by DSP (including "Unknown").
    record.parameters = {
      samplingFrequency: aiResult?.parameters?.sampling_frequency ?? aiResult?.sampling_frequency ?? null,
      modulation: aiResult?.parameters?.modulation ?? aiResult?.modulation ?? null,
      fec: aiResult?.parameters?.fec ?? aiResult?.fec ?? null,
      interleaving: aiResult?.parameters?.interleaving ?? aiResult?.interleaving ?? null
    };

    record.extractedData = {
      header: aiResult?.extractedData?.header ?? aiResult?.header ?? null,
      payload: aiResult?.extractedData?.payload ?? aiResult?.payload ?? null
    };

    // Optional cleaned audio base64, forwarded as-is if DSP includes it
    const cleanedAudio = aiResult?.cleaned_audio_base64 ?? null;

    record.status = 'completed';
    await record.save();

    // Pass through real DSP visualization fields (waterfall_matrix, constellation, bitstream)
    // to the frontend response without forcing large arrays into MongoDB persistence.
    const responseData = {
      ...record.toObject(),
      waterfall_matrix: aiResult?.waterfall_matrix ?? aiResult?.waterfall ?? aiResult?.plot_data?.waterfall_matrix ?? aiResult?.plot_data?.waterfall ?? null,
      constellation: aiResult?.constellation ?? aiResult?.constellation_points ?? aiResult?.plot_data?.constellation_points ?? aiResult?.plot_data?.constellation ?? null,
      bitstream: aiResult?.bitstream ?? aiResult?.extractedData ?? null
    };

    console.log("FINAL RESPONSE KEYS:", Object.keys(responseData));

    console.log(
      "WATERFALL PRESENT:",
      Array.isArray(responseData.waterfall_matrix)
    );

    console.log(
      "WATERFALL SIZE:",
      Array.isArray(responseData.waterfall_matrix)
        ? [
          responseData.waterfall_matrix.length,
          responseData.waterfall_matrix[0]?.length
        ]
        : null
    );

    res.json({
      status: 'success',
      data: responseData,
      audioStream: cleanedAudio
    });

  } catch (error) {
    console.error("ANALYZE ERROR MESSAGE:", error?.message);
    console.error("ANALYZE ERROR CODE:", error?.code);
    console.error("ANALYZE ERROR STATUS:", error?.response?.status);
    console.error("ANALYZE ERROR DATA:", error?.response?.data);
    console.error("ANALYZE ERROR STACK:", error?.stack);

    // Distinguish multer file-type rejection from runtime errors
    if (error.message && error.message.startsWith('Unsupported file type')) {
      return res.status(415).json({ error: error.message });
    }

    // DSP-specific error messages bubble up as plain Error throws from aiService
    if (error.message && (
      error.message.includes('DSP service') ||
      error.message.includes('DSP_BASE_URL')
    )) {
      return res.status(502).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
});

// History Endpoints
app.get('/api/history', async (req, res) => {
  try {
    const history = await SignalAnalysis.find();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/history/:id', async (req, res) => {
  try {
    const item = await SignalAnalysis.findById(req.params.id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});