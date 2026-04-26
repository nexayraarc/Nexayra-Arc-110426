"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { QuotationData } from "./QuotationDocument";
import { Download, Pencil, Save, X, History as HistoryIcon, FolderPlus, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { quotationToProjectPayload, quotationToLpoPayload } from "@/lib/quotation-converters";

type QDoc = QuotationData & { _docId: string; revisionOf?: string; revisionNumber?: number; createdAt?: string };

export default function QuotationHistory() {
  const [items, setItems] = useState<QDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<QDoc>>({});
  const [error, setError] = useState("");
  const router = useRouter();

  const fetch_ = async () => {
    try { const r = await apiCall<{quotations: QDoc[]}>("/api/quotation"); setItems(r.quotations || []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(()=>{fetch_();},[]);

  const grouped = useMemo(() => {
    const g = new Map<string, QDoc[]>();
    items.forEach(q => {
      const root = q.revisionOf || q._docId;
      if (!g.has(root)) g.set(root, []);
      g.get(root)!.push(q);
    });
    g.forEach(arr => arr.sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0)));
    return Array.from(g.values()).sort((a, b) => String(b[0].createdAt).localeCompare(String(a[0].createdAt)));
  }, [items]);

  const handleDownload = async (q: QDoc) => {
    const [{pdf}, {default: Doc}] = await Promise.all([import("@react-pdf/renderer"), import("./QuotationDocument")]);
    const blob = await pdf(<Doc quotationData={q}/>).toBlob();
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `${q.quotationNo}.pdf` }).click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (q: QDoc) => { setEditing(q._docId); setEditData({ ...q }); };
  const cancel = () => { setEditing(null); setEditData({}); };
  const save = async () => {
    try {
      await apiCall("/api/quotation", { method: "PUT", body: { _docId: editing, quotationNo: (editData as any).quotationNo, ...editData }});
      cancel(); fetch_();
    } catch (e: any) { setError(e.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/></div>;

  const inp = "px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-600 rounded-lg text-navy dark:text-white text-sm w-full";
  const lbl = "text-xs text-navy-400 font-semibold mb-1 block";

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
      {grouped.length === 0 ? <div className="text-center py-16 text-navy-300">No quotations yet.</div> : (
        <div className="space-y-4">
          {grouped.map(group => {
            const q = group[0]; const older = group.slice(1);
            return (
              <div key={q._docId} className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm hover-lift">
                {editing === q._docId ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-navy dark:text-white">Editing {q.quotationNo}</h3>
                      <div className="flex gap-2">
                        <button onClick={save} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl btn-press"><Save size={14}/> Save as new revision</button>
                        <button onClick={cancel} className="px-3 py-2 text-navy-400 text-sm"><X size={14}/></button>
                      </div>
                    </div>
                    <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">⚠ Saving creates a new revision.</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><label className={lbl}>To</label><input value={editData.to||""} onChange={e=>setEditData(p=>({...p, to: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Attn</label><input value={editData.attn||""} onChange={e=>setEditData(p=>({...p, attn: e.target.value}))} className={inp}/></div>
                      <div className="sm:col-span-2"><label className={lbl}>Project</label><input value={editData.project||""} onChange={e=>setEditData(p=>({...p, project: e.target.value}))} className={inp}/></div>
                      <div className="sm:col-span-2"><label className={lbl}>Service Title</label><input value={editData.serviceTitle||""} onChange={e=>setEditData(p=>({...p, serviceTitle: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Validity</label><input value={editData.validity||""} onChange={e=>setEditData(p=>({...p, validity: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Date</label><input value={editData.date||""} onChange={e=>setEditData(p=>({...p, date: e.target.value}))} className={inp}/></div>
                      <div className="sm:col-span-2"><label className={lbl}>BOQ Items (JSON)</label><textarea value={JSON.stringify(editData.boqItems||[],null,2)} onChange={e=>{try{setEditData(p=>({...p, boqItems: JSON.parse(e.target.value)}));}catch{}}} className={`${inp} font-mono text-xs min-h-[100px]`}/></div>
                      <div className="sm:col-span-2"><label className={lbl}>Inclusions (JSON array of strings)</label><textarea value={JSON.stringify(editData.inclusionItems||[],null,2)} onChange={e=>{try{setEditData(p=>({...p, inclusionItems: JSON.parse(e.target.value)}));}catch{}}} className={`${inp} font-mono text-xs min-h-[80px]`}/></div>
                      <div className="sm:col-span-2"><label className={lbl}>Exclusions (JSON array of strings)</label><textarea value={JSON.stringify(editData.exclusionItems||[],null,2)} onChange={e=>{try{setEditData(p=>({...p, exclusionItems: JSON.parse(e.target.value)}));}catch{}}} className={`${inp} font-mono text-xs min-h-[80px]`}/></div>
                      <div className="sm:col-span-2"><label className={lbl}>Payment Terms (JSON array of strings)</label><textarea value={JSON.stringify(editData.paymentTerms||[],null,2)} onChange={e=>{try{setEditData(p=>({...p, paymentTerms: JSON.parse(e.target.value)}));}catch{}}} className={`${inp} font-mono text-xs min-h-[80px]`}/></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-navy dark:text-white">{q.quotationNo}</h3>
                          {older.length > 0 && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 text-xs rounded-full">{older.length} older</span>}
                        </div>
                        <p className="text-navy-400 text-sm">{q.to}</p>
                        <p className="text-navy-300 text-xs">{q.project}</p>
                      </div>
                      <p className="text-gold font-bold text-lg">AED {Number(q.totalWithVat||0).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-navy-50 dark:border-navy-700">
                      <button onClick={()=>handleDownload(q)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 dark:bg-navy-700 border border-navy-200 dark:border-navy-600 rounded-xl text-navy dark:text-white text-sm font-semibold btn-press"><Download size={14}/> Download</button>
                      <button onClick={()=>startEdit(q)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-xl text-blue-600 text-sm font-semibold btn-press"><Pencil size={14}/> Edit</button>
                      <button onClick={()=>{
                        const payload = quotationToProjectPayload(q);
                        sessionStorage.setItem("prefillProject", JSON.stringify(payload));
                        router.push("/dashboard/accounts/projects?prefill=1");
                      }} className="flex items-center gap-2 px-4 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 rounded-xl text-teal-700 dark:text-teal-400 text-sm font-semibold btn-press"><FolderPlus size={14}/> Convert to Project</button>
                      <button onClick={()=>{
                        const payload = quotationToLpoPayload(q);
                        sessionStorage.setItem("prefillLpo", JSON.stringify(payload));
                        router.push("/dashboard/procurement/lpo?prefill=1");
                      }} className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-semibold btn-press"><ShoppingCart size={14}/> Convert to LPO</button>
                    </div>  
                    {older.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-navy-400 text-xs flex items-center gap-1"><HistoryIcon size={12}/> Revision history</summary>
                        <div className="mt-2 pl-4 border-l-2 border-navy-100 dark:border-navy-700 space-y-1">
                          {older.map(o => <div key={o._docId} className="flex justify-between text-xs text-navy-400 py-1"><span>{o.quotationNo}</span><button onClick={()=>handleDownload(o)} className="text-navy dark:text-gold font-semibold hover:underline">Download</button></div>)}
                        </div>
                      </details>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}