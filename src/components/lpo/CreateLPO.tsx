"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { LpoItem, LpoPdfData } from "./LpoDocument";
import PreviewModal from "@/components/PreviewModal";
import { Eye } from "lucide-react";

type PaymentPreset = "15"|"30"|"60"|"90"|"custom";
type DeliveryPreset = "Days"|"Weeks"|"Months"|"custom";
const DRAFT_KEY = "createLpoDraftV9";
const makeEmpty = (): LpoItem => ({ description:"",qty:"1",uom:"Nos",amount:"",discount:"0" });

export default function CreateLPO() {
  const [nxrNo, setNxrNo] = useState<number|null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [project, setProject] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [contact, setContact] = useState("");
  const [reference, setReference] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorTRN, setVendorTRN] = useState("");
  const [paymentPreset, setPaymentPreset] = useState<PaymentPreset>("30");
  const [customPaymentDays, setCustomPaymentDays] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryPreset, setDeliveryPreset] = useState<DeliveryPreset>("Days");
  const [customDeliveryTime, setCustomDeliveryTime] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [items, setItems] = useState<LpoItem[]>([makeEmpty()]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [message, setMessage] = useState<{text:string;type:"success"|"error"}|null>(null);
  const [previewUrl, setPreviewUrl] = useState<string|null>(null);

  useEffect(() => { try { const s = localStorage.getItem(DRAFT_KEY); if(!s) return; const d=JSON.parse(s); setClientName(d.clientName??""); setClientPhone(d.clientPhone??""); setProject(d.project??""); setSiteLocation(d.siteLocation??""); setContact(d.contact??""); setReference(d.reference??""); setVendorName(d.vendorName??""); setVendorAddress(d.vendorAddress??""); setVendorPhone(d.vendorPhone??""); setVendorTRN(d.vendorTRN??""); setPaymentPreset(d.paymentPreset??"30"); setCustomPaymentDays(d.customPaymentDays??""); setDeliveryNumber(d.deliveryNumber??""); setDeliveryPreset(d.deliveryPreset??"Days"); setCustomDeliveryTime(d.customDeliveryTime??""); setRequestedBy(d.requestedBy??""); setPreparedBy(d.preparedBy??""); if(Array.isArray(d.items)&&d.items.length>0) setItems(d.items); } catch{} }, []);
  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify({clientName,clientPhone,project,siteLocation,contact,reference,vendorName,vendorAddress,vendorPhone,vendorTRN,paymentPreset,customPaymentDays,deliveryNumber,deliveryPreset,customDeliveryTime,requestedBy,preparedBy,items})); });

  const paymentTerms = useMemo(()=>paymentPreset==="custom"?(customPaymentDays.trim()?`${customPaymentDays.trim()} days Credit`:""):`${paymentPreset} days Credit`,[paymentPreset,customPaymentDays]);
  const resolvedDelivery = useMemo(()=>{if(deliveryPreset==="custom"){const ct=customDeliveryTime.trim();return{dp:"",dt:deliveryNumber.trim()&&ct?`${deliveryNumber.trim()} ${ct}`:ct};}return{dp:deliveryPreset,dt:deliveryPreset.toLowerCase()};},[deliveryNumber,deliveryPreset,customDeliveryTime]);
  const calcItem = (item:LpoItem) => { const qty=Number(item.qty||0),up=Number(item.amount||0),dp=Math.max(0,Number(item.discount||0));const g=qty*up,da=g*(dp/100),st=g-da,vt=st*0.05;return{discountAmount:da,subtotal:st,vat:vt,total:st+vt}; };
  const totals = useMemo(()=>items.reduce((a,i)=>{const r=calcItem(i);a.discountAmount+=r.discountAmount;a.subtotal+=r.subtotal;a.vat+=r.vat;a.total+=r.total;return a;},{discountAmount:0,subtotal:0,vat:0,total:0}),[items]);
  const updateItem = (i:number,f:keyof LpoItem,v:string)=>setItems(p=>p.map((item,idx)=>idx===i?{...item,[f]:v}:item));

  const validate = () => {
    if(!clientName.trim()) return "Please enter Client Name."; if(!project.trim()) return "Please enter Project Name."; if(!siteLocation.trim()) return "Please enter Site Location.";
    if(!vendorName.trim()) return "Please enter Vendor Name."; if(!requestedBy.trim()) return "Please enter Requested By."; if(!preparedBy.trim()) return "Please enter Prepared By.";
    if(paymentPreset==="custom"&&!customPaymentDays.trim()) return "Please enter custom payment days."; if(deliveryPreset==="custom"&&!customDeliveryTime.trim()) return "Please enter custom delivery time.";
    if(!items.some(i=>i.description.trim()&&Number(i.qty)>0)) return "Please add at least one valid item."; return "";
  };

  const buildPayload = () => ({
    clientName:clientName.trim(),clientPhone:clientPhone.trim(),project:project.trim(),siteLocation:siteLocation.trim(),contact:contact.trim(),reference:reference.trim(),
    vendorName:vendorName.trim(),vendorAddress:vendorAddress.trim(),vendorPhone:vendorPhone.trim(),vendorTRN:vendorTRN.trim(),items,
    totalDiscount:+totals.discountAmount.toFixed(2),subtotal:+totals.subtotal.toFixed(2),vat:+totals.vat.toFixed(2),total:+totals.total.toFixed(2),
    paymentTerms,deliveryterms:resolvedDelivery.dt,deliveryPreset:resolvedDelivery.dp,deliverynumber:deliveryNumber.trim(),
    requestedBy:requestedBy.trim(),preparedBy:preparedBy.trim(),attachmentNames:attachments.map(f=>f.name),
  });

  const clearDraft = () => { localStorage.removeItem(DRAFT_KEY); setNxrNo(null); setClientName(""); setClientPhone(""); setProject(""); setSiteLocation(""); setContact(""); setReference(""); setVendorName(""); setVendorAddress(""); setVendorPhone(""); setVendorTRN(""); setPaymentPreset("30"); setCustomPaymentDays(""); setDeliveryNumber(""); setDeliveryPreset("Days"); setCustomDeliveryTime(""); setRequestedBy(""); setPreparedBy(""); setItems([makeEmpty()]); setAttachments([]); };

  const generatePdfBlob = async (data: LpoPdfData) => {
    const [{pdf},{default:LpoDocument}] = await Promise.all([import("@react-pdf/renderer"),import("./LpoDocument")]);
    return await pdf(<LpoDocument lpoData={data}/>).toBlob();
  };

  const handlePreview = async () => {
    const err = validate(); if(err){setMessage({text:err,type:"error"});return;}
    try {
      setIsWorking(true); setMessage(null);
      const payload = buildPayload();
      const tempLpo: LpoPdfData = { ...payload, nxrNo: 0, approved: false, approvedBy: "", approvedAt: undefined, shareLink: undefined };
      const blob = await generatePdfBlob(tempLpo);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch(e:any){setMessage({text:e.message||"Failed.",type:"error"});}
    finally{setIsWorking(false);}
  };

  const handleDownload = async () => {
    try {
      setIsWorking(true); setMessage(null);
      const res = await apiCall<{lpo:LpoPdfData}>("/api/lpo",{method:"POST",body:buildPayload()});
      setNxrNo(res.lpo.nxrNo);
      const blob = await generatePdfBlob(res.lpo);
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement("a"),{href:url,download:`LPO-${res.lpo.nxrNo}.pdf`}).click();
      URL.revokeObjectURL(url);
      setMessage({text:`LPO #${res.lpo.nxrNo} saved and downloaded.`,type:"success"});
      setPreviewUrl(null); clearDraft();
    } catch(e:any){setMessage({text:e.message||"Download failed.",type:"error"});}
    finally{setIsWorking(false);}
  };

  const handleShare = async () => {
    try {
      setIsWorking(true); setMessage(null);
      const res = await apiCall<{lpo:LpoPdfData}>("/api/lpo",{method:"POST",body:buildPayload()});
      setNxrNo(res.lpo.nxrNo);
      const blob = await generatePdfBlob(res.lpo);
      const pdfFile = new File([blob],`LPO-${res.lpo.nxrNo}.pdf`,{type:"application/pdf"});
      const text = [`LPO #${res.lpo.nxrNo}`,`Client: ${res.lpo.clientName}`,`Total: AED ${res.lpo.total.toFixed(2)}`].join("\n");
      if(navigator.share){
        const files=[pdfFile,...attachments];
        if(navigator.canShare?.({files})) await navigator.share({title:`LPO #${res.lpo.nxrNo}`,text,files});
        else await navigator.share({title:`LPO #${res.lpo.nxrNo}`,text});
      } else {
        await navigator.clipboard.writeText(text);
      }
      setMessage({text:`LPO #${res.lpo.nxrNo} saved and shared.`,type:"success"});
      setPreviewUrl(null); clearDraft();
    } catch(e:any){setMessage({text:e.message||"Share failed.",type:"error"});}
    finally{setIsWorking(false);}
  };

  const inp = "w-full px-4 py-3 bg-white border border-navy-200 rounded-xl text-navy placeholder-navy-300 text-sm transition-all duration-200 hover:border-navy-300";
  const lbl = "block text-navy-500 text-xs font-bold uppercase tracking-wider mb-1.5";
  const sec = "text-navy font-display text-lg font-bold mt-8 mb-4 pb-2 border-b border-navy-100";

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PreviewModal pdfUrl={previewUrl} title={`LPO #${nxrNo||"Draft"}`} onClose={()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);setPreviewUrl(null);}} onDownload={handleDownload} onShare={handleShare} isWorking={isWorking} />

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">{nxrNo?`LPO #${nxrNo}`:"Create LPO"}</h1>
          <p className="mt-1 text-navy-400 text-sm">{nxrNo?"Nexayra Arc General Contracting L.L.C.":"Number assigned on generation."}</p>
        </div>
        <button onClick={handlePreview} disabled={isWorking}
          className="flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all shadow-lg shadow-navy/20 hover:shadow-xl hover:-translate-y-0.5 btn-press animate-pulse-glow">
          <Eye size={18}/> {isWorking?"Working…":"Preview & Generate"}
        </button>
      </div>

      {message && <div className={`mb-5 p-3.5 rounded-xl text-sm font-medium animate-scale-in ${message.type==="success"?"bg-green-50 border border-green-200 text-green-700":"bg-red-50 border border-red-200 text-red-600"}`}>{message.text}</div>}

      <div className="bg-white border border-navy-100 rounded-2xl p-6 sm:p-8 shadow-sm hover-lift">
        <h3 className={sec}>Project Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="animate-fade-in-up delay-1"><label className={lbl}>Project Code</label><input placeholder="Project Code" value={project} onChange={e=>setProject(e.target.value)} className={inp}/></div>
          <div className="animate-fade-in-up delay-2"><label className={lbl}>Project Name</label><input placeholder="Project Name" value={clientName} onChange={e=>setClientName(e.target.value)} className={inp}/></div>
          <div className="animate-fade-in-up delay-3"><label className={lbl}>Contact Person</label><input placeholder="Contact Person" value={contact} onChange={e=>setContact(e.target.value)} className={inp}/></div>
          <div className="animate-fade-in-up delay-4"><label className={lbl}>Contact Number</label><input placeholder="Contact Number" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} className={inp}/></div>
          <div className="animate-fade-in-up delay-5"><label className={lbl}>Site Location</label><input placeholder="Site Location" value={siteLocation} onChange={e=>setSiteLocation(e.target.value)} className={inp}/></div>
          <div className="animate-fade-in-up delay-5"><label className={lbl}>Quotation Ref.</label><input placeholder="Reference Number" value={reference} onChange={e=>setReference(e.target.value)} className={inp}/></div>
        </div>

        <h3 className={sec}>Vendor Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Vendor Name</label><input placeholder="Vendor Name" value={vendorName} onChange={e=>setVendorName(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Vendor Address</label><input placeholder="Vendor Address" value={vendorAddress} onChange={e=>setVendorAddress(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Vendor Phone</label><input placeholder="Vendor Phone" value={vendorPhone} onChange={e=>setVendorPhone(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Vendor TRN</label><input placeholder="Vendor TRN" value={vendorTRN} onChange={e=>setVendorTRN(e.target.value)} className={inp}/></div>
        </div>

        <h3 className={sec}>Payment Terms</h3>
        <div className="flex flex-wrap gap-3">
          <select value={paymentPreset} onChange={e=>setPaymentPreset(e.target.value as PaymentPreset)} className={`${inp} w-auto min-w-[200px]`}>
            <option value="15">15 days Credit</option><option value="30">30 days Credit</option><option value="60">60 days Credit</option><option value="90">90 days Credit</option><option value="custom">Custom</option>
          </select>
          {paymentPreset==="custom"&&<input type="number" min="1" placeholder="Custom days" value={customPaymentDays} onChange={e=>setCustomPaymentDays(e.target.value)} className={`${inp} w-auto min-w-[180px]`}/>}
        </div>

        <h3 className={sec}>Item Details</h3>
        <div className="hidden md:flex gap-2 mb-2 text-navy-400 text-xs font-bold uppercase tracking-wider px-1">
          <div className="flex-[4]">Description</div><div className="w-20">Qty</div><div className="w-24">Unit</div><div className="w-28">Amount</div><div className="w-28">Discount %</div><div className="w-20"/>
        </div>
        {items.map((item,i)=>(
          <div key={i} className="flex flex-wrap md:flex-nowrap gap-2 mb-3 items-center animate-slide-up" style={{animationDelay:`${i*0.05}s`}}>
            <input placeholder="Description" value={item.description} onChange={e=>updateItem(i,"description",e.target.value)} className={`${inp} flex-[4] min-w-[200px]`}/>
            <input type="number" min="0" placeholder="Qty" value={item.qty} onChange={e=>updateItem(i,"qty",e.target.value)} className={`${inp} w-20`}/>
            <input placeholder="UOM" value={item.uom} onChange={e=>updateItem(i,"uom",e.target.value)} className={`${inp} w-24`}/>
            <input type="number" min="0" step="0.01" placeholder="Amount" value={item.amount} onChange={e=>updateItem(i,"amount",e.target.value)} className={`${inp} w-28`}/>
            <input type="number" min="0" max="100" step="0.01" placeholder="Disc %" value={item.discount} onChange={e=>updateItem(i,"discount",e.target.value)} className={`${inp} w-28`}/>
            <button onClick={()=>setItems(p=>p.length===1?p:p.filter((_,j)=>j!==i))} disabled={items.length===1} className="w-20 py-3 bg-red-50 hover:bg-red-100 text-red-500 font-semibold rounded-xl text-xs disabled:opacity-30 transition-all border border-red-200 btn-press">Remove</button>
          </div>
        ))}
        <button onClick={()=>setItems(p=>[...p,makeEmpty()])} className="mt-2 px-4 py-2.5 bg-navy-50 border border-navy-200 rounded-xl text-navy text-sm font-semibold hover:bg-navy-100 transition-all btn-press">+ Add Item</button>

        <h3 className={sec}>Delivery Terms</h3>
        <div className="flex flex-wrap gap-3">
          <input placeholder="Delivery Time" value={deliveryNumber} onChange={e=>setDeliveryNumber(e.target.value)} className={`${inp} w-auto min-w-[160px]`}/>
          <select value={deliveryPreset} onChange={e=>setDeliveryPreset(e.target.value as DeliveryPreset)} className={`${inp} w-auto min-w-[160px]`}>
            <option value="Days">Days</option><option value="Weeks">Weeks</option><option value="Months">Months</option><option value="custom">Custom</option>
          </select>
          {deliveryPreset==="custom"&&<input placeholder="Custom term" value={customDeliveryTime} onChange={e=>setCustomDeliveryTime(e.target.value)} className={`${inp} w-auto min-w-[200px]`}/>}
        </div>

        <h3 className={sec}>Approval Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Requested By</label><input placeholder="Requested By" value={requestedBy} onChange={e=>setRequestedBy(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Prepared By</label><input placeholder="Prepared By" value={preparedBy} onChange={e=>setPreparedBy(e.target.value)} className={inp}/></div>
        </div>

        <h3 className={sec}>Attachments</h3>
        <input type="file" multiple onChange={e=>{if(e.target.files)setAttachments(p=>[...p,...Array.from(e.target.files!)]);}} className="text-navy-500 text-sm"/>
        {attachments.length>0&&<div className="mt-3 space-y-2">{attachments.map((f,i)=>(<div key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-navy-50 border border-navy-100 rounded-xl animate-scale-in"><span className="text-navy text-sm truncate">{f.name}</span><button onClick={()=>setAttachments(p=>p.filter((_,j)=>j!==i))} className="text-red-500 text-xs font-semibold">Remove</button></div>))}</div>}

        <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-navy-50 to-white border border-navy-100">
          <div className="flex justify-between text-navy-500 text-sm mb-2"><span>Total Discount:</span><strong className="text-navy">AED {totals.discountAmount.toFixed(2)}</strong></div>
          <div className="flex justify-between text-navy-500 text-sm mb-2"><span>Subtotal:</span><strong className="text-navy">AED {totals.subtotal.toFixed(2)}</strong></div>
          <div className="flex justify-between text-navy-500 text-sm mb-3"><span>VAT (5%):</span><strong className="text-navy">AED {totals.vat.toFixed(2)}</strong></div>
          <div className="flex justify-between text-navy text-xl font-bold pt-3 border-t border-navy-200"><span>Total:</span><span className="text-gold">AED {totals.total.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}