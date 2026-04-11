"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { LpoPdfData } from "./LpoDocument";
import { CheckCircle, Clock, Download } from "lucide-react";

export default function LpoHistory() {
  const [lpos, setLpos] = useState<LpoPdfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<number | null>(null);
  const [approverName, setApproverName] = useState("");
  const [error, setError] = useState("");

  const fetchLpos = async () => {
    try {
      const res = await apiCall<{ lpos: LpoPdfData[] }>("/api/lpo");
      setLpos(res.lpos || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLpos(); }, []);

  const handleApprove = async (lpo: LpoPdfData) => {
    if (!approverName.trim()) return;
    try {
      await apiCall("/api/lpo", { method: "PATCH", body: { nxrNo: lpo.nxrNo, approvedBy: approverName.trim() } });
      setApproving(null);
      setApproverName("");
      fetchLpos();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownload = async (lpo: LpoPdfData) => {
    const [{ pdf }, { default: LpoDocument }] = await Promise.all([import("@react-pdf/renderer"), import("./LpoDocument")]);
    const blob = await pdf(<LpoDocument lpoData={lpo} />).toBlob();
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: `LPO-${lpo.nxrNo}.pdf` }).click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <h1 className="font-display text-3xl font-bold text-navy mb-6">LPO History</h1>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      {lpos.length === 0 ? (
        <div className="text-center py-16 text-navy-300 bg-white rounded-2xl border border-navy-100">No LPOs found.</div>
      ) : (
        <div className="space-y-4">
          {lpos.map((lpo, i) => (
            <div key={lpo.nxrNo} className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-navy font-bold text-lg">LPO #{lpo.nxrNo}</h3>
                  <p className="text-navy-400 text-sm">{lpo.clientName} — {lpo.project}</p>
                  <p className="text-navy-300 text-sm">Vendor: {lpo.vendorName}</p>
                </div>
                <div className="text-right">
                  <p className="text-gold font-bold text-lg">AED {lpo.total?.toFixed(2) || "0.00"}</p>
                  {lpo.approved ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold mt-1"><CheckCircle size={14} /> Approved by {lpo.approvedBy}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-semibold mt-1"><Clock size={14} /> Pending</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-navy-50">
                <button onClick={() => handleDownload(lpo)} className="flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 transition-all">
                  <Download size={15} /> Download PDF
                </button>
                {!lpo.approved && (
                  approving === lpo.nxrNo ? (
                    <div className="flex items-center gap-2 animate-scale-in">
                      <input placeholder="Approver's Name" value={approverName} onChange={e => setApproverName(e.target.value)}
                        className="px-3 py-2 bg-white border border-navy-200 rounded-xl text-navy text-sm placeholder-navy-300 w-48" autoFocus />
                      <button onClick={() => handleApprove(lpo)} disabled={!approverName.trim()}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all">Confirm</button>
                      <button onClick={() => { setApproving(null); setApproverName(""); }} className="px-3 py-2 text-navy-300 text-sm hover:text-navy">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setApproving(lpo.nxrNo)} className="px-4 py-2 bg-gold/10 border border-gold/30 rounded-xl text-gold-500 text-sm font-semibold hover:bg-gold/20 transition-all">Approve</button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
