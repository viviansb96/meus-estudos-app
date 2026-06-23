"use client";

import { useState, useEffect, useRef } from 'react';
import { Clock, BookOpen, Flame, Play, Pause, RotateCcw, ChevronDown, CheckCircle2, Check, Timer, ArrowUpRight, Award, AlertTriangle, Edit2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, BarChart, Calendar } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTask, setActiveTask] = useState('Selecione uma tarefa...');
  const [taskOptions, setTaskOptions] = useState<string[]>([]);
  
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [customPomodoroMinutes, setCustomPomodoroMinutes] = useState(25);
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  // Novos Estados para o Backend
  const [activeCerts, setActiveCerts] = useState<any[]>([]);
  const [studySessions, setStudySessions] = useState<any[]>([]);

  // Função central para puxar todos os dados
  const fetchDashboardData = async () => {
    try {
      const resContents = await fetch('/api/contents');
      if (resContents.ok) {
        const dataContents = await resContents.json();
        if (dataContents.contents) {
          const inProgress = dataContents.contents.filter((c: any) => c.status === 'Em Andamento');
          setActiveCerts(inProgress);
          setTaskOptions(inProgress.map((c: any) => c.name));
          if (inProgress.length > 0 && activeTask === 'Selecione uma tarefa...') setActiveTask(inProgress[0].name);
        }
      }

      const resSessions = await fetch('/api/sessions');
      if (resSessions.ok) {
        const dataSessions = await resSessions.json();
        if (dataSessions.sessions) setStudySessions(dataSessions.sessions);
      } else {
        // Se o backend falhar, captura o texto do erro em vez de quebrar em JSON
        const errorText = await resSessions.text();
        console.error("Erro retornado pelo servidor (/api/sessions):", errorText);
      }
    } catch (error) { 
      console.error("Erro na requisição do Dashboard:", error); 
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  // --- LÓGICA DE NAVEGAÇÃO DE TEMPO ---
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const prevMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  
  const firstDayOfMonthRaw = new Date(year, month, 1).getDay();
  const startDayIndex = firstDayOfMonthRaw === 0 ? 6 : firstDayOfMonthRaw - 1; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from({ length: startDayIndex }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevWeek = () => setWeekOffset(prev => prev - 1);
  const nextWeek = () => setWeekOffset(prev => prev + 1);
  const getWeekDays = (offset: number) => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1) + (offset * 7);
    const week = [];
    for (let i = 0; i < 7; i++) week.push(new Date(curr.setDate(first + i)));
    return week;
  };
  const weekDays = getWeekDays(weekOffset);
  const weekLabel = `Semana de ${weekDays[0].getDate()}/${weekDays[0].getMonth() + 1} a ${weekDays[6].getDate()}/${weekDays[6].getMonth() + 1}`;

  // --- LÓGICA DE CÁLCULO DE DADOS REAIS ---
  // Fixa o fuso horário para bater com o Brasil
  const getLocalDateStr = (d: Date | string) => new Date(d).toLocaleDateString('en-CA');
  const todayStr = new Date().toLocaleDateString('en-CA');

// 1. Estudos de Hoje
  const todaySecs = studySessions
    .filter((s: any) => getLocalDateStr(s.createdAt) === todayStr)
    .reduce((acc, curr) => acc + curr.durationInSeconds, 0);
  const todayHours = Math.floor(todaySecs / 3600);
  const todayMinutes = Math.floor((todaySecs % 3600) / 60);

  // 2. Estudos da Semana
  const weekDStrs = new Set(weekDays.map(d => getLocalDateStr(d)));
  const weekSecs = studySessions
    .filter((s: any) => weekDStrs.has(getLocalDateStr(s.createdAt)))
    .reduce((acc, curr) => acc + curr.durationInSeconds, 0);
  const weekHours = Math.floor(weekSecs / 3600);
  const weekMinutes = Math.floor((weekSecs % 3600) / 60);

  // 3. Estudos do Mês
  const monthSecs = studySessions
    .filter((s: any) => {
      const d = new Date(s.createdAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .reduce((acc, curr) => acc + curr.durationInSeconds, 0);
  const monthHours = Math.floor(monthSecs / 3600);
  const monthMinutes = Math.floor((monthSecs % 3600) / 60);

  

  // 2. Ofensiva Atual (Dias Consecutivos)
  const uniqueDates = new Set(studySessions.map((s: any) => getLocalDateStr(s.createdAt)));
  let currentStreak = 0;
  let checkDate = new Date();
  while(true) {
    const dStr = checkDate.toLocaleDateString('en-CA');
    if (uniqueDates.has(dStr)) { currentStreak++; checkDate.setDate(checkDate.getDate() - 1); } 
    else if (dStr === todayStr) { checkDate.setDate(checkDate.getDate() - 1); } 
    else { break; }
  }

  // 3. Gráfico da Semana
  const weeklyData = weekDays.map(dateObj => {
    const targetDStr = dateObj.toLocaleDateString('en-CA');
    const secs = studySessions
      .filter((s:any) => getLocalDateStr(s.createdAt) === targetDStr)
      .reduce((acc, curr) => acc + curr.durationInSeconds, 0);
    return Number((secs / 3600).toFixed(1));
  });

  // 4. Calendário do Mês (Dias Ativos)
  const activeDaysInMonth = new Set(
    studySessions
      .filter((s: any) => {
        const d = new Date(s.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((s: any) => new Date(s.createdAt).getDate())
  );

// --- CONTROLE DO CRONÔMETRO ---
  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Erro de áudio:", e));
      setTimeout(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      }, 3000);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTime((prev) => {
          if (timerMode === 'pomodoro') { if (prev <= 1) { setIsActive(false); playSound(); return 0; } return prev - 1; } 
          else { return prev + 1; }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timerMode]);

  const toggleTimer = () => {
    // Truque para desbloquear o áudio no celular:
    // Toca e pausa no exato momento que o usuário clica em "Iniciar"
    if (!isActive && audioRef.current) {
      audioRef.current.play().then(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      }).catch(() => {});
    }
    setIsActive(!isActive);
  };
  
  const resetTimer = () => { setIsActive(false); setTime(timerMode === 'pomodoro' ? customPomodoroMinutes * 60 : 0); };
  const changeMode = (mode: 'pomodoro' | 'stopwatch') => { setTimerMode(mode); setIsActive(false); setTime(mode === 'pomodoro' ? customPomodoroMinutes * 60 : 0); };
  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };

  const saveSession = async () => {
    const timeSpent = timerMode === 'pomodoro' ? (customPomodoroMinutes * 60) - time : time;
    if (timeSpent <= 0) return;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName: activeTask, durationInSeconds: timeSpent })
      });
      // Atualiza os gráficos na mesma hora após salvar!
      if (res.ok) { alert('Sessão salva!'); resetTimer(); fetchDashboardData(); } 
    } catch (error) { console.error(error); }
  };

  // --- CONFIGURAÇÃO DO GRÁFICO (Injetando dados reais) ---
  const chartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [{
      fill: true, label: 'Horas',
      data: weeklyData, // <--- Dados reais conectados
      borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4,
    }]
  };
  const chartOptions = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: true, grid: { color: '#1b362c' }, ticks: { color: '#94a3b8' } }, y: { display: true, beginAtZero: true, grid: { color: '#1b362c' }, ticks: { color: '#94a3b8', stepSize: 1 } } } };

return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ELEMENTO DE ÁUDIO INVISÍVEL */}
      <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg" preload="auto" />

      {/* COLUNA ESQUERDA - Timer e Atividade Rápida */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* TIMER */}
        <section className="bg-[#11241d] border border-[#1b362c] rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
            <div className="flex gap-4 bg-[#0b1713] p-1.5 rounded-xl border border-[#1b362c]">
              <button onClick={() => changeMode('pomodoro')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${timerMode === 'pomodoro' ? 'bg-[#1b362c] text-emerald-400' : 'text-slate-400'}`}><Timer size={16} /> Regressivo</button>
              <button onClick={() => changeMode('stopwatch')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${timerMode === 'stopwatch' ? 'bg-[#1b362c] text-emerald-400' : 'text-slate-400'}`}><ArrowUpRight size={16} /> Livre</button>
            </div>
            
            <div className="relative w-full md:w-72 z-20">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center justify-between w-full bg-[#0b1713] border border-[#1b362c] px-4 py-3 rounded-xl">
                <div className="flex items-center gap-3"><BookOpen size={18} className="text-emerald-500" /><span className="text-sm font-medium text-slate-200">{activeTask}</span></div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMenuOpen && (
                <div className="absolute top-full mt-2 w-full bg-[#0b1713] border border-[#1b362c] rounded-xl shadow-2xl overflow-hidden">
                  {taskOptions.map((t) => (
                    <button key={t} onClick={() => { setActiveTask(t); setIsMenuOpen(false); }} className="flex justify-between w-full px-4 py-3 text-sm text-left hover:bg-[#162c23] border-b border-[#1b362c] text-slate-300">
                      {t} {activeTask === t && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            
            {/* RELÓGIO GIGANTE COM CONTROLES INTEGRADOS */}
            <div className="flex items-center justify-center gap-4 md:gap-8 mb-6 min-h-[120px] md:min-h-[160px]">
              
              {timerMode === 'pomodoro' && !isActive && (
                <button 
                  type="button"
                  // Substitua o onClick antigo por este:
                  onClick={() => { const m = Math.max(1, Math.floor((customPomodoroMinutes - 1) / 5) * 5); setCustomPomodoroMinutes(m); setTime(m * 60); }} 
                  className="text-slate-500 hover:text-emerald-400 bg-[#0b1713] border border-[#1b362c] hover:border-emerald-500/50 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl text-3xl font-light transition-all animate-in zoom-in-95 duration-200"
                  title="Menos 5 minutos"
                >
                  -
                </button>
              )}

              <div className="text-7xl md:text-9xl font-mono font-bold tracking-widest text-white tabular-nums">
                {formatTime(time)}
              </div>

              {timerMode === 'pomodoro' && !isActive && (
                <button 
                  type="button"
                  // Substitua o onClick antigo por este:
                  onClick={() => { const m = Math.ceil((customPomodoroMinutes + 1) / 5) * 5; setCustomPomodoroMinutes(m); setTime(m * 60); }}
                  className="text-slate-500 hover:text-emerald-400 bg-[#0b1713] border border-[#1b362c] hover:border-emerald-500/50 w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl text-3xl font-light transition-all animate-in zoom-in-95 duration-200"
                  title="Mais 5 minutos"
                >
                  +
                </button>
              )}

            </div>

            

            {/* BOTÕES DE CONTROLE RESTAURADOS E FECHADOS CORRETAMENTE */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={toggleTimer} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0b1713] font-bold text-lg px-8 py-3 rounded-xl transition-all">
                {isActive ? 'Pausar' : 'Iniciar'}
              </button>
              <button onClick={resetTimer} className="flex items-center gap-2 bg-[#1b362c] hover:bg-[#234539] text-slate-300 font-medium px-6 py-3 rounded-xl border border-[#2a5042] transition-all">
                Zerar
              </button>
              {((timerMode === 'pomodoro' && time < customPomodoroMinutes * 60) || (timerMode === 'stopwatch' && time > 0)) && (
                <button onClick={saveSession} className="flex items-center gap-2 bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-400 font-medium px-6 py-3 rounded-xl border border-emerald-800 transition-all">
                  Salvar Sessão
                </button>
              )}
            </div>

          </div>
        </section>

        {/* ESTATÍSTICAS RÁPIDAS */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-[#11241d] border border-[#1b362c] rounded-2xl p-5 flex items-center justify-between">
            <div><p className="text-xs text-slate-400">Ofensiva Atual</p><p className="text-2xl font-bold text-white">{currentStreak} Dias</p></div>
            <Flame size={28} className={currentStreak > 0 ? "text-orange-500 animate-pulse" : "text-slate-600"} />
          </div>
          <div className="bg-[#11241d] border border-[#1b362c] rounded-2xl p-5 flex items-center justify-between">
            <div><p className="text-xs text-slate-400">Estudo Hoje</p><p className="text-2xl font-bold text-white">{todayHours}h {todayMinutes}m</p></div>
            <Clock size={28} className={todaySecs > 0 ? "text-emerald-500" : "text-slate-600"} />
          </div>
        </section>

        {/* CERTIFICAÇÕES EM ANDAMENTO */}
        <section className="bg-[#11241d] border border-[#1b362c] rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-emerald-400 flex items-center gap-2 mb-6"><Award size={20} /> Em Andamento</h3>
          <div className="space-y-4">
            {activeCerts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum estudo em andamento no momento.</p>
            ) : (
              activeCerts.map((cert) => (
                <div key={cert._id} className="flex flex-col md:flex-row md:items-center justify-between bg-[#0b1713] p-4 rounded-xl border border-[#1b362c] hover:border-emerald-500/40 transition-all gap-4 shadow-sm">
                  <div className="flex-1">
                    {/* NOME LIMPO: Apenas o nome da certificação */}
                    <span className="font-semibold text-slate-100 text-lg">{cert.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    
                    {/* CAMPO DE PRAZO HARMONIZADO */}
                    <div className="flex items-center gap-2 bg-[#11241d] px-3 py-2 rounded-lg border border-[#1b362c] hover:border-emerald-500/50 transition-colors group">
                      <Calendar size={14} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Prazo:</span>
                      <input 
                        type="date" 
                        value={cert.endDate ? new Date(cert.endDate).toISOString().split('T')[0] : ''} 
                        onChange={async (e) => {
                          try {
                            await fetch('/api/contents', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: cert._id, endDate: e.target.value })
                            });
                            fetchDashboardData(); 
                          } catch(err) { console.error(err); }
                        }}
                        className="bg-transparent text-sm text-slate-200 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert-[0.8]"
                      />
                    </div>

                    <div className="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20">
                      Estudando
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>


      </div>

     {/* COLUNA DIREITA - Gráficos e Calendário Navegáveis */}
      <div className="space-y-6">
        
        {/* GRÁFICO DA SEMANA */}
        <section className="bg-[#11241d] border border-[#1b362c] rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
            
            {/* Título isolado à esquerda - Um pouco menor (text-base) */}
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <BarChart size={18} className="text-emerald-500" /> Horas de Estudo na Semana
            </h3>
            
            {/* Controles em Pílula à direita */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#0b1713] border border-[#1b362c] px-4 py-1.5 rounded-full text-sm font-bold text-emerald-400 shadow-sm">
                Total: {weekHours}h {weekMinutes}m
              </div>
              
              <div className="flex items-center bg-[#0b1713] border border-[#1b362c] rounded-full px-2 py-1 shadow-sm">
                <button onClick={prevWeek} className="p-1.5 hover:bg-[#162c23] rounded-full transition-colors">
                  <ChevronLeft size={16} className="text-slate-400" />
                </button>
                <span className="text-xs font-bold text-slate-300 w-32 text-center truncate">
                  {weekLabel}
                </span>
                <button onClick={nextWeek} className="p-1.5 hover:bg-[#162c23] rounded-full transition-colors">
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
            
          </div>
          
          <div className="h-40">
            <Line data={chartData} options={chartOptions} />
          </div>
        </section>

        {/* CALENDÁRIO MENSAL */}
        <section className="bg-[#11241d] border border-[#1b362c] rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
            
            {/* Título isolado à esquerda - Um pouco menor (text-base) */}
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar size={18} className="text-emerald-500" /> Atividade do Mês
            </h3>
            
            {/* Controles em Pílula à direita */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-[#0b1713] border border-[#1b362c] px-4 py-1.5 rounded-full text-sm font-bold text-emerald-400 shadow-sm">
                Total: {monthHours}h {monthMinutes}m
              </div>
              
              <div className="flex items-center bg-[#0b1713] border border-[#1b362c] rounded-full px-2 py-1 shadow-sm">
                <button onClick={prevMonth} className="p-1.5 hover:bg-[#162c23] rounded-full transition-colors">
                  <ChevronLeft size={16} className="text-slate-400" />
                </button>
                <span className="text-xs font-bold text-slate-300 min-w-[100px] text-center">
                  {monthNames[month]} {year}
                </span>
                <button onClick={nextMonth} className="p-1.5 hover:bg-[#162c23] rounded-full transition-colors">
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </div>
            </div>
            
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['S','T','Q','Q','S','S','D'].map((d, index) => <div key={`header-day-${index}`} className="text-center text-xs text-slate-600 font-bold mb-2">{d}</div>)}
            
            {/* Dias em branco no começo do mês */}
            {blanks.map(b => <div key={`blank-${b}`} className="aspect-square" />)}
            
            {/* Dias reais do mês */}
            {days.map(day => (
              <div 
                key={day} 
                className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-default transition-all ${
                  activeDaysInMonth.has(day)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                    : 'bg-[#0b1713] text-slate-500 border border-[#1b362c] hover:bg-[#162c23]'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}