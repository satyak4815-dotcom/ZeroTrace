'use client';

import React, { useState } from 'react';

export default function SpaceVideoBackground() {
  const [imageError, setImageError] = useState(false);

  return (
    <>
      {/* Base Fallback Layer: Original pale blue/white ZeroTrace theme background */}
      <div
        className="fixed top-0 left-0 w-screen h-screen -z-30 bg-[#F4F8FB] pointer-events-none"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
        }}
      />

      {/* Cinematic Earth-from-Space Background Image */}
      {!imageError && (
        <img
          src="/images/earth-space.png"
          alt="Earth Space Background"
          onError={() => setImageError(true)}
          aria-hidden="true"
          className="fixed top-0 left-0 w-screen h-screen object-cover -z-20 pointer-events-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Subtle Readability & Light Translucent Overlay Layer */}
      <div
        className="fixed top-0 left-0 w-screen h-screen -z-10 pointer-events-none"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background:
            'linear-gradient(to bottom, rgba(244, 248, 251, 0.42) 0%, rgba(240, 246, 252, 0.32) 50%, rgba(244, 248, 251, 0.48) 100%)',
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
