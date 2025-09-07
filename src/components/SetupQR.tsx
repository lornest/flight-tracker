'use client';

import { useEffect, useState } from 'react';

export function SetupQR() {
  const [qrCode, setQrCode] = useState('');
  
  // Generate QR code for setup URL
  useEffect(() => {
    const setupUrl = 'http://192.168.4.1:3000/setup';
    // Using QR Server API for QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(setupUrl)}`;
    setQrCode(qrUrl);
  }, []);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="w-round h-round rounded-round flex items-center justify-center p-8 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
        
        <div className="text-center space-y-6">
          <h1 className="text-2xl font-bold text-white">Setup Required</h1>
          
          <div className="bg-white p-4 rounded-lg">
            {qrCode && (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={qrCode} 
                alt="Setup QR Code" 
                className="w-48 h-48 mx-auto"
              />
            )}
          </div>
          
          <div className="space-y-3">
            <p className="text-base text-gray-300">
              1. Connect to: <span className="text-blue-400 font-mono font-bold">FlightClock-Setup</span>
            </p>
            <p className="text-base text-gray-300">
              2. Password: <span className="text-blue-400 font-mono font-bold">setup123</span>
            </p>
            <p className="text-base text-gray-300">
              3. Scan QR code or visit:
            </p>
            <p className="text-sm text-blue-400 font-mono font-bold">
              192.168.4.1:3000/setup
            </p>
          </div>
        </div>
        
        {/* Pulsing indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-400 font-medium">Waiting for setup...</span>
          </div>
        </div>
      </div>
    </div>
  );
}