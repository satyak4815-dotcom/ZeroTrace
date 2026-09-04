<div align="center">

# 📡 ZeroTrace

### Automated Terrestrial Signal Intelligence & Analysis Platform

**From Raw RF Capture → Automated DSP Analysis → Actionable Signal Intelligence**

<br/>

[![Hackathon](https://img.shields.io/badge/HACKATHON-PROTOTYPE-00E5FF?style=for-the-badge)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-DSP-009688?style=for-the-badge&logo=fastapi)](#)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs)](#)
[![Python](https://img.shields.io/badge/Python-Signal_Processing-3776AB?style=for-the-badge&logo=python)](#)

<br/>

## 🚀 LIVE DEMO

### 🔗 **[Launch ZeroTrace →](YOUR_VERCEL_LINK_HERE)**

> Replace `YOUR_VERCEL_LINK_HERE` with the final Vercel deployment URL.

<br/>

**ZeroTrace transforms uploaded WAV and raw I/Q signal captures into structured signal intelligence through an automated DSP pipeline and an interactive visualization dashboard.**

</div>

---

# 🎯 The Challenge

Modern terrestrial communication environments generate enormous volumes of raw off-air signal data across frequencies ranging from **kHz to GHz**.

A captured signal by itself tells an analyst very little.

Before useful information can be extracted, an analyst may need to determine:

- What is the sampling frequency?
- What does the frequency activity look like over time?
- Is the signal BPSK, QPSK, QAM, FSK or something else?
- What does its I/Q constellation look like?
- Can a bitstream be recovered?
- Is Forward Error Correction present?
- Has the data been interleaved?
- Can meaningful signal parameters be extracted automatically?

Traditionally, much of this process requires manual inspection, multiple DSP tools and significant signal-processing expertise.

### ZeroTrace asks a simple question:

> **What if an analyst could upload a raw signal capture and let an automated pipeline perform the first level of signal intelligence?**

That is the problem ZeroTrace is designed to explore.

---

# 💡 Our Solution

**ZeroTrace** is an end-to-end terrestrial signal analysis prototype that connects:

```text
Signal Capture
      ↓
Signal Ingestion
      ↓
Metadata Extraction
      ↓
DSP Processing
      ↓
Signal Classification
      ↓
Constellation + Waterfall
      ↓
Available Bitstream Recovery
      ↓
Interactive Intelligence Dashboard
```

Instead of requiring the user to manually move a signal between separate tools, ZeroTrace provides a unified workflow.

The user uploads a supported signal recording and the platform orchestrates storage, metadata handling, DSP analysis and visualization automatically.

---

# ⚡ What Makes ZeroTrace Different?

### 01 — End-to-End Signal Analysis Pipeline

ZeroTrace is not only a visualization interface.

The prototype connects a real frontend, backend, storage layer and Python DSP engine into one pipeline:

**Upload → Process → Analyze → Store → Visualize**

---

### 02 — Real DSP-Generated Visualizations

The waterfall and constellation components are designed to consume data returned by the DSP pipeline.

For supported captures, the backend receives numerical DSP output and the frontend transforms that output into interactive signal-analysis visualizations.

---

### 03 — Raw I/Q + WAV Support

The current prototype supports multiple signal-input workflows including:

- `.wav`
- `.iq`
- `.sigmf-data`

This allows ZeroTrace to demonstrate both audio-domain and complex baseband I/Q analysis.

---

### 04 — SigMF-Aware SDR Metadata

Raw I/Q samples normally do not contain enough information to determine parameters such as sample rate simply from the sample bytes.

ZeroTrace therefore supports attached `.sigmf-meta` metadata.

The frontend can extract supported fields such as:

```text
core:sample_rate
core:datatype
captures[0].core:frequency
```

and propagate the relevant metadata through the processing pipeline.

---

### 05 — Uncertainty Instead of Fabrication

One of the most important design decisions in ZeroTrace is:

> **Unknown is better than fabricated certainty.**

If the current prototype cannot reliably determine FEC, interleaving or another parameter, the pipeline can return:

```text
Unknown
```

instead of manufacturing a technically impressive but unsupported answer.

For an intelligence-analysis system, knowing what the system **does not know** is important.

---

# 🧠 What ZeroTrace Currently Analyzes

| Capability | Current Prototype |
|---|---|
| WAV ingestion | ✅ Implemented |
| Raw I/Q ingestion | ✅ Implemented |
| `.sigmf-data` ingestion | ✅ Implemented |
| `.sigmf-meta` parsing | ✅ Implemented |
| Sampling metadata handling | ✅ Implemented |
| Center-frequency metadata | ✅ Implemented |
| Waterfall generation | ✅ Implemented |
| I/Q constellation extraction | ✅ Implemented |
| Modulation-family analysis | ✅ Prototype |
| BPSK processing | ✅ Controlled prototype |
| QPSK processing | ✅ Controlled prototype |
| 16-QAM processing | ✅ Controlled prototype |
| BFSK processing | ✅ Controlled prototype |
| Bitstream recovery | ✅ Supported controlled cases |
| WAV noise processing | ✅ Implemented |
| Generic FEC identification | 🧪 Future module |
| Generic de-interleaver detection | 🧪 Future module |
| Reed-Solomon decoding | 🧪 Future module |
| LDPC decoding | 🧪 Future module |

> **Important:** Modulation classification in the current prototype is heuristic. ZeroTrace should not be interpreted as a calibrated universal RF classifier capable of decoding every arbitrary real-world transmission.

---

# 🏗️ System Architecture

```text
┌─────────────────────────────┐
│        SIGNAL SOURCE        │
│                             │
│   WAV / I-Q / SigMF Data    │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      ZEROTRACE FRONTEND     │
│                             │
│    Next.js + TypeScript     │
│                             │
│  • Signal Upload            │
│  • SigMF Metadata           │
│  • Intelligence Dashboard  │
└──────────────┬──────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────┐
│      ORCHESTRATION API      │
│                             │
│      Node.js + Express      │
│                             │
│  • Upload Management       │
│  • Metadata Forwarding     │
│  • DSP Orchestration       │
│  • Result Persistence      │
└───────┬─────────────┬───────┘
        │             │
        ▼             ▼
┌─────────────┐  ┌─────────────┐
│ Cloudinary  │  │   MongoDB   │
│Signal Store │  │Analysis Data│
└──────┬──────┘  └─────────────┘
       │
       │ Signal URL + Metadata
       ▼
┌─────────────────────────────┐
│       PYTHON DSP CORE       │
│                             │
│    FastAPI + NumPy/SciPy    │
│                             │
│  • Signal Loading          │
│  • STFT / Spectral DSP     │
│  • Modulation Analysis     │
│  • Constellation           │
│  • Waterfall Matrix        │
│  • Available Demodulation  │
└──────────────┬──────────────┘
               │
               │ Structured JSON
               ▼
┌─────────────────────────────┐
│   SIGNAL INTELLIGENCE UI    │
│                             │
│ Parameters │ Constellation  │
│ Waterfall  │ Bitstream      │
└─────────────────────────────┘
```

---

# 🔬 Inside the DSP Pipeline

The DSP engine is implemented as a separate Python service so that signal-processing logic remains independent from the web application.

### High-Level Processing

```text
Input Signal
     │
     ├── WAV ──────────► Audio Processing
     │
     └── Complex I/Q ─► I/Q Processing
                             │
                             ▼
                    Numerical Analysis
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
               Frequency         I/Q Domain
               Analysis           Analysis
                    │                 │
                    ▼                 ▼
                 STFT           Constellation
                    │
                    ▼
                Waterfall
                    │
                    ▼
            Modulation Analysis
                    │
                    ▼
        Available Demodulation
                    │
                    ▼
             Structured Result
```

---

# 📊 Signal Intelligence Dashboard

ZeroTrace converts DSP results into an analyst-oriented interface instead of presenting raw numerical arrays.

## Sampling Information

Displays available sampling metadata associated with the signal capture.

## Modulation Analysis

Reports the modulation-family result produced by the current classification pipeline.

## Constellation Diagram

For supported complex I/Q signals, ZeroTrace visualizes returned I/Q samples in the complex plane.

This provides an intuitive representation of modulation structure and signal behaviour.

## Waterfall Spectrogram

The DSP engine performs time-frequency analysis and returns a numerical waterfall matrix.

The frontend converts this matrix into a visual representation of:

> **Frequency activity versus time**

This is useful for observing spectral occupancy and changes in signal energy.

## Bitstream Output

Where supported by the current demodulation pipeline, recovered binary information can be surfaced for further analysis.

---

# 📡 Modulation Prototype

The current controlled DSP implementation contains processing paths for:

```text
BPSK
QPSK
16-QAM
BFSK
```

These demonstrate how ZeroTrace can evolve toward a larger automated modulation-analysis framework.

Real-world RF classification is substantially harder because captured signals can contain:

- noise
- carrier-frequency offset
- timing offset
- phase rotation
- interference
- filtering effects
- multipath
- unknown symbol rates
- OFDM structures

For this reason, the current classification output is presented as a **prototype heuristic**, not guaranteed universal modulation recognition.

---

# 🧬 FEC & Interleaving Strategy

The target analysis architecture is designed to accommodate FEC and interleaving stages.

Potential decoder modules include:

### Forward Error Correction

```text
Convolutional Coding
        ↓
Viterbi Decoder

Reed-Solomon

Concatenated Coding

LDPC
```

### De-interleaving

```text
Block

Convolutional

Diagonal

Pseudo-Random
```

These generic identification/decoding modules are **not fully implemented in the current hackathon prototype**.

Rather than displaying unsupported results, ZeroTrace can expose the state as:

```text
FEC          → Unknown
Interleaving → Unknown
```

The architecture leaves these stages open for future decoder modules.

---

# 🛰️ SigMF Integration

ZeroTrace supports a practical problem encountered with real SDR datasets.

Consider a raw complex I/Q file:

```text
capture.sigmf-data
```

The binary samples themselves may not tell the application:

```text
Sample Rate
Center Frequency
Sample Format
```

Its associated metadata file:

```text
capture.sigmf-meta
```

can contain this information.

ZeroTrace parses supported SigMF metadata locally and uses it to enrich the analysis request.

### Example

```json
{
  "global": {
    "core:datatype": "cf32_le",
    "core:sample_rate": 5000000
  },
  "captures": [
    {
      "core:frequency": 2685000000
    }
  ]
}
```

This allows the DSP engine to interpret a headerless I/Q capture with the acquisition context supplied by the SDR recording.

---

# 🔄 Complete Processing Workflow

### Stage 1 — Signal Acquisition

The analyst obtains an SDR/IQ or WAV capture.

### Stage 2 — Signal Upload

The capture is selected through the ZeroTrace ingestion interface.

### Stage 3 — Metadata

For SDR recordings, metadata can be supplied manually or extracted from an attached supported SigMF metadata file.

### Stage 4 — Backend Ingestion

The Next.js frontend submits the capture and available metadata to the Express backend.

### Stage 5 — Signal Storage

The backend stores the uploaded signal through Cloudinary and obtains a retrievable signal URL.

### Stage 6 — DSP Request

The backend sends the signal location, signal type and available acquisition metadata to the Python DSP API.

### Stage 7 — DSP Processing

The Python engine performs the applicable signal-processing operations.

### Stage 8 — Structured Intelligence

The DSP service returns structured analysis data including applicable parameters and visualization matrices/points.

### Stage 9 — Persistence

The backend stores analysis records in MongoDB.

### Stage 10 — Visualization

The frontend renders the result through the ZeroTrace dashboard.

---

# 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 |
| UI | React + TypeScript |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| DSP API | FastAPI + Uvicorn |
| DSP Language | Python |
| Numerical Processing | NumPy + SciPy |
| Audio Processing | Librosa + SoundFile |
| Noise Processing | Noisereduce |
| Database | MongoDB |
| Signal Storage | Cloudinary |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Prototype DSP Compute | Google Colab |
| DSP Connectivity | ngrok |

---

# 📁 Repository Structure

```text
ZeroTrace/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── services/
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── services/
│   ├── routes/
│   ├── controllers/
│   └── server.js
│
├── dsp/
│   ├── app.py
│   ├── ai_agent.py
│   ├── math_tools.py
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

# 🧩 DSP Code Organization

### `app.py`

FastAPI interface between the web infrastructure and the signal-processing engine.

Responsibilities include:

- API endpoints
- request validation
- signal-analysis request handling
- DSP response delivery

### `ai_agent.py`

Coordinates the signal-analysis workflow.

It acts as the orchestration layer between the API and underlying signal-processing utilities.

### `math_tools.py`

Contains the core numerical and DSP helper operations used by the analysis pipeline.

This separation makes it possible to extend the signal-processing engine without tightly coupling DSP implementation to the web API.

---

# 🎬 Judge Demo Flow

For a short hackathon demonstration, ZeroTrace can be presented in the following order:

### 1️⃣ Open ZeroTrace

Introduce the dashboard as an automated terrestrial signal-analysis environment.

### 2️⃣ Upload a WAV Capture

Demonstrate the complete:

```text
Frontend → Backend → DSP → Dashboard
```

pipeline.

Show the resulting sampling information, audio classification and waterfall.

### 3️⃣ Upload a Real I/Q Capture

Use a supported SDR recording.

### 4️⃣ Attach SigMF Metadata

Demonstrate automatic extraction of sample rate and center frequency.

Explain why this metadata is necessary for headerless raw I/Q data.

### 5️⃣ Run Analysis

Show that metadata is propagated to the DSP pipeline.

### 6️⃣ Explain the Constellation

Discuss how I/Q samples are represented in the complex plane.

### 7️⃣ Explain the Waterfall

Show how signal energy changes across frequency and time.

### 8️⃣ Highlight Honest Uncertainty

If FEC or interleaving displays:

```text
Unknown
```

explain:

> ZeroTrace deliberately avoids inventing a decoder result when the current prototype does not have sufficient evidence to determine it.

This demonstrates an important principle for automated intelligence systems: **confidence and uncertainty matter.**

---

# ⚖️ Implemented vs Roadmap

We intentionally distinguish the working prototype from the target architecture.

### 🟢 Implemented / Demonstrated

- End-to-end web-to-DSP pipeline
- WAV ingestion
- Raw I/Q ingestion
- SigMF data handling
- SigMF metadata extraction
- Sampling metadata propagation
- Spectral/time-frequency processing
- Waterfall matrix generation
- Constellation extraction
- Prototype modulation analysis
- Supported controlled demodulation paths
- Analysis persistence
- Interactive signal dashboard

### 🟡 Research / Prototype-Level

- Generalized modulation classification
- Bitstream recovery outside controlled supported cases

### 🔵 Planned Expansion

- Automatic FEC identification
- Viterbi decoding pipeline
- Reed-Solomon decoding
- LDPC decoding
- Generic interleaver identification
- Automatic de-interleaving
- Synchronization improvements
- OFDM analysis
- Protocol identification
- Header/payload correlation

---

# ⚠️ Current Prototype Limitations

ZeroTrace is a hackathon proof-of-concept, not a production universal RF decoder.

Arbitrary real-world RF signals may require additional processing including:

```text
Carrier Frequency Recovery
Symbol Timing Recovery
Phase Synchronization
Matched Filtering
Frame Synchronization
Pulse-Shaping Recovery
Channel Estimation
OFDM Processing
Protocol-Specific Decoding
```

The prototype therefore demonstrates the **architecture and automated analysis workflow** while leaving advanced universal decoding as future work.

---

# 🚀 Future Vision

The long-term goal is to evolve ZeroTrace from an analysis prototype into a modular signal-intelligence pipeline.

```text
                   ZEROTRACE
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
  Signal DSP      Classification     Decoding
       │               │               │
       ▼               ▼               ▼
 Synchronization   Modulation      FEC Detection
 Filtering         Recognition     De-interleaving
 Spectral DSP      Confidence      Bit Recovery
       │               │               │
       └───────────────┼───────────────┘
                       ▼
               Protocol Analysis
                       │
                       ▼
              Signal Intelligence
```

Potential future extensions include:

- advanced automatic modulation recognition
- confidence-aware RF classification
- Viterbi/convolutional decoding
- Reed-Solomon decoding
- LDPC decoding
- automatic interleaver detection
- carrier/timing synchronization
- OFDM analysis
- frame synchronization
- protocol fingerprinting
- header and payload correlation
- scalable persistent DSP infrastructure

---

# 🏆 Why ZeroTrace Matters

ZeroTrace demonstrates how several traditionally separate stages—

**signal ingestion, metadata handling, DSP processing, classification, persistence and visualization**—

can be combined into a single automated workflow.

The prototype is not intended to claim that every unknown terrestrial transmission can already be decoded.

Instead, it demonstrates the foundation of a system where increasingly sophisticated DSP, classification and decoding modules can be added behind one consistent analyst interface.

---

<div align="center">

## 📡 ZeroTrace

### **Capture. Analyze. Understand.**

**Automated Terrestrial Signal Intelligence**

<br/>

### 🚀 [Launch Live Demo](https://zero-trace-ruby.vercel.app)

<br/>

Built as a Hackathon Prototype

</div>