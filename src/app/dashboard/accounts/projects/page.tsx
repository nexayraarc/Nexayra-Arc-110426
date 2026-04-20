"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useRole } from "@/lib/use-role";
import { fmtAED } from "@/lib/format";
import { Plus } from "lucide-react";

type Project = { id: string; code: string; name: string; client: string; contractValue: number; startDate: string; endDate: string; status: string; totalExpenses: number; totalInvoiced: number; totalCollected: number; profit: number };

export default function ProjectsPage() {
  const { canWrite } = useRole();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState(""); const [name, setName] = useState(""); const [client, setClient] = useState("");
  const [contractValue, setContractValue] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState("");

  const load = async () => { try { const r = await apiCall<{projects: Project[]}>("/api/accounts-projects"); setProjects(r.projects); } finally { setLoading(false); } };
  useEffect(()=>{load();},[]);

  const add = async () => {
    if (!name.trim()) return;
    await apiCall("/api/accounts-projects", { method: "POST", body: { code, name, client, contractValue: Number(contractValue||0), startDate, endDate, status: "active" }});
    setCode(""); setName(""); setClient(""); setContractValue(""); setStartDate(""); setEndDate(""); load();
  };

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  const inp = "w-full px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm";

  return (
    <div className="space-y-6">
      {canWrite && (
        <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-navy mb-4">New Project</h2>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <input placeholder="Code" value={code} onChange={e=>setCode(e.target.value)} className={inp}/>
            <input placeholder="Project name" value={name} onChange={e=>setName(e.target.value)} className={inp}/>
            <input placeholder="Client" value={client} onChange={e=>setClient(e.target.value)} className={inp}/>
            <input type="number" placeholder="Contract value" value={contractValue} onChange={e=>setContractValue(e.target.value)} className={inp}/>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className={inp}/>
            <button onClick={add} className="px-4 py-2 bg-navy text-white font-semibold rounded-lg text-sm btn-press flex items-center justify-center gap-1"><Plus size={14}/> Add</button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? <p className="col-span-3 text-center py-16 text-navy-300">No projects.</p> :
          projects.map(p => (
            <div key={p.id} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-navy-400 text-xs">{p.code}</p>
                  <h3 className="font-bold text-navy">{p.name}</h3>
                  <p className="text-navy-400 text-sm">{p.client}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-navy-100 text-navy-500"}`}>{p.status}</span>
              </div>
              <div className="space-y-1 text-sm border-t border-navy-50 pt-3">
                <div className="flex justify-between"><span className="text-navy-400">Contract:</span><span className="font-semibold">{fmtAED(p.contractValue)}</span></div>
                <div className="flex justify-between"><span className="text-navy-400">Invoiced:</span><span className="font-semibold text-blue-600">{fmtAED(p.totalInvoiced)}</span></div>
                <div className="flex justify-between"><span className="text-navy-400">Collected:</span><span className="font-semibold text-green-600">{fmtAED(p.totalCollected)}</span></div>
                <div className="flex justify-between"><span className="text-navy-400">Expenses:</span><span className="font-semibold text-red-500">{fmtAED(p.totalExpenses)}</span></div>
                <div className="flex justify-between border-t border-navy-50 pt-1 mt-1"><span className="text-navy font-bold">Profit:</span><span className={`font-bold ${p.profit >= 0 ? "text-green-600" : "text-red-500"}`}>{fmtAED(p.profit)}</span></div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}