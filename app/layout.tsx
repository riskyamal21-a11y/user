import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TugasKu - Anti-Gravity Task Reminder',
  description: 'Aplikasi pengingat tugas sekolah modern bergaya Anti-Gravity dengan Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
