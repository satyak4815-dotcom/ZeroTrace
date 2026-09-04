'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Copy, Check, Play, RefreshCw, Cpu, Database, Binary } from 'lucide-react';
import { Bitstream } from '@/lib/mockData';

interface BitstreamTerminalProps {
  bitstream?: Bitstream;
}

export default function BitstreamTerminal({ bitstream }: BitstreamTerminalProps) {
  const [displayedHeader, setDisplayedHeader] = useState('');
  const [displayedPayload, setDisplayedPayload] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hexPayload, setHexPayload] = useState('');
  const [asciiPayload, setAsciiPayload] = useState('');
  const [updateKey, setUpdateKey] = useState(0);

  const headerStr = bitstream?.header ?? '';
  const payloadStr = bitstream?.payload ?? '';
  const isBinaryHeader = /^[01]+$/.test(headerStr);
  const isBinaryPayload = /^[01]+$/.test(payloadStr);
  const headerHex = isBinaryHeader
    ? `0x${parseInt(headerStr, 2).toString(16).toUpperCase()}`
    : (headerStr || 'N/A');

  // Convert binary string to Hex and ASCII
  const parseBinary = (binStr?: string) => {
    if (!binStr || !/^[01]+$/.test(binStr)) {
      return { hex: 'N/A (ANALOG / NON-BINARY)', ascii: binStr || 'N/A' };
    }
    let hex = '';
    let ascii = '';
    for (let i = 0; i < binStr.length; i += 8) {
      const byteStr = binStr.substring(i, i + 8);
      if (byteStr.length === 8) {
        const val = parseInt(byteStr, 2);
        hex += '0x' + val.toString(16).toUpperCase().padStart(2, '0') + ' ';
        ascii += (val >= 32 && val <= 126) ? String.fromCharCode(val) : '.';
      }
    }
    return { hex: hex.trim() || 'N/A', ascii: ascii || 'N/A' };
  };

  // Run typing animation effect with clean timer references
  const runTypingEffect = () => {
    setIsTyping(true);
    setDisplayedHeader('');
    setDisplayedPayload('');

    const targetHeader = headerStr;
    const targetPayload = payloadStr;

    if (!targetHeader && !targetPayload) {
      setIsTyping(false);
      return;
    }

    let hIdx = 0;
    const headerInterval = setInterval(() => {
      if (hIdx <= targetHeader.length) {
        setDisplayedHeader(targetHeader.substring(0, hIdx));
        hIdx++;
      } else {
        clearInterval(headerInterval);

        // Start typing payload
        let pIdx = 0;
        const payloadInterval = setInterval(() => {
          if (pIdx <= targetPayload.length) {
            setDisplayedPayload(targetPayload.substring(0, pIdx));
            pIdx += 2; // Type 2 bits at a time for fast military stream feel
          } else {
            setDisplayedPayload(targetPayload);
            clearInterval(payloadInterval);
            setIsTyping(false);
          }
        }, 30);
      }
    }, 45);
  };

  useEffect(() => {
    setUpdateKey((k) => k + 1);
  }, [bitstream?.header, bitstream?.payload]);

  useEffect(() => {
    runTypingEffect();
    const { hex, ascii } = parseBinary(payloadStr);
    setHexPayload(hex);
    setAsciiPayload(ascii);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateKey]);

  const handleCopy = () => {
    const fullText = `[HEADER]: ${headerStr || 'N/A'}\n[PAYLOAD]: ${payloadStr || 'N/A'}\n[HEX]: ${hexPayload}\n[ASCII]: ${asciiPayload}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-[#050811] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col font-mono">
      {/* Terminal Title Bar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Tactical window control dots */}
          <div className="flex space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
          </div>
          <span className="text-slate-600 text-xs">|</span>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>ZEROTRACE-CORE://DSP/DECODED_STREAM_FEED</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={runTypingEffect}
            disabled={isTyping}
            className="flex items-center space-x-1 px-2 py-0.5 text-[10px] rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-emerald-500/40 transition-colors disabled:opacity-50"
            title="Replay bitstream decoding stream"
          >
            <RefreshCw className={`w-3 h-3 ${isTyping ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">REPLAY STREAM</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-0.5 text-[10px] rounded bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'COPIED' : 'COPY STREAM'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Screen with CRT Scanlines */}
      <div className="relative p-5 bg-[#03060e] text-emerald-400 text-xs sm:text-sm space-y-4 min-h-[220px]">
        {/* Subtle CRT scanlines */}
        <div className="absolute inset-0 crt-scanlines pointer-events-none opacity-40" />

        {/* Terminal Status Prompt */}
        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
          <span className="text-emerald-500 font-bold">sigint@zerotrace-node:~$</span>
          <span>demod --correlate --bitstream-extractor --sync</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
            [CORRELATION_PASS: 100%]
          </span>
        </div>

        {/* 1. Header Bits Block */}
        <div className="bg-slate-950/90 border border-emerald-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 border-b border-slate-900 pb-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <span className="text-cyan-300 font-bold uppercase tracking-wider">
                FRAME HEADER SYNC WORD (PREAMBLE)
              </span>
            </div>
            <span className="text-[10px] text-cyan-400/90">
              LENGTH: {headerStr.length} BITS ({Math.ceil(headerStr.length / 8) || 1} BYTE)
            </span>
          </div>

          <div className="flex items-center font-mono text-base tracking-widest text-cyan-300 break-all select-all font-bold">
            <span>{displayedHeader || (isTyping ? '' : headerStr || 'N/A')}</span>
            {isTyping && displayedHeader.length < headerStr.length && (
              <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />
            )}
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex gap-3">
            <span>HEX: {headerHex}</span>
            <span>SYNC CONFIDENCE: {headerStr && headerStr !== 'N/A' ? '99.8%' : 'N/A'}</span>
            <span>BARKER PATTERN MATCH</span>
          </div>
        </div>

        {/* 2. Payload Bits Block */}
        <div className="bg-slate-950/90 border border-emerald-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 border-b border-slate-900 pb-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span className="text-emerald-300 font-bold uppercase tracking-wider">
                DEMODULATED PAYLOAD BITSTREAM
              </span>
            </div>
            <span className="text-[10px] text-emerald-400/90">
              LENGTH: {payloadStr.length} BITS ({Math.ceil(payloadStr.length / 8)} BYTES)
            </span>
          </div>

          {/* Formatted bit chunks (groups of 8 bits) */}
          <div className="font-mono text-sm sm:text-base tracking-widest text-emerald-400 break-all select-all font-bold leading-relaxed">
            {isBinaryPayload && displayedPayload.length > 0 ? (
              displayedPayload.match(/.{1,8}/g)?.map((chunk, idx) => (
                <span key={idx} className="mr-2 inline-block">
                  <span className="text-emerald-300">{chunk}</span>
                </span>
              ))
            ) : (
              <span>{displayedPayload || (isTyping ? '' : payloadStr || 'N/A')}</span>
            )}
            <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 align-middle animate-blink" />
          </div>

          {/* Translations: HEX & ASCII Interpretation */}
          <div className="mt-3 pt-2.5 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono">
            <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block mb-0.5">HEXADECIMAL DUMP:</span>
              <span className="text-amber-300 font-bold tracking-wider">{hexPayload}</span>
            </div>
            <div className="bg-slate-900/70 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block mb-0.5">ASCII STRING CONVERSION:</span>
              <span className="text-cyan-300 font-bold tracking-wider font-mono">
                &quot;{asciiPayload}&quot;
              </span>
              <span className="text-slate-500 ml-2">(PLAINTEXT SIGINT CHUNK)</span>
            </div>
          </div>
        </div>

        {/* Live Correlation Matrix Telemetry */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
          <div className="flex items-center space-x-3">
            <span>BIT ERROR RATE (BER): <span className="text-emerald-400">0.00e+0</span></span>
            <span>FRAME SYNC JITTER: <span className="text-cyan-400">&lt; 0.1 μs</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-semibold">STREAM STATUS: BUFFERING LIVE PACKETS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
