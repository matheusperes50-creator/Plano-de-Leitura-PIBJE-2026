
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
  ChevronLeft,
  BookOpen,
  BookMarked
} from 'lucide-react';

const STORAGE_KEY = 'bible_reading_progress_v1';

export default function App() {
  const [progress, setProgress] = useState<ProgressState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [activeTab, setActiveTab] = useState(0);

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

  // Lógica de cálculo revisada para somar os valores de chapterCounts
  const totalPossibleChapters = useMemo(() => {
    return MONTHS_CONFIG.reduce((acc, month) => {
      const monthTotal = Object.values(month.chapterCounts).reduce((a, b) => a + b, 0);
      return acc + monthTotal;
    }, 0);
  }, []);

  const totalReadChapters = useMemo(() => {
    let sum = 0;
    MONTHS_CONFIG.forEach(month => {
      Object.keys(month.readings).forEach(dayStr => {
        const dayNum = parseInt(dayStr);
        if (progress[`${month.id}-${dayNum}`]) {
          // Busca o peso de capítulos para este dia específico no plano
          const chapters = month.chapterCounts[dayNum] || 0;
          sum += chapters;
        }
      });
    });
    return sum;
  }, [progress]);

  const progressPercentage = Math.round((totalReadChapters / totalPossibleChapters) * 100) || 0;

  const resetProgress = useCallback(() => {
    if (confirm('Tem certeza que deseja resetar todo o seu progresso de leitura?')) {
      setProgress({});
    }
  }, []);

  const currentMonthData = MONTHS_CONFIG[activeTab];
  
  const getMonthProgress = (monthId: string) => {
    const month = MONTHS_CONFIG.find(m => m.id === monthId);
    if (!month) return 0;
    const totalDays = Object.keys(month.readings).length;
    const readDays = Object.keys(month.readings).filter(day => progress[`${monthId}-${day}`]).length;
    return Math.round((readDays / totalDays) * 100);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-4 md:py-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Novo Ícone de Bíblia */}
            <div className="bg-emerald-600 p-3 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
               <BookOpen className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                Plano de Leitura <span className="text-emerald-600">PIBJE 2026</span>
              </h1>
              <p className="text-slate-500 text-sm font-semibold italic">Ano da frutificação</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Contador de Capítulos Corrigido */}
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-2xl">
              <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
                <BookMarked size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total de Capítulos</span>
                <span className="text-lg font-black text-slate-800 leading-none">
                  {totalReadChapters} <span className="text-slate-400 font-medium text-sm">/ {totalPossibleChapters}</span>
                </span>
              </div>
            </div>

            <div className="hidden sm:flex flex-col w-40">
              <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meta Anual</span>
                <span className="text-[10px] font-bold text-emerald-600">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 pt-6 flex-1">
        {/* Mobile Stats Bar */}
        <div className="flex sm:hidden items-center justify-between mb-6 bg-white p-4 rounded-3xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Trophy size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Concluído</span>
                <span className="text-xl font-black text-slate-800">{progressPercentage}%</span>
              </div>
           </div>
           
           <div className="h-10 w-[1px] bg-slate-100"></div>

           <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Lidos</span>
              <span className="text-lg font-bold text-emerald-600">{totalReadChapters} cap.</span>
           </div>
        </div>

        {/* Month Selector Desktop */}
        <div className="hidden md:flex flex-wrap gap-2 mb-8">
          {MONTHS_CONFIG.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setActiveTab(idx)}
              className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 border ${
                activeTab === idx 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <div className="flex flex-col items-start">
                <span>{m.name}</span>
                <div className={`mt-1.5 h-1 w-full rounded-full overflow-hidden ${activeTab === idx ? 'bg-white/30' : 'bg-slate-100'}`}>
                  <div 
                    className={`h-full transition-all duration-500 ${activeTab === idx ? 'bg-white' : 'bg-emerald-400'}`}
                    style={{ width: `${getMonthProgress(m.id)}%` }}
                  />
                </div>
              </div>
            </button>
          ))}
          <button 
            onClick={resetProgress}
            className="ml-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center gap-2 border border-slate-100 hover:border-red-100"
          >
            <RotateCcw size={14} />
            Resetar Tudo
          </button>
        </div>

        {/* Mobile Month Navigation */}
        <div className="flex md:hidden items-center justify-between mb-6 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
           <button 
             onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
             disabled={activeTab === 0}
             className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
           >
             <ChevronLeft size={24} />
           </button>
           <div className="text-center flex-1">
             <h2 className="text-lg font-black tracking-tight text-slate-800">{currentMonthData.name}</h2>
             <div className="flex items-center justify-center gap-2 mt-1">
                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getMonthProgress(currentMonthData.id)}%` }}></div>
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">{getMonthProgress(currentMonthData.id)}%</span>
             </div>
           </div>
           <button 
             onClick={() => setActiveTab(prev => Math.min(MONTHS_CONFIG.length - 1, prev + 1))}
             disabled={activeTab === MONTHS_CONFIG.length - 1}
             className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors"
           >
             <ChevronRight size={24} />
           </button>
        </div>

        {/* Reading Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {Object.entries(currentMonthData.readings).map(([dayStr, passage]) => {
            const dayNum = parseInt(dayStr);
            const isRead = !!progress[`${currentMonthData.id}-${dayNum}`];
            const chaptersCount = currentMonthData.chapterCounts[dayNum] || 1;
            
            return (
              <button
                key={dayNum}
                onClick={() => toggleReading(currentMonthData.id, dayNum)}
                className={`group flex items-center p-4 rounded-[2rem] border transition-all duration-500 text-left relative overflow-hidden ${
                  isRead 
                  ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-50 translate-y-[-2px]' 
                  : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:translate-y-[-4px]'
                }`}
              >
                <div className={`mr-4 flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl font-black text-base transition-all duration-500 ${
                  isRead ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'
                }`}>
                  {dayNum}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-bold truncate transition-colors ${
                    isRead ? 'text-white' : 'text-slate-800'
                  }`}>
                    {passage}
                  </p>
                  <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    isRead ? 'text-emerald-100/70' : 'text-slate-400'
                  }`}>
                    {chaptersCount} {chaptersCount === 1 ? 'Capítulo' : 'Capítulos'}
                  </p>
                </div>

                <div className={`flex-shrink-0 ml-2 transition-all duration-500 ${
                  isRead ? 'text-white scale-110' : 'text-slate-200 group-hover:text-emerald-300'
                }`}>
                  {isRead ? <CheckCircle2 size={28} fill="currentColor" className="text-emerald-600" /> : <Circle size={28} strokeWidth={1.5} />}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-4 flex items-center justify-between z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-t-[2.5rem]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capítulos Lidos</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600">{totalReadChapters}</span>
            <span className="text-slate-300 font-bold">/</span>
            <span className="text-lg font-bold text-slate-400">{totalPossibleChapters}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-2">
              <Calendar size={18} />
              <span className="text-sm font-black uppercase tracking-tight">{currentMonthData.name}</span>
           </div>
        </div>
      </nav>
    </div>
  );
}
