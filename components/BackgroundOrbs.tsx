'use client';

export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#f8fafc]">
      {/* Soft gradient ambient lights */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="absolute top-1/2 -left-32 w-96 h-96 rounded-full bg-indigo-50/70 blur-3xl" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 rounded-full bg-sky-50/80 blur-3xl" />
    </div>
  );
}
