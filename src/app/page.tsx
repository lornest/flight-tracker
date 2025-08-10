// import Clock from '@/components/Clock';

// export default function Home() {
//   return (
//     <main className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
//       <Clock />
//     </main>
//   );
// }

import FlightTrackingClock from '@/components/FlightTrackingClock';

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <FlightTrackingClock />
    </main>
  );
}