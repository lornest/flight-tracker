import { NextResponse } from 'next/server';

export async function POST() {
  // Simulate restart delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Mock system restart - would restart device in production');
  
  return NextResponse.json({ 
    success: true, 
    message: 'Mock restart completed (system would restart in production)' 
  });
}