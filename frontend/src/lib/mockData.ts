export interface ConstellationPoint {
  x: number;
  y: number;
}

export interface FileInfo {
  name: string;
  type: string;
  duration: string;
}

export interface SignalParameters {
  sampling_frequency: string;
  modulation: string;
  fec: string;
  interleaving: string;

  center_frequency?: string | number;
  center_frequency_source?: 'sigmf' | 'manual';

  estimated_bandwidth?: string | number;

  fec_confidence?: string;
  interleaving_confidence?: string;
}

export interface PlotData {
  constellation_points?: ConstellationPoint[] | null;
  waterfall_matrix?: number[][] | null;
}

export interface Bitstream {
  header: string;
  payload: string;
}

/**
 * Result of known-preamble bitstream correlation performed
 * by the Python DSP engine.
 *
 * This is optional because correlation is only available
 * when the DSP has successfully recovered a bitstream.
 */
export interface BitstreamCorrelation {
  status: string;

  method?: string;

  reference_pattern?: string;
  reference_length?: number;

  best_offset?: number | null;

  match_percent?: number | null;
  correlation_score?: number | null;

  header_detected?: boolean;

  header_bits?: string;

  payload_start?: number | null;
  payload_bits?: string;
}

/**
 * DSP demodulation / decoding status.
 */
export interface DecodingResult {
  decoded: boolean;
  bit_count?: number;
  message?: string;
}

/**
 * Raw candidate bitstream analysis from DSP.
 * Separate from recovered frame bitstream correlation.
 */
export interface CandidateBitstreamAnalysis {
  status?: string;
  method?: string;
  bit_count?: number;
  bits?: string;
  entropy?: number;
  binary_entropy?: number;
  transition_rate?: number;
  [key: string]: any;
}

export interface PeriodicityCandidateLag {
  lag?: number;
  score?: number;
  strength?: number;
}

/**
 * Signal periodicity / autocorrelation analysis from DSP.
 */
export interface PeriodicityAnalysis {
  status?: string;
  peak_lag?: number | null;
  peak_score?: number | null;
  signed_peak_score?: number | null;
  candidate_lags?: PeriodicityCandidateLag[];
  [key: string]: any;
}

/**
 * Interleaver structure candidate analysis.
 */
export interface InterleaverAnalysis {
  candidate?: string;
  confidence?: number;
  estimated_depth?: number | null;
  periodicity_score?: number;
  entropy?: number;
  transition_rate?: number;
  evidence?: string[];
  [key: string]: any;
}

/**
 * Forward Error Correction (FEC) candidate analysis.
 */
export interface FecAnalysis {
  candidate?: string;
  confidence?: number;
  estimated_code_rate?: string | null;
  entropy?: number;
  transition_rate?: number;
  periodicity_score?: number;
  evidence?: string[];
  [key: string]: any;
}

export interface SimulationInput {
  source?: 'recovered_bitstream' | 'signal_derived_candidate_bits' | string;
  bit_count?: number;
  bits?: string;
  [key: string]: any;
}

export interface PermutationPreviewItem {
  input: number;
  output: number;
}

export interface DeinterleavingSimulation {
  mode?: string;
  profile?: string;
  input_bit_count?: number;
  output_bit_count?: number;
  matrix_rows?: number;
  matrix_columns?: number;
  reordered_positions?: number;
  input_preview?: string;
  output_preview?: string;
  permutation_preview?: PermutationPreviewItem[];
  permutation_valid?: boolean;
  status?: string;
  [key: string]: any;
}

export interface FecSimulation {
  mode?: string;
  profile?: string;
  decoder_profile?: string;
  code_rate?: string;
  constraint_length?: number;
  input_bit_count?: number;
  output_bit_count?: number;
  simulated_error_count?: number;
  simulated_corrected_count?: number;
  corrected_positions?: number[];
  input_preview?: string;
  output_preview?: string;
  simulated_ber_before?: number;
  simulated_ber_after?: number;
  status?: string;
  [key: string]: any;
}

export interface SignalData {
  status: string;

  fileInfo: FileInfo;

  parameters: SignalParameters;

  plot_data: PlotData;

  bitstream: Bitstream;

  /**
   * Real backend/DSP correlation result.
   * Undefined when correlation was not performed.
   */
  bitstream_correlation?: BitstreamCorrelation | null;

  /**
   * Real DSP decoding status.
   */
  decoding?: DecodingResult | null;

  audioStream?: string | null;

  /**
   * Real DSP signal fingerprint hash/identifier.
   */
  signal_fingerprint?: string | null;

  /**
   * Raw candidate bitstream analysis.
   */
  candidate_bitstream?: CandidateBitstreamAnalysis | null;

  /**
   * Periodicity / autocorrelation analysis.
   */
  periodicity_analysis?: PeriodicityAnalysis | null;

  /**
   * Interleaver structural candidate analysis.
   */
  interleaver_analysis?: InterleaverAnalysis | null;

  /**
   * FEC code candidate analysis.
   */
  fec_analysis?: FecAnalysis | null;

  /**
   * Prototype simulation input.
   */
  simulation_input?: SimulationInput | null;

  /**
   * Prototype de-interleaving simulation.
   */
  deinterleaving_simulation?: DeinterleavingSimulation | null;

  /**
   * Prototype FEC correction simulation.
   */
  fec_simulation?: FecSimulation | null;
}



// ============================================================
// Sample visualization matrix
// ============================================================
//
// Used only by demo/preset data.
// This is NOT presented as a real DSP analysis result.
//
// ============================================================

const generateSampleMatrix = (
  rows = 64,
  cols = 129
): number[][] => {

  const matrix: number[][] = [];

  for (let r = 0; r < rows; r++) {

    const row: number[] = [];

    const peakPos =
      Math.floor(cols / 2) +
      Math.sin(r * 0.1) * 15;

    for (let c = 0; c < cols; c++) {

      const dist =
        Math.abs(c - peakPos);

      const val =
        Math.max(
          10,
          180 *
            Math.exp(
              -(dist * dist) / 40
            ) +
            Math.random() * 25
        );

      row.push(
        Math.floor(val)
      );
    }

    matrix.push(row);
  }

  return matrix;
};


// ============================================================
// Default demo data
// ============================================================
//
// IMPORTANT:
//
// This object is only fallback / demonstration data.
// Real uploaded files must use values returned by the backend.
//
// Correlation is intentionally null here so the UI does NOT
// claim that a real header was detected by the DSP.
//
// ============================================================

export const mockSignalData: SignalData = {

  status: 'demo',

  fileInfo: {
    name: 'intercept_alpha_44.IQ',
    type: 'RF_SIGNAL',
    duration: '4.2s',
  },

  parameters: {
    sampling_frequency: '2.4 MHz',
    modulation: '16-QAM',

    // Demo labels only.
    fec: 'Viterbi',
    interleaving: 'Block',
  },

  plot_data: {

    constellation_points: [

      { x: 0.5, y: 0.5 },
      { x: -0.5, y: 0.5 },

      { x: 0.5, y: -0.5 },
      { x: -0.5, y: -0.5 },

      { x: 0.25, y: 0.75 },
      { x: -0.25, y: 0.75 },

      { x: 0.25, y: -0.75 },
      { x: -0.25, y: -0.75 },

      { x: 0.75, y: 0.25 },
      { x: -0.75, y: 0.25 },

      { x: 0.75, y: -0.25 },
      { x: -0.75, y: -0.25 },

      { x: 0.85, y: 0.85 },
      { x: -0.85, y: 0.85 },

      { x: 0.85, y: -0.85 },
      { x: -0.85, y: -0.85 },

    ],

    waterfall_matrix:
      generateSampleMatrix(),

  },

  /**
   * Demo bitstream only.
   *
   * Because bitstream_correlation is null, the frontend
   * must NOT describe this as a DSP-detected frame header.
   */
  bitstream: {
    header: '',
    payload: '',
  },

  bitstream_correlation: null,

  decoding: null,
};


// ============================================================
// Dashboard presets
// ============================================================
//
// Presets are visual demonstrations only.
// They intentionally do not contain a successful correlation
// result.
//
// ============================================================

export const signalPresets:
  Record<string, SignalData> = {

  alpha: {

    status: 'demo',

    fileInfo: {
      name: 'intercept_alpha_44.IQ',
      type: 'RF_SIGNAL',
      duration: '4.2s',
    },

    parameters: {
      sampling_frequency: '2.4 MHz',
      modulation: '16-QAM',
      fec: 'Viterbi',
      interleaving: 'Block',
    },

    plot_data: {

      constellation_points: [

        { x: 0.5, y: 0.5 },
        { x: -0.5, y: 0.5 },

        { x: 0.5, y: -0.5 },
        { x: -0.5, y: -0.5 },

        { x: 0.25, y: 0.75 },
        { x: -0.25, y: 0.75 },

        { x: 0.25, y: -0.75 },
        { x: -0.25, y: -0.75 },

        { x: 0.75, y: 0.25 },
        { x: -0.75, y: 0.25 },

        { x: 0.75, y: -0.25 },
        { x: -0.75, y: -0.25 },

        { x: 0.85, y: 0.85 },
        { x: -0.85, y: 0.85 },

        { x: 0.85, y: -0.85 },
        { x: -0.85, y: -0.85 },

      ],

      waterfall_matrix:
        generateSampleMatrix(),

    },

    bitstream: {
      header: '',
      payload: '',
    },

    bitstream_correlation: null,

    decoding: null,
  },


  covert: {

    status: 'demo',

    fileInfo: {
      name: 'covert_comm_ch9.wav',
      type: 'AUDIO_WAV_IQ',
      duration: '8.5s',
    },

    parameters: {
      sampling_frequency: '44100 Hz',
      modulation: 'Analog Audio',
      fec: 'None',
      interleaving: 'None',
    },

    plot_data: {
      constellation_points: null,
      waterfall_matrix:
        generateSampleMatrix(
          64,
          129
        ),
    },

    bitstream: {
      header: '',
      payload: '',
    },

    bitstream_correlation: null,

    decoding: null,
  },


  satcom: {

    status: 'demo',

    fileInfo: {
      name: 'satcom_downlink_03.IQ',
      type: 'RF_SIGNAL',
      duration: '12.0s',
    },

    parameters: {
      sampling_frequency: '10.0 MHz',
      modulation: 'QPSK',
      fec: 'LDPC',
      interleaving: 'Convolution',
    },

    plot_data: {

      constellation_points: [

        { x: 0.707, y: 0.707 },
        { x: 0.72, y: 0.69 },
        { x: 0.69, y: 0.73 },

        { x: -0.707, y: 0.707 },
        { x: -0.73, y: 0.68 },
        { x: -0.68, y: 0.72 },

        { x: -0.707, y: -0.707 },
        { x: -0.72, y: -0.69 },
        { x: -0.69, y: -0.73 },

        { x: 0.707, y: -0.707 },
        { x: 0.73, y: -0.68 },
        { x: 0.68, y: -0.72 },

      ],

      waterfall_matrix:
        generateSampleMatrix(),

    },

    bitstream: {
      header: '',
      payload: '',
    },

    bitstream_correlation: null,

    decoding: null,
  },
};