import axios from 'axios';
import {
  SignalData,
  mockSignalData,
  signalPresets,
  BitstreamCorrelation,
  DecodingResult,
} from '@/lib/mockData';


// ============================================================
// Backend Configuration
// ============================================================
//
// Local development:
//   http://localhost:5000
//
// Vercel:
//   NEXT_PUBLIC_BACKEND_URL
//
// ============================================================

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:5000';


export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});


// ============================================================
// Optional Signal Metadata
// ============================================================
//
// These values are supplied by the user / recording metadata.
// Nothing is assumed or hardcoded.
//
// ============================================================

export interface SignalMetadata {
  sample_rate?: number | string;

  center_frequency?: number | string;

  center_frequency_source?:
    | 'sigmf'
    | 'manual';

  symbol_rate?: number | string;

  freq_0?: number | string;

  freq_1?: number | string;
}


// ============================================================
// Normalize Backend Data
// ============================================================

export function normalizeSignalData(
  raw: any,
  fallbackFile?: File,
  metadata?: SignalMetadata
): SignalData {

  if (!raw) {
    return mockSignalData;
  }


  // ----------------------------------------------------------
  // File information
  // ----------------------------------------------------------

  const fileName =
    fallbackFile?.name ||
    raw.fileName ||
    raw.fileInfo?.name ||
    'unknown_signal.iq';

  const fileNameLower =
    fileName.toLowerCase();

  const isWav =
    fileNameLower.endsWith('.wav');

  const isIq =
    fileNameLower.endsWith('.iq');

  const isSigMf =
    fileNameLower.endsWith(
      '.sigmf-data'
    );


  // ----------------------------------------------------------
  // Signal parameters
  // ----------------------------------------------------------

  const rawParams =
    raw.parameters || {};


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


  const sampling_frequency =
    getParam(
      rawParams.sampling_frequency,
      rawParams.samplingFrequency,
      isWav
        ? 'Unknown'
        : 'Unknown'
    );


  const modulation =
    getParam(
      rawParams.modulation,
      raw.modulation,
      'Unknown'
    );


  const fec =
    getParam(
      rawParams.fec,
      raw.fec,
      isWav
        ? 'None'
        : 'Undetermined'
    );


  const interleaving =
    getParam(
      rawParams.interleaving,
      raw.interleaving,
      isWav
        ? 'None'
        : 'Undetermined'
    );


  // ----------------------------------------------------------
  // Center frequency
  // ----------------------------------------------------------

  const rawCenterFreq =
    rawParams.center_frequency ??
    rawParams.centerFrequency ??
    raw.center_frequency ??
    raw.centerFrequency ??
    metadata?.center_frequency;


  const center_frequency =
    rawCenterFreq !== undefined &&
    rawCenterFreq !== null &&
    String(rawCenterFreq).trim() !== ''
      ? String(rawCenterFreq)
      : undefined;


  const center_frequency_source =
    metadata?.center_frequency_source ??
    rawParams.center_frequency_source ??
    raw.center_frequency_source ??
    (
      center_frequency
        ? 'manual'
        : undefined
    );


  // ----------------------------------------------------------
  // Estimated bandwidth
  // ----------------------------------------------------------
  //
  // Preserved if backend supplies it.
  // No value is invented.
  //
  // ----------------------------------------------------------

  const rawEstimatedBandwidth =
    rawParams.estimated_bandwidth ??
    rawParams.estimatedBandwidth ??
    raw.estimated_bandwidth ??
    raw.estimatedBandwidth ??
    raw.data?.estimated_bandwidth ??
    raw.data?.estimatedBandwidth ??
    raw.data?.parameters
      ?.estimated_bandwidth ??
    raw.data?.parameters
      ?.estimatedBandwidth ??
    raw.result?.estimated_bandwidth ??
    raw.result?.parameters
      ?.estimated_bandwidth;


  const estimated_bandwidth =
    rawEstimatedBandwidth !== undefined &&
    rawEstimatedBandwidth !== null &&
    String(
      rawEstimatedBandwidth
    ).trim() !== ''
      ? String(
          rawEstimatedBandwidth
        )
      : undefined;


  // ----------------------------------------------------------
  // FEC / Interleaving confidence
  // ----------------------------------------------------------

  const fec_confidence:
    string | undefined =
      rawParams.fec_confidence ??
      raw.fec_confidence ??
      raw.data?.fec_confidence ??
      undefined;


  const interleaving_confidence:
    string | undefined =
      rawParams.interleaving_confidence ??
      raw.interleaving_confidence ??
      raw.data
        ?.interleaving_confidence ??
      undefined;


  // ==========================================================
  // REAL BITSTREAM CORRELATION
  // ==========================================================
  //
  // This field comes directly from the Python DSP.
  //
  // We NEVER create a fake successful correlation result.
  //
  // ==========================================================

  const rawCorrelation =
    raw.bitstream_correlation ??
    null;


  let bitstream_correlation:
    BitstreamCorrelation | null =
      null;


  if (
    rawCorrelation &&
    typeof rawCorrelation === 'object'
  ) {

    bitstream_correlation = {

      status:
        String(
          rawCorrelation.status ??
          'unknown'
        ),

      method:
        rawCorrelation.method !==
        undefined
          ? String(
              rawCorrelation.method
            )
          : undefined,

      reference_pattern:
        rawCorrelation
          .reference_pattern !==
        undefined
          ? String(
              rawCorrelation
                .reference_pattern
            )
          : undefined,

      reference_length:
        rawCorrelation
          .reference_length !==
        undefined &&
        rawCorrelation
          .reference_length !==
        null
          ? Number(
              rawCorrelation
                .reference_length
            )
          : undefined,

      best_offset:
        rawCorrelation.best_offset !==
        undefined &&
        rawCorrelation.best_offset !==
        null
          ? Number(
              rawCorrelation
                .best_offset
            )
          : null,

      match_percent:
        rawCorrelation.match_percent !==
        undefined &&
        rawCorrelation.match_percent !==
        null
          ? Number(
              rawCorrelation
                .match_percent
            )
          : null,

      correlation_score:
        rawCorrelation
          .correlation_score !==
        undefined &&
        rawCorrelation
          .correlation_score !==
        null
          ? Number(
              rawCorrelation
                .correlation_score
            )
          : null,

      header_detected:
        Boolean(
          rawCorrelation
            .header_detected
        ),

      header_bits:
        rawCorrelation.header_bits !==
        undefined &&
        rawCorrelation.header_bits !==
        null
          ? String(
              rawCorrelation
                .header_bits
            )
          : '',

      payload_start:
        rawCorrelation.payload_start !==
        undefined &&
        rawCorrelation.payload_start !==
        null
          ? Number(
              rawCorrelation
                .payload_start
            )
          : null,

      payload_bits:
        rawCorrelation.payload_bits !==
        undefined &&
        rawCorrelation.payload_bits !==
        null
          ? String(
              rawCorrelation
                .payload_bits
            )
          : '',
    };
  }


  // ==========================================================
  // DECODING STATUS
  // ==========================================================

  const rawDecoding =
    raw.decoding ??
    null;


  let decoding:
    DecodingResult | null =
      null;


  if (
    rawDecoding &&
    typeof rawDecoding === 'object'
  ) {

    decoding = {

      decoded:
        Boolean(
          rawDecoding.decoded
        ),

      bit_count:
        rawDecoding.bit_count !==
        undefined &&
        rawDecoding.bit_count !==
        null
          ? Number(
              rawDecoding.bit_count
            )
          : undefined,

      message:
        rawDecoding.message !==
        undefined
          ? String(
              rawDecoding.message
            )
          : undefined,

    };
  }


  // ==========================================================
  // BITSTREAM
  // ==========================================================
  //
  // Priority:
  //
  // 1. Correlation-confirmed header + payload
  // 2. Genuine backend bitstream fields
  // 3. Empty strings
  //
  // NO hardcoded 10110100.
  // NO hardcoded demo payload.
  //
  // ==========================================================

  const rawBitstream =
    raw.bitstream ??
    raw.extractedData ??
    {};


  let header = '';
  let payload = '';


  if (
    bitstream_correlation
      ?.header_detected
  ) {

    header =
      bitstream_correlation
        .header_bits ??
      '';

    payload =
      bitstream_correlation
        .payload_bits ??
      '';

  } else {

    if (
      rawBitstream?.header !==
        undefined &&
      rawBitstream?.header !==
        null
    ) {

      header =
        String(
          rawBitstream.header
        );

    }


    if (
      rawBitstream?.payload !==
        undefined &&
      rawBitstream?.payload !==
        null
    ) {

      payload =
        String(
          rawBitstream.payload
        );

    }
  }


  // ----------------------------------------------------------
  // Do not display placeholder text as decoded binary
  // ----------------------------------------------------------

  if (
    header === 'N/A' ||
    header === 'null' ||
    header === 'undefined'
  ) {
    header = '';
  }


  if (
    payload === 'N/A' ||
    payload === 'null' ||
    payload === 'undefined'
  ) {
    payload = '';
  }


  // ==========================================================
  // Constellation
  // ==========================================================
  // Constellation
  // ==========================================================

  const rawConst =
    raw.constellation ??
    raw.constellation_points ??
    raw.plot_data
      ?.constellation_points ??
    raw.plot_data
      ?.constellation ??
    raw.data?.constellation ??
    raw.data?.constellation_points ??
    raw.result?.constellation ??
    raw.result?.constellation_points;


  let constellation_points:
    {
      x: number;
      y: number;
    }[] | null = null;


  if (
    !isWav &&
    Array.isArray(rawConst) &&
    rawConst.length > 0
  ) {

    constellation_points =
      rawConst.map(
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


          if (
            pt &&
            typeof pt === 'object' &&
            'I' in pt &&
            'Q' in pt
          ) {

            return {
              x: Number(pt.I),
              y: Number(pt.Q),
            };
          }


          return {
            x: 0,
            y: 0,
          };
        }
      );
  }


  // ==========================================================
  // Waterfall
  // ==========================================================

  const rawWaterfall =
    raw.waterfall_matrix ??
    raw.waterfall ??
    raw.plot_data
      ?.waterfall_matrix ??
    raw.plot_data
      ?.waterfall ??
    raw.data?.waterfall_matrix ??
    raw.data?.waterfall ??
    raw.result?.waterfall_matrix ??
    raw.result?.waterfall;


  let waterfall_matrix:
    number[][] | null =
      null;


  if (
    Array.isArray(
      rawWaterfall
    ) &&
    rawWaterfall.length > 0 &&
    Array.isArray(
      rawWaterfall[0]
    )
  ) {

    waterfall_matrix =
      rawWaterfall;
  }


  // ==========================================================
  // File information
  // ==========================================================

  const durationEst =
    raw.fileInfo?.duration ||
    (
      isWav
        ? 'Unknown'
        : 'Unknown'
    );


  const derivedType =
    isSigMf
      ? 'IQ'
      : isWav
        ? 'AUDIO_WAV_IQ'
        : isIq
          ? 'RF_SIGNAL'
          : 'RF_SIGNAL';


  // ==========================================================
  // DSP Candidate & Structural Analysis Fields
  // ==========================================================

  const rawFingerprint =
    raw.signal_fingerprint ??
    raw.data?.signal_fingerprint ??
    raw.result?.signal_fingerprint ??
    null;

  const rawCandidateBitstream =
    raw.candidate_bitstream ??
    raw.data?.candidate_bitstream ??
    raw.result?.candidate_bitstream ??
    null;

  const rawPeriodicity =
    raw.periodicity_analysis ??
    raw.data?.periodicity_analysis ??
    raw.result?.periodicity_analysis ??
    null;

  const rawInterleaver =
    raw.interleaver_analysis ??
    raw.data?.interleaver_analysis ??
    raw.result?.interleaver_analysis ??
    null;

  const rawFec =
    raw.fec_analysis ??
    raw.data?.fec_analysis ??
    raw.result?.fec_analysis ??
    null;

  const rawSimInput =
    raw.simulation_input ??
    raw.data?.simulation_input ??
    raw.result?.simulation_input ??
    null;

  const rawDeintSim =
    raw.deinterleaving_simulation ??
    raw.data?.deinterleaving_simulation ??
    raw.result?.deinterleaving_simulation ??
    null;

  const rawFecSim =
    raw.fec_simulation ??
    raw.data?.fec_simulation ??
    raw.result?.fec_simulation ??
    null;


  // ==========================================================
  // Final normalized object
  // ==========================================================

  return {

    status:
      raw.status ||
      'success',


    fileInfo: {

      name:
        fileName,

      type:
        raw.fileInfo?.type ||
        derivedType,

      duration:
        durationEst,

    },


    parameters: {

      sampling_frequency,

      modulation,

      fec,

      interleaving,

      center_frequency,

      center_frequency_source,

      estimated_bandwidth,

      fec_confidence,

      interleaving_confidence,

    },


    plot_data: {

      constellation_points,

      waterfall_matrix,

    },


    bitstream: {

      header,

      payload,

    },


    bitstream_correlation,

    decoding,


    audioStream:
      raw.audioStream ??
      null,

    signal_fingerprint:
      rawFingerprint ? String(rawFingerprint) : null,

    candidate_bitstream:
      rawCandidateBitstream ?? null,

    periodicity_analysis:
      rawPeriodicity ?? null,

    interleaver_analysis:
      rawInterleaver ?? null,

    fec_analysis:
      rawFec ?? null,

    simulation_input:
      rawSimInput ?? null,

    deinterleaving_simulation:
      rawDeintSim ?? null,

    fec_simulation:
      rawFecSim ?? null,

  };
}




// ============================================================
// Backend Health Check
// ============================================================

export async function checkBackendHealth():
  Promise<boolean> {

  try {

    const response =
      await apiClient.get(
        '/history',
        {
          timeout: 3000,
        }
      );

    return (
      response.status === 200
    );

  } catch {

    return false;
  }
}


// ============================================================
// Fetch Existing Analysis
// ============================================================

export async function fetchSignalData():
  Promise<{
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
      Array.isArray(
        response.data
      ) &&
      response.data.length > 0
    ) {

      const completedRecords =
        response.data.filter(
          (r: any) =>
            r.status ===
            'completed'
        );


      const latestRecord =
        completedRecords.length > 0
          ? completedRecords[
              completedRecords.length -
              1
            ]
          : response.data[
              response.data.length -
              1
            ];


      return {

        data:
          normalizeSignalData(
            latestRecord
          ),

        isFromBackend:
          true,

      };
    }


    return {

      data:
        mockSignalData,

      isFromBackend:
        true,

    };

  } catch (error) {

    console.info(
      '[ZeroTrace API] Backend service unavailable. Using demo fallback data.'
    );


    return {

      data:
        mockSignalData,

      isFromBackend:
        false,

    };
  }
}


// ============================================================
// Waterfall Debug Fingerprinting
// ============================================================

let previousFingerprint:
  string | null =
    null;


function computeMatrixStatsAndFingerprint(
  matrix: any
) {

  if (
    !Array.isArray(matrix) ||
    matrix.length === 0 ||
    !Array.isArray(
      matrix[0]
    )
  ) {

    return {

      size: null,

      samples: null,

      min: null,

      max: null,

      fingerprint:
        'NONE',

    };
  }


  const rows =
    matrix.length;

  const cols =
    matrix[0].length;


  let min =
    Infinity;

  let max =
    -Infinity;

  let hash =
    0;


  for (
    let r = 0;
    r < rows;
    r++
  ) {

    const row =
      matrix[r];


    if (
      !Array.isArray(row)
    ) {
      continue;
    }


    for (
      let c = 0;
      c < cols;
      c++
    ) {

      const v =
        Number(
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

    fingerprint:
      fpStr,

  };
}


// ============================================================
// Append optional numeric metadata
// ============================================================

function appendNumericMetadata(
  formData: FormData,
  key:
    | 'sample_rate'
    | 'center_frequency'
    | 'symbol_rate'
    | 'freq_0'
    | 'freq_1',
  value:
    | number
    | string
    | undefined
) {

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ''
  ) {
    return;
  }


  const numberValue =
    Number(value);


  if (
    !Number.isFinite(
      numberValue
    )
  ) {
    return;
  }


  if (
    key === 'symbol_rate' &&
    numberValue <= 0
  ) {
    return;
  }


  formData.append(
    key,
    String(numberValue)
  );
}


// ============================================================
// Upload Signal
// ============================================================

export async function uploadSignalFile(
  file: File,

  arg2?:
    | ((
        progress: number
      ) => void)
    | SignalMetadata,

  arg3?:
    | ((
        progress: number
      ) => void)
    | SignalMetadata

): Promise<SignalData> {


  let onProgress:
    | ((
        progress: number
      ) => void)
    | undefined =
      undefined;


  let metadata:
    | SignalMetadata
    | undefined =
      undefined;


  if (typeof arg2 === 'function') {
    onProgress = arg2;
  } else if (
    arg2 &&
    typeof arg2 === 'object'
  ) {
    metadata = arg2;
  }


  if (typeof arg3 === 'function') {
    onProgress = arg3;
  } else if (
    arg3 &&
    typeof arg3 === 'object'
  ) {
    metadata = arg3;
  }


  const formData =
    new FormData();


  formData.append(
    'file',
    file
  );


  appendNumericMetadata(
    formData,
    'sample_rate',
    metadata?.sample_rate
  );


  appendNumericMetadata(
    formData,
    'center_frequency',
    metadata?.center_frequency
  );


  appendNumericMetadata(
    formData,
    'symbol_rate',
    metadata?.symbol_rate
  );


  appendNumericMetadata(
    formData,
    'freq_0',
    metadata?.freq_0
  );


  appendNumericMetadata(
    formData,
    'freq_1',
    metadata?.freq_1
  );


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

      symbol_rate:
        formData.get(
          'symbol_rate'
        ),

      freq_0:
        formData.get(
          'freq_0'
        ),

      freq_1:
        formData.get(
          'freq_1'
        ),

    }
  );


  try {

    const response =
      await apiClient.post(
        '/analyze',
        formData,
        {

          headers: {
            'Content-Type':
              undefined,
          },


          onUploadProgress:
            (
              progressEvent: any
            ) => {

              if (
                progressEvent.total &&
                onProgress
              ) {

                const percent =
                  Math.round(
                    (
                      progressEvent.loaded *
                      100
                    ) /
                    progressEvent.total
                  );


                onProgress(
                  percent
                );
              }
            },
        }
      );


    console.log(
      '[ZeroTrace Upload] Raw backend response:',
      response.data
    );


    if (
      response.data &&
      (
        response.data.status ===
          'success' ||
        response.data.data ||
        response.data.parameters
      )
    ) {

      const mergedRecord = {

        ...(
          response.data.data ||
          response.data
        ),

        audioStream:
          response.data
            .audioStream,

      };


      const normalized =
        normalizeSignalData(
          mergedRecord,
          file,
          metadata
        );


      const matrix =
        normalized
          ?.plot_data
          ?.waterfall_matrix;


      const stats =
        computeMatrixStatsAndFingerprint(
          matrix
        );


      const sameAsPrevious =
        previousFingerprint !==
          null &&
        previousFingerprint ===
          stats.fingerprint;


      previousFingerprint =
        stats.fingerprint;

      const hasWaterfall =
        Array.isArray(normalized.plot_data?.waterfall_matrix) &&
        normalized.plot_data.waterfall_matrix.length > 0 &&
        Array.isArray(normalized.plot_data.waterfall_matrix[0]);

      const waterfallDim = hasWaterfall
        ? `${normalized.plot_data.waterfall_matrix!.length}x${normalized.plot_data.waterfall_matrix![0].length}`
        : 'null';

      const constPointsCount =
        Array.isArray(normalized.plot_data?.constellation_points)
          ? normalized.plot_data.constellation_points.length
          : null;

      console.log('[ZeroTrace Real Backend Plot Data Check]', {
        file: file.name,
        waterfall_received: hasWaterfall,
        waterfall_dimensions: waterfallDim,
        constellation_points_count: constPointsCount,
      });

      console.log('[ZeroTrace DSP Candidate Analysis Check]', {
        signal_fingerprint: normalized.signal_fingerprint ?? null,
        candidate_bit_count: normalized.candidate_bitstream?.bit_count ?? null,
        periodicity_peak_lag: normalized.periodicity_analysis?.peak_lag ?? null,
        interleaver_candidate: normalized.interleaver_analysis?.candidate ?? null,
        fec_candidate: normalized.fec_analysis?.candidate ?? null,
      });


      console.log(
        'WATERFALL FILE:',
        file.name
      );

      console.log(
        'WATERFALL SIZE:',
        stats.size
      );

      console.log(
        'WATERFALL SAMPLE VALUES:',
        stats.samples
      );

      console.log(
        'WATERFALL MIN:',
        stats.min
      );

      console.log(
        'WATERFALL MAX:',
        stats.max
      );

      console.log(
        'WATERFALL FINGERPRINT:',
        stats.fingerprint
      );

      console.log(
        'SAME AS PREVIOUS MATRIX:',
        sameAsPrevious
      );


      console.log(
        'BITSTREAM CORRELATION:',
        normalized
          .bitstream_correlation
      );


      console.log(
        'DECODING:',
        normalized.decoding
      );


      return normalized;
    }


    throw new Error(
      response.data?.message ||
      response.data?.error ||
      'Analysis failed or returned invalid response format.'
    );

  } catch (error) {

    console.error(
      '[ZeroTrace API] Upload / analysis failed:',
      error
    );


    if (onProgress) {

      onProgress(0);
    }


    throw error;
  }
}