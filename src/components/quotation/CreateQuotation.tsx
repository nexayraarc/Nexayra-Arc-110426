"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { apiCall } from "@/lib/api-client";
import type { QuotationData, QuotationItem } from "./QuotationDocument";
import PreviewModal from "@/components/PreviewModal";
import { Eye } from "lucide-react";

const DRAFT_KEY = "createQuotationDraftV4";
const DEFAULT_INTRO_PREFIX = "Pertaining to the above-mentioned project / subject and further to your enquiry we hereby gladly submit our commercial proposal for ";
const DEFAULT_INTRO_SUFFIX = " in accordance with the annexures given below:";
const DEFAULT_ANNEXURE_1 = "Scope of work, Inclusions and Exclusions";
const DEFAULT_ANNEXURE_2 = "Bill of Quantity";
const DEFAULT_ANNEXURE_3 = "Terms & Conditions";
const DEFAULT_CLOSING = "We hope that our proposal is in line with your requirements. In case of any required additional information or clarification, you can contact the undersigned.";
const DEFAULT_SIGNATORY_NAME = "Ashish Dhir";
const DEFAULT_SIGNATORY_DESIGNATION = "Operation Manager";
const DEFAULT_EXCLUSIONS = ["Any materials required for the installation, including but not limited to AC units, ducting materials, communication cables, refrigerant, rubber pads. and other accessories, are not included in this quotation. All materials shall be provided by the contractor.","Any kind of civil works such as foundations or steel structural support for indoor units, necessary openings for the passage of the piping and closing the openings after erection, external openings, false ceiling cutting & opening etc.","All electric items as per local regulations distribution board, control panel, isolator, ELCB, P.F correction capacitors, U.V relay etc., power wiring/Conduits, up to the junction box of air conditioning units.","Cranage, scaffolding, and man lift required for the installation works.","Generator connection & shifting.","Power and water connections required for installation and erection works.","Third party testing & commissioning.","Electrical & power connection.","Cladding / trucking works."];
const DEFAULT_PAYMENT_TERMS = ["Payments in UAE Dirham to be paid in UAE as follows;","i. 25% advance payment","ii. The balance will be made against progress of works.","iii. Our price doesn't include any item which is not mentioned in this proposal."];

function formatToday():string{const n=new Date();return`${String(n.getDate()).padStart(2,"0")}-${n.toLocaleString("en-US",{month:"long"})}-${n.getFullYear()}`;}
function toNumber(v:string):number{const p=Number(String(v).replace(/,/g,"").replace(/\/-/g,"").trim());return Number.isFinite(p)?p:0;}
function convertNumberToWords(num:number):string{const ones=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];const teens=["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];const tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];const scales=["","Thousand","Million","Billion"];if(num===0)return"Zero";const ch=(n:number)=>{let r="";const h=Math.floor(n/100);const rem=n%100;if(h>0)r+=`${ones[h]} Hundred`;if(rem>=20){if(r)r+=" ";r+=tens[Math.floor(rem/10)];if(rem%10>0)r+=` ${ones[rem%10]}`;}else if(rem>=10){if(r)r+=" ";r+=teens[rem-10];}else if(rem>0){if(r)r+=" ";r+=ones[rem];}return r;};const parts:string[]=[];let si=0;let v=num;while(v>0){const c=v%1000;if(c!==0)parts.unshift(`${ch(c)}${si>0?` ${scales[si]}`:""}`);v=Math.floor(v/1000);si++;}return parts.join(" ").trim();}
function amountToWords(a:number):string{const s=Number.isFinite(a)?a:0;const d=Math.floor(s);const f=Math.round((s-d)*100);let r=`${convertNumberToWords(d)} Dirhams`;if(f>0)r+=` and ${convertNumberToWords(f)} Fils`;return`${r} Only`;}
function fmtMoney(v:number):string{return`${v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}/-`;}

export default function CreateQuotation(){
  const [quotationNo,setQuotationNo]=useState("(auto)");
  const [date,setDate]=useState(""); const [to,setTo]=useState(""); const [attn,setAttn]=useState(""); const [project,setProject]=useState(""); const [serviceTitle,setServiceTitle]=useState("");
  const [inclusionItems,setInclusionItems]=useState<string[]>([""]); const [items,setItems]=useState<QuotationItem[]>([{srNo:"1",description:"",unit:"",amount:""}]);
  const [attachments,setAttachments]=useState<File[]>([]); const [isWorking,setIsWorking]=useState(false); const [message,setMessage]=useState<{text:string;type:"success"|"error"}|null>(null);
  const [validityMode,setValidityMode]=useState("30"); const [customValidityDays,setCustomValidityDays]=useState("");
  const [previewUrl,setPreviewUrl]=useState<string|null>(null); const [pendingData,setPendingData]=useState<QuotationData|null>(null);

  useEffect(()=>{setDate(formatToday());try{const s=localStorage.getItem(DRAFT_KEY);if(!s)return;const d=JSON.parse(s);setTo(d.to??"");setAttn(d.attn??"");setProject(d.project??"");setServiceTitle(d.serviceTitle??"");if(Array.isArray(d.inclusionItems)&&d.inclusionItems.length>0)setInclusionItems(d.inclusionItems);if(Array.isArray(d.items)&&d.items.length>0)setItems(d.items);setValidityMode(d.validityMode??"30");setCustomValidityDays(d.customValidityDays??"");}catch{}},[]);
  useEffect(()=>{localStorage.setItem(DRAFT_KEY,JSON.stringify({to,attn,project,serviceTitle,inclusionItems,items,validityMode,customValidityDays}));});

  const totals=useMemo(()=>{const t=items.reduce((s,i)=>s+toNumber(i.amount||"0"),0);const vat=t*0.05;return{totalWithoutVat:t,vatPercent:5,vatAmount:vat,totalWithVat:t+vat};},[items]);
  const autoWords=useMemo(()=>amountToWords(totals.totalWithVat),[totals.totalWithVat]);
  const resolvedDays=validityMode==="custom"?(customValidityDays.trim()||"30"):validityMode;
  const validityText=`${resolvedDays} Days from the date of this offer subject to written confirmation thereafter.`;
  const introParagraph=`${DEFAULT_INTRO_PREFIX}${serviceTitle||"________________"}${DEFAULT_INTRO_SUFFIX}`;

  const updateItem=(i:number,f:keyof QuotationItem,v:string)=>setItems(p=>p.map((item,idx)=>idx===i?{...item,[f]:v}:item));
  const addRow=()=>setItems(p=>[...p,{srNo:String(p.length+1),description:"",unit:"",amount:""}]);
  const removeRow=(i:number)=>setItems(p=>{if(p.length===1)return p;return p.filter((_,j)=>j!==i).map((x,j)=>({...x,srNo:String(j+1)}));});
  const updateInclusion=(i:number,v:string)=>setInclusionItems(p=>p.map((x,j)=>j===i?v:x));
  const addInclusion=()=>setInclusionItems(p=>[...p,""]);
  const removeInclusion=(i:number)=>setInclusionItems(p=>p.length===1?p:p.filter((_,j)=>j!==i));

  const validate=()=>{if(!serviceTitle.trim())return"Please enter the service title.";if(!items.some(i=>i.description.trim()||i.amount.trim()))return"Please enter at least one BOQ row.";if(!inclusionItems.some(i=>i.trim()))return"Please enter at least one inclusion.";return"";};

  const buildPayload=():Omit<QuotationData,"quotationNo">=>({date:date.trim(),to:to.trim(),attn:attn.trim(),project:project.trim(),serviceTitle:serviceTitle.trim(),introParagraph,annexure1Title:DEFAULT_ANNEXURE_1,annexure2Title:DEFAULT_ANNEXURE_2,annexure3Title:DEFAULT_ANNEXURE_3,closingParagraph:DEFAULT_CLOSING,signatoryName:DEFAULT_SIGNATORY_NAME,signatoryDesignation:DEFAULT_SIGNATORY_DESIGNATION,inclusionItems:inclusionItems.filter(i=>i.trim()),exclusionItems:DEFAULT_EXCLUSIONS,boqItems:items,totalWithoutVat:+totals.totalWithoutVat.toFixed(2),vatPercent:totals.vatPercent,vatAmount:+totals.vatAmount.toFixed(2),totalWithVat:+totals.totalWithVat.toFixed(2),amountInWords:autoWords,paymentTerms:DEFAULT_PAYMENT_TERMS,validity:validityText,attachmentNames:attachments.map(f=>f.name)});

  const reset=()=>{localStorage.removeItem(DRAFT_KEY);setQuotationNo("(auto)");setDate(formatToday());setTo("");setAttn("");setProject("");setServiceTitle("");setInclusionItems([""]);setItems([{srNo:"1",description:"",unit:"",amount:""}]);setValidityMode("30");setCustomValidityDays("");setAttachments([]);};

  const generatePdfBlob=async(data:QuotationData)=>{const[{pdf},{default:QDoc}]=await Promise.all([import("@react-pdf/renderer"),import("./QuotationDocument")]);return await pdf(<QDoc quotationData={data}/>).toBlob();};

  const handlePreview=async()=>{
    const err=validate();if(err){setMessage({text:err,type:"error"});return;}
    try{setIsWorking(true);setMessage(null);
      const res=await apiCall<{quotation:QuotationData}>("/api/quotation",{method:"POST",body:buildPayload()});
      setPendingData(res.quotation);setQuotationNo(res.quotation.quotationNo);
      const blob=await generatePdfBlob(res.quotation);setPreviewUrl(URL.createObjectURL(blob));
    }catch(e:any){setMessage({text:e.message||"Failed.",type:"error"});}finally{setIsWorking(false);}
  };

  const handleDownload=async()=>{if(!pendingData)return;try{setIsWorking(true);const blob=await generatePdfBlob(pendingData);const url=URL.createObjectURL(blob);Object.assign(document.createElement("a"),{href:url,download:`${pendingData.quotationNo}.pdf`}).click();URL.revokeObjectURL(url);setMessage({text:`${pendingData.quotationNo} downloaded.`,type:"success"});setPreviewUrl(null);reset();}catch(e:any){setMessage({text:e.message,type:"error"});}finally{setIsWorking(false);}};
  const handleShare=async()=>{if(!pendingData)return;try{setIsWorking(true);const blob=await generatePdfBlob(pendingData);const pdfFile=new File([blob],`${pendingData.quotationNo}.pdf`,{type:"application/pdf"});const text=[`Quotation: ${pendingData.quotationNo}`,`Total: AED ${pendingData.totalWithVat.toFixed(2)}`].join("\n");if(navigator.share){const f=[pdfFile,...attachments];if(navigator.canShare?.({files:f}))await navigator.share({title:pendingData.quotationNo,text,files:f});else await navigator.share({title:pendingData.quotationNo,text});}else await navigator.clipboard.writeText(text);setMessage({text:`${pendingData.quotationNo} shared.`,type:"success"});setPreviewUrl(null);reset();}catch(e:any){setMessage({text:e.message,type:"error"});}finally{setIsWorking(false);}};

  const paper:CSSProperties={background:"#fff",border:"1px solid #d8dde8",borderRadius:"10px",padding:"24px 26px",marginBottom:"18px",boxShadow:"0 8px 22px rgba(0,0,0,0.06)",fontFamily:"'Times New Roman',Georgia,serif",color:"#111827"};
  const ulH:CSSProperties={fontSize:"16px",fontWeight:700,textDecoration:"underline",marginBottom:"10px"};
  const ulHC:CSSProperties={...ulH,textAlign:"center",fontSize:"18px",marginBottom:"16px"};
  const bodyP:CSSProperties={fontSize:"16px",lineHeight:1.4,margin:"10px 0"};

  return(
    <div className="max-w-[1160px] mx-auto animate-fade-in-up">
      <PreviewModal pdfUrl={previewUrl} title={quotationNo} onClose={()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);setPreviewUrl(null);}} onDownload={handleDownload} onShare={handleShare} isWorking={isWorking}/>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div><h2 className="font-display text-3xl font-bold text-navy m-0">Quotation Draft</h2><p className="mt-2 text-navy-400 text-sm max-w-[840px]">Quotation number assigned automatically. Preview before generating.</p></div>
        <button onClick={handlePreview} disabled={isWorking} className="flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all shadow-lg shadow-navy/20 hover:-translate-y-0.5 btn-press animate-pulse-glow"><Eye size={18}/>{isWorking?"Working…":"Preview & Generate"}</button>
      </div>

      {message&&<div className={`mb-4 p-3 rounded-xl text-sm font-medium animate-scale-in ${message.type==="success"?"bg-green-50 border border-green-200 text-green-700":"bg-red-50 border border-red-200 text-red-600"}`}>{message.text}</div>}

      {/* Page 1 */}
      <div style={paper} className="hover-lift">
        <div style={{fontSize:"26px",fontWeight:700,color:"#1c2143",lineHeight:1}}>NEXAYRA ARC</div>
        <div style={{fontSize:"12px",fontWeight:700,letterSpacing:"0.06em",marginBottom:"22px"}}>GENERAL CONTRACTING LLC</div>
        <div className="grid gap-2.5">
          <RowLabelInput label="Quotation No:" value={quotationNo} readOnly/><RowLabelInput label="Date:" value={date} readOnly/>
          <RowLabelInput label="To:" value={to} onChange={setTo}/><RowLabelInput label="Attn:" value={attn} onChange={setAttn}/>
          <RowLabelInput label="Project:" value={project} onChange={setProject} multiline/>
          <RowSubjectInput label="Subject:" prefix="Quotation & Proposal for " value={serviceTitle} onChange={setServiceTitle}/>
        </div>
        <p style={bodyP}>Dear Sir,</p><p style={bodyP}>{introParagraph}</p>
        <div style={{display:"grid",gridTemplateColumns:"165px 1fr",gap:"8px",marginTop:"18px",fontSize:"18px"}}><span>ANNEXURE – 1</span><span>{DEFAULT_ANNEXURE_1}</span></div>
        <div style={{display:"grid",gridTemplateColumns:"165px 1fr",gap:"8px",marginTop:"18px",fontSize:"18px"}}><span>ANNEXURE – 2</span><span>{DEFAULT_ANNEXURE_2}</span></div>
        <div style={{display:"grid",gridTemplateColumns:"165px 1fr",gap:"8px",marginTop:"18px",fontSize:"18px"}}><span>ANNEXURE – 3</span><span>{DEFAULT_ANNEXURE_3}</span></div>
        <p style={{...bodyP,marginTop:24}}>{DEFAULT_CLOSING}</p>
        <div style={{marginTop:"34px"}}><p style={bodyP}>Truly yours,</p><p style={bodyP}>For Nexayra Arc General Contracting L.L.C</p><div style={{width:"120px",height:"36px",border:"1px dashed #94a3b8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",color:"#64748b",margin:"10px 0 6px"}}>signature</div><p style={bodyP}>{DEFAULT_SIGNATORY_NAME}</p><p style={bodyP}>{DEFAULT_SIGNATORY_DESIGNATION}</p></div>
      </div>

      {/* Page 2 */}
      <div style={paper} className="hover-lift">
        <div style={ulHC}>ANNEXURE-1:</div><div style={ulH}>OUR PROPOSAL INCLUDES THE FOLLOWING:</div>
        <div className="grid gap-2.5">{inclusionItems.map((item,i)=>(<div key={i} className="flex gap-2.5 items-start animate-slide-up" style={{animationDelay:`${i*0.05}s`}}><textarea value={item} onChange={e=>updateInclusion(i,e.target.value)} style={{flex:1,minHeight:"76px",padding:"10px 12px",border:"1px solid #cbd5e1",borderRadius:"6px",fontSize:"15px",fontFamily:"'Times New Roman',Georgia,serif",resize:"vertical",boxSizing:"border-box"}}/><button onClick={()=>removeInclusion(i)} disabled={inclusionItems.length===1} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 btn-press">Remove</button></div>))}</div>
        <div style={{marginTop:10,marginBottom:14}}><button onClick={addInclusion} className="px-4 py-2 rounded-lg bg-white text-navy border border-navy font-semibold text-sm hover:bg-navy-50 btn-press">Add Inclusion</button></div>
        <div style={ulH}>EXCLUSIONS:</div>
        <ul style={{margin:"0 0 14px 22px",padding:0}}>{DEFAULT_EXCLUSIONS.map((item,i)=><li key={i} style={{fontSize:"16px",lineHeight:1.35,marginBottom:"6px"}}>{item}</li>)}</ul>
        <div style={ulHC}>ANNEXURE-2:</div><div style={ulH}>SCHEDULE OF PRICES</div><p style={bodyP}>Our price for the execution of the above-mentioned scope of works is as follows:</p>
        <div style={{border:"1px solid #111827",marginTop:"10px"}}>
          <div style={{display:"flex",background:"#d8e4f2",borderBottom:"1px solid #111827"}}><div style={{padding:"8px 6px",fontSize:"15px",fontWeight:700,textAlign:"center",borderRight:"1px solid #111827",width:"12%"}}>Sr. no.</div><div style={{padding:"8px 6px",fontSize:"15px",fontWeight:700,textAlign:"center",borderRight:"1px solid #111827",width:"59%"}}>Description</div><div style={{padding:"8px 6px",fontSize:"15px",fontWeight:700,textAlign:"center",borderRight:"1px solid #111827",width:"11%"}}>Unit</div><div style={{padding:"8px 6px",fontSize:"15px",fontWeight:700,textAlign:"center",width:"18%"}}>Amount (AED)</div></div>
          {items.map((item,i)=>(<div key={i} style={{display:"flex",borderBottom:"1px solid #111827",minHeight:"58px"}}><div style={{padding:0,borderRight:"1px solid #111827",width:"12%",display:"flex",alignItems:"center",justifyContent:"center"}}>{item.srNo}</div><div style={{padding:0,borderRight:"1px solid #111827",width:"59%",display:"flex",alignItems:"stretch"}}><textarea value={item.description} onChange={e=>updateItem(i,"description",e.target.value)} style={{width:"100%",minHeight:"56px",border:"none",outline:"none",resize:"vertical",padding:"8px 6px",fontSize:"15px",lineHeight:1.25,fontFamily:"'Times New Roman',Georgia,serif"}}/></div><div style={{padding:0,borderRight:"1px solid #111827",width:"11%",display:"flex",alignItems:"stretch"}}><input value={item.unit} onChange={e=>updateItem(i,"unit",e.target.value)} style={{width:"100%",border:"none",outline:"none",padding:"8px 6px",fontSize:"15px",fontFamily:"'Times New Roman',Georgia,serif"}}/></div><div style={{padding:0,width:"18%",display:"flex",alignItems:"stretch"}}><input value={item.amount} onChange={e=>updateItem(i,"amount",e.target.value)} style={{width:"100%",border:"none",outline:"none",padding:"8px 6px",fontSize:"15px",fontFamily:"'Times New Roman',Georgia,serif"}}/></div></div>))}
          <div style={{display:"flex",gap:"10px",padding:"10px 8px",borderTop:"1px solid #111827"}}><button onClick={addRow} className="px-4 py-2 rounded-lg bg-white text-navy border border-navy font-semibold text-sm hover:bg-navy-50 btn-press">Add BOQ Row</button><button onClick={()=>removeRow(items.length-1)} disabled={items.length===1} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-50 btn-press">Remove Last</button></div>
        </div>
      </div>

      {/* Page 3 */}
      <div style={paper} className="hover-lift">
        <div style={{border:"1px solid #111827"}}>
          <div style={{display:"flex",borderBottom:"1px solid #111827"}}><div style={{width:"82%",padding:"6px 8px",textAlign:"center",fontSize:"16px",borderRight:"1px solid #111827"}}>Total Amount without Vat (AED)</div><div style={{width:"18%",padding:"6px 8px",textAlign:"right",fontSize:"16px"}}>{fmtMoney(totals.totalWithoutVat)}</div></div>
          <div style={{display:"flex",borderBottom:"1px solid #111827"}}><div style={{width:"82%",padding:"6px 8px",textAlign:"center",fontSize:"16px",borderRight:"1px solid #111827"}}>Vat@5%</div><div style={{width:"18%",padding:"6px 8px",textAlign:"right",fontSize:"16px"}}>{fmtMoney(totals.vatAmount)}</div></div>
          <div style={{display:"flex",borderBottom:"1px solid #111827"}}><div style={{width:"82%",padding:"6px 8px",textAlign:"center",fontSize:"16px",borderRight:"1px solid #111827"}}>Total Amount with Vat</div><div style={{width:"18%",padding:"6px 8px",textAlign:"right",fontSize:"16px"}}>{fmtMoney(totals.totalWithVat)}</div></div>
          <div style={{display:"flex"}}><div style={{width:"22%",padding:"6px 8px",fontSize:"16px",fontWeight:700,borderRight:"1px solid #111827"}}>In Words (AED):</div><div style={{width:"78%",padding:"6px 8px",fontSize:"16px",fontWeight:700}}>{autoWords}</div></div>
        </div>
        <div style={{marginTop:22}}><div style={ulH}>PAYMENT TERMS:</div>{DEFAULT_PAYMENT_TERMS.map((t,i)=><div key={i} style={{fontSize:"16px",lineHeight:1.3,marginBottom:2}}>{t}</div>)}</div>
        <div style={{marginTop:22}}>
          <div style={ulH}>VALIDITY:</div>
          <div className="flex gap-2.5 items-center mb-2.5">
            <select value={validityMode} onChange={e=>setValidityMode(e.target.value)} style={{minHeight:"40px",minWidth:"180px",padding:"8px 10px",fontSize:"15px",fontFamily:"'Times New Roman',Georgia,serif",border:"1px solid #cbd5e1",borderRadius:"6px",background:"#fff"}}><option value="15">15 Days</option><option value="30">30 Days</option><option value="45">45 Days</option><option value="60">60 Days</option><option value="90">90 Days</option><option value="custom">Custom</option></select>
            {validityMode==="custom"&&<input placeholder="Custom days" value={customValidityDays} onChange={e=>setCustomValidityDays(e.target.value)} style={{minHeight:"40px",width:"140px",padding:"8px 10px",fontSize:"15px",fontFamily:"'Times New Roman',Georgia,serif",border:"1px solid #cbd5e1",borderRadius:"6px"}}/>}
          </div>
          <div style={{fontSize:"16px",lineHeight:1.4}}>{validityText}</div>
        </div>
        <div style={{marginTop:22}}>
          <div style={ulH}>ATTACHMENTS:</div>
          <input type="file" multiple onChange={e=>{if(e.target.files)setAttachments(p=>[...p,...Array.from(e.target.files!)]);}} style={{color:"#111827",fontFamily:"'Times New Roman',serif"}}/>
          {attachments.length>0&&<div className="grid gap-2 mt-3">{attachments.map((f,i)=>(<div key={`${f.name}-${i}`} className="flex justify-between items-center gap-3 p-2.5 rounded-lg bg-navy-50 border border-navy-100 animate-scale-in"><span>{f.name}</span><button onClick={()=>setAttachments(p=>p.filter((_,j)=>j!==i))} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold btn-press">Remove</button></div>))}</div>}
        </div>
      </div>
    </div>
  );
}

function RowLabelInput({label,value,onChange,readOnly=false,multiline=false}:{label:string;value:string;onChange?:(v:string)=>void;readOnly?:boolean;multiline?:boolean}){
  const base:CSSProperties={width:"100%",minHeight:multiline?"62px":"38px",padding:"8px 10px",fontSize:"16px",fontFamily:"'Times New Roman',Georgia,serif",border:"1px solid #cbd5e1",borderRadius:"6px",boxSizing:"border-box" as any,resize:multiline?"vertical":"none" as any};
  return(<div style={{display:"grid",gridTemplateColumns:"82px 1fr",gap:"12px",alignItems:"start"}}><div style={{fontSize:"16px",lineHeight:1.4,paddingTop:"8px"}}>{label}</div><div style={{width:"100%"}}>{multiline?<textarea value={value} readOnly={readOnly} onChange={e=>onChange?.(e.target.value)} style={base}/>:<input value={value} readOnly={readOnly} onChange={e=>onChange?.(e.target.value)} style={base}/>}</div></div>);
}
function RowSubjectInput({label,prefix,value,onChange}:{label:string;prefix:string;value:string;onChange:(v:string)=>void}){
  return(<div style={{display:"grid",gridTemplateColumns:"82px 1fr",gap:"12px",alignItems:"start"}}><div style={{fontSize:"16px",lineHeight:1.4,paddingTop:"8px"}}>{label}</div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:"16px",whiteSpace:"nowrap"}}>{prefix}</span><input value={value} onChange={e=>onChange(e.target.value)} style={{flex:1,minHeight:"38px",padding:"8px 10px",fontSize:"16px",fontFamily:"'Times New Roman',Georgia,serif",border:"1px solid #cbd5e1",borderRadius:"6px"}}/></div></div>);
}
