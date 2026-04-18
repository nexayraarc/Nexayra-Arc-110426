"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { LpoItem, LpoPdfData } from "./LpoDocument";
import { CheckCircle, Clock, Download, Pencil, Save, X } from "lucide-react";

export default function LpoHistory() {
  const [lpos, setLpos] = useState<LpoPdfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number|null>(null);
  const [approverName, setApproverName] = useState("");
  const [editing, setEditing] = useState<number|null>(null);
  const [editData, setEditData] = useState<Partial<LpoPdfData>>({});
  const [error, setError] = useState("");

  const fetchLpos = async () => { try { const res = await apiCall<{lpos:LpoPdfData[]}>("/api/lpo"); setLpos(res.lpos||[]); } catch(e:any){setError(e.message);} finally{setLoading(false);} };
  useEffect(()=>{fetchLpos();},[]);

  const handleApprove = async (lpo:LpoPdfData) => {
    if(!approverName.trim()) return;
    try { await apiCall("/api/lpo",{method:"PATCH",body:{nxrNo:lpo.nxrNo,approvedBy:approverName.trim()}}); setApproving(null); setApproverName(""); fetchLpos(); } catch(e:any){setError(e.message);}
  };

  const handleDownload = async (lpo:LpoPdfData) => {
    const [{pdf},{default:LpoDocument}]=await Promise.all([import("@react-pdf/renderer"),import("./LpoDocument")]);
    const blob=await pdf(<LpoDocument lpoData={lpo}/>).toBlob();
    const url=URL.createObjectURL(blob); Object.assign(document.createElement("a"),{href:url,download:`LPO-${lpo.nxrNo}.pdf`}).click(); URL.revokeObjectURL(url);
  };

  const startEdit = (lpo:LpoPdfData) => { setEditing(lpo.nxrNo); setEditData({clientName:lpo.clientName,project:lpo.project,vendorName:lpo.vendorName,siteLocation:lpo.siteLocation,requestedBy:lpo.requestedBy,preparedBy:lpo.preparedBy}); };

  const handleSave = async (lpo:LpoPdfData) => {
    try { const nxrStr = String(lpo.nxrNo); const newNxrNo = nxrStr.includes(" (Revised)") ? nxrStr : `${nxrStr} (Revised)`; await apiCall("/api/lpo",{method:"PUT",body:{nxrNo:lpo.nxrNo,updatedNxrNo:newNxrNo,...editData}}); setEditing(null); setEditData({}); fetchLpos(); } catch(e:any){setError(e.message);}
  };

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/></div>;

  const inp = "px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm w-full";

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <h1 className="font-display text-3xl font-bold text-navy mb-6">LPO History</h1>
      {error&&<div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-scale-in">{error}</div>}
      {lpos.length===0?(
        <div className="text-center py-16 text-navy-300 bg-white rounded-2xl border border-navy-100">No LPOs found.</div>
      ):(
        <div className="space-y-4">
          {lpos.map((lpo,i)=>(
            <div key={lpo.nxrNo} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover-lift animate-fade-in-up" style={{animationDelay:`${i*0.06}s`}}>
              {editing===lpo.nxrNo?(
                <div className="animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-navy font-bold text-lg">Editing LPO #{lpo.nxrNo}</h3>
                    <div className="flex gap-2">
                      <button onClick={()=>handleSave(lpo)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl btn-press"><Save size={14}/> Save</button>
                      <button onClick={()=>{setEditing(null);setEditData({});}} className="flex items-center gap-1.5 px-3 py-2 text-navy-400 hover:text-navy text-sm"><X size={14}/> Cancel</button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="text-xs text-navy-400 font-semibold">Client Name</label><input value={editData.clientName||""} onChange={e=>setEditData(p=>({...p,clientName:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Project</label><input value={editData.project||""} onChange={e=>setEditData(p=>({...p,project:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Vendor Name</label><input value={editData.vendorName||""} onChange={e=>setEditData(p=>({...p,vendorName:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Site Location</label><input value={editData.siteLocation||""} onChange={e=>setEditData(p=>({...p,siteLocation:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Requested By</label><input value={editData.requestedBy||""} onChange={e=>setEditData(p=>({...p,requestedBy:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Prepared By</label><input value={editData.preparedBy||""} onChange={e=>setEditData(p=>({...p,preparedBy:e.target.value}))} className={inp}/></div>
                  </div>
                </div>
              ):(
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-navy font-bold text-lg">LPO #{lpo.nxrNo}</h3>
                      <p className="text-navy-400 text-sm">{lpo.clientName} — {lpo.project}</p>
                      <p className="text-navy-300 text-sm">Vendor: {lpo.vendorName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gold font-bold text-lg">AED {lpo.total?.toFixed(2)||"0.00"}</p>
                      {lpo.approved?(<span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold mt-1"><CheckCircle size={14}/> Approved by {lpo.approvedBy}</span>)
                      :(<span className="inline-flex items-center gap-1 text-amber-500 text-xs font-semibold mt-1 badge-pulse"><Clock size={14}/> Pending</span>)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-navy-50">
                    <button onClick={()=>handleDownload(lpo)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 transition-all btn-press"><Download size={14}/> Download</button>
                    <button onClick={()=>startEdit(lpo)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-all btn-press"><Pencil size={14}/> Edit</button>
                    {!lpo.approved&&(approving===lpo.nxrNo?(
                      <div className="flex items-center gap-2 animate-scale-in">
                        <input placeholder="Approver's Name" value={approverName} onChange={e=>setApproverName(e.target.value)} className="px-3 py-2 bg-white border border-navy-200 rounded-xl text-navy text-sm placeholder-navy-300 w-48" autoFocus/>
                        <button onClick={()=>handleApprove(lpo)} disabled={!approverName.trim()} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 btn-press">Confirm</button>
                        <button onClick={()=>{setApproving(null);setApproverName("");}} className="px-3 py-2 text-navy-300 text-sm hover:text-navy">Cancel</button>
                      </div>
                    ):(<button onClick={()=>setApproving(lpo.nxrNo)} className="px-4 py-2 bg-gold/10 border border-gold/30 rounded-xl text-gold-500 text-sm font-semibold hover:bg-gold/20 transition-all btn-press">Approve</button>))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
