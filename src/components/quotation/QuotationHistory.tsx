"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { QuotationData } from "./QuotationDocument";
import { Download, Pencil, Save, X } from "lucide-react";

export default function QuotationHistory(){
  const [quotations,setQuotations]=useState<QuotationData[]>([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState<string|null>(null);
  const [editData,setEditData]=useState<Partial<QuotationData>>({});
  const [error,setError]=useState("");

  const fetch_=async()=>{try{const res=await apiCall<{quotations:QuotationData[]}>("/api/quotation");setQuotations(res.quotations||[]);}catch(e:any){setError(e.message);}finally{setLoading(false);}};
  useEffect(()=>{fetch_();},[]);

  const handleDownload=async(data:QuotationData)=>{const[{pdf},{default:QDoc}]=await Promise.all([import("@react-pdf/renderer"),import("./QuotationDocument")]);const blob=await pdf(<QDoc quotationData={data}/>).toBlob();const url=URL.createObjectURL(blob);Object.assign(document.createElement("a"),{href:url,download:`${data.quotationNo}.pdf`}).click();URL.revokeObjectURL(url);};

  const startEdit=(q:QuotationData)=>{setEditing(q.quotationNo);setEditData({to:q.to,attn:q.attn,project:q.project,serviceTitle:q.serviceTitle});};
  const handleSave=async(q:QuotationData)=>{try{const qNoStr=String(q.quotationNo);const newQuotationNo=qNoStr.includes(" (Revised)")?qNoStr:`${qNoStr} (Revised)`;await apiCall("/api/quotation",{method:"PUT",body:{quotationNo:q.quotationNo,updatedQuotationNo:newQuotationNo,...editData}});setEditing(null);setEditData({});fetch_();}catch(e:any){setError(e.message);}};

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/></div>;

  const inp="px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm w-full";

  return(
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <h1 className="font-display text-3xl font-bold text-navy mb-6">Quotation History</h1>
      {error&&<div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-scale-in">{error}</div>}
      {quotations.length===0?(<div className="text-center py-16 text-navy-300 bg-white rounded-2xl border border-navy-100">No quotations found.</div>):(
        <div className="space-y-4">
          {quotations.map((q,i)=>(
            <div key={q.quotationNo} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover-lift animate-fade-in-up" style={{animationDelay:`${i*0.06}s`}}>
              {editing===q.quotationNo?(
                <div className="animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-navy font-bold text-lg">Editing {q.quotationNo}</h3>
                    <div className="flex gap-2">
                      <button onClick={()=>handleSave(q)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl btn-press"><Save size={14}/> Save</button>
                      <button onClick={()=>{setEditing(null);setEditData({});}} className="flex items-center gap-1.5 px-3 py-2 text-navy-400 hover:text-navy text-sm"><X size={14}/> Cancel</button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="text-xs text-navy-400 font-semibold">To</label><input value={editData.to||""} onChange={e=>setEditData(p=>({...p,to:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Attn</label><input value={editData.attn||""} onChange={e=>setEditData(p=>({...p,attn:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Project</label><input value={editData.project||""} onChange={e=>setEditData(p=>({...p,project:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Service Title</label><input value={editData.serviceTitle||""} onChange={e=>setEditData(p=>({...p,serviceTitle:e.target.value}))} className={inp}/></div>
                  </div>
                </div>
              ):(
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><h3 className="text-navy font-bold text-lg">{q.quotationNo}</h3><p className="text-navy-400 text-sm">{q.project||"-"} — {q.serviceTitle||"-"}</p><p className="text-navy-300 text-sm">To: {q.to||"-"}</p></div>
                    <p className="text-gold font-bold text-lg">AED {q.totalWithVat?.toFixed(2)||"0.00"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-navy-50">
                    <button onClick={()=>handleDownload(q)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 transition-all btn-press"><Download size={14}/> Download</button>
                    <button onClick={()=>startEdit(q)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-all btn-press"><Pencil size={14}/> Edit</button>
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
