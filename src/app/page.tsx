// import Clock from '@/components/Clock';

// export default function Home() {
//   return (
//     <main className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
//       <Clock />
//     </main>
//   );
// }

import SwipeableScreens from '@/components/SwipeableScreens';

export default function Home() {
  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <SwipeableScreens />
    </main>
  );
}