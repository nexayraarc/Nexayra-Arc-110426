"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { TaxInvoiceData } from "./TaxInvoiceDocument";
import { Download, Pencil, Save, X } from "lucide-react";

export default function TaxInvoiceHistory(){
  const [invoices,setInvoices]=useState<TaxInvoiceData[]>([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState<string|null>(null);
  const [editData,setEditData]=useState<Partial<TaxInvoiceData>>({});
  const [error,setError]=useState("");

  const fetch_=async()=>{try{const res=await apiCall<{invoices:TaxInvoiceData[]}>("/api/tax-invoice");setInvoices(res.invoices||[]);}catch(e:any){setError(e.message);}finally{setLoading(false);}};
  useEffect(()=>{fetch_();},[]);

  const handleDownload=async(data:TaxInvoiceData)=>{const[{pdf},{default:Doc}]=await Promise.all([import("@react-pdf/renderer"),import("./TaxInvoiceDocument")]);const blob=await pdf(<Doc data={data}/>).toBlob();const url=URL.createObjectURL(blob);Object.assign(document.createElement("a"),{href:url,download:`${data.invoiceNo}.pdf`}).click();URL.revokeObjectURL(url);};

  const startEdit=(inv:TaxInvoiceData)=>{setEditing(inv.invoiceNo);setEditData({clientName:inv.clientName,clientAddress:inv.clientAddress,project:inv.project,clientTRN:inv.clientTRN,notes:inv.notes});};
  const handleSave=async(inv:TaxInvoiceData)=>{try{await apiCall("/api/tax-invoice",{method:"PUT",body:{invoiceNo:inv.invoiceNo,...editData}});setEditing(null);setEditData({});fetch_();}catch(e:any){setError(e.message);}};

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/></div>;

  const inp="px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm w-full";

  return(
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {error&&<div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-scale-in">{error}</div>}
      {invoices.length===0?(<div className="text-center py-16 text-navy-300 bg-white rounded-2xl border border-navy-100">No tax invoices found.</div>):(
        <div className="space-y-4">
          {invoices.map((inv,i)=>(
            <div key={inv.invoiceNo} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover-lift animate-fade-in-up" style={{animationDelay:`${i*0.06}s`}}>
              {editing===inv.invoiceNo?(
                <div className="animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-navy font-bold text-lg">Editing {inv.invoiceNo}</h3>
                    <div className="flex gap-2">
                      <button onClick={()=>handleSave(inv)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl btn-press"><Save size={14}/> Save</button>
                      <button onClick={()=>{setEditing(null);setEditData({});}} className="flex items-center gap-1.5 px-3 py-2 text-navy-400 hover:text-navy text-sm"><X size={14}/> Cancel</button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="text-xs text-navy-400 font-semibold">Client Name</label><input value={editData.clientName||""} onChange={e=>setEditData(p=>({...p,clientName:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Client Address</label><input value={editData.clientAddress||""} onChange={e=>setEditData(p=>({...p,clientAddress:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Project</label><input value={editData.project||""} onChange={e=>setEditData(p=>({...p,project:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Client TRN</label><input value={editData.clientTRN||""} onChange={e=>setEditData(p=>({...p,clientTRN:e.target.value}))} className={inp}/></div>
                    <div className="sm:col-span-2"><label className="text-xs text-navy-400 font-semibold">Notes</label><input value={editData.notes||""} onChange={e=>setEditData(p=>({...p,notes:e.target.value}))} className={inp}/></div>
                  </div>
                </div>
              ):(
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><h3 className="text-navy font-bold text-lg">{inv.invoiceNo}</h3><p className="text-navy-400 text-sm">{inv.clientName} — {inv.project||"No project"}</p><p className="text-navy-300 text-sm">Date: {inv.date}</p></div>
                    <p className="text-gold font-bold text-lg">AED {inv.total?.toFixed(2)||"0.00"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-navy-50">
                    <button onClick={()=>handleDownload(inv)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 transition-all btn-press"><Download size={14}/> Download</button>
                    <button onClick={()=>startEdit(inv)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-all btn-press"><Pencil size={14}/> Edit</button>
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