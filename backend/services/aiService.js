const axios = require('axios');

// DSP base URL is configured in .env as DSP_BASE_URL (no trailing slash)
const DSP_BASE_URL = process.env.DSP_BASE_URL;

if (!DSP_BASE_URL) {
  console.warn('[aiService] WARNING: DSP_BASE_URL is not set in environment. DSP calls will fail.');
}

/**
 * Map the stored file extension to the file_type value expected by the DSP service.
 * .sigmf-data raw IQ (cf32_le interleaved float32) is wire-compatible with .iq.
 * Only send a mapping when we know the right type; otherwise forward as-is.
 */
function toDspFileType(ext) {
  if (ext === '.sigmf-data') return '.iq';
  return ext; // .iq and .wav pass through unchanged
}

/**
 * Send the uploaded file URL to the DSP FastAPI microservice and return its response.
 *
 * @param {string} fileUrl      - Publicly downloadable Cloudinary URL
 * @param {string} fileType     - Original file extension (e.g. '.iq', '.wav', '.sigmf-data')
 * @param {object} [metadata]   - Optional signal metadata from the frontend:
 *   {number} sample_rate
 *   {number} center_frequency
 *   {number} symbol_rate
 *   {number} freq_0
 *   {number} freq_1
 */
async function processSignalWithAI(fileUrl, fileType, metadata = {}) {
  if (!DSP_BASE_URL) {
    throw new Error('DSP_BASE_URL is not configured. Cannot contact DSP service.');
  }

  const dspFileType = toDspFileType(fileType);

  // Build the request body — only include fields that are actually known
  const requestBody = {
    file_url: fileUrl,
    file_type: dspFileType
  };

  // Optional DSP parameters: only attach if caller provided a real numeric value
  const optionalFields = ['sample_rate', 'center_frequency', 'symbol_rate', 'freq_0', 'freq_1'];
  if (metadata && typeof metadata === 'object') {
    for (const field of optionalFields) {
      const val = metadata[field];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const num = Number(val);
        if (!isNaN(num)) {
          requestBody[field] = num;
        }
      }
    }
  }

  console.log(`[aiService] Calling DSP at ${DSP_BASE_URL}/analyze`);
  console.log('[aiService] DSP request body:', JSON.stringify(requestBody));

  let response;
  try {
    response = await axios.post(`${DSP_BASE_URL}/analyze`, requestBody, {
      timeout: 120000 // 2-minute timeout; DSP analysis can be slow
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error('DSP service timed out after 120 seconds. Try again or check the Colab/ngrok runtime.');
    }
    if (err.response) {
      // DSP returned an HTTP error status
      throw new Error(
        `DSP service returned HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
      );
    }
    // Network / DNS / connection refused
    throw new Error(
      `DSP service is unreachable (${DSP_BASE_URL}). Verify the ngrok URL is active. Detail: ${err.message}`
    );
  }

  console.log('--- DSP RESPONSE ---');
  console.log(response.data);
  console.log('--------------------');

  if (!response.data || typeof response.data !== 'object') {
    throw new Error('DSP service returned an invalid (non-JSON) response.');
  }

  // If DSP wraps its result in a "data" key, unwrap it; otherwise use the top-level object.
  const finalData = response.data.data || response.data;
  return finalData;
}

module.exports = { processSignalWithAI };