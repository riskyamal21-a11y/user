'use client';

export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#f8fafc]">
      {/* Soft Pastel Ambient Glows */}
      <div className="absolute top-[-100px] right-[-80px] w-96 h-96 rounded-full bg-gradient-to-br from-blue-200/40 to-sky-100/40 blur-[90px]" />
      <div className="absolute bottom-[5%] left-[-100px] w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-indigo-100/50 to-slate-200/50 blur-[100px]" />
      <div className="absolute top-[35%] left-[20%] w-80 h-80 rounded-full bg-gradient-to-r from-teal-100/30 to-blue-100/30 blur-[90px]" />

      {/* Subtle Micro-Grid Texture */}
      <div 
        className="absolute inset-0 opacity-[0.035]" 
        style={{
          backgroundImage: 'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />
    </div>
  );
}
