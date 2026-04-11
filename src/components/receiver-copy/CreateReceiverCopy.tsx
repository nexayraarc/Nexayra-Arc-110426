"use client";

import { useEffect, useMemo, useState } from "react";
import { apiCall } from "@/lib/api-client";
import type { ReceiverCopyData } from "./ReceiverCopyDocument";

const DRAFT_KEY = "createReceiverCopyV4";

function formatToday():string{const n=new Date();return`${String(n.getDate()).padStart(2,"0")}-${n.toLocaleString("en-US",{month:"long"})}-${n.getFullYear()}`;}
function toNumber(v:string):number{const p=Number(String(v).replace(/,/g,"").trim());return Number.isFinite(p)?p:0;}
function convertNumberToWords(num:number):string{const ones=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];const teens=["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];const tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];const scales=["","Thousand","Million","Billion"];if(num===0)return"Zero";const ch=(n:number)=>{let r="";const h=Math.floor(n/100);const rem=n%100;if(h>0)r+=`${ones[h]} Hundred`;if(rem>=20){if(r)r+=" ";r+=tens[Math.floor(rem/10)];if(rem%10>0)r+=` ${ones[rem%10]}`;}else if(rem>=10){if(r)r+=" ";r+=teens[rem-10];}else if(rem>0){if(r)r+=" ";r+=ones[rem];}return r;};const parts:string[]=[];let si=0;let v=num;while(v>0){const c=v%1000;if(c!==0)parts.unshift(`${ch(c)}${si>0?` ${scales[si]}`:""}`);v=Math.floor(v/1000);si++;}return parts.join(" ").trim();}
function amountToWords(a:number):string{const s=Number.isFinite(a)?a:0;const d=Math.floor(s);const f=Math.round((s-d)*100);let r=`${convertNumberToWords(d)} Dirhams`;if(f>0)r+=` and ${convertNumberToWords(f)} Fils`;return r;}

export default function CreateReceiverCopy(){
  const [documentNo,setDocumentNo]=useState("(auto)");
  const [date,setDate]=useState("");
  const [receivedFrom,setReceivedFrom]=useState("");
  const [amount,setAmount]=useState("");
  const [chequeNumber,setChequeNumber]=useState("");
  const [bankName,setBankName]=useState("");
  const [chequeDate,setChequeDate]=useState("");
  const [purposeDescription,setPurposeDescription]=useState("");
  const [receivedBy,setReceivedBy]=useState("");
  const [companyName,setCompanyName]=useState("");
  const [contactNumber,setContactNumber]=useState("");
  const [email,setEmail]=useState("");
  const [isWorking,setIsWorking]=useState(false);
  const [message,setMessage]=useState<{text:string;type:"success"|"error"}|null>(null);

  useEffect(()=>{
    setDate(formatToday());
    try{const s=localStorage.getItem(DRAFT_KEY);if(!s)return;const d=JSON.parse(s);
    setReceivedFrom(d.receivedFrom??"");setAmount(d.amount??"");setChequeNumber(d.chequeNumber??"");setBankName(d.bankName??"");
    setChequeDate(d.chequeDate??"");setPurposeDescription(d.purposeDescription??"");setReceivedBy(d.receivedBy??"");
    setCompanyName(d.companyName??"");setContactNumber(d.contactNumber??"");setEmail(d.email??"");}catch{}
  },[]);

  useEffect(()=>{localStorage.setItem(DRAFT_KEY,JSON.stringify({receivedFrom,amount,chequeNumber,bankName,chequeDate,purposeDescription,receivedBy,companyName,contactNumber,email}));});

  const amountInWords=useMemo(()=>amountToWords(toNumber(amount)),[amount]);

  const validate=()=>{
    if(!receivedFrom.trim())return"Please enter Received From.";if(!amount.trim())return"Please enter Amount.";
    if(!chequeNumber.trim())return"Please enter Cheque Number.";if(!bankName.trim())return"Please enter Bank Name.";
    if(!chequeDate.trim())return"Please enter Cheque Date.";if(!purposeDescription.trim())return"Please enter Purpose.";
    if(!receivedBy.trim())return"Please enter Received By.";if(!companyName.trim())return"Please enter Company Name.";return"";
  };

  const buildPayload=()=>({
    date:date.trim(),receivedFrom:receivedFrom.trim(),amount:amount.trim(),chequeNumber:chequeNumber.trim(),
    bankName:bankName.trim(),chequeDate:chequeDate.trim(),purposeDescription:purposeDescription.trim(),
    receivedBy:receivedBy.trim(),companyName:companyName.trim(),contactNumber:contactNumber.trim(),email:email.trim(),
  });

  const reset=()=>{
    localStorage.removeItem(DRAFT_KEY);setDocumentNo("(auto)");setDate(formatToday());setReceivedFrom("");setAmount("");
    setChequeNumber("");setBankName("");setChequeDate("");setPurposeDescription("");setReceivedBy("");setCompanyName("");setContactNumber("");setEmail("");
  };

  const handleGenerate=async()=>{
    const err=validate();if(err){setMessage({text:err,type:"error"});return;}
    try{
      setIsWorking(true);setMessage(null);
      const res=await apiCall<{receiverCopy:ReceiverCopyData}>("/api/receiver-copy",{method:"POST",body:buildPayload()});
      const data=res.receiverCopy;setDocumentNo(data.documentNo);
      const [{pdf},{default:RCDoc}]=await Promise.all([import("@react-pdf/renderer"),import("./ReceiverCopyDocument")]);
      const blob=await pdf(<RCDoc data={data}/>).toBlob();
      const file=new File([blob],`${data.documentNo}.pdf`,{type:"application/pdf"});
      const url=URL.createObjectURL(file);Object.assign(document.createElement("a"),{href:url,download:file.name}).click();URL.revokeObjectURL(url);
      setMessage({text:`Receiver Copy ${data.documentNo} saved and downloaded.`,type:"success"});reset();
    }catch(e:any){setMessage({text:e.message||"Failed.",type:"error"});}
    finally{setIsWorking(false);}
  };

  const handleShare=async()=>{
    const err=validate();if(err){setMessage({text:err,type:"error"});return;}
    try{
      setIsWorking(true);setMessage(null);
      const res=await apiCall<{receiverCopy:ReceiverCopyData}>("/api/receiver-copy",{method:"POST",body:buildPayload()});
      const data=res.receiverCopy;
      const [{pdf},{default:RCDoc}]=await Promise.all([import("@react-pdf/renderer"),import("./ReceiverCopyDocument")]);
      const blob=await pdf(<RCDoc data={data}/>).toBlob();
      const pdfFile=new File([blob],`${data.documentNo}.pdf`,{type:"application/pdf"});
      const text=[`Receipt: ${data.documentNo}`,`From: ${data.receivedFrom}`,`Amount: AED ${data.amount}`].join("\n");
      if(navigator.share){if(navigator.canShare?.({files:[pdfFile]}))await navigator.share({title:data.documentNo,text,files:[pdfFile]});else await navigator.share({title:data.documentNo,text});}
      else await navigator.clipboard.writeText(text);
      setMessage({text:`Shared ${data.documentNo}.`,type:"success"});reset();
    }catch(e:any){setMessage({text:e.message||"Failed.",type:"error"});}
    finally{setIsWorking(false);}
  };

  const inp="w-full px-4 py-3 bg-white border border-navy-200 rounded-xl text-navy placeholder-navy-300 text-sm transition-all hover:border-navy-300";
  const lbl="block text-navy-500 text-xs font-bold uppercase tracking-wider mb-1.5";

  return(
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Receiver Copy</h1>
          <p className="mt-1 text-navy-400 text-sm">{documentNo} — {date}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={isWorking} className="px-5 py-2.5 bg-navy hover:bg-navy-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all shadow-lg shadow-navy/20">{isWorking?"Working…":"Generate PDF"}</button>
          <button onClick={handleShare} disabled={isWorking} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all">Share</button>
        </div>
      </div>

      {message&&<div className={`mb-5 p-3.5 rounded-xl text-sm font-medium animate-scale-in ${message.type==="success"?"bg-green-50 border border-green-200 text-green-700":"bg-red-50 border border-red-200 text-red-600"}`}>{message.text}</div>}

      <div className="bg-white border border-navy-100 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div><label className={lbl}>Received From</label><input value={receivedFrom} onChange={e=>setReceivedFrom(e.target.value)} className={inp} placeholder="Person / Company"/></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Amount (AED)</label><input value={amount} onChange={e=>setAmount(e.target.value)} className={inp} placeholder="0.00"/></div>
          <div><label className={lbl}>Amount in Words</label><div className="px-4 py-3 bg-navy-50 border border-navy-100 rounded-xl text-navy-400 text-sm min-h-[48px]">{amountInWords||"-"}</div></div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className={lbl}>Cheque Number</label><input value={chequeNumber} onChange={e=>setChequeNumber(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Bank Name</label><input value={bankName} onChange={e=>setBankName(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Cheque Date</label><input value={chequeDate} onChange={e=>setChequeDate(e.target.value)} className={inp} placeholder="DD-Month-YYYY"/></div>
        </div>
        <div><label className={lbl}>Purpose / Description</label><textarea value={purposeDescription} onChange={e=>setPurposeDescription(e.target.value)} className={`${inp} min-h-[80px] resize-y`}/></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Received By</label><input value={receivedBy} onChange={e=>setReceivedBy(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Company Name</label><input value={companyName} onChange={e=>setCompanyName(e.target.value)} className={inp}/></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={lbl}>Contact Number (Optional)</label><input value={contactNumber} onChange={e=>setContactNumber(e.target.value)} className={inp}/></div>
          <div><label className={lbl}>Email (Optional)</label><input value={email} onChange={e=>setEmail(e.target.value)} className={inp}/></div>
        </div>
      </div>
    </div>
  );
}
