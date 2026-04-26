"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useRole } from "@/lib/use-role";
import type { LpoPdfData } from "./LpoDocument";
import { Download, Pencil, Save, X, CheckCircle, Stamp, History as HistoryIcon } from "lucide-react";

type LpoDoc = LpoPdfData & { _docId: string; revisionOf?: string; revisionNumber?: number; createdAt?: string };

export default function LpoHistory() {
  const { canApproveLpo } = useRole();
  const [lpos, setLpos] = useState<LpoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LpoDoc>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approverName, setApproverName] = useState("");
  const [error, setError] = useState("");

  const fetch_ = async () => {
    try { const r = await apiCall<{lpos: LpoDoc[]}>("/api/lpo"); setLpos(r.lpos || []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(()=>{fetch_();},[]);

  // Group revisions together
  const grouped = useMemo(() => {
    const g = new Map<string, LpoDoc[]>();
    lpos.forEach(l => {
      const root = l.revisionOf || l._docId;
      if (!g.has(root)) g.set(root, []);
      g.get(root)!.push(l);
    });
    g.forEach(arr => arr.sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0)));
    return Array.from(g.values()).sort((a, b) => String(b[0].createdAt).localeCompare(String(a[0].createdAt)));
  }, [lpos]);

  const handleDownload = async (lpo: LpoDoc) => {
    const [{pdf}, {default: Doc}] = await Promise.all([import("@react-pdf/renderer"), import("./LpoDocument")]);
    const blob = await pdf(<Doc lpoData={lpo}/>).toBlob();
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `LPO-${lpo.nxrNo}.pdf` }).click();
    URL.revokeObjectURL(url);
  };

  const startEdit = (l: LpoDoc) => { setEditing(l._docId); setEditData({ ...l }); };
  const cancelEdit = () => { setEditing(null); setEditData({}); };
  const saveEdit = async () => {
    try {
      await apiCall("/api/lpo", { method: "PUT", body: { _docId: editing, ...editData }});
      cancelEdit(); fetch_();
    } catch (e: any) { setError(e.message); }
  };

  const submitApprove = async (l: LpoDoc) => {
    if (!approverName.trim()) { alert("Please enter your name to approve."); return; }
    try {
      await apiCall("/api/lpo", { method: "PATCH", body: { _docId: l._docId, nxrNo: l.nxrNo, approvedBy: approverName }});
      setApprovingId(null); setApproverName(""); fetch_();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/></div>;

  const inp = "px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-600 rounded-lg text-navy dark:text-white text-sm w-full";
  const lbl = "text-xs text-navy-400 dark:text-navy-300 font-semibold mb-1 block";

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
      {grouped.length === 0 ? (<div className="text-center py-16 text-navy-300">No LPOs yet.</div>) : (
        <div className="space-y-4">
          {grouped.map(group => {
            const latest = group[0];
            const older = group.slice(1);
            const l = latest;
            return (
              <div key={l._docId} className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-5 shadow-sm hover-lift">
                {editing === l._docId ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-navy dark:text-white">Editing LPO #{l.nxrNo}</h3>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white font-semibold text-sm rounded-xl btn-press"><Save size={14}/> Save as new revision</button>
                        <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-2 text-navy-400 text-sm"><X size={14}/> Cancel</button>
                      </div>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">⚠ Saving creates a new revision. Old version stays in history.</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><label className={lbl}>Client Name</label><input value={editData.clientName||""} onChange={e=>setEditData(p=>({...p, clientName: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Client Phone</label><input value={editData.clientPhone||""} onChange={e=>setEditData(p=>({...p, clientPhone: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Project</label><input value={editData.project||""} onChange={e=>setEditData(p=>({...p, project: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Site Location</label><input value={editData.siteLocation||""} onChange={e=>setEditData(p=>({...p, siteLocation: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Contact Person</label><input value={editData.contact||""} onChange={e=>setEditData(p=>({...p, contact: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Reference</label><input value={editData.reference||""} onChange={e=>setEditData(p=>({...p, reference: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Vendor Name</label><input value={editData.vendorName||""} onChange={e=>setEditData(p=>({...p, vendorName: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Vendor Address</label><input value={editData.vendorAddress||""} onChange={e=>setEditData(p=>({...p, vendorAddress: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Vendor Phone</label><input value={editData.vendorPhone||""} onChange={e=>setEditData(p=>({...p, vendorPhone: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Vendor TRN</label><input value={editData.vendorTRN||""} onChange={e=>setEditData(p=>({...p, vendorTRN: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Payment Terms</label><input value={editData.paymentTerms||""} onChange={e=>setEditData(p=>({...p, paymentTerms: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Delivery Terms</label><input value={editData.deliveryterms||""} onChange={e=>setEditData(p=>({...p, deliveryterms: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Requested By</label><input value={editData.requestedBy||""} onChange={e=>setEditData(p=>({...p, requestedBy: e.target.value}))} className={inp}/></div>
                      <div><label className={lbl}>Prepared By</label><input value={editData.preparedBy||""} onChange={e=>setEditData(p=>({...p, preparedBy: e.target.value}))} className={inp}/></div>
                    </div>
                    <div>
                      <label className={lbl}>Items (JSON — be careful)</label>
                      <textarea value={JSON.stringify(editData.items || [], null, 2)} onChange={e=>{try{setEditData(p=>({...p, items: JSON.parse(e.target.value)}));}catch{}}} className={`${inp} font-mono text-xs min-h-[120px]`}/>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-navy dark:text-white">LPO #{l.nxrNo}</h3>
                          {l.approved && <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full"><CheckCircle size={12}/> Approved</span>}
                          {older.length > 0 && <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">{older.length} older revision{older.length>1?"s":""}</span>}
                        </div>
                        <p className="text-navy-400 text-sm">{l.clientName} · {l.vendorName}</p>
                        <p className="text-navy-300 text-xs">{l.project}</p>
                        {l.approved && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Approved by {l.approvedBy}</p>}
                      </div>
                      <p className="text-gold font-bold text-lg">AED {Number(l.total||0).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-navy-50 dark:border-navy-700">
                      <button onClick={()=>handleDownload(l)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 dark:bg-navy-700 border border-navy-200 dark:border-navy-600 rounded-xl text-navy dark:text-white text-sm font-semibold btn-press"><Download size={14}/> Download</button>
                      <button onClick={()=>startEdit(l)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-xl text-blue-600 text-sm font-semibold btn-press"><Pencil size={14}/> Edit</button>
                      {!l.approved && canApproveLpo && (
                        approvingId === l._docId ? (
                          <div className="flex gap-2 items-center">
                            <input placeholder="Your name" value={approverName} onChange={e=>setApproverName(e.target.value)} className={inp + " w-auto"}/>
                            <button onClick={()=>submitApprove(l)} className="px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold btn-press">Confirm</button>
                            <button onClick={()=>setApprovingId(null)} className="px-3 py-2 text-navy-400 text-sm">✕</button>
                          </div>
                        ) : (
                          <button onClick={()=>setApprovingId(l._docId)} className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl text-green-700 dark:text-green-400 text-sm font-semibold btn-press"><Stamp size={14}/> Approve</button>
                        )
                      )}
                    </div>
                    {older.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-navy-400 text-xs flex items-center gap-1 hover:text-navy dark:hover:text-white"><HistoryIcon size={12}/> View revision history ({older.length})</summary>
                        <div className="mt-2 space-y-1 pl-4 border-l-2 border-navy-100 dark:border-navy-700">
                          {older.map(o => (
                            <div key={o._docId} className="flex items-center justify-between text-xs text-navy-400 py-1">
                              <span>{o.nxrNo}</span>
                              <button onClick={()=>handleDownload(o)} className="text-navy dark:text-gold font-semibold hover:underline">Download</button>
                            </div>
                          ))}
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