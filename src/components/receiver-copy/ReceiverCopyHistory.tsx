"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { ReceiverCopyData } from "./ReceiverCopyDocument";
import { Download } from "lucide-react";

export default function ReceiverCopyHistory(){
  const [receipts,setReceipts]=useState<ReceiverCopyData[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try{const res=await apiCall<{receiverCopies:ReceiverCopyData[]}>("/api/receiver-copy");setReceipts(res.receiverCopies||[]);}
      catch(err){console.error(err);}
      finally{setLoading(false);}
    })();
  },[]);

  const handleDownload=async(data:ReceiverCopyData)=>{
    const [{pdf},{default:RCDoc}]=await Promise.all([import("@react-pdf/renderer"),import("./ReceiverCopyDocument")]);
    const blob=await pdf(<RCDoc data={data}/>).toBlob();
    const url=URL.createObjectURL(blob);Object.assign(document.createElement("a"),{href:url,download:`${data.documentNo}.pdf`}).click();URL.revokeObjectURL(url);
  };

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/></div>;

  return(
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <h1 className="font-display text-3xl font-bold text-navy mb-6">Receipt History</h1>
      {receipts.length===0?(
        <div className="text-center py-16 text-navy-300 bg-white rounded-2xl border border-navy-100">No receipts found.</div>
      ):(
        <div className="space-y-4">
          {receipts.map((rc,i)=>(
            <div key={rc.documentNo} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all animate-fade-in-up" style={{animationDelay:`${i*0.05}s`}}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-navy font-bold text-lg">{rc.documentNo}</h3>
                  <p className="text-navy-400 text-sm">From: {rc.receivedFrom}</p>
                  <p className="text-navy-300 text-sm">Cheque: {rc.chequeNumber} — {rc.bankName}</p>
                </div>
                <p className="text-gold font-bold text-lg">AED {rc.amount}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-navy-50">
                <button onClick={()=>handleDownload(rc)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 transition-all"><Download size={15}/> Download PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
