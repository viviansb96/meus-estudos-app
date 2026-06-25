"use client";

import { useState, useEffect } from 'react';
import { Trophy, Medal, Calendar, Shield, Clock, Award, ChevronRight, Zap, RefreshCw, Flame } from 'lucide-react'; // <-- Flame adicionado aqui

interface RankUser {
  rank: number;
  name: string;
  hours: number;
  streak?: number;
  imageUrl?: string; // NOVO: Campo da foto do perfil!
  isWinner?: boolean;
}

export default function RankingPage() {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<RankUser[]>([]);
  const [lastFortnightReport, setLastFortnightReport] = useState<{ label: string; winner: string; standings: RankUser[] } | null>(null);
  const [fortnightInfo, setFortnightInfo] = useState({ label: '1ª Quinzena de Junho', daysLeft: 5 });

  const fetchRankingData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ranking');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setLastFortnightReport(data.lastFortnightReport || null);
        setFortnightInfo(data.fortnightInfo || { label: 'Quinzena Atual', daysLeft: 0 });
      }
    } catch (err) {
      console.error("Erro ao buscar dados do ranking:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="text-emerald-400 animate-spin" size={32} />
        <p className="text-slate-400 text-sm">Computando horas da liga...</p>
      </div>
    );
  }

  // Separa o Top 3 para criar o pódio visual estilo jogo
  const topThree = leaderboard.slice(0, 3);
  const runningList = leaderboard.slice(3);

  return (
    // Transformamos em flex-col com gap-10 (Força o distanciamento da seta vermelha)
    <div className="max-w-6xl mx-auto flex flex-col gap-10 animate-in fade-in duration-300">
      
      {/* TÍTULO E PLACAR DA QUINZENA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#11241d] border border-[#1b362c] p-6 rounded-2xl shadow-lg shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-emerald-400" /> Liga dos Especialistas
          </h2>
          <p className="text-slate-400 text-sm mt-1">Sua dose diária de foco em Cybersecurity & Networks</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#0b1713] border border-[#1b362c] px-4 py-2.5 rounded-xl">
          <Calendar className="text-emerald-400" size={20} />
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{fortnightInfo.label}</p>
            <p className="text-sm font-semibold text-slate-200">Termina em {fortnightInfo.daysLeft} dias</p>
          </div>
        </div>
      </div>

      {/* QUADROS INFERIORES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUNA ESQUERDA/CENTRO: LIGA ATUAL */}
        <div className="lg:col-span-2">
          {/* Adicionado rounded-2xl para arredondar a borda do quadro de Classificação */}
          <section className="bg-[#11241d] border border-[#1b362c] rounded-2xl p-6 sm:p-10 shadow-lg">
            <h3 className="text-xl font-bold text-emerald-400 mb-8 flex items-center gap-2">
              <Zap size={22} /> Classificação em Tempo Real
            </h3>

            {/* LISTA CORRIDA (Aumentamos o espaço entre eles com space-y-6) */}
            <div className="space-y-6">
              {leaderboard.length === 0 ? (
                <p className="text-slate-500 text-center text-base py-8">Ainda sem dados registrados nesta quinzena.</p>
              ) : (
                leaderboard.map((user, idx) => {
                  const userStreak = user.streak ?? 0;
                  
                  return (
                    <div 
                      key={user.name + idx} 
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                        idx === 0 
                          ? 'bg-yellow-500/5 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]' 
                          : idx === 1
                          ? 'bg-slate-400/5 border-slate-400/20'
                          : idx === 2
                          ? 'bg-amber-700/5 border-amber-700/20'
                          : 'bg-[#0b1713] border-[#1b362c] hover:border-emerald-500/30'
                      }`}
                    >
                      {/* Lado Esquerdo: Posição, Avatar, Nome e Troféu */}
                      <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                        <span className={`w-6 sm:w-8 text-center font-mono text-lg sm:text-xl font-black shrink-0 ${
                          idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>

                        {/* FOTO DO PERFIL (AVATAR) - TAMANHO TRAVADO COM STYLE */}
                        {user.imageUrl ? (
                          <img 
                            src={user.imageUrl} 
                            alt={user.name} 
                            className="rounded-full border-2 border-[#1b362c] object-cover shrink-0"
                            style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', maxWidth: '40px', maxHeight: '40px' }}
                          />
                        ) : (
                          <div 
                            className="rounded-full bg-[#0b1713] border-2 border-[#1b362c] flex items-center justify-center shrink-0"
                            style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
                          >
                            <span className="text-emerald-400 font-bold text-sm">{user.name.charAt(0)}</span>
                          </div>
                        )}
                        
                        <div className="flex flex-col truncate">
                          <span className="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2 truncate">
                            {user.name}
                            {idx === 0 && <Trophy size={16} className="text-yellow-400 shrink-0" />}
                          </span>
                        </div>
                      </div>

                      {/* Lado Direito: Ofensiva e Horas com largura fixa */}
                      <div className="flex items-center justify-end gap-6 sm:gap-8 shrink-0">
                        
                        {/* Foguinho da Ofensiva */}
                        <div className="hidden sm:flex items-center gap-1.5 w-16 justify-end" title="Dias seguidos de estudo">
                          <Flame size={18} className={userStreak > 0 ? "text-orange-500" : "text-slate-600"} />
                          <span className={`font-bold text-sm ${userStreak > 0 ? "text-orange-400" : "text-slate-600"}`}>
                            {userStreak}
                          </span>
                        </div>

                        {/* Relógio e Horas alinhados à direita */}
                        <div className="flex items-center justify-end gap-2 w-24">
                          <Clock size={16} className="text-slate-500 shrink-0" />
                          <span className="font-black text-emerald-400 text-base sm:text-lg">
                            {user.hours} <span className="text-xs sm:text-sm text-slate-500 font-medium">h</span>
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA: HISTÓRICO / RELATÓRIO DO CAMPEÃO */}
        <div className="space-y-6">
          <section className="bg-[#11241d] border border-[#1b362c] rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
            
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-5 border-b border-[#1b362c] pb-3">
              <Award className="text-yellow-500" size={18} /> Relatório da Quinzena Anterior
            </h3>

            {lastFortnightReport ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-[#0b1713] border border-[#1b362c] p-4 rounded-xl text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{lastFortnightReport.label}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Trophy className="text-yellow-400 fill-yellow-400/10 animate-pulse" size={20} />
                    <h4 className="text-lg font-black text-white">{lastFortnightReport.winner}</h4>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">🏆 Grande Vencedor</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider px-1">Colocação Geral:</p>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#1b362c] [&::-webkit-scrollbar-thumb]:rounded-full">
                    {lastFortnightReport.standings.map((user, idx) => (
                      <div key={'rep-' + idx} className="flex items-center justify-between bg-[#0b1713]/50 px-3 py-2 rounded-lg border border-[#1b362c]/50 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-slate-500 font-bold">{idx + 1}º</span>
                          {idx === 0 && <span className="text-base leading-none">🏆</span>}
                          <span className="text-slate-300 font-medium truncate">{user.name}</span>
                        </div>
                        <span className="text-slate-400 font-bold shrink-0">{user.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-[#0b1713] border border-[#1b362c] rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">🏆</div>
                <p className="text-xs text-slate-500">Nenhum relatório emitido ainda. A liga está na primeira rodada!</p>
              </div>
            )}
          </section>
        </div>

      </div>
    </div>
  );
}