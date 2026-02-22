import type { Metadata, Viewport } from 'next';
import './globals.css';
import '../styles/performance.css';

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
      <body className="overflow-hidden select-none font-sans">
        {children}
      </body>
    </html>
  );
}
