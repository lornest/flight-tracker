import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/performance.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HyperPixel Flight Clock',
  description: 'Real-time flight tracking display for HyperPixel 2.1 Round',
};

export const viewport: Viewport = {
  width: 480,
  height: 480,
  initialScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-hidden select-none`}>
        {children}
      </body>
    </html>
  );
}