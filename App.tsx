
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MONTHS_CONFIG } from './constants';
import { ProgressState } from './types';
import { 
  CheckCircle2, 
  Circle, 
  Trophy, 
  Calendar, 
  RotateCcw,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const STORAGE_KEY = 'bible_reading_progress_v1';

/**
 * Utilitário para extrair a quantidade de capítulos de uma string de passagem.
 * Ex: "Gn 1,2" -> 2
 * Ex: "Gn 3-5" -> 3 (3, 4, 5)
 * Ex: "Sl 119" -> 1
 * Ex: "Ag 1-2; Zc 1-2" -> 4
 */
const getChapterCount = (passage: string): number => {
  if (!passage) return 0;
  const parts = passage.split(';');
  let total = 0;

  parts.forEach(part => {
    const clean = part.trim();
    
    // Caso 1: Intervalo com hífen (ex: 3-5 ou 11-14:20)
    // Pegamos os números antes de qualquer possível dois-pontos (versículos)
    const rangeMatch = clean.match(/(\d+)(?::\d+)?\s*-\s*(\d+)(?::\d+)?/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      // Se for no mesmo capítulo (ex: 14:21-25), conta como 1 capítulo
      if (rangeMatch[1] === rangeMatch[2]) {
        total += 1;
      } else {
        total += (Math.abs(end - start) + 1);
      }
      return;
    }

    // Caso 2: Lista com vírgulas (ex: 1,2 ou 1,2,5)
    const listMatch = clean.match(/(\d+)(,\d+)+/);
    if (listMatch) {
      total += listMatch[0].split(',').length;
      return;
    }

    // Caso 3: Capítulo único ou livro sem número explícito (ex: Sl 119 ou Jn)
    if (/\d+/.test(clean)) {
      total += 1;
    } else if (clean.length > 0) {
      // Casos especiais de livros citados por sigla que são lidos inteiros em um dia
      const lower = clean.toLowerCase();
      if (lower.includes('jn')) total += 4; // Jonas tem 4 caps
      else if (lower.includes('fm')) total += 1; // Filemom
      else if (lower.includes('jd')) total += 1; // Judas
      else if (lower.includes('2 jo')) total += 1;
      else if (lower.includes('3 jo')) total += 1;
      else total += 1; // Padrão 1
    }
  });

  return total || 1;
};

const ChurchLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 120" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF200" />
        <stop offset="100%" stopColor="#FF8C00" />
      </linearGradient>
      <linearGradient id="hillGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#006400" />
        <stop offset="100%" stopColor="#32CD32" />
      </linearGradient>
    </defs>
    <circle cx="110" cy="55" r="30" fill="url(#sunGrad)" />
    <path d="M10 85 Q 60 40, 110 80 T 190 75 L 190 100 L 10 100 Z" fill="url(#hillGrad)" />
    <rect x="106" y="35" width="8" height="35" fill="#007FFF" rx="1" />
    <rect x="98" y="45" width="24" height="6" fill="#007FFF" rx="1" />
    <circle cx="103" cy="72" r="2" fill="white" />
    <circle cx="110" cy="75" r="2" fill="white" />
    <circle cx="117" cy="72" r="2" fill="white" />
    <text x="100" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#8B4513" style={{ fontFamily: 'serif', letterSpacing: '1px' }}>
      1ª IGREJA BATISTA EM
    </text>
    <text x="100" y="122" textAnchor="middle" fontSize="12" fontWeight="black" fill="#8B4513" style={{ fontFamily: 'serif', letterSpacing: '2px' }}>
      JARDIM ESMERALDA
    </text>
  </svg>
);

export default function App() {
  const [progress, setProgress] = useState<ProgressState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    return Math.min(new Date().getMonth(), MONTHS_CONFIG.length - 1);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const toggleReading = (monthId: string, day: number) => {
    const key = `${monthId}-${day}`;
    setProgress(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Cálculo do total de capítulos possíveis no plano inteiro
  const totalPossibleChapters = useMemo(() => {
    return MONTHS_CONFIG.reduce((acc, month) => {
      return acc + Object.values(month.readings).reduce((sum, passage) => sum + getChapterCount(passage), 0);
    }, 0);
  }, []);

  // Cálculo de capítulos já lidos (baseado nos dias marcados)
  const totalReadChapters = useMemo(() => {
    let total = 0;
    MONTHS_CONFIG.forEach(month => {
      Object.entries(month.readings).forEach(([dayStr, passage]) => {
        if (progress[`${month.id}-${dayStr}`]) {
          total += getChapterCount(passage);
        }
      });
    });
    return total;
  }, [progress]);

  const progressPercentage = Math.round((totalReadChapters / totalPossibleChapters) * 100);

  const resetProgress = useCallback(() => {
    if (confirm('Tem certeza que deseja resetar todo o seu progresso? Esta ação não pode ser desfeita.')) {
      setProgress({});
    }
  }, []);

  const currentMonthData = MONTHS_CONFIG[activeTab];
  
  const getMonthChapterStats = (monthId: string) => {
    const month = MONTHS_CONFIG.find(m => m.id === monthId);
    if (!month) return { percentage: 0, read: 0, total: 0 };
    
    let total = 0;
    let read = 0;
    
    Object.entries(month.readings).forEach(([dayStr, passage]) => {
      const count = getChapterCount(passage);
      total += count;
      if (progress[`${monthId}-${dayStr}`]) {
        read += count;
      }
    });
    
    return {
      percentage: Math.round((read / total) * 100) || 0,
      read,
      total
    };
  };

  const currentMonthStats = getMonthChapterStats(currentMonthData.id);

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 md:py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
              PLANO DE LEITURA PIBJE
            </h1>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">
              2026 - Ano da Frutificação
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                  {progressPercentage}% DO TOTAL
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {totalReadChapters} de {totalPossibleChapters} caps.
                </span>
              </div>
              <div className="w-48 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="h-16 w-24 md:h-20 md:w-32 flex items-center justify-center p-1">
              <ChurchLogo className="h-full w-full drop-shadow-sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 pt-6 flex-1">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Calendar size={20}/></div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Mês</p>
               <p className="text-sm font-bold text-slate-800">{currentMonthData.name}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={20}/></div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Capítulos Lidos</p>
               <p className="text-sm font-bold text-slate-800">{totalReadChapters}</p>
             </div>
          </div>
          <div className="hidden md:flex bg-white p-4 rounded-2xl border border-slate-200 shadow-sm items-center gap-3">
             <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Trophy size={20}/></div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Faltam (Caps)</p>
               <p className="text-sm font-bold text-slate-800">{totalPossibleChapters - totalReadChapters}</p>
             </div>
          </div>
          <button 
            onClick={resetProgress}
            className="hidden md:flex bg-white p-4 rounded-2xl border border-slate-200 shadow-sm items-center gap-3 hover:bg-red-50 hover:border-red-100 transition-colors group"
          >
             <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:text-red-500"><RotateCcw size={20}/></div>
             <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">Reiniciar</p>
               <p className="text-sm font-bold text-slate-800">Zerar progresso</p>
             </div>
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
            disabled={activeTab === 0}
            className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all"
          >
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-black text-slate-900">{currentMonthData.name}</h2>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${currentMonthStats.percentage}%` }}></div>
              </div>
              <span className="text-[10px] font-black text-emerald-600">{currentMonthStats.percentage}% ({currentMonthStats.read}/{currentMonthStats.total} caps)</span>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab(prev => Math.min(MONTHS_CONFIG.length - 1, prev + 1))}
            disabled={activeTab === MONTHS_CONFIG.length - 1}
            className="p-3 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all"
          >
            <ChevronRight size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Reading List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {Object.entries(currentMonthData.readings).map(([dayStr, passage]) => {
            const dayNum = parseInt(dayStr);
            const isRead = !!progress[`${currentMonthData.id}-${dayNum}`];
            const capsInDay = getChapterCount(passage);
            
            return (
              <button
                key={dayNum}
                onClick={() => toggleReading(currentMonthData.id, dayNum)}
                className={`group flex items-center p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden ${
                  isRead 
                  ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500/10' 
                  : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <div className={`mr-4 flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl font-black text-base transition-all ${
                  isRead ? 'bg-emerald-500 text-white rotate-6' : 'bg-slate-100 text-slate-400'
                }`}>
                  {dayNum}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm md:text-base font-black truncate transition-colors ${
                    isRead ? 'text-emerald-900' : 'text-slate-800'
                  }`}>
                    {passage}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {capsInDay} {capsInDay === 1 ? 'capítulo' : 'capítulos'}
                  </p>
                </div>

                <div className={`flex-shrink-0 ml-2 transition-all duration-500 ${
                  isRead ? 'text-emerald-500 scale-125' : 'text-slate-200 group-hover:text-slate-300'
                }`}>
                  {isRead ? (
                    <CheckCircle2 size={28} fill="currentColor" className="text-white bg-emerald-500 rounded-full" />
                  ) : (
                    <Circle size={28} strokeWidth={1.5} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Floating Action Button / Mobile Progress */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Geral</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-emerald-600 leading-none">{progressPercentage}%</span>
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-slate-500 leading-tight">{totalReadChapters}/{totalPossibleChapters} caps.</span>
               <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mt-1">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${progressPercentage}%` }}></div>
               </div>
            </div>
          </div>
        </div>
        
        <button 
          onClick={resetProgress}
          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-red-500 transition-colors"
        >
          <RotateCcw size={20} />
        </button>
      </nav>
    </div>
  );
}
