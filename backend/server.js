require('dotenv').config();
const dns = require('dns');

// Configure reliable DNS servers to prevent local ISP/router
// querySrv ECONNREFUSED issues
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Fallback silently if not supported in environment
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const {
  upload,
  uploadToCloud
} = require('./services/uploadService');

const {
  processSignalWithAI
} = require('./services/aiService');

const SignalAnalysis = require('./models/SignalAnalysis');

const app = express();

app.use(cors());
app.use(express.json());


// ============================================================
// MongoDB Connection
// ============================================================

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB Connected');
    })
    .catch((err) => {
      console.log(
        'MongoDB Connection Error:',
        err.message
      );
    });
}


// ============================================================
// Main Signal Analysis Endpoint
// ============================================================

app.post(
  '/api/analyze',
  upload.single('file'),
  async (req, res) => {

    console.log(
      '>>> /api/analyze HIT! File:',
      req.file?.originalname,
      'Size:',
      req.file?.size,
      'bytes'
    );

    try {

      // --------------------------------------------------------
      // Validate uploaded file
      // --------------------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          error: 'No signal file uploaded.'
        });
      }


      // --------------------------------------------------------
      // Determine file type
      // --------------------------------------------------------

      const fileType =
        '.' +
        req.file.originalname
          .split('.')
          .pop()
          .toLowerCase();


      // --------------------------------------------------------
      // Upload raw binary file to Cloudinary
      // --------------------------------------------------------

      const fileUrl = await uploadToCloud(
        req.file.buffer
      );

      console.log(
        'UPLOAD FILE SIZE:',
        req.file?.size
      );

      console.log(
        'UPLOAD MIME TYPE:',
        req.file?.mimetype
      );

      console.log(
        'CLOUDINARY URL:',
        fileUrl
      );

      console.log(
        'MAPPED DSP FILE TYPE:',
        fileType
      );

      console.log(
        'SENDING TO DSP NOW...'
      );


      // --------------------------------------------------------
      // Create MongoDB processing record
      // --------------------------------------------------------

      let record =
        await SignalAnalysis.create({

          fileName:
            req.file.originalname,

          fileUrl:
            fileUrl,

          fileType:
            fileType,

          status:
            'processing'

        });


      // --------------------------------------------------------
      // Collect optional signal metadata
      // --------------------------------------------------------
      //
      // Nothing is hardcoded here.
      //
      // Metadata must come from the caller/frontend.
      // Example:
      //
      // sample_rate
      // center_frequency
      // symbol_rate
      // freq_0
      // freq_1
      //
      // --------------------------------------------------------

      const metadata = {};

      const metadataFields = [
        'sample_rate',
        'center_frequency',
        'symbol_rate',
        'freq_0',
        'freq_1'
      ];

      if (req.body) {

        for (const field of metadataFields) {

          const val = req.body[field];

          if (
            val !== undefined &&
            val !== null &&
            String(val).trim() !== ''
          ) {

            const num = Number(val);

            if (!isNaN(num)) {
              metadata[field] = num;
            }

          }
        }
      }


      console.log(
        'SIGNAL METADATA:',
        metadata
      );


      // --------------------------------------------------------
      // Call Python DSP service
      // --------------------------------------------------------

      const aiResult =
        await processSignalWithAI(
          fileUrl,
          fileType,
          metadata
        );


      console.log(
        'DSP RESPONSE RECEIVED'
      );

      console.log(
        'DSP RESPONSE KEYS:',
        aiResult
          ? Object.keys(aiResult)
          : []
      );


      // --------------------------------------------------------
      // Store important parameter results
      // --------------------------------------------------------

      record.parameters = {

        samplingFrequency:
          aiResult?.parameters
            ?.sampling_frequency ??
          aiResult?.sampling_frequency ??
          null,

        modulation:
          aiResult?.parameters
            ?.modulation ??
          aiResult?.modulation ??
          null,

        fec:
          aiResult?.parameters
            ?.fec ??
          aiResult?.fec ??
          null,

        interleaving:
          aiResult?.parameters
            ?.interleaving ??
          aiResult?.interleaving ??
          null

      };


      // --------------------------------------------------------
      // Legacy extracted-data support
      // --------------------------------------------------------

      record.extractedData = {

        header:
          aiResult?.extractedData
            ?.header ??
          aiResult?.header ??
          null,

        payload:
          aiResult?.extractedData
            ?.payload ??
          aiResult?.payload ??
          null

      };


      // --------------------------------------------------------
      // Optional cleaned WAV audio
      // --------------------------------------------------------

      const cleanedAudio =
        aiResult?.cleaned_audio_base64 ??
        null;


      // --------------------------------------------------------
      // Save completed MongoDB record
      // --------------------------------------------------------

      record.status = 'completed';

      await record.save();


      // ========================================================
      // FRONTEND RESPONSE
      // ========================================================
      //
      // Large DSP visualization data is passed directly to the
      // frontend instead of forcing it into MongoDB.
      //
      // IMPORTANT:
      //
      // bitstream_correlation contains the genuine DSP
      // known-preamble correlation result.
      //
      // ========================================================

      const responseData = {

        ...record.toObject(),


        // ------------------------------------------------------
        // Waterfall / STFT
        // ------------------------------------------------------

        waterfall_matrix:

          aiResult?.waterfall_matrix ??

          aiResult?.waterfall ??

          aiResult?.plot_data
            ?.waterfall_matrix ??

          aiResult?.plot_data
            ?.waterfall ??

          null,


        // ------------------------------------------------------
        // IQ Constellation
        // ------------------------------------------------------

        constellation:

          aiResult?.constellation ??

          aiResult?.constellation_points ??

          aiResult?.plot_data
            ?.constellation_points ??

          aiResult?.plot_data
            ?.constellation ??

          null,


        // ------------------------------------------------------
        // Recovered Demodulated Bitstream
        // ------------------------------------------------------

        bitstream:

          aiResult?.bitstream ??

          aiResult?.extractedData ??

          null,


        // ------------------------------------------------------
        // Genuine Bitstream Correlation Result
        // ------------------------------------------------------
        //
        // Expected structure:
        //
        // {
        //   status: "success",
        //   method: "known_preamble_bit_correlation",
        //   reference_pattern: "10110100",
        //   reference_length: 8,
        //   best_offset: 0,
        //   match_percent: 100,
        //   correlation_score: 1.0,
        //   header_detected: true,
        //   header_bits: "10110100",
        //   payload_start: 8,
        //   payload_bits: "..."
        // }
        //
        // ------------------------------------------------------

        bitstream_correlation:

          aiResult?.bitstream_correlation ??
          null,


        // ------------------------------------------------------
        // DSP Decoding Status
        // ------------------------------------------------------

        decoding:

          aiResult?.decoding ??
          null,


        // ------------------------------------------------------
        // Signal Fingerprint & DSP Analysis Fields
        // ------------------------------------------------------

        signal_fingerprint:

          aiResult?.signal_fingerprint ??
          null,

        candidate_bitstream:

          aiResult?.candidate_bitstream ??
          null,

        periodicity_analysis:

          aiResult?.periodicity_analysis ??
          null,

        interleaver_analysis:

          aiResult?.interleaver_analysis ??
          null,

        fec_analysis:

          aiResult?.fec_analysis ??
          null

      };


      // --------------------------------------------------------
      // Debug logs
      // --------------------------------------------------------

      console.log(
        'FINAL RESPONSE KEYS:',
        Object.keys(responseData)
      );


      console.log(
        'WATERFALL PRESENT:',
        Array.isArray(
          responseData.waterfall_matrix
        )
      );


      console.log(
        'WATERFALL SIZE:',

        Array.isArray(
          responseData.waterfall_matrix
        )
          ? [
              responseData
                .waterfall_matrix
                .length,

              responseData
                .waterfall_matrix[0]
                ?.length
            ]
          : null
      );


      console.log(
        'BITSTREAM CORRELATION PRESENT:',
        responseData
          .bitstream_correlation !== null
      );


      if (
        responseData
          .bitstream_correlation
      ) {

        console.log(
          'HEADER DETECTED:',
          responseData
            .bitstream_correlation
            .header_detected
        );

        console.log(
          'CORRELATION MATCH:',
          responseData
            .bitstream_correlation
            .match_percent
        );

      }


      // --------------------------------------------------------
      // Send final frontend response
      // --------------------------------------------------------

      res.json({

        status:
          'success',

        data:
          responseData,

        audioStream:
          cleanedAudio

      });

    } catch (error) {

      // ========================================================
      // Error Logging
      // ========================================================

      console.error(
        'ANALYZE ERROR MESSAGE:',
        error?.message
      );

      console.error(
        'ANALYZE ERROR CODE:',
        error?.code
      );

      console.error(
        'ANALYZE ERROR STATUS:',
        error?.response?.status
      );

      console.error(
        'ANALYZE ERROR DATA:',
        error?.response?.data
      );

      console.error(
        'ANALYZE ERROR STACK:',
        error?.stack
      );


      // --------------------------------------------------------
      // Unsupported uploaded file
      // --------------------------------------------------------

      if (
        error.message &&
        error.message.startsWith(
          'Unsupported file type'
        )
      ) {

        return res
          .status(415)
          .json({
            error:
              error.message
          });

      }


      // --------------------------------------------------------
      // DSP service errors
      // --------------------------------------------------------

      if (
        error.message &&
        (
          error.message.includes(
            'DSP service'
          ) ||
          error.message.includes(
            'DSP_BASE_URL'
          )
        )
      ) {

        return res
          .status(502)
          .json({
            error:
              error.message
          });

      }


      // --------------------------------------------------------
      // Generic server error
      // --------------------------------------------------------

      res
        .status(500)
        .json({
          error:
            error.message
        });

    }
  }
);


// ============================================================
// History Endpoints
// ============================================================

app.get(
  '/api/history',
  async (req, res) => {

    try {

      const history =
        await SignalAnalysis.find();

      res.json(history);

    } catch (error) {

      res
        .status(500)
        .json({
          error:
            error.message
        });

    }

  }
);


app.get(
  '/api/history/:id',
  async (req, res) => {

    try {

      const item =
        await SignalAnalysis.findById(
          req.params.id
        );

      res.json(item);

    } catch (error) {

      res
        .status(500)
        .json({
          error:
            error.message
        });

    }

  }
);


// ============================================================
// Start Server
// ============================================================

const PORT =
  process.env.PORT ||
  5000;

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);