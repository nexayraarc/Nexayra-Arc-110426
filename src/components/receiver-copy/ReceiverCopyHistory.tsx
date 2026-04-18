"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { ReceiverCopyData } from "./ReceiverCopyDocument";
import { Download, Pencil, Save, X } from "lucide-react";

export default function ReceiverCopyHistory(){
  const [receipts,setReceipts]=useState<ReceiverCopyData[]>([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState<string|null>(null);
  const [editData,setEditData]=useState<Partial<ReceiverCopyData>>({});
  const [error,setError]=useState("");

  const fetch_=async()=>{try{const res=await apiCall<{receiverCopies:ReceiverCopyData[]}>("/api/receiver-copy");setReceipts(res.receiverCopies||[]);}catch(e:any){setError(e.message);}finally{setLoading(false);}};
  useEffect(()=>{fetch_();},[]);

  const handleDownload=async(data:ReceiverCopyData)=>{const[{pdf},{default:RCDoc}]=await Promise.all([import("@react-pdf/renderer"),import("./ReceiverCopyDocument")]);const blob=await pdf(<RCDoc data={data}/>).toBlob();const url=URL.createObjectURL(blob);Object.assign(document.createElement("a"),{href:url,download:`${data.documentNo}.pdf`}).click();URL.revokeObjectURL(url);};

  const startEdit=(rc:ReceiverCopyData)=>{setEditing(rc.documentNo);setEditData({receivedFrom:rc.receivedFrom,amount:rc.amount,chequeNumber:rc.chequeNumber,bankName:rc.bankName,chequeDate:rc.chequeDate,purposeDescription:rc.purposeDescription,receivedBy:rc.receivedBy,companyName:rc.companyName});};
  const handleSave=async(rc:ReceiverCopyData)=>{try{const docNoStr=String(rc.documentNo);const newDocumentNo=docNoStr.includes(" (Revised)")?docNoStr:`${docNoStr} (Revised)`;await apiCall("/api/receiver-copy",{method:"PUT",body:{documentNo:rc.documentNo,updatedDocumentNo:newDocumentNo,...editData}});setEditing(null);setEditData({});fetch_();}catch(e:any){setError(e.message);}};

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/></div>;

  const inp="px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm w-full";

  return(
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <h1 className="font-display text-3xl font-bold text-navy mb-6">Receipt History</h1>
      {error&&<div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-scale-in">{error}</div>}
      {receipts.length===0?(<div className="text-center py-16 text-navy-300 bg-white rounded-2xl border border-navy-100">No receipts found.</div>):(
        <div className="space-y-4">
          {receipts.map((rc,i)=>(
            <div key={rc.documentNo} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover-lift animate-fade-in-up" style={{animationDelay:`${i*0.06}s`}}>
              {editing===rc.documentNo?(
                <div className="animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-navy font-bold text-lg">Editing {rc.documentNo}</h3>
                    <div className="flex gap-2">
                      <button onClick={()=>handleSave(rc)} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl btn-press"><Save size={14}/> Save</button>
                      <button onClick={()=>{setEditing(null);setEditData({});}} className="flex items-center gap-1.5 px-3 py-2 text-navy-400 hover:text-navy text-sm"><X size={14}/> Cancel</button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="text-xs text-navy-400 font-semibold">Received From</label><input value={editData.receivedFrom||""} onChange={e=>setEditData(p=>({...p,receivedFrom:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Amount</label><input value={editData.amount||""} onChange={e=>setEditData(p=>({...p,amount:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Cheque Number</label><input value={editData.chequeNumber||""} onChange={e=>setEditData(p=>({...p,chequeNumber:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Bank Name</label><input value={editData.bankName||""} onChange={e=>setEditData(p=>({...p,bankName:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Cheque Date</label><input value={editData.chequeDate||""} onChange={e=>setEditData(p=>({...p,chequeDate:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Purpose</label><input value={editData.purposeDescription||""} onChange={e=>setEditData(p=>({...p,purposeDescription:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Received By</label><input value={editData.receivedBy||""} onChange={e=>setEditData(p=>({...p,receivedBy:e.target.value}))} className={inp}/></div>
                    <div><label className="text-xs text-navy-400 font-semibold">Company</label><input value={editData.companyName||""} onChange={e=>setEditData(p=>({...p,companyName:e.target.value}))} className={inp}/></div>
                  </div>
                </div>
              ):(
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><h3 className="text-navy font-bold text-lg">{rc.documentNo}</h3><p className="text-navy-400 text-sm">From: {rc.receivedFrom}</p><p className="text-navy-300 text-sm">Cheque: {rc.chequeNumber} — {rc.bankName}</p></div>
                    <p className="text-gold font-bold text-lg">AED {rc.amount}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-navy-50">
                    <button onClick={()=>handleDownload(rc)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 transition-all btn-press"><Download size={14}/> Download</button>
                    <button onClick={()=>startEdit(rc)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-all btn-press"><Pencil size={14}/> Edit</button>
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
