import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Radio, 
  HelpCircle,
  Pickaxe,
  Waves
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: any;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  contextData,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Centro de Inteligencia Centinela Orinoco en línea. ¿En qué sector de la cuenca o vector de amenaza requiere asistencia?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const newMessages = [...messages, { role: 'user' as const, content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: contextData,
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages([...newMessages, { role: 'assistant' as const, content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant' as const, content: data.error || 'Error al procesar consulta.' }]);
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant' as const, content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#0b121c]/98 backdrop-blur-md border-l border-slate-700 shadow-2xl flex flex-col text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#060a0f]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Centinela AI Companion
            </h3>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              GEMINI 3.7 FLASH ACTIVO
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-[#080e16] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => handleQuickPrompt('¿Cuál es la situación actual de minería ilegal en el Parque Nacional Yapacana?')}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700"
        >
          ⛏️ Yapacana
        </button>
        <button
          onClick={() => handleQuickPrompt('Resume las alertas de nivel hidrométrico en el Río Orinoco')}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700"
        >
          🌊 Crecidas Orinoco
        </button>
        <button
          onClick={() => handleQuickPrompt('¿Cuáles son los niveles de mercurio reportados en la cuenca del Caura?')}
          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap border border-slate-700"
        >
          🧪 Mercurio Caura
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white rounded-br-none shadow'
                  : 'bg-[#070b10] border border-slate-800 text-slate-200 rounded-bl-none shadow'
              }`}
            >
              <MarkdownRenderer content={msg.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-xs text-slate-400 font-mono py-1">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span>Consultando modelo táctico...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-800 bg-[#060a0f] flex items-center gap-2.5">
        <input
          type="text"
          placeholder="Escriba su consulta táctica..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-[#0b121c] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm md:text-base text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 sm:p-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
