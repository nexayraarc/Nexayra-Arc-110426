"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { TaxInvoiceItem, TaxInvoiceData } from "./TaxInvoiceDocument";
import PreviewModal from "@/components/PreviewModal";
import { Eye } from "lucide-react";
import SuggestInput from "@/components/SuggestInput";

const DRAFT_KEY="createTaxInvoiceV1";
function formatToday():string{const n=new Date();return`${String(n.getDate()).padStart(2,"0")}-${n.toLocaleString("en-US",{month:"long"})}-${n.getFullYear()}`;}
function convertNumberToWords(num:number):string{const ones=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];const teens=["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];const tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];const scales=["","Thousand","Million","Billion"];if(num===0)return"Zero";const ch=(n:number)=>{let r="";const h=Math.floor(n/100);const rem=n%100;if(h>0)r+=`${ones[h]} Hundred`;if(rem>=20){if(r)r+=" ";r+=tens[Math.floor(rem/10)];if(rem%10>0)r+=` ${ones[rem%10]}`;}else if(rem>=10){if(r)r+=" ";r+=teens[rem-10];}else if(rem>0){if(r)r+=" ";r+=ones[rem];}return r;};const parts:string[]=[];let si=0;let v=num;while(v>0){const c=v%1000;if(c!==0)parts.unshift(`${ch(c)}${si>0?` ${scales[si]}`:""}`);v=Math.floor(v/1000);si++;}return parts.join(" ").trim();}
function amountToWords(a:number):string{const s=Number.isFinite(a)?a:0;const d=Math.floor(s);const f=Math.round((s-d)*100);let r=`${convertNumberToWords(d)} Dirhams`;if(f>0)r+=` and ${convertNumberToWords(f)} Fils`;return`${r} Only`;}

const makeEmpty=():TaxInvoiceItem=>({description:"",qty:"1",uom:"Nos",unitPrice:"",discount:"0"});

export default function CreateTaxInvoice(){
  const [invoiceNo,setInvoiceNo]=useState("(auto)");
  const [date,setDate]=useState(""); const [dueDate,setDueDate]=useState("");
  const [clientName,setClientName]=useState(""); const [clientAddress,setClientAddress]=useState("");
  const [clientTRN,setClientTRN]=useState(""); const [clientPhone,setClientPhone]=useState("");
  const [project,setProject]=useState(""); const [poReference,setPoReference]=useState("");
  const [items,setItems]=useState<TaxInvoiceItem[]>([makeEmpty()]);
  const [bankName,setBankName]=useState(""); const [accountName,setAccountName]=useState("");
  const [accountNumber,setAccountNumber]=useState(""); const [iban,setIban]=useState("");
  const [swiftCode,setSwiftCode]=useState(""); const [notes,setNotes]=useState("");
  const [isWorking,setIsWorking]=useState(false);
  const [message,setMessage]=useState<{text:string;type:"success"|"error"}|null>(null);
  const [previewUrl,setPreviewUrl]=useState<string|null>(null);

  useEffect(()=>{setDate(formatToday());try{const s=localStorage.getItem(DRAFT_KEY);if(!s)return;const d=JSON.parse(s);setClientName(d.clientName??"");setClientAddress(d.clientAddress??"");setClientTRN(d.clientTRN??"");setClientPhone(d.clientPhone??"");setProject(d.project??"");setPoReference(d.poReference??"");setDueDate(d.dueDate??"");setBankName(d.bankName??"");setAccountName(d.accountName??"");setAccountNumber(d.accountNumber??"");setIban(d.iban??"");setSwiftCode(d.swiftCode??"");setNotes(d.notes??"");if(Array.isArray(d.items)&&d.items.length>0)setItems(d.items);}catch{}},[]);
  useEffect(()=>{localStorage.setItem(DRAFT_KEY,JSON.stringify({clientName,clientAddress,clientTRN,clientPhone,project,poReference,dueDate,items,bankName,accountName,accountNumber,iban,swiftCode,notes}));});

  const calcItem=(item:TaxInvoiceItem)=>{const qty=Number(item.qty||0),up=Number(item.unitPrice||0),dp=Math.max(0,Number(item.discount||0));const gross=qty*up,disc=gross*(dp/100),taxable=gross-disc,vat=taxable*0.05;return{gross,disc,taxable,vat,total:taxable+vat};};

  const totals=useMemo(()=>{return items.reduce((a,i)=>{const r=calcItem(i);a.subtotal+=r.gross;a.totalDiscount+=r.disc;a.taxableAmount+=r.taxable;a.vatAmount+=r.vat;a.total+=r.total;return a;},{subtotal:0,totalDiscount:0,taxableAmount:0,vatAmount:0,total:0});},[items]);

  const updateItem=(i:number,f:keyof TaxInvoiceItem,v:string)=>setItems(p=>p.map((item,idx)=>idx===i?{...item,[f]:v}:item));

  const validate=()=>{if(!clientName.trim())return"Enter client name.";if(!items.some(i=>i.description.trim()&&Number(i.qty)>0))return"Add at least one item.";return"";};

  const buildPayload=()=>({
    date:date.trim(),dueDate:dueDate.trim(),clientName:clientName.trim(),clientAddress:clientAddress.trim(),
    clientTRN:clientTRN.trim(),clientPhone:clientPhone.trim(),project:project.trim(),poReference:poReference.trim(),
    items,subtotal:+totals.subtotal.toFixed(2),totalDiscount:+totals.totalDiscount.toFixed(2),
    taxableAmount:+totals.taxableAmount.toFixed(2),vatAmount:+totals.vatAmount.toFixed(2),total:+totals.total.toFixed(2),
    bankName:bankName.trim(),accountName:accountName.trim(),accountNumber:accountNumber.trim(),
    iban:iban.trim(),swiftCode:swiftCode.trim(),notes:notes.trim(),
  });

  const reset=()=>{localStorage.removeItem(DRAFT_KEY);setInvoiceNo("(auto)");setDate(formatToday());setDueDate("");setClientName("");setClientAddress("");setClientTRN("");setClientPhone("");setProject("");setPoReference("");setItems([makeEmpty()]);setBankName("");setAccountName("");setAccountNumber("");setIban("");setSwiftCode("");setNotes("");};

  const generatePdfBlob=async(data:TaxInvoiceData)=>{const[{pdf},{default:Doc}]=await Promise.all([import("@react-pdf/renderer"),import("./TaxInvoiceDocument")]);return await pdf(<Doc data={data}/>).toBlob();};

  const handlePreview=async()=>{
    const err=validate();if(err){setMessage({text:err,type:"error"});return;}
    try{setIsWorking(true);setMessage(null);
      const tempData:TaxInvoiceData={...buildPayload(),invoiceNo:"PREVIEW"};
      const blob=await generatePdfBlob(tempData);setPreviewUrl(URL.createObjectURL(blob));
    }catch(e:any){setMessage({text:e.message||"Failed.",type:"error"});}finally{setIsWorking(false);}
  };

  const handleDownload=async()=>{
    try{setIsWorking(true);setMessage(null);
      const res=await apiCall<{invoice:TaxInvoiceData}>("/api/tax-invoice",{method:"POST",body:buildPayload()});
      setInvoiceNo(res.invoice.invoiceNo);
      const blob=await generatePdfBlob(res.invoice);
      const url=URL.createObjectURL(blob);Object.assign(document.createElement("a"),{href:url,download:`${res.invoice.invoiceNo}.pdf`}).click();URL.revokeObjectURL(url);
      setMessage({text:`${res.invoice.invoiceNo} saved and downloaded.`,type:"success"});setPreviewUrl(null);reset();
    }catch(e:any){setMessage({text:e.message||"Failed.",type:"error"});}finally{setIsWorking(false);}
  };

  const handleShare=async()=>{
    try{setIsWorking(true);setMessage(null);
      const res=await apiCall<{invoice:TaxInvoiceData}>("/api/tax-invoice",{method:"POST",body:buildPayload()});
      const blob=await generatePdfBlob(res.invoice);
      const pdfFile=new File([blob],`${res.invoice.invoiceNo}.pdf`,{type:"application/pdf"});
      const text=[`Invoice: ${res.invoice.invoiceNo}`,`Client: ${res.invoice.clientName}`,`Total: AED ${res.invoice.total.toFixed(2)}`].join("\n");
      if(navigator.share){if(navigator.canShare?.({files:[pdfFile]}))await navigator.share({title:res.invoice.invoiceNo,text,files:[pdfFile]});else await navigator.share({title:res.invoice.invoiceNo,text});}
      else await navigator.clipboard.writeText(text);
      setMessage({text:`${res.invoice.invoiceNo} saved and shared.`,type:"success"});setPreviewUrl(null);reset();
    }catch(e:any){setMessage({text:e.message||"Failed.",type:"error"});}finally{setIsWorking(false);}
  };

  const inp="w-full px-4 py-3 bg-white border border-navy-200 rounded-xl text-navy placeholder-navy-300 text-sm transition-all duration-200 hover:border-navy-300";
  const lbl="block text-navy-500 text-xs font-bold uppercase tracking-wider mb-1.5";
  const sec="text-navy font-display text-lg font-bold mt-8 mb-4 pb-2 border-b border-navy-100";

  return(
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PreviewModal pdfUrl={previewUrl} title={invoiceNo} onClose={()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);setPreviewUrl(null);}} onDownload={handleDownload} onShare={handleShare} isWorking={isWorking}/>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div><h1 className="font-display text-2xl font-bold text-navy">Tax Invoice</h1><p className="mt-1 text-navy-400 text-sm">{invoiceNo} — {date}</p></div>
        <button onClick={handlePreview} disabled={isWorking} className="flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all shadow-lg shadow-navy/20 hover:-translate-y-0.5 btn-press animate-pulse-glow"><Eye size={18}/>{isWorking?"Working…":"Preview & Generate"}</button>
      </div>

      {message&&<div className={`mb-5 p-3.5 rounded-xl text-sm font-medium animate-scale-in ${message.type==="success"?"bg-green-50 border border-green-200 text-green-700":"bg-red-50 border border-red-200 text-red-600"}`}>{message.text}</div>}

      <div className="bg-white border border-navy-100 rounded-2xl p-6 sm:p-8 shadow-sm hover-lift">
        <h3 className={sec}>Client Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Client Name</label><SuggestInput field="clientName" value={clientName} onChange={setClientName} onPick={async (name) => {
  try {
    const r = await apiCall<{details:any}>(`/api/suggestions?lookup=client&name=${encodeURIComponent(name)}`);
    if (r.details) { if (r.details.clientAddress) setClientAddress(r.details.clientAddress); if (r.details.clientPhone) setClientPhone(r.details.clientPhone); if (r.details.clientTRN) setClientTRN(r.details.clientTRN); }
  } catch {}
}} placeholder="Client / Company" className={inp}/></div>
          <div><label className={lbl}>Client Address</label><input value={clientAddress} onChange={e=>setClientAddress(e.target.value)} className={inp} placeholder="Address"/></div>
          <div><label className={lbl}>Client TRN</label><input value={clientTRN} onChange={e=>setClientTRN(e.target.value)} className={inp} placeholder="Tax Registration Number"/></div>
          <div><label className={lbl}>Client Phone</label><input value={clientPhone} onChange={e=>setClientPhone(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Project</label><input value={project} onChange={e=>setProject(e.target.value)} className={inp} placeholder="Project name (optional)"/></div>
          <div><label className={lbl}>PO Reference</label><input value={poReference} onChange={e=>setPoReference(e.target.value)} className={inp} placeholder="Purchase order ref (optional)"/></div>
          <div><label className={lbl}>Due Date</label><input value={dueDate} onChange={e=>setDueDate(e.target.value)} className={inp} placeholder="DD-Month-YYYY"/></div>
        </div>

        <h3 className={sec}>Invoice Items</h3>
        <div className="hidden md:flex gap-2 mb-2 text-navy-400 text-xs font-bold uppercase tracking-wider px-1">
          <div className="flex-[4]">Description</div><div className="w-16">Qty</div><div className="w-20">Unit</div><div className="w-28">Unit Price</div><div className="w-16"/>
        </div>
        {items.map((item,i)=>(
          <div key={i} className="flex flex-wrap md:flex-nowrap gap-2 mb-3 items-center animate-slide-up" style={{animationDelay:`${i*0.05}s`}}>
            <input placeholder="Description" value={item.description} onChange={e=>updateItem(i,"description",e.target.value)} className={`${inp} flex-[4] min-w-[200px]`}/>
            <input type="number" min="0" placeholder="Qty" value={item.qty} onChange={e=>updateItem(i,"qty",e.target.value)} className={`${inp} w-16`}/>
            <input placeholder="UOM" value={item.uom} onChange={e=>updateItem(i,"uom",e.target.value)} className={`${inp} w-20`}/>
            <input type="number" min="0" step="0.01" placeholder="Price" value={item.unitPrice} onChange={e=>updateItem(i,"unitPrice",e.target.value)} className={`${inp} w-28`}/>
            <button onClick={()=>setItems(p=>p.length===1?p:p.filter((_,j)=>j!==i))} disabled={items.length===1} className="w-16 py-3 bg-red-50 hover:bg-red-100 text-red-500 font-semibold rounded-xl text-xs disabled:opacity-30 border border-red-200 btn-press">✕</button>
          </div>
        ))}
        <button onClick={()=>setItems(p=>[...p,makeEmpty()])} className="mt-2 px-4 py-2.5 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 btn-press">+ Add Item</button>

        <h3 className={sec}>Bank Details (Optional)</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Bank Name</label><input value={bankName} onChange={e=>setBankName(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Account Name</label><input value={accountName} onChange={e=>setAccountName(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Account Number</label><input value={accountNumber} onChange={e=>setAccountNumber(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>IBAN</label><input value={iban} onChange={e=>setIban(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>SWIFT Code</label><input value={swiftCode} onChange={e=>setSwiftCode(e.target.value)} className={inp}/></div>
        </div>

        <h3 className={sec}>Notes (Optional)</h3>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} className={`${inp} min-h-[80px] resize-y`} placeholder="Additional notes or terms"/>

        <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-navy-50 to-white border border-navy-100">
          <div className="flex justify-between text-navy-500 text-sm mb-2"><span>Subtotal:</span><strong className="text-navy">AED {totals.subtotal.toFixed(2)}</strong></div>
          <div className="flex justify-between text-navy-500 text-sm mb-3"><span>VAT (5%):</span><strong className="text-navy">AED {totals.vatAmount.toFixed(2)}</strong></div>
          <div className="flex justify-between text-navy text-xl font-bold pt-3 border-t border-navy-200"><span>Total:</span><span className="text-gold">AED {totals.total.toFixed(2)}</span></div>
          <p className="mt-2 text-navy-400 text-xs">{amountToWords(totals.total)}</p>
        </div>
      </div>
    </div>
  );
}