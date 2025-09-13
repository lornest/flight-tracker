import AppWrapper from '@/components/AppWrapper';

export default function Home() {
  return (
    <main className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <div className="w-round h-round">
        <AppWrapper />
      </div>
    </main>
  );
}