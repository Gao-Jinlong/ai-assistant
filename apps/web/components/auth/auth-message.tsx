import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthMessageProps {
  type: 'success' | 'error';
  text: string;
}

export function AuthMessage({ type, text }: AuthMessageProps) {
  return (
    <div
      className={`p-3 mb-4 text-sm border rounded-md flex items-center gap-2 ${
        type === 'error'
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-green-50 border-green-200 text-green-600'
      }`}
    >
      {type === 'error' ? (
        <AlertCircle size={16} />
      ) : (
        <CheckCircle2 size={16} />
      )}
      {text}
    </div>
  );
}
