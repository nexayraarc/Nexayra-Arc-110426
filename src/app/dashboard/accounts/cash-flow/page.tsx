"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useRole } from "@/lib/use-role";
import { fmtAED, fmtDate } from "@/lib/format";
import { Plus, TrendingUp, TrendingDown, Wallet } from "lucide-react";

type Bank = { id: string; name: string; openingBalance: number; currentBalance: number };
type Tx = { id: string; bankAccountId: string; amount: number; date: string; type: string; description: string };

export default function CashFlowPage() {
  const { canWrite } = useRole();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBank, setFilterBank] = useState("");

  const [newName, setNewName] = useState(""); const [newOpening, setNewOpening] = useState("");

  const load = async () => {
    try {
      const [b, t] = await Promise.all([
        apiCall<{accounts: Bank[]}>("/api/bank-accounts"),
        apiCall<{transactions: Tx[]}>("/api/bank-transactions?limit=200"),
      ]);
      setBanks(b.accounts); setTxs(t.transactions);
    } finally { setLoading(false); }
  };
  useEffect(()=>{load();},[]);

  const addBank = async () => {
    if (!newName.trim()) return;
    await apiCall("/api/bank-accounts", { method: "POST", body: { name: newName, openingBalance: Number(newOpening||0) }});
    setNewName(""); setNewOpening(""); load();
  };

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  const inp = "w-full px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm";
  const totalCash = banks.reduce((s,b)=>s+b.currentBalance,0);
  const filtered = filterBank ? txs.filter(t => t.bankAccountId === filterBank) : txs;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-navy to-navy-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"/>
        <p className="text-navy-200 text-sm uppercase tracking-wider font-semibold">Total Cash in Hand</p>
        <p className="text-4xl font-bold mt-1">{fmtAED(totalCash)}</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {banks.map(b => (
          <div key={b.id} className="bg-white border border-navy-100 rounded-2xl p-5 hover-lift">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center"><Wallet size={18} className="text-navy"/></div>
              <div><p className="font-bold text-navy">{b.name}</p><p className="text-navy-400 text-xs">Opening: {fmtAED(b.openingBalance)}</p></div>
            </div>
            <p className="text-2xl font-bold text-navy">{fmtAED(b.currentBalance)}</p>
          </div>
        ))}
      </div>

      {canWrite && (
        <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-navy mb-4">Add Bank Account</h2>
          <div className="grid sm:grid-cols-3 gap-2">
            <input placeholder="Account name" value={newName} onChange={e=>setNewName(e.target.value)} className={inp}/>
            <input type="number" placeholder="Opening balance" value={newOpening} onChange={e=>setNewOpening(e.target.value)} className={inp}/>
            <button onClick={addBank} className="px-4 py-2 bg-navy text-white font-semibold rounded-lg text-sm btn-press flex items-center justify-center gap-1"><Plus size={14}/> Add Account</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-navy">Recent Movements</h2>
          <select value={filterBank} onChange={e=>setFilterBank(e.target.value)} className={inp + " w-auto"}>
            <option value="">All accounts</option>{banks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          {filtered.length === 0 ? <p className="text-center py-8 text-navy-300">No movements.</p> :
            filtered.map(t => {
              const bank = banks.find(b=>b.id===t.bankAccountId);
              const Icon = t.amount > 0 ? TrendingUp : TrendingDown;
              const color = t.amount > 0 ? "text-green-600" : "text-red-500";
              return (
                <div key={t.id} className="flex items-center justify-between p-3 bg-navy-50/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={color}/>
                    <div>
                      <p className="text-navy text-sm font-semibold">{t.description}</p>
                      <p className="text-navy-400 text-xs">{fmtDate(t.date)} · {bank?.name} · {t.type}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${color}`}>{t.amount > 0 ? "+" : ""}{fmtAED(t.amount)}</span>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}