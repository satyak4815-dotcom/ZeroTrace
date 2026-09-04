import axios from 'axios';
import { SignalData, mockSignalData, signalPresets } from '@/lib/mockData';

// Backend base URL:
// - Local development falls back to http://localhost:5000
// - Vercel uses NEXT_PUBLIC_BACKEND_URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Normalizes and adapts backend MongoDB record data into the frontend SignalData schema.
 * Handles differences in key names (samplingFrequency vs sampling_frequency, extractedData vs bitstream, etc.)
 * and fills in safe defaults for missing fields.
 */
export function normalizeSignalData(raw: any, fallbackFile?: File): SignalData {
  if (!raw) return mockSignalData;

  const fileName =
    fallbackFile?.name ||
    raw.fileName ||
    raw.fileInfo?.name ||
    'intercept_alpha_44.IQ';

  const fileNameLower = fileName.toLowerCase();
  const isWav = fileNameLower.endsWith('.wav');
  const isIq = fileNameLower.endsWith('.iq');
  const isSigMf = fileNameLower.endsWith('.sigmf-data');

  const rawParams = raw.parameters || {};

  // Preserve returned DSP parameter values (including "Unknown", "None", "N/A") honestly
  const getParam = (
    val1: any,
    val2: any,
    defaultVal: string
  ) => {
    if (
      val1 !== undefined &&
      val1 !== null &&
      val1 !== ''
    ) {
      return String(val1);
    }

    if (
      val2 !== undefined &&
      val2 !== null &&
      val2 !== ''
    ) {
      return String(val2);
    }

    return defaultVal;
  };

  const sampling_frequency = getParam(
    rawParams.sampling_frequency,
    rawParams.samplingFrequency,
    isWav ? '44100 Hz' : '2.4 MHz'
  );

  const modulation = getParam(
    rawParams.modulation,
    rawParams.modulation,
    isWav
      ? 'Analog Audio'
      : isIq || isSigMf
        ? 'IQ Signal'
        : 'FSK'
  );

  const fec = getParam(
    rawParams.fec,
    rawParams.fec,
    isWav ? 'None' : 'None'
  );

  const interleaving = getParam(
    rawParams.interleaving,
    rawParams.interleaving,
    isWav ? 'None' : 'None'
  );

  // Extract and normalize bitstream / extractedData
  const rawExtracted =
    raw.extractedData ||
    raw.bitstream ||
    {};

  let header =
    rawExtracted.header !== undefined &&
      rawExtracted.header !== null
      ? String(rawExtracted.header)
      : null;

  let payload =
    rawExtracted.payload !== undefined &&
      rawExtracted.payload !== null
      ? String(rawExtracted.payload)
      : null;

  if (!header && !payload) {
    header = isWav
      ? 'N/A'
      : '10110100';

    payload = isWav
      ? 'N/A'
      : '0100111001101110011101000110010101101100';
  } else {
    header =
      header ??
      (isWav
        ? 'N/A'
        : '10110100');

    payload =
      payload ??
      (isWav
        ? 'N/A'
        : '0100111001101110011101000110010101101100');
  }

  // Extract real Constellation Points from DSP / backend response
  let rawConst =
    raw.constellation ??
    raw.constellation_points ??
    raw.plot_data?.constellation_points ??
    raw.plot_data?.constellation;

  let constellation_points = null;

  if (
    !isWav &&
    Array.isArray(rawConst) &&
    rawConst.length > 0
  ) {
    constellation_points = rawConst.map(
      (pt: any) => {
        if (
          Array.isArray(pt) &&
          pt.length >= 2
        ) {
          return {
            x: Number(pt[0]),
            y: Number(pt[1]),
          };
        }

        if (
          pt &&
          typeof pt === 'object' &&
          'x' in pt &&
          'y' in pt
        ) {
          return {
            x: Number(pt.x),
            y: Number(pt.y),
          };
        }

        if (
          pt &&
          typeof pt === 'object' &&
          'i' in pt &&
          'q' in pt
        ) {
          return {
            x: Number(pt.i),
            y: Number(pt.q),
          };
        }

        return {
          x: 0,
          y: 0,
        };
      }
    );
  }

  // Extract real Waterfall Matrix (number[][]) from DSP / backend response
  let rawWaterfall =
    raw.waterfall_matrix ??
    raw.waterfall ??
    raw.plot_data?.waterfall_matrix ??
    raw.plot_data?.waterfall;

  let waterfall_matrix: number[][] | null =
    null;

  if (
    Array.isArray(rawWaterfall) &&
    rawWaterfall.length > 0 &&
    Array.isArray(rawWaterfall[0])
  ) {
    waterfall_matrix = rawWaterfall;
  }

  const durationEst =
    raw.fileInfo?.duration ||
    (isWav ? '3.2s' : '4.2s');

  const derivedType = isSigMf
    ? 'IQ'
    : isWav
      ? 'AUDIO_WAV_IQ'
      : 'RF_SIGNAL';

  return {
    status: raw.status || 'success',

    fileInfo: {
      name: fileName,
      type:
        raw.fileInfo?.type ||
        derivedType,
      duration: durationEst,
    },

    parameters: {
      sampling_frequency,
      modulation,
      fec,
      interleaving,
    },

    plot_data: {
      constellation_points,
      waterfall_matrix,
    },

    bitstream: {
      header,
      payload,
    },

    audioStream:
      raw.audioStream || null,
  };
}

/**
 * Health-check to verify if Express/MongoDB backend is reachable.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response =
      await apiClient.get(
        '/history',
        {
          timeout: 3000,
        }
      );

    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Fetch latest signal analysis data from MongoDB history.
 * Tries the backend API endpoint first; falls back seamlessly to mockSignalData.
 */
export async function fetchSignalData(): Promise<{
  data: SignalData;
  isFromBackend: boolean;
}> {
  try {
    const response =
      await apiClient.get(
        '/history'
      );

    if (
      response.data &&
      Array.isArray(response.data) &&
      response.data.length > 0
    ) {
      // Find the latest completed record,
      // or fallback to latest available record
      const completedRecords =
        response.data.filter(
          (r: any) =>
            r.status === 'completed'
        );

      const latestRecord =
        completedRecords.length > 0
          ? completedRecords[
          completedRecords.length - 1
          ]
          : response.data[
          response.data.length - 1
          ];

      return {
        data:
          normalizeSignalData(
            latestRecord
          ),
        isFromBackend: true,
      };
    }

    return {
      data: mockSignalData,
      isFromBackend: true,
    };
  } catch (error) {
    console.info(
      '[ZeroTrace API] Backend service unavailable or in mock mode. Utilizing mockSignalData contract.'
    );

    return {
      data: mockSignalData,
      isFromBackend: false,
    };
  }
}

let previousFingerprint:
  | string
  | null = null;

function computeMatrixStatsAndFingerprint(
  matrix: any
) {
  if (
    !Array.isArray(matrix) ||
    matrix.length === 0 ||
    !Array.isArray(matrix[0])
  ) {
    return {
      size: null,
      samples: null,
      min: null,
      max: null,
      fingerprint: 'NONE',
    };
  }

  const rows = matrix.length;
  const cols = matrix[0].length;

  let min = Infinity;
  let max = -Infinity;
  let hash = 0;

  for (
    let r = 0;
    r < rows;
    r++
  ) {
    const row = matrix[r];

    if (!Array.isArray(row)) {
      continue;
    }

    for (
      let c = 0;
      c < cols;
      c++
    ) {
      const v = Number(
        row[c]
      );

      if (
        Number.isFinite(v)
      ) {
        if (v < min) {
          min = v;
        }

        if (v > max) {
          max = v;
        }

        const intV =
          Math.floor(
            v * 10000
          ) &
          0x7fffffff;

        hash =
          (
            hash * 31 +
            intV +
            r * 17 +
            c * 13
          ) |
          0;
      }
    }
  }

  const samples = [
    matrix[0]?.[0],
    matrix[0]?.[1],
    matrix[1]?.[0],
    matrix[10]?.[10],
  ];

  const fpStr =
    (hash >>> 0)
      .toString(16)
      .padStart(
        8,
        '0'
      ) +
    `_${rows}x${cols}`;

  return {
    size: [
      rows,
      cols,
    ],
    samples,
    min:
      Number.isFinite(min)
        ? min
        : null,
    max:
      Number.isFinite(max)
        ? max
        : null,
    fingerprint: fpStr,
  };
}

export interface SignalMetadata {
  sample_rate?:
  | number
  | string;

  center_frequency?:
  | number
  | string;
}

/**
 * Upload a raw .IQ or .wav signal capture file for signal processing & demodulation.
 * Posts to Node.js /api/analyze endpoint with correct 'file' field name and optional SDR capture metadata.
 */
export async function uploadSignalFile(
  file: File,
  onProgressOrMetadata?:
    | ((
      progress: number
    ) => void)
    | SignalMetadata,
  optionalMetadata?: SignalMetadata
): Promise<SignalData> {
  const onProgress =
    typeof onProgressOrMetadata ===
      'function'
      ? onProgressOrMetadata
      : undefined;

  const metadata =
    (
      typeof onProgressOrMetadata ===
        'object' &&
        onProgressOrMetadata !==
        null
        ? onProgressOrMetadata
        : optionalMetadata
    ) as
    | SignalMetadata
    | undefined;

  const formData =
    new FormData();

  // Key name 'file' matches Express multer upload.single('file')
  formData.append(
    'file',
    file
  );

  if (
    metadata?.sample_rate !==
    undefined &&
    metadata?.sample_rate !==
    null &&
    String(
      metadata.sample_rate
    ).trim() !== ''
  ) {
    const srNum =
      Number(
        metadata.sample_rate
      );

    if (
      !isNaN(srNum) &&
      srNum > 0
    ) {
      formData.append(
        'sample_rate',
        String(srNum)
      );
    }
  }

  if (
    metadata?.center_frequency !==
    undefined &&
    metadata?.center_frequency !==
    null &&
    String(
      metadata.center_frequency
    ).trim() !== ''
  ) {
    const cfNum =
      Number(
        metadata.center_frequency
      );

    if (
      !isNaN(cfNum) &&
      cfNum > 0
    ) {
      formData.append(
        'center_frequency',
        String(cfNum)
      );
    }
  }

  console.log(
    '[ZeroTrace Upload] FormData payload:',
    {
      file:
        file.name,

      sample_rate:
        formData.get(
          'sample_rate'
        ),

      center_frequency:
        formData.get(
          'center_frequency'
        ),
    }
  );

  try {
    const response = await apiClient.post('/analyze', formData, {
      headers: {
        'Content-Type': undefined,
      },
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
    });

    console.log('[ZeroTrace Upload] Raw backend response:', response.data);

    // Accept response if it has data, regardless of exact status string
    if (
      response.data &&
      (
        response.data.status === 'success' ||
        response.data.data ||
        response.data.parameters
      )
    ) {
      const mergedRecord = {
        ...(response.data.data || response.data),
        audioStream: response.data.audioStream,
      };

      const normalized = normalizeSignalData(mergedRecord, file);
      const matrix = normalized?.plot_data?.waterfall_matrix;
      const stats = computeMatrixStatsAndFingerprint(matrix);

      const sameAsPrevious =
        previousFingerprint !== null &&
        previousFingerprint === stats.fingerprint;

      previousFingerprint = stats.fingerprint;

      console.log('WATERFALL FILE:', file.name);
      console.log('WATERFALL SIZE:', stats.size);
      console.log('WATERFALL SAMPLE VALUES:', stats.samples);
      console.log('WATERFALL MIN:', stats.min);
      console.log('WATERFALL MAX:', stats.max);
      console.log('WATERFALL FINGERPRINT:', stats.fingerprint);
      console.log('SAME AS PREVIOUS MATRIX:', sameAsPrevious);

      return normalized;
    }

    return getSimulatedFallback(file);
  } catch (error) {
    console.info(
      '[ZeroTrace API] Uplink offline or fallback triggered. Simulating tactical signal ingestion...'
    );

    // Simulate realistic ingestion & extraction progression on error/fallback
    if (onProgress) {
      for (let p = 15; p <= 100; p += 20) {
        onProgress(p);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }

      onProgress(100);
    }

    return getSimulatedFallback(file);
  }
}

/**
 * Helper to construct a compliant SignalData response based on the uploaded file metadata
 */
function getSimulatedFallback(
  file: File
): SignalData {
  const fileNameLower =
    file.name.toLowerCase();

  const isWav =
    fileNameLower.endsWith(
      '.wav'
    );

  const isSigMf =
    fileNameLower.endsWith(
      '.sigmf-data'
    );

  const sizeMB =
    (
      file.size /
      (1024 * 1024)
    ).toFixed(1);

  const durationEst =
    Math.max(
      1.5,
      Math.min(
        30,
        Number(sizeMB) *
        2.1
      )
    ).toFixed(1) +
    's';

  if (isWav) {
    return {
      ...signalPresets.covert,

      fileInfo: {
        name: file.name,
        type:
          'AUDIO_WAV_IQ',
        duration:
          durationEst,
      },
    };
  }

  return {
    ...mockSignalData,

    fileInfo: {
      name: file.name,

      type: isSigMf
        ? 'IQ'
        : 'RF_SIGNAL',

      duration:
        durationEst,
    },
  };
}