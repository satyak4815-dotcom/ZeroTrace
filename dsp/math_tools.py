
import numpy as np
import requests
import io
import librosa
import noisereduce as nr
import soundfile as sf
import base64
from scipy import signal


def fetch_file_bytes(file_url: str) -> bytes:
    if file_url.startswith("local://"):
        local_path = file_url.replace("local://", "")

        with open(local_path, "rb") as f:
            return f.read()

    response = requests.get(
        file_url,
        timeout=30
    )

    response.raise_for_status()

    return response.content


def generate_constellation(iq_complex):
    sample_stride = max(
        1,
        len(iq_complex) // 300
    )

    sampled_points = (
        iq_complex[::sample_stride][:300]
    )

    return [
        {
            "x": float(np.real(point)),
            "y": float(np.imag(point))
        }
        for point in sampled_points
    ]


def generate_waterfall(iq_complex):
    f, t, Zxx = signal.stft(
        iq_complex[:4096],
        nperseg=64,
        return_onesided=False
    )

    return np.abs(Zxx).tolist()


def calculate_iq_statistics(iq_complex):
    magnitude = np.abs(iq_complex)
    phase = np.angle(iq_complex)

    mean_power = np.mean(
        magnitude ** 2
    )

    peak_power = np.max(
        magnitude ** 2
    )

    papr = (
        peak_power / mean_power
        if mean_power > 0
        else 0
    )

    phase_diff = np.diff(
        np.unwrap(phase)
    )

    return {
        "mean_power": float(mean_power),
        "peak_power": float(peak_power),
        "papr": float(papr),
        "magnitude_mean": float(
            np.mean(magnitude)
        ),
        "magnitude_std": float(
            np.std(magnitude)
        ),
        "phase_std": float(
            np.std(phase)
        ),
        "phase_change_std": float(
            np.std(phase_diff)
        )
    }


def extract_modulation_features(
    iq_complex
):
    magnitude = np.abs(iq_complex)

    phase = np.unwrap(
        np.angle(iq_complex)
    )

    phase_diff = np.diff(phase)

    normalized_magnitude = (
        magnitude /
        (np.mean(magnitude) + 1e-12)
    )

    amplitude_variation = np.std(
        normalized_magnitude
    )

    phase_variation = np.std(
        phase_diff
    )

    real_part = np.real(iq_complex)
    imag_part = np.imag(iq_complex)

    real_kurtosis = float(
        np.mean(
            (
                (
                    real_part
                    - np.mean(real_part)
                )
                /
                (
                    np.std(real_part)
                    + 1e-12
                )
            ) ** 4
        )
    )

    imag_kurtosis = float(
        np.mean(
            (
                (
                    imag_part
                    - np.mean(imag_part)
                )
                /
                (
                    np.std(imag_part)
                    + 1e-12
                )
            ) ** 4
        )
    )

    return {
        "amplitude_variation":
            float(amplitude_variation),

        "phase_variation":
            float(phase_variation),

        "real_kurtosis":
            real_kurtosis,

        "imag_kurtosis":
            imag_kurtosis
    }


def classify_modulation_v2(
    iq_complex
):
    features = (
        extract_modulation_features(
            iq_complex
        )
    )

    magnitude = np.abs(iq_complex)
    phase = np.angle(iq_complex)

    amplitude_variation = features[
        "amplitude_variation"
    ]

    phase_bins = (
        np.round(
            phase / (np.pi / 4)
        )
        * (np.pi / 4)
    )

    unique_phase_states = len(
        np.unique(phase_bins)
    )

    if amplitude_variation < 0.15:

        if unique_phase_states <= 4:
            modulation = "PSK"

        else:
            modulation = "FSK"

    elif amplitude_variation >= 0.25:
        modulation = "QAM"

    else:
        modulation = "Unknown"

    return {
        "detected_modulation":
            modulation,

        "unique_phase_states":
            int(unique_phase_states),

        "features":
            features
    }


def detect_qam_order(iq_complex):
    real_part = np.real(iq_complex)
    imag_part = np.imag(iq_complex)

    real_levels = np.unique(
        np.round(real_part, 3)
    )

    imag_levels = np.unique(
        np.round(imag_part, 3)
    )

    num_real_levels = len(
        real_levels
    )

    num_imag_levels = len(
        imag_levels
    )

    constellation_points = (
        num_real_levels
        * num_imag_levels
    )

    if constellation_points == 16:
        qam_type = "16-QAM"

    elif constellation_points == 64:
        qam_type = "64-QAM"

    elif constellation_points == 256:
        qam_type = "256-QAM"

    else:
        qam_type = "QAM"

    return {
        "qam_type":
            qam_type,

        "i_levels":
            int(num_real_levels),

        "q_levels":
            int(num_imag_levels),

        "estimated_constellation_points":
            int(constellation_points)
    }


def classify_modulation_final(
    iq_complex
):
    family_result = (
        classify_modulation_v2(
            iq_complex
        )
    )

    family = family_result[
        "detected_modulation"
    ]

    phase_states = family_result[
        "unique_phase_states"
    ]

    if family == "PSK":

        if phase_states == 2:
            modulation = "BPSK"

        elif phase_states == 4:
            modulation = "QPSK"

        else:
            modulation = "PSK"

    elif family == "QAM":

        qam_result = detect_qam_order(
            iq_complex
        )

        modulation = qam_result[
            "qam_type"
        ]

    elif family == "FSK":
        modulation = "FSK"

    else:
        modulation = "Unknown"

    return {
        "detected_modulation":
            modulation,

        "detected_family":
            family,

        "unique_phase_states":
            phase_states,

        "features":
            family_result["features"]
    }


def calculate_dominant_phase_concentration(
    iq_complex
):
    phase = np.angle(iq_complex)

    phase_bins = (
        np.round(
            phase / (np.pi / 4)
        )
        * (np.pi / 4)
    )

    _, counts = np.unique(
        phase_bins,
        return_counts=True
    )

    sorted_counts = np.sort(
        counts
    )[::-1]

    top_two = np.sum(
        sorted_counts[:2]
    )

    total = np.sum(
        sorted_counts
    )

    concentration = (
        top_two / total
        if total > 0
        else 0
    )

    return float(concentration)


def calculate_real_energy_ratio(
    iq_complex
):
    real_part = np.real(iq_complex)
    imag_part = np.imag(iq_complex)

    real_energy = np.mean(
        real_part ** 2
    )

    imag_energy = np.mean(
        imag_part ** 2
    )

    total_energy = (
        real_energy
        + imag_energy
    )

    if total_energy <= 0:
        return 0.0

    return float(
        real_energy
        / total_energy
    )


def classify_modulation_robust_v2(
    iq_complex
):
    base_result = (
        classify_modulation_final(
            iq_complex
        )
    )

    modulation = base_result[
        "detected_modulation"
    ]

    dominant_concentration = (
        calculate_dominant_phase_concentration(
            iq_complex
        )
    )

    real_energy_ratio = (
        calculate_real_energy_ratio(
            iq_complex
        )
    )

    if (
        dominant_concentration >= 0.60
        or real_energy_ratio >= 0.75
    ):
        modulation = "BPSK"

    return {
        "detected_modulation":
            modulation,

        "detected_family": (
            "PSK"
            if modulation == "BPSK"
            else base_result[
                "detected_family"
            ]
        ),

        "unique_phase_states":
            base_result[
                "unique_phase_states"
            ],

        "dominant_phase_concentration":
            float(
                dominant_concentration
            ),

        "real_energy_ratio":
            float(
                real_energy_ratio
            ),

        "features":
            base_result["features"]
    }


def calculate_modulation_confidence_v2(
    classification
):
    modulation = classification[
        "detected_modulation"
    ]

    family = classification[
        "detected_family"
    ]

    features = classification[
        "features"
    ]

    phase_states = classification[
        "unique_phase_states"
    ]

    amplitude_variation = features[
        "amplitude_variation"
    ]

    dominant_concentration = (
        classification.get(
            "dominant_phase_concentration",
            0.0
        )
    )

    real_energy_ratio = (
        classification.get(
            "real_energy_ratio",
            0.0
        )
    )

    if modulation == "BPSK":

        if real_energy_ratio >= 0.90:
            confidence = 0.90

        elif real_energy_ratio >= 0.75:
            confidence = 0.80

        elif dominant_concentration >= 0.60:
            confidence = 0.75

        else:
            confidence = 0.60

    elif (
        modulation == "QPSK"
        and phase_states == 4
    ):
        confidence = 0.90

    elif (
        family == "QAM"
        and amplitude_variation >= 0.25
    ):
        confidence = 0.85

    elif (
        family == "FSK"
        and amplitude_variation < 0.15
    ):
        confidence = 0.80

    elif modulation == "Unknown":
        confidence = 0.0

    else:
        confidence = 0.50

    return round(
        confidence,
        2
    )


def bits_to_bitstream(bits):
    bit_string = "".join(
        str(int(bit))
        for bit in bits
    )

    return {
        "header": "",
        "payload": bit_string
    }


def demodulate_bpsk(iq_complex):
    real_part = np.real(
        iq_complex
    )

    return [
        1 if value >= 0 else 0
        for value in real_part
    ]


def demodulate_qpsk(iq_complex):
    recovered_bits = []

    for symbol in iq_complex:
        phase = np.angle(symbol)

        if 0 <= phase < np.pi / 2:
            recovered_bits.extend(
                [0, 0]
            )

        elif (
            np.pi / 2
            <= phase
            <= np.pi
        ):
            recovered_bits.extend(
                [0, 1]
            )

        elif (
            -np.pi
            <= phase
            < -np.pi / 2
        ):
            recovered_bits.extend(
                [1, 0]
            )

        else:
            recovered_bits.extend(
                [1, 1]
            )

    return recovered_bits


def demodulate_16qam(
    iq_complex
):
    def level_to_bits(value):

        if value < -2:
            return [0, 0]

        elif value < 0:
            return [0, 1]

        elif value < 2:
            return [1, 1]

        else:
            return [1, 0]

    recovered_bits = []

    real_part = np.real(
        iq_complex
    )

    imag_part = np.imag(
        iq_complex
    )

    scale = np.mean(
        np.abs(
            np.concatenate(
                [
                    real_part,
                    imag_part
                ]
            )
        )
    )

    if scale == 0:
        raise ValueError(
            "Invalid 16-QAM signal"
        )

    normalized_i = (
        real_part / scale * 2
    )

    normalized_q = (
        imag_part / scale * 2
    )

    for i_value, q_value in zip(
        normalized_i,
        normalized_q
    ):
        recovered_bits.extend(
            level_to_bits(i_value)
        )

        recovered_bits.extend(
            level_to_bits(q_value)
        )

    return recovered_bits


def automatic_bitstream_decode(
    iq_complex
):
    classification = (
        classify_modulation_robust_v2(
            iq_complex
        )
    )

    modulation = classification[
        "detected_modulation"
    ]

    if modulation == "BPSK":
        recovered_bits = (
            demodulate_bpsk(
                iq_complex
            )
        )

    elif modulation == "QPSK":
        recovered_bits = (
            demodulate_qpsk(
                iq_complex
            )
        )

    elif modulation == "16-QAM":
        recovered_bits = (
            demodulate_16qam(
                iq_complex
            )
        )

    else:
        return {
            "decoded": False,
            "modulation":
                modulation,

            "bit_count": 0,

            "bitstream": {
                "header": "",
                "payload": ""
            }
        }

    bitstream = bits_to_bitstream(
        recovered_bits
    )

    return {
        "decoded": True,
        "modulation":
            modulation,

        "bit_count":
            len(recovered_bits),

        "bitstream":
            bitstream
    }


def extract_instantaneous_frequency(
    iq_complex,
    sample_rate
):
    if len(iq_complex) < 2:
        raise ValueError(
            "Not enough IQ samples for frequency analysis"
        )

    phase = np.unwrap(
        np.angle(iq_complex)
    )

    phase_difference = np.diff(
        phase
    )

    return (
        phase_difference
        * sample_rate
        / (2 * np.pi)
    )


def demodulate_bfsk(
    iq_complex,
    sample_rate,
    symbol_rate,
    freq_0,
    freq_1
):
    samples_per_symbol = int(
        sample_rate / symbol_rate
    )

    instantaneous_frequency = (
        extract_instantaneous_frequency(
            iq_complex,
            sample_rate
        )
    )

    threshold = (
        freq_0 + freq_1
    ) / 2

    bits = []

    for start in range(
        0,
        len(
            instantaneous_frequency
        ),
        samples_per_symbol
    ):
        chunk = (
            instantaneous_frequency[
                start:
                start + samples_per_symbol
            ]
        )

        if len(chunk) == 0:
            continue

        average_frequency = (
            np.mean(chunk)
        )

        if average_frequency < threshold:
            bits.append(0)

        else:
            bits.append(1)

    return bits


def analyze_iq_complete_v2(
    file_url: str
):
    raw_data = fetch_file_bytes(
        file_url
    )

    float_array = np.frombuffer(
        raw_data,
        dtype=np.float32
    )

    if len(float_array) < 2:
        raise ValueError(
            "IQ file does not contain enough samples"
        )

    if len(float_array) % 2 != 0:
        float_array = (
            float_array[:-1]
        )

    iq_complex = (
        float_array[0::2]
        + 1j * float_array[1::2]
    )

    constellation = (
        generate_constellation(
            iq_complex
        )
    )

    waterfall_matrix = (
        generate_waterfall(
            iq_complex
        )
    )

    statistics = (
        calculate_iq_statistics(
            iq_complex
        )
    )

    modulation_result = (
        classify_modulation_robust_v2(
            iq_complex
        )
    )

    confidence = (
        calculate_modulation_confidence_v2(
            modulation_result
        )
    )

    modulation_result[
        "confidence"
    ] = confidence

    modulation_result[
        "confidence_type"
    ] = "heuristic"

    decoding_result = (
        automatic_bitstream_decode(
            iq_complex
        )
    )

    return {
        "parameters": {
            "sampling_frequency":
                "Unknown",

            "symbol_rate":
                "Unknown",

            "center_frequency":
                "Unknown",

            "modulation":
                modulation_result[
                    "detected_modulation"
                ],

            "fec":
                "Unknown",

            "interleaving":
                "Unknown"
        },

        "statistics":
            statistics,

        "modulation_analysis":
            modulation_result,

        "decoding": {
            "decoded":
                decoding_result[
                    "decoded"
                ],

            "bit_count":
                decoding_result[
                    "bit_count"
                ]
        },

        "constellation":
            constellation,

        "waterfall_matrix":
            waterfall_matrix,

        "bitstream":
            decoding_result[
                "bitstream"
            ]
    }


def apply_iq_metadata(
    analysis_result,
    sample_rate=None,
    symbol_rate=None,
    center_frequency=None
):
    if sample_rate is not None:
        analysis_result[
            "parameters"
        ][
            "sampling_frequency"
        ] = (
            f"{sample_rate} Hz"
        )

    if symbol_rate is not None:
        analysis_result[
            "parameters"
        ][
            "symbol_rate"
        ] = (
            f"{symbol_rate} baud"
        )

    if center_frequency is not None:
        analysis_result[
            "parameters"
        ][
            "center_frequency"
        ] = (
            f"{center_frequency} Hz"
        )

    return analysis_result


def add_decoding_message(
    result,
    sample_rate=None,
    symbol_rate=None,
    freq_0=None,
    freq_1=None
):
    modulation = result[
        "parameters"
    ][
        "modulation"
    ]

    decoded = result[
        "decoding"
    ][
        "decoded"
    ]

    if decoded:
        message = (
            "Bitstream successfully recovered."
        )

    elif modulation == "FSK":
        missing = []

        if sample_rate is None:
            missing.append(
                "sample_rate"
            )

        if symbol_rate is None:
            missing.append(
                "symbol_rate"
            )

        if freq_0 is None:
            missing.append(
                "freq_0"
            )

        if freq_1 is None:
            missing.append(
                "freq_1"
            )

        if missing:
            message = (
                "FSK detected, but bitstream decoding requires: "
                + ", ".join(missing)
            )

        else:
            message = (
                "FSK detected but bitstream could not be recovered."
            )

    else:
        message = (
            "Bitstream decoding is not available for this signal."
        )

    result[
        "decoding"
    ][
        "message"
    ] = message

    return result


def process_wav_file(
    file_url: str
):
    raw_data = fetch_file_bytes(
        file_url
    )

    y, sr = librosa.load(
        io.BytesIO(raw_data),
        sr=None
    )

    reduced_noise = (
        nr.reduce_noise(
            y=y,
            sr=sr
        )
    )

    # Generate real WAV spectrogram/waterfall using STFT
    f, t, Zxx = signal.stft(
        reduced_noise,
        fs=sr,
        nperseg=256
    )

    waterfall_matrix = np.abs(Zxx).tolist()

    buffer = io.BytesIO()

    sf.write(
        buffer,
        reduced_noise,
        sr,
        format="WAV"
    )

    audio_base64 = (
        base64.b64encode(
            buffer.getvalue()
        ).decode("utf-8")
    )

    return {
        "parameters": {
            "sampling_frequency":
                f"{sr} Hz",

            "modulation":
                "Analog Audio",

            "fec":
                "None",

            "interleaving":
                "None"
        },

        "waterfall_matrix":
            waterfall_matrix,

        "constellation":
            None,

        "cleaned_audio_base64":
            audio_base64,

        "transcript":
            "Pending Speech-to-Text integration"
    }
