import type { Metadata } from 'next';
import './components/styles/tailwind.css';

export const metadata: Metadata = {
  title: 'QueryMindAI — Ask questions, not SQL',
  description:
    'Connect a read-only PostgreSQL database and query it safely using natural language.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
