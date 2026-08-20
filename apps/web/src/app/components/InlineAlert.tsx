import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type AlertKind = 'error' | 'success' | 'info';

const styles: Record<AlertKind, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-900',
};

export default function InlineAlert({
  kind = 'info',
  children,
}: {
  kind?: AlertKind;
  children: React.ReactNode;
}) {
  const Icon = kind === 'error' ? AlertCircle : kind === 'success' ? CheckCircle2 : Info;
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${styles[kind]}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
