
from math_tools import (
    analyze_iq_complete_v2,
    process_wav_file,
    apply_iq_metadata,
    fetch_file_bytes,
    demodulate_bfsk,
    bits_to_bitstream,
    add_decoding_message
)

import numpy as np


async def run_analysis_agent(
    file_url: str,
    file_type: str,
    sample_rate=None,
    symbol_rate=None,
    center_frequency=None,
    freq_0=None,
    freq_1=None
):
    file_type = file_type.lower()

    if file_type == ".iq":

        result = analyze_iq_complete_v2(
            file_url
        )

        result = apply_iq_metadata(
            analysis_result=result,
            sample_rate=sample_rate,
            symbol_rate=symbol_rate,
            center_frequency=center_frequency
        )

        if (
            result["parameters"]["modulation"] == "FSK"
            and sample_rate is not None
            and symbol_rate is not None
            and freq_0 is not None
            and freq_1 is not None
        ):
            raw_data = fetch_file_bytes(
                file_url
            )

            float_array = np.frombuffer(
                raw_data,
                dtype=np.float32
            )

            if len(float_array) % 2 != 0:
                float_array = float_array[:-1]

            iq_complex = (
                float_array[0::2]
                + 1j * float_array[1::2]
            )

            recovered_bits = demodulate_bfsk(
                iq_complex=iq_complex,
                sample_rate=sample_rate,
                symbol_rate=symbol_rate,
                freq_0=freq_0,
                freq_1=freq_1
            )

            result["bitstream"] = (
                bits_to_bitstream(
                    recovered_bits
                )
            )

            result["decoding"] = {
                "decoded": True,
                "bit_count": len(
                    recovered_bits
                )
            }

        result = add_decoding_message(
            result=result,
            sample_rate=sample_rate,
            symbol_rate=symbol_rate,
            freq_0=freq_0,
            freq_1=freq_1
        )

        return result

    elif file_type == ".wav":

        return process_wav_file(
            file_url
        )

    else:

        raise ValueError(
            f"Unsupported file type: {file_type}"
        )
