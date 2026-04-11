"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { QuotationData } from "./QuotationDocument";
import { Download } from "lucide-react";

export default function QuotationHistory() {
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiCall<{quotations:QuotationData[]}>("/api/quotation");
        setQuotations(res.quotations||[]);
      } catch(err){console.error(err);}
      finally{setLoading(false);}
    })();
  }, []);

  const handleDownload = async (data: QuotationData) => {
    const [{pdf},{default:QDoc}] = await Promise.all([import("@react-pdf/renderer"),import("./QuotationDocument")]);
    const blob = await pdf(<QDoc quotationData={data}/>).toBlob();
    const url=URL.createObjectURL(blob); Object.assign(document.createElement("a"),{href:url,download:`${data.quotationNo}.pdf`}).click(); URL.revokeObjectURL(url);
  };

  if(loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <h1 className="font-display text-3xl font-bold text-navy mb-6">Quotation History</h1>
      {quotations.length===0?(
        <div className="text-center py-16 text-navy-300 bg-white rounded-2xl border border-navy-100">No quotations found.</div>
      ):(
        <div className="space-y-4">
          {quotations.map((q,i)=>(
            <div key={q.quotationNo} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all animate-fade-in-up" style={{animationDelay:`${i*0.05}s`}}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-navy font-bold text-lg">{q.quotationNo}</h3>
                  <p className="text-navy-400 text-sm">{q.project||"-"} — {q.serviceTitle||"-"}</p>
                  <p className="text-navy-300 text-sm">To: {q.to||"-"}</p>
                </div>
                <p className="text-gold font-bold text-lg">AED {q.totalWithVat?.toFixed(2)||"0.00"}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-navy-50">
                <button onClick={()=>handleDownload(q)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 transition-all"><Download size={15}/> Download PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
