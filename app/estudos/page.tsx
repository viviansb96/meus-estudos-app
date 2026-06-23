"use client";

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, X, Edit2, Trash2, Loader2, ChevronDown, AlertTriangle } from 'lucide-react';


export default function EstudosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [estudos, setEstudos] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Estados do Formulário Principal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false); // <--- ADICIONE ESTA LINHA
  const [status, setStatus] = useState('Em Andamento');
  const [investment, setInvestment] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [certificationDate, setCertificationDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Estado do Popup de Adicionar Horas
  const [addHoursPopup, setAddHoursPopup] = useState<{ isOpen: boolean; estudo: any; hours: string }>({ isOpen: false, estudo: null, hours: '' });

  const fetchEstudos = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch('/api/contents');
      const data = await res.json();
      if (data.contents) {
        // Ordena os registros dando prioridade ao status
        const sortedContents = data.contents.sort((a: any, b: any) => {
          // Define os "pesos": Em Andamento (1) sobe, Concluída (3) desce.
          const getPriority = (status: string) => {
            if (status === 'Em Andamento') return 1;
            if (status === 'Pausada') return 2;
            if (status === 'Concluída') return 3;
            return 4; // Prevenção para status vazios ou antigos
          };
          
          return getPriority(a.status) - getPriority(b.status);
        });
        
        setEstudos(sortedContents);
      }
    } catch (error) { console.error("Erro:", error); } 
    finally { setIsLoadingData(false); }
  };

  useEffect(() => { fetchEstudos(); }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const getExpirationAlert = (dateString: string) => {
    if (!dateString) return null;
    
    const today = new Date();
    const expDate = new Date(dateString);
    
    // Calcula a diferença em dias
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-red-500 font-bold flex items-center gap-1 text-[11px] mt-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 w-fit animate-pulse">
          <AlertTriangle size={12} /> EXPIRADA
        </span>
      );
    } else if (diffDays <= 90) { // 90 dias = 3 meses de antecedência
      return (
        <span className="text-orange-500 font-bold flex items-center gap-1 text-[11px] mt-1 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 w-fit">
          <AlertTriangle size={12} /> EXPIRA EM BREVE
        </span>
      );
    }
    return null;
  };

  const handleEdit = (estudo: any) => {
    setEditingId(estudo._id); setName(estudo.name); setCategoryName(estudo.categoryId?.name || '');
    setStatus(estudo.status || 'Em Andamento'); setInvestment(estudo.investment || ''); setManualHours(estudo.manualHours || '');
    setStartDate(estudo.startDate ? estudo.startDate.split('T')[0] : ''); setEndDate(estudo.endDate ? estudo.endDate.split('T')[0] : '');
    setCertificationDate(estudo.certificationDate ? estudo.certificationDate.split('T')[0] : ''); setExpirationDate(estudo.expirationDate ? estudo.expirationDate.split('T')[0] : '');
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setCategoryName(''); setStatus('Em Andamento'); setInvestment(''); setManualHours('');
    setStartDate(''); setEndDate(''); setCertificationDate(''); setExpirationDate(''); setIsFormOpen(false);
    setIsCategoryMenuOpen(false); // <--- ADICIONE ESTA LINHA DENTRO DO RESETFORM
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("O nome é obrigatório.");
    setIsSaving(true);

    const bodyData = {
      id: editingId, name, categoryName, status, investment, manualHours,
      startDate, endDate, certificationDate, expirationDate
    };

    try {
      const res = await fetch('/api/contents', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) { resetForm(); fetchEstudos(); } else { alert('Erro ao salvar.'); }
    } catch (error) { console.error(error); } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    try {
      const res = await fetch(`/api/contents?id=${id}`, { method: 'DELETE' });
      if (res.ok) { fetchEstudos(); } else { alert('Erro ao excluir.'); }
    } catch (error) { console.error(error); }
  };

  const handleAddHoursSubmit = async () => {
    const hoursToAdd = Number(addHoursPopup.hours);
    if (!addHoursPopup.estudo || hoursToAdd <= 0) return;

    setIsSaving(true);
    const currentTotal = addHoursPopup.estudo.manualHours || 0;
    const newTotal = currentTotal + hoursToAdd;

    const bodyData = {
      id: addHoursPopup.estudo._id, name: addHoursPopup.estudo.name, categoryName: addHoursPopup.estudo.categoryId?.name || '',
      status: addHoursPopup.estudo.status, investment: addHoursPopup.estudo.investment, manualHours: newTotal,
      startDate: addHoursPopup.estudo.startDate, endDate: addHoursPopup.estudo.endDate, 
      certificationDate: addHoursPopup.estudo.certificationDate, expirationDate: addHoursPopup.estudo.expirationDate
    };

    try {
      const res = await fetch('/api/contents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) { setAddHoursPopup({ isOpen: false, estudo: null, hours: '' }); fetchEstudos(); }
    } catch (error) { console.error(error); } finally { setIsSaving(false); }
  };

  // Função para atalho rápido no popup
  const addQuickHours = (amount: number) => {
    setAddHoursPopup(prev => ({ ...prev, hours: String(Number(prev.hours || 0) + amount) }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-emerald-400">Estudos & Certificações</h1>
        {!isFormOpen ? (
          <button onClick={() => { resetForm(); setIsFormOpen(true); }} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0b1713] font-bold px-4 py-2 rounded-lg">
            <Plus size={20} /> Novo Registro
          </button>
        ) : (
          <button onClick={resetForm} className="flex items-center gap-2 bg-[#1b362c] text-slate-300 px-4 py-2 rounded-lg border border-[#2a5042]">
            <X size={20} /> Cancelar
          </button>
        )}
      </div>

      {/* NOVO POPUP DE ADICIONAR HORAS */}
      {addHoursPopup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#11241d] border border-[#1b362c] p-6 rounded-2xl w-full max-w-[320px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Linha decorativa no topo */}
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
            
            <h3 className="text-xl font-bold text-white mb-1">Adicionar Horas</h3>
            <p className="text-sm text-slate-400 mb-5">Em <strong className="text-emerald-400 block truncate">{addHoursPopup.estudo?.name}</strong></p>
            
            {/* Botões de Atalho Alinhados */}
            <div className="grid grid-cols-3 gap-2 mb-5">
               <button onClick={() => addQuickHours(1)} className="bg-[#0b1713] border border-[#1b362c] hover:border-emerald-500/50 text-emerald-400 py-2 rounded-xl text-sm font-bold transition-colors">+ 1h</button>
               <button onClick={() => addQuickHours(2)} className="bg-[#0b1713] border border-[#1b362c] hover:border-emerald-500/50 text-emerald-400 py-2 rounded-xl text-sm font-bold transition-colors">+ 2h</button>
               <button onClick={() => addQuickHours(5)} className="bg-[#0b1713] border border-[#1b362c] hover:border-emerald-500/50 text-emerald-400 py-2 rounded-xl text-sm font-bold transition-colors">+ 5h</button>
            </div>

            {/* Input de horas corrigido com Flexbox para não cortar texto */}
            <div className="flex items-center gap-3 mb-6 bg-[#0b1713] border border-[#1b362c] rounded-xl px-4 py-3 focus-within:border-emerald-500 transition-colors">
               <input 
                 type="number" 
                 value={addHoursPopup.hours} 
                 onChange={(e) => setAddHoursPopup({...addHoursPopup, hours: e.target.value})} 
                 className="w-full bg-transparent text-white text-center text-3xl font-bold outline-none" 
                 placeholder="0" 
                 autoFocus
               />
               <span className="text-slate-500 font-bold text-xl">h</span>
            </div>

            <div className="flex justify-between gap-3">
              <button onClick={() => setAddHoursPopup({ isOpen: false, estudo: null, hours: '' })} className="flex-1 py-2.5 text-slate-400 hover:text-white hover:bg-[#1b362c] rounded-xl transition-colors font-medium text-sm">Cancelar</button>
              <button onClick={handleAddHoursSubmit} disabled={isSaving} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#0b1713] font-bold py-2.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] text-sm">
                {isSaving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA PRINCIPAL: Formulário ou Tabela */}
      {isFormOpen ? (
        <section className="bg-[#11241d] border border-[#1b362c] rounded-2xl p-6 shadow-lg max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2"><BookOpen size={20} className="text-emerald-500" /> {editingId ? 'Editar Registro' : 'Novo Registro'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Nome da Certificação/Estudo</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#0b1713] border border-[#1b362c] rounded-lg px-4 py-2 text-slate-200 outline-none" required />
            </div>
            
            {/* SELEÇÃO DE CATEGORIA ESTILO DROP-DOWN CUSTOMIZADO */}
            <div className="space-y-1 relative">
              <label className="text-xs text-slate-400">Categoria</label>
              <button 
                type="button"
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)} 
                className="flex items-center justify-between w-full bg-[#0b1713] border border-[#1b362c] px-4 py-2 rounded-lg text-slate-200 outline-none focus:border-emerald-500"
              >
                <span className="text-sm text-slate-300">{categoryName || 'Selecione uma categoria...'}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#0b1713] border border-[#1b362c] rounded-lg shadow-2xl overflow-hidden z-30 max-h-48 overflow-y-auto">
                  {['Certificação de Ferramenta', 'Certificação Geral', 'Tecnologia da Informação', 'Linguagem', 'Outros'].map((cat) => (
                    <button 
                      key={cat} 
                      type="button" 
                      onClick={() => { setCategoryName(cat); setIsCategoryMenuOpen(false); }} 
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-[#162c23] border-b border-[#1b362c]/30 text-slate-300 transition-colors last:border-b-0"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[#0b1713] border border-[#1b362c] rounded-lg px-4 py-2 text-slate-200 outline-none">
                <option value="Em Andamento">Em Andamento</option><option value="Concluída">Concluída</option><option value="Pausada">Pausada</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Horas Iniciais Totais (Manual)</label>
              <input type="number" value={manualHours} onChange={(e) => setManualHours(e.target.value)} className="w-full bg-[#0b1713] border border-[#1b362c] rounded-lg px-4 py-2 text-slate-200 outline-none" placeholder="Horas" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Data de Início</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-[#0b1713] border border-[#1b362c] rounded-lg px-4 py-2 text-slate-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Data Final (Estudos)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-[#0b1713] border border-[#1b362c] rounded-lg px-4 py-2 text-slate-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Data da Certificação</label>
              <input type="date" value={certificationDate} onChange={(e) => setCertificationDate(e.target.value)} className="w-full bg-[#0b1713] border border-[#1b362c] rounded-lg px-4 py-2 text-slate-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Data de Expiração</label>
              <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="w-full bg-[#0b1713] border border-[#1b362c] rounded-lg px-4 py-2 text-slate-400" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-slate-400">Investimento Total (R$)</label>
              <input type="number" value={investment} onChange={(e) => setInvestment(e.target.value)} className="w-full md:w-1/2 bg-[#0b1713] border border-[#1b362c] rounded-lg px-4 py-2 text-slate-200 outline-none" placeholder="R$" />
            </div>
            <div className="md:col-span-2 flex justify-end mt-4">
              <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-[#1b362c] hover:bg-[#234539] text-emerald-400 font-medium px-6 py-2 rounded-lg transition-all border border-[#2a5042]">
                <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="bg-[#11241d] border border-[#1b362c] rounded-2xl shadow-lg overflow-hidden">
          {isLoadingData ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
          ) : estudos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Nenhum estudo cadastrado. Clique em "Novo Registro".</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#0b1713] border-b border-[#1b362c] text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nome & Categoria</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Início - Fim</th>
                    <th className="px-6 py-4">Certificação / Expira</th>
                    <th className="px-6 py-4 text-center">Gasto</th>
                    <th className="px-6 py-4 text-center">Horas</th>
                    {/* ALINHAMENTO CORRIGIDO AQUI */}
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b362c]">
                  {estudos.map((estudo) => (
                    <tr key={estudo._id} className="hover:bg-[#162c23] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-200 text-base">{estudo.name}</p>
                        <p className="text-xs text-emerald-500/80 mt-0.5">{estudo.categoryId?.name || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${estudo.status === 'Concluída' ? 'text-blue-400 bg-blue-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                          {estudo.status || 'Em andamento'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-400"><span className="text-slate-500 text-xs">Início: </span>{formatDate(estudo.startDate)}</div>
                        <div className="text-slate-400 mt-1"><span className="text-slate-500 text-xs">Fim: </span>{formatDate(estudo.endDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-400"><span className="text-slate-500 text-xs">Cert.: </span>{formatDate(estudo.certificationDate)}</div>
                        <div className="text-slate-400 mt-1"><span className="text-slate-500 text-xs">Exp.: </span>{formatDate(estudo.expirationDate)}</div>
                        {/* Renderiza o alerta visual de vencimento embaixo da data */}
                        {getExpirationAlert(estudo.expirationDate)}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">
                        {estudo.investment ? `R$ ${estudo.investment}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {(() => {
                          const totalHoursDecimal = estudo.manualHours || 0;
                          const hrs = Math.floor(totalHoursDecimal);
                          const mins = Math.round((totalHoursDecimal - hrs) * 60);
                          
                          return (
                            <span className="bg-[#0b1713] px-3 py-1.5 rounded-lg border border-[#1b362c] text-emerald-400 font-bold text-sm inline-flex items-center gap-1">
                              {hrs}h {mins > 0 ? `${mins}m` : '00m'}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {/* ALINHAMENTO CORRIGIDO AQUI (justify-center) */}
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setAddHoursPopup({ isOpen: true, estudo, hours: '' })} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-[#0b1713] p-2 rounded-lg transition-colors" title="Adicionar Horas">
                            <Plus size={16} />
                          </button>
                          <button onClick={() => handleEdit(estudo)} className="text-slate-400 hover:text-emerald-400 bg-[#0b1713] p-2 rounded-lg border border-[#1b362c] transition-colors" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(estudo._id)} className="text-slate-400 hover:text-red-400 bg-[#0b1713] p-2 rounded-lg border border-[#1b362c] transition-colors" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}