"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useRole } from "@/lib/use-role";
import { fmtAED, fmtDate } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

type PE = { id: string; projectId: string; date: string; categoryId: string; description: string; amount: number; bankAccountId: string; vendor: string };
type Category = { id: string; name: string; scope: string };
type Bank = { id: string; name: string };
type Project = { id: string; name: string; code: string };

export default function ProjectExpensesPage() {
  const { canWrite } = useRole();
  const [expenses, setExpenses] = useState<PE[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState("");

  const [projectId, setProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [vendor, setVendor] = useState("");

  const load = async () => {
    try {
      const [e, c, b, p] = await Promise.all([
        apiCall<{expenses: PE[]}>("/api/project-expenses"),
        apiCall<{categories: Category[]}>("/api/expense-categories"),
        apiCall<{accounts: Bank[]}>("/api/bank-accounts"),
        apiCall<{projects: Project[]}>("/api/accounts-projects"),
      ]);
      setExpenses(e.expenses); setCats(c.categories); setBanks(b.accounts); setProjects(p.projects);
    } finally { setLoading(false); }
  };
  useEffect(()=>{load();},[]);

  const add = async () => {
    if (!projectId || !amount || !bankAccountId) return;
    await apiCall("/api/project-expenses", { method: "POST", body: { projectId, date, categoryId, description, amount: Number(amount), bankAccountId, vendor }});
    setAmount(""); setDescription(""); setVendor(""); load();
  };

  const del = async (id: string) => { if (!confirm("Delete?")) return; await apiCall(`/api/project-expenses?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  const inp = "w-full px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm";
  const projCats = cats.filter(c => c.scope === "project" || c.scope === "both");
  const filtered = filterProject ? expenses.filter(e => e.projectId === filterProject) : expenses;
  const total = filtered.reduce((s,e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {canWrite && (
        <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-navy mb-4">Record Project Expense</h2>
          <div className="grid sm:grid-cols-3 lg:grid-cols-7 gap-2">
            <select value={projectId} onChange={e=>setProjectId(e.target.value)} className={inp}>
              <option value="">Project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inp}/>
            <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className={inp}>
              <option value="">Category</option>{projCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className={inp}/>
            <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} className={inp}/>
            <select value={bankAccountId} onChange={e=>setBankAccountId(e.target.value)} className={inp}>
              <option value="">Bank</option>{banks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button onClick={add} className="px-4 py-2 bg-navy text-white font-semibold rounded-lg text-sm btn-press flex items-center justify-center gap-1"><Plus size={14}/></button>
          </div>
          <input placeholder="Vendor (optional)" value={vendor} onChange={e=>setVendor(e.target.value)} className={`${inp} mt-2`}/>
        </div>
      )}

      <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-navy">Project Expenses Register</h2>
          <div className="flex items-center gap-3">
            <select value={filterProject} onChange={e=>setFilterProject(e.target.value)} className={inp + " w-auto"}>
              <option value="">All projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="text-navy-400 text-sm">Total: <strong className="text-red-500">{fmtAED(total)}</strong></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-navy-400 text-xs uppercase font-bold tracking-wider border-b border-navy-100">
              <th className="text-left py-2">Date</th><th className="text-left">Project</th><th className="text-left">Category</th>
              <th className="text-left">Description</th><th className="text-left">Vendor</th><th className="text-right">Amount</th>{canWrite && <th/>}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-navy-300">No project expenses.</td></tr> :
                filtered.map(e => (
                  <tr key={e.id} className="border-b border-navy-50">
                    <td className="py-2">{fmtDate(e.date)}</td>
                    <td className="font-semibold text-navy">{projects.find(p=>p.id===e.projectId)?.name || "-"}</td>
                    <td>{cats.find(c=>c.id===e.categoryId)?.name || "-"}</td>
                    <td>{e.description}</td>
                    <td className="text-navy-400">{e.vendor}</td>
                    <td className="text-right font-semibold text-red-500">{fmtAED(e.amount)}</td>
                    {canWrite && <td><button onClick={()=>del(e.id)} className="text-red-500"><Trash2 size={14}/></button></td>}
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