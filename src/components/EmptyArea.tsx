import { Sparkles } from 'lucide-react';

const suggestedPrompts = [
  'Explain quantum computing simply',
  'Write a professional email',
  'Brainstorm startup ideas',
  'Plan a healthy weekly routine',
];

interface EmptyAreaProps {
  onPromptSelect: (prompt: string) => void;
}

export default function EmptyArea({ onPromptSelect }: EmptyAreaProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">How can I help you today?</h1>
      <p className="mt-2 text-sm text-zinc-500">Ask me anything, or try one of these:</p>
      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptSelect(prompt)}
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}