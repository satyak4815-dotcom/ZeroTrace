'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Binary, FileText } from 'lucide-react';
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
  const hasHeaderData = headerStr.trim().length > 0;
  const headerHex = isBinaryHeader
    ? `0x${parseInt(headerStr, 2).toString(16).toUpperCase()}`
    : (headerStr || 'N/A');

  // Convert binary string to Hex and ASCII
  const parseBinary = (binStr?: string) => {
    if (!binStr || !/^[01]+$/.test(binStr)) {
      return { hex: 'N/A (Analog / Non-Binary)', ascii: binStr || 'N/A' };
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

  // Run typing animation effect
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

        let pIdx = 0;
        const payloadInterval = setInterval(() => {
          if (pIdx <= targetPayload.length) {
            setDisplayedPayload(targetPayload.substring(0, pIdx));
            pIdx += 2;
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
    const fullText = `${hasHeaderData ? `[HEADER]: ${headerStr}\n` : ''}[PAYLOAD]: ${payloadStr || 'N/A'}\n[HEX]: ${hexPayload}\n[ASCII]: ${asciiPayload}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Decoded Stream Feed</h3>
            <p className="text-xs text-slate-500">Recovered bitstream extracted from the analyzed signal</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={runTypingEffect}
            disabled={isTyping}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
            title="Replay stream typing animation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTyping ? 'animate-spin text-cyan-600' : ''}`} />
            <span>Replay Stream</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Stream'}</span>
          </button>
        </div>
      </div>

      {/* Main Stream Container */}
      <div className="space-y-4">
        
        {/* 1. Header/Preamble Block — conditionally rendered ONLY if headerStr has data */}
        {hasHeaderData && (
          <div className="bg-cyan-50/60 border border-cyan-100 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-900 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Frame Header Preamble
              </span>
              <span className="text-[11px] text-cyan-700 font-mono">
                {headerStr.length} Bits ({Math.ceil(headerStr.length / 8)} Byte)
              </span>
            </div>

            <div className="font-mono text-base font-bold tracking-widest text-cyan-950 break-all">
              <span>{displayedHeader || (isTyping ? '' : headerStr)}</span>
              {isTyping && displayedHeader.length < headerStr.length && (
                <span className="inline-block w-2 h-4 bg-cyan-600 ml-1 animate-pulse" />
              )}
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1.5">
              Hex: <strong className="text-slate-800">{headerHex}</strong>
            </div>
          </div>
        )}

        {/* 2. Demodulated Payload Bitstream Block */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Demodulated Payload Bitstream
            </span>
            <span className="text-[11px] text-emerald-700 font-mono">
              {payloadStr.length} Bits ({Math.ceil(payloadStr.length / 8)} Bytes)
            </span>
          </div>

          <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-slate-900 break-all leading-relaxed select-all">
            {isBinaryPayload && displayedPayload.length > 0 ? (
              displayedPayload.match(/.{1,8}/g)?.map((chunk, idx) => (
                <span key={idx} className="mr-2 inline-block">
                  <span className="text-emerald-900">{chunk}</span>
                </span>
              ))
            ) : (
              <span>{displayedPayload || (isTyping ? '' : payloadStr || 'N/A')}</span>
            )}
            <span className="inline-block w-2 h-4 bg-emerald-600 ml-1 align-middle animate-blink" />
          </div>
        </div>

        {/* 3. HEX Dump & ASCII Interpretation Subcards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <span className="text-slate-500 font-semibold block mb-1">Hexadecimal Dump</span>
            <div className="font-mono font-bold text-amber-800 tracking-wider break-all">
              {hexPayload}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
            <span className="text-slate-500 font-semibold block mb-1">ASCII Interpretation</span>
            <div className="font-mono font-bold text-cyan-900 tracking-wider break-all">
              &quot;{asciiPayload}&quot;
            </div>
          </div>
        </div>

      </div>

      {/* Stream Info Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
        <div>
          Bit Count: <strong className="text-slate-800 font-mono">{payloadStr.length}</strong>
        </div>
        <div>
          Format: <strong className="text-slate-800">{isBinaryPayload ? 'Binary Bitstream' : 'Text / Raw'}</strong>
        </div>
      </div>
    </div>
  );
}


