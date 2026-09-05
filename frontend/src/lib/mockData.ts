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
  /** Backend-provided estimated occupied signal bandwidth in Hz. Never hardcoded. */
  estimated_bandwidth?: string | number;
  /** Backend-provided confidence string for FEC candidate (e.g. "Low", "Medium"). Never hardcoded. */
  fec_confidence?: string;
  /** Backend-provided confidence string for interleaving candidate. Never hardcoded. */
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

export interface SignalData {
  status: string;
  fileInfo: FileInfo;
  parameters: SignalParameters;
  plot_data: PlotData;
  bitstream: Bitstream;
  audioStream?: string | null;
}

// Generate sample 129x64 waterfall matrix for presets
const generateSampleMatrix = (rows = 64, cols = 129): number[][] => {
  const matrix: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    const peakPos = Math.floor(cols / 2) + Math.sin(r * 0.1) * 15;
    for (let c = 0; c < cols; c++) {
      const dist = Math.abs(c - peakPos);
      const val = Math.max(10, 180 * Math.exp(-(dist * dist) / 40) + Math.random() * 25);
      row.push(Math.floor(val));
    }
    matrix.push(row);
  }
  return matrix;
};

export const mockSignalData: SignalData = {
  status: "success",
  fileInfo: {
    name: "intercept_alpha_44.IQ",
    type: "RF_SIGNAL",
    duration: "4.2s"
  },
  parameters: {
    sampling_frequency: "2.4 MHz",
    modulation: "16-QAM",
    fec: "Viterbi",
    interleaving: "Block"
  },
  plot_data: {
    constellation_points: [
      { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 },
      { x: 0.5, y: -0.5 }, { x: -0.5, y: -0.5 },
      { x: 0.25, y: 0.75 }, { x: -0.25, y: 0.75 },
      { x: 0.25, y: -0.75 }, { x: -0.25, y: -0.75 },
      { x: 0.75, y: 0.25 }, { x: -0.75, y: 0.25 },
      { x: 0.75, y: -0.25 }, { x: -0.75, y: -0.25 },
      { x: 0.85, y: 0.85 }, { x: -0.85, y: 0.85 },
      { x: 0.85, y: -0.85 }, { x: -0.85, y: -0.85 }
    ],
    waterfall_matrix: generateSampleMatrix()
  },
  bitstream: {
    header: "10110100",
    payload: "0100111001101110011101000110010101101100"
  }
};

export const signalPresets: Record<string, SignalData> = {
  alpha: {
    status: "success",
    fileInfo: {
      name: "intercept_alpha_44.IQ",
      type: "RF_SIGNAL",
      duration: "4.2s"
    },
    parameters: {
      sampling_frequency: "2.4 MHz",
      modulation: "16-QAM",
      fec: "Viterbi",
      interleaving: "Block"
    },
    plot_data: {
      constellation_points: [
        { x: 0.5, y: 0.5 }, { x: -0.5, y: 0.5 },
        { x: 0.5, y: -0.5 }, { x: -0.5, y: -0.5 },
        { x: 0.25, y: 0.75 }, { x: -0.25, y: 0.75 },
        { x: 0.25, y: -0.75 }, { x: -0.25, y: -0.75 },
        { x: 0.75, y: 0.25 }, { x: -0.75, y: 0.25 },
        { x: 0.75, y: -0.25 }, { x: -0.75, y: -0.25 },
        { x: 0.85, y: 0.85 }, { x: -0.85, y: 0.85 },
        { x: 0.85, y: -0.85 }, { x: -0.85, y: -0.85 }
      ],
      waterfall_matrix: generateSampleMatrix()
    },
    bitstream: {
      header: "10110100",
      payload: "0100111001101110011101000110010101101100"
    }
  },
  covert: {
    status: "success",
    fileInfo: {
      name: "covert_comm_ch9.wav",
      type: "AUDIO_WAV_IQ",
      duration: "8.5s"
    },
    parameters: {
      sampling_frequency: "44100 Hz",
      modulation: "Analog Audio",
      fec: "None",
      interleaving: "None"
    },
    plot_data: {
      constellation_points: null,
      waterfall_matrix: generateSampleMatrix(64, 129)
    },
    bitstream: {
      header: "N/A",
      payload: "N/A"
    }
  },
  satcom: {
    status: "success",
    fileInfo: {
      name: "satcom_downlink_03.IQ",
      type: "RF_SIGNAL",
      duration: "12.0s"
    },
    parameters: {
      sampling_frequency: "10.0 MHz",
      modulation: "QPSK",
      fec: "LDPC",
      interleaving: "Convolution"
    },
    plot_data: {
      constellation_points: [
        { x: 0.707, y: 0.707 }, { x: 0.72, y: 0.69 }, { x: 0.69, y: 0.73 },
        { x: -0.707, y: 0.707 }, { x: -0.73, y: 0.68 }, { x: -0.68, y: 0.72 },
        { x: -0.707, y: -0.707 }, { x: -0.72, y: -0.69 }, { x: -0.69, y: -0.73 },
        { x: 0.707, y: -0.707 }, { x: 0.73, y: -0.68 }, { x: 0.68, y: -0.72 }
      ],
      waterfall_matrix: generateSampleMatrix()
    },
    bitstream: {
      header: "11001010",
      payload: "1010101011110000110011001010101001010101"
    }
  }
};
