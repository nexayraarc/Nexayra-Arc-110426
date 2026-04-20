"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useRole } from "@/lib/use-role";
import { fmtAED, fmtDate } from "@/lib/format";
import { Plus, Trash2, Settings } from "lucide-react";

type Expense = { id: string; date: string; categoryId: string; description: string; amount: number; bankAccountId: string; vendor: string };
type Category = { id: string; name: string; scope: string };
type Bank = { id: string; name: string };

export default function ExpensesPage() {
  const { canWrite } = useRole();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatManager, setShowCatManager] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [vendor, setVendor] = useState("");

  const [newCat, setNewCat] = useState("");

  const load = async () => {
    try {
      const [e, c, b] = await Promise.all([
        apiCall<{expenses: Expense[]}>("/api/expenses"),
        apiCall<{categories: Category[]}>("/api/expense-categories"),
        apiCall<{accounts: Bank[]}>("/api/bank-accounts"),
      ]);
      setExpenses(e.expenses); setCats(c.categories); setBanks(b.accounts);
    } finally { setLoading(false); }
  };
  useEffect(()=>{load();},[]);

  const add = async () => {
    if (!amount || !bankAccountId) return;
    await apiCall("/api/expenses", { method: "POST", body: { date, categoryId, description, amount: Number(amount), bankAccountId, vendor }});
    setAmount(""); setDescription(""); setVendor(""); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete expense? Ledger will be reversed.")) return;
    await apiCall(`/api/expenses?id=${id}`, { method: "DELETE" }); load();
  };

  const addCat = async () => {
    if (!newCat.trim()) return;
    await apiCall("/api/expense-categories", { method: "POST", body: { name: newCat, scope: "general" }});
    setNewCat(""); load();
  };
  const delCat = async (id: string) => {
    if (!confirm("Delete category?")) return;
    await apiCall(`/api/expense-categories?id=${id}`, { method: "DELETE" }); load();
  };

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  const inp = "w-full px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm";
  const total = expenses.reduce((s,e) => s + e.amount, 0);
  const genCats = cats.filter(c => c.scope === "general" || c.scope === "both");

  return (
    <div className="space-y-6">
      {canWrite && (
        <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-navy">Record Expense</h2>
            <button onClick={()=>setShowCatManager(!showCatManager)} className="flex items-center gap-1 text-navy-400 hover:text-navy text-sm"><Settings size={14}/> Manage Categories</button>
          </div>
          {showCatManager && (
            <div className="mb-4 p-4 bg-navy-50 rounded-xl">
              <div className="flex gap-2 mb-3">
                <input placeholder="New category" value={newCat} onChange={e=>setNewCat(e.target.value)} className={inp}/>
                <button onClick={addCat} className="px-4 py-2 bg-navy text-white font-semibold rounded-lg text-sm btn-press">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cats.map(c => <span key={c.id} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-navy-200 rounded-full text-xs">{c.name} <button onClick={()=>delCat(c.id)} className="text-red-500"><Trash2 size={12}/></button></span>)}
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inp}/>
            <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className={inp}>
              <option value="">Category</option>{genCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className={inp}/>
            <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} className={inp}/>
            <select value={bankAccountId} onChange={e=>setBankAccountId(e.target.value)} className={inp}>
              <option value="">Bank</option>{banks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button onClick={add} className="px-4 py-2 bg-navy text-white font-semibold rounded-lg text-sm btn-press flex items-center justify-center gap-1"><Plus size={14}/> Add</button>
          </div>
          <input placeholder="Vendor (optional)" value={vendor} onChange={e=>setVendor(e.target.value)} className={`${inp} mt-2`}/>
        </div>
      )}

      <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-navy">Expense Register</h2>
          <span className="text-navy-400 text-sm">Total: <strong className="text-red-500">{fmtAED(total)}</strong></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-navy-400 text-xs uppercase font-bold tracking-wider border-b border-navy-100">
              <th className="text-left py-2">Date</th><th className="text-left">Category</th><th className="text-left">Description</th>
              <th className="text-left">Vendor</th><th className="text-left">Bank</th><th className="text-right">Amount</th>{canWrite && <th/>}
            </tr></thead>
            <tbody>
              {expenses.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-navy-300">No expenses yet.</td></tr> :
                expenses.map(e => (
                  <tr key={e.id} className="border-b border-navy-50">
                    <td className="py-2">{fmtDate(e.date)}</td>
                    <td>{cats.find(c=>c.id===e.categoryId)?.name || "-"}</td>
                    <td>{e.description}</td>
                    <td className="text-navy-400">{e.vendor}</td>
                    <td>{banks.find(b=>b.id===e.bankAccountId)?.name || "-"}</td>
                    <td className="text-right font-semibold text-red-500">{fmtAED(e.amount)}</td>
                    {canWrite && <td><button onClick={()=>del(e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button></td>}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}