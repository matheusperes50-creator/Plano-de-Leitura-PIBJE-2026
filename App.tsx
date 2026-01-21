
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MONTHS_CONFIG } from './constants';
import { ProgressState } from './types';
import { 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  Trophy, 
  Calendar, 
  RotateCcw,
  ChevronRight,
  ChevronLeft
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

  const totalPossible = useMemo(() => {
    return MONTHS_CONFIG.reduce((acc, month) => acc + Object.keys(month.readings).length, 0);
  }, []);

  const totalRead = useMemo(() => {
    return Object.values(progress).filter(Boolean).length;
  }, [progress]);

  const progressPercentage = Math.round((totalRead / totalPossible) * 100);

  const resetProgress = useCallback(() => {
    if (confirm('Tem certeza que deseja resetar todo o seu progresso?')) {
      setProgress({});
    }
  }, []);

  const currentMonthData = MONTHS_CONFIG[activeTab];
  
  const getMonthProgress = (monthId: string) => {
    const month = MONTHS_CONFIG.find(m => m.id === monthId);
    if (!month) return 0;
    const total = Object.keys(month.readings).length;
    const read = Object.keys(month.readings).filter(day => progress[`${monthId}-${day}`]).length;
    return Math.round((read / total) * 100);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-4 md:py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">Plano de Leitura</h1>
              <p className="text-slate-500 text-sm font-medium">Acompanhe sua jornada bíblica</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl">
            <div className="flex-1 md:w-64">
              <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progresso Total</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{progressPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-200">
              <Trophy size={16} className="text-amber-500" />
              <span className="text-sm font-bold text-slate-700">{totalRead}/{totalPossible}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 pt-6 flex-1">
        {/* Mobile Stats Bar */}
        <div className="flex sm:hidden items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
           <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Lidos</span>
              <span className="text-lg font-bold text-slate-800">{totalRead} cap.</span>
           </div>
           <div className="h-8 w-[1px] bg-slate-100"></div>
           <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Restantes</span>
              <span className="text-lg font-bold text-slate-800">{totalPossible - totalRead}</span>
           </div>
           <button 
             onClick={resetProgress}
             className="p-2 text-slate-400 hover:text-red-500 transition-colors"
           >
             <RotateCcw size={20} />
           </button>
        </div>

        {/* Month Selector Desktop */}
        <div className="hidden md:flex flex-wrap gap-2 mb-8">
          {MONTHS_CONFIG.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setActiveTab(idx)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                activeTab === idx 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <div className="flex flex-col items-start">
                <span>{m.name}</span>
                <span className={`text-[10px] opacity-70`}>{getMonthProgress(m.id)}%</span>
              </div>
            </button>
          ))}
          <button 
            onClick={resetProgress}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Resetar
          </button>
        </div>

        {/* Mobile Month Navigation */}
        <div className="flex md:hidden items-center justify-between mb-4 px-2">
           <button 
             onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
             disabled={activeTab === 0}
             className="p-2 rounded-full bg-white border border-slate-200 disabled:opacity-30"
           >
             <ChevronLeft size={20} />
           </button>
           <div className="text-center">
             <h2 className="text-lg font-bold text-slate-800">{currentMonthData.name}</h2>
             <span className="text-xs font-bold text-emerald-500">{getMonthProgress(currentMonthData.id)}% Concluído</span>
           </div>
           <button 
             onClick={() => setActiveTab(prev => Math.min(MONTHS_CONFIG.length - 1, prev + 1))}
             disabled={activeTab === MONTHS_CONFIG.length - 1}
             className="p-2 rounded-full bg-white border border-slate-200 disabled:opacity-30"
           >
             <ChevronRight size={20} />
           </button>
        </div>

        {/* Reading Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Object.entries(currentMonthData.readings).map(([dayStr, passage]) => {
            const dayNum = parseInt(dayStr);
            const isRead = !!progress[`${currentMonthData.id}-${dayNum}`];
            
            return (
              <button
                key={dayNum}
                onClick={() => toggleReading(currentMonthData.id, dayNum)}
                className={`group flex items-center p-3 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden ${
                  isRead 
                  ? 'bg-emerald-50 border-emerald-100 ring-1 ring-emerald-500/20' 
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className={`mr-4 flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-colors ${
                  isRead ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {dayNum}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate transition-colors ${
                    isRead ? 'text-emerald-800' : 'text-slate-700'
                  }`}>
                    {passage}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {currentMonthData.name}
                  </p>
                </div>

                <div className={`flex-shrink-0 ml-2 transition-all duration-300 ${
                  isRead ? 'text-emerald-500 scale-110' : 'text-slate-300 group-hover:text-slate-400'
                }`}>
                  {isRead ? <CheckCircle2 size={24} fill="currentColor" className="text-white bg-emerald-500 rounded-full" /> : <Circle size={24} />}
                </div>

                {isRead && (
                  <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rotate-45 translate-x-4 -translate-y-4"></div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* Footer Mobile Navigation (Persistent CTA) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Progresso Total</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-emerald-600">{progressPercentage}%</span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-2">
             <Calendar size={16} className="text-slate-400" />
             <span className="text-xs font-bold text-slate-600">{currentMonthData.name}</span>
          </div>
        </div>
      </nav>
    </div>
  );
}
