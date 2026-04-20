"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useRole } from "@/lib/use-role";
import { fmtAED, fmtDate } from "@/lib/format";
import { Plus, Trash2, Settings, Upload, Eye, Download, X } from "lucide-react";

type Expense = { id: string; date: string; categoryId: string; description: string; amount: number; bankAccountId: string; vendor: string; paidBy: string; paymentMode: string; paymentModeCustom: string; billData: string; billName: string; billType: string };
type Category = { id: string; name: string; scope: string };
type Bank = { id: string; name: string };

const MAX_BILL_BYTES = 700 * 1024; // 700 KB safety limit for Firestore

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("Read failed"));
    r.readAsDataURL(file);
  });
}

export default function ExpensesPage() {
  const { canWrite } = useRole();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatManager, setShowCatManager] = useState(false);
  const [viewBill, setViewBill] = useState<Expense | null>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [vendor, setVendor] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentModeCustom, setPaymentModeCustom] = useState("");
  const [billData, setBillData] = useState("");
  const [billName, setBillName] = useState("");
  const [billType, setBillType] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [newCat, setNewCat] = useState("");

  const load = async () => {
    try {
      const [e, c, b] = await Promise.all([
        apiCall<{expenses: Expense[]}>("/api/expenses"),
        apiCall<{categories: Category[]}>("/api/expense-categories"),
        apiCall<{accounts: Bank[]}>("/api/bank-accounts"),
      ]);
      setExpenses(e.expenses); setCats(c.categories); setBanks(b.accounts);
    } finally { setLoading(false); }
  };
  useEffect(()=>{load();},[]);

  const handleFile = async (file: File) => {
    setUploadError("");
    if (file.size > MAX_BILL_BYTES) {
      setUploadError(`File too large (${(file.size/1024).toFixed(0)} KB). Max 700 KB.`);
      return;
    }
    try {
      const data = await fileToBase64(file);
      setBillData(data);
      setBillName(file.name);
      setBillType(file.type);
    } catch (err: any) {
      setUploadError("Failed to read file.");
    }
  };

  const clearBill = () => { setBillData(""); setBillName(""); setBillType(""); setUploadError(""); };

  const add = async () => {
    if (!amount || !bankAccountId) return;
    await apiCall("/api/expenses", { method: "POST", body: {
      date, categoryId, description, amount: Number(amount), bankAccountId, vendor,
      paidBy, paymentMode, paymentModeCustom, billData, billName, billType,
    }});
    setAmount(""); setDescription(""); setVendor(""); setPaidBy(""); setPaymentMode(""); setPaymentModeCustom(""); clearBill();
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete expense? Ledger will be reversed.")) return;
    await apiCall(`/api/expenses?id=${id}`, { method: "DELETE" }); load();
  };

  const addCat = async () => {
    if (!newCat.trim()) return;
    await apiCall("/api/expense-categories", { method: "POST", body: { name: newCat, scope: "general" }});
    setNewCat(""); load();
  };
  const delCat = async (id: string) => {
    if (!confirm("Delete category?")) return;
    await apiCall(`/api/expense-categories?id=${id}`, { method: "DELETE" }); load();
  };

  const downloadBill = (e: Expense) => {
    if (!e.billData) return;
    const a = document.createElement("a");
    a.href = e.billData;
    a.download = e.billName || "bill";
    a.click();
  };

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  const inp = "w-full px-3 py-2 bg-white border border-navy-200 rounded-lg text-navy text-sm";
  const total = expenses.reduce((s,e) => s + e.amount, 0);
  const genCats = cats.filter(c => c.scope === "general" || c.scope === "both");

  return (
    <div className="space-y-6">
      {canWrite && (
        <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-navy">Record Expense</h2>
            <button onClick={()=>setShowCatManager(!showCatManager)} className="flex items-center gap-1 text-navy-400 hover:text-navy text-sm"><Settings size={14}/> Manage Categories</button>
          </div>
          {showCatManager && (
            <div className="mb-4 p-4 bg-navy-50 rounded-xl">
              <div className="flex gap-2 mb-3">
                <input placeholder="New category" value={newCat} onChange={e=>setNewCat(e.target.value)} className={inp}/>
                <button onClick={addCat} className="px-4 py-2 bg-navy text-white font-semibold rounded-lg text-sm btn-press">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cats.map(c => <span key={c.id} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-navy-200 rounded-full text-xs">{c.name} <button onClick={()=>delCat(c.id)} className="text-red-500"><Trash2 size={12}/></button></span>)}
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className={inp}/>
            <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className={inp}>
              <option value="">Category</option>{genCats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} className={inp}/>
            <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={e=>setAmount(e.target.value)} className={inp}/>
            <select value={bankAccountId} onChange={e=>setBankAccountId(e.target.value)} className={inp}>
              <option value="">Bank</option>{banks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input placeholder="Vendor (optional)" value={vendor} onChange={e=>setVendor(e.target.value)} className={inp}/>
            <input placeholder="Paid By" value={paidBy} onChange={e=>setPaidBy(e.target.value)} className={inp}/>
            <select value={paymentMode} onChange={e=>{setPaymentMode(e.target.value); if (e.target.value !== "custom") setPaymentModeCustom("");}} className={inp}>
              <option value="">Payment Mode</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="custom">Custom</option>
            </select>
            {paymentMode === "custom" && (
              <input placeholder="Specify payment mode" value={paymentModeCustom} onChange={e=>setPaymentModeCustom(e.target.value)} className={inp}/>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 items-center">
            <label className="flex items-center gap-2 px-4 py-2 bg-navy-50 border border-navy-200 rounded-lg text-navy text-sm font-semibold cursor-pointer hover:bg-navy-100">
              <Upload size={14}/> Upload Bill (optional)
              <input type="file" className="hidden" accept="image/*,application/pdf" onChange={e=>{const f=e.target.files?.[0]; if (f) handleFile(f); e.target.value="";}}/>
            </label>
            {billName && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                <span className="text-green-700 font-semibold">{billName}</span>
                <button onClick={clearBill} className="text-red-500"><X size={14}/></button>
              </div>
            )}
            {uploadError && <span className="text-red-500 text-sm">{uploadError}</span>}
            <button onClick={add} className="ml-auto px-5 py-2 bg-navy text-white font-semibold rounded-lg text-sm btn-press flex items-center gap-1"><Plus size={14}/> Add Expense</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-navy">Expense Register</h2>
          <span className="text-navy-400 text-sm">Total: <strong className="text-red-500">{fmtAED(total)}</strong></span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-navy-400 text-xs uppercase font-bold tracking-wider border-b border-navy-100">
              <th className="text-left py-2">Date</th><th className="text-left">Category</th><th className="text-left">Description</th>
              <th className="text-left">Vendor</th><th className="text-left">Paid By</th><th className="text-left">Mode</th>
              <th className="text-left">Bank</th><th className="text-left">Bill</th>
              <th className="text-right">Amount</th>{canWrite && <th/>}
            </tr></thead>
            <tbody>
              {expenses.length === 0 ? <tr><td colSpan={10} className="py-8 text-center text-navy-300">No expenses yet.</td></tr> :
                expenses.map(e => (
                  <tr key={e.id} className="border-b border-navy-50">
                    <td className="py-2">{fmtDate(e.date)}</td>
                    <td>{cats.find(c=>c.id===e.categoryId)?.name || "-"}</td>
                    <td>{e.description}</td>
                    <td className="text-navy-400">{e.vendor}</td>
                    <td>{e.paidBy || "-"}</td>
                    <td className="capitalize">{e.paymentMode === "custom" ? e.paymentModeCustom : (e.paymentMode || "-")}</td>
                    <td>{banks.find(b=>b.id===e.bankAccountId)?.name || "-"}</td>
                    <td>
                      {e.billData ? (
                        <div className="flex gap-1">
                          <button onClick={()=>setViewBill(e)} className="text-blue-600 hover:text-blue-800" title="View"><Eye size={14}/></button>
                          <button onClick={()=>downloadBill(e)} className="text-navy hover:text-navy-700" title="Download"><Download size={14}/></button>
                        </div>
                      ) : <span className="text-navy-300 text-xs">—</span>}
                    </td>
                    <td className="text-right font-semibold text-red-500">{fmtAED(e.amount)}</td>
                    {canWrite && <td><button onClick={()=>del(e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button></td>}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {viewBill && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-scale-in" onClick={()=>setViewBill(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-navy-100">
              <h3 className="font-bold text-navy">{viewBill.billName}</h3>
              <div className="flex gap-2">
                <button onClick={()=>downloadBill(viewBill)} className="px-3 py-1.5 bg-navy text-white rounded-lg text-sm font-semibold flex items-center gap-1"><Download size={14}/> Download</button>
                <button onClick={()=>setViewBill(null)} className="p-1.5 text-navy-400 hover:text-navy"><X size={18}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-navy-50">
              {viewBill.billType.startsWith("image/") ? (
                <img src={viewBill.billData} alt={viewBill.billName} className="max-w-full max-h-full"/>
              ) : viewBill.billType === "application/pdf" ? (
                <iframe src={viewBill.billData} className="w-full h-[70vh]" title={viewBill.billName}/>
              ) : (
                <p className="text-navy-400">Preview not available. Use Download instead.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}