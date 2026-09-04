
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.responses import FileResponse
from typing import Optional

from ai_agent import run_analysis_agent


app = FastAPI(
    title="ZeroTrace DSP Engine"
)


class SignalPayload(BaseModel):
    file_url: str
    file_type: str

    sample_rate: Optional[float] = None
    symbol_rate: Optional[float] = None
    center_frequency: Optional[float] = None

    freq_0: Optional[float] = None
    freq_1: Optional[float] = None


@app.get("/health")
async def health():
    return {
        "status": "ok"
    }


@app.get("/capabilities")
async def capabilities():
    return {
        "supported_file_types": [
            ".iq",
            ".wav"
        ],
        "supported_modulations": [
            "BPSK",
            "QPSK",
            "16-QAM",
            "BFSK"
        ],
        "features": [
            "modulation_detection",
            "constellation_generation",
            "waterfall_generation",
            "signal_statistics",
            "bitstream_recovery",
            "wav_noise_reduction"
        ],
        "notes": {
            "bfsk": (
                "Bitstream recovery requires sample_rate, "
                "symbol_rate, freq_0 and freq_1."
            ),
            "iq_sampling_frequency": (
                "Provided through capture metadata when available."
            ),
            "fec": "Currently not automatically detected.",
            "interleaving": "Currently not automatically detected."
        }
    }


@app.get("/test.iq")
async def get_test_iq():
    return FileResponse("test.iq")


@app.get("/test.wav")
async def get_test_wav():
    return FileResponse("test.wav")


@app.post("/analyze")
async def analyze_signal(
    payload: SignalPayload
):
    try:
        data = await run_analysis_agent(
            file_url=payload.file_url,
            file_type=payload.file_type,
            sample_rate=payload.sample_rate,
            symbol_rate=payload.symbol_rate,
            center_frequency=payload.center_frequency,
            freq_0=payload.freq_0,
            freq_1=payload.freq_1
        )

        return {
            "status": "success",
            "data": data
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
