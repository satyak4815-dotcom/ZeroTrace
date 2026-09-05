import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ZeroTrace Intel — Automated Signal Intelligence & Demodulation Command',
  description: 'Scientific RF Signal Intelligence & Demodulation Platform for Demodulation, Constellation Analysis, and Bitstream Extraction',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${inter.variable}`}>
      <body className="bg-[#F4F8FB] text-slate-900 min-h-screen antialiased selection:bg-cyan-600 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}


