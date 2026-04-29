"use client";

import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer";

export interface TaxInvoiceItem {
  description: string;
  qty: string;
  uom: string;
  unitPrice: string;
  discount: string;
}

export interface TaxInvoiceData {
  invoiceNo: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientTRN: string;
  clientPhone: string;
  project: string;
  poReference: string;
  items: TaxInvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  vatAmount: number;
  total: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  notes: string;
}

const A4W = 595.28, A4H = 841.89;

function convertNumberToWords(num: number): string {
  const ones=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];
  const teens=["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const scales=["","Thousand","Million","Billion"];
  if(num===0)return"Zero";
  const ch=(n:number)=>{let r="";const h=Math.floor(n/100);const rem=n%100;if(h>0)r+=`${ones[h]} Hundred`;if(rem>=20){if(r)r+=" ";r+=tens[Math.floor(rem/10)];if(rem%10>0)r+=` ${ones[rem%10]}`;}else if(rem>=10){if(r)r+=" ";r+=teens[rem-10];}else if(rem>0){if(r)r+=" ";r+=ones[rem];}return r;};
  const parts:string[]=[];let si=0;let v=num;
  while(v>0){const c=v%1000;if(c!==0)parts.unshift(`${ch(c)}${si>0?` ${scales[si]}`:""}`);v=Math.floor(v/1000);si++;}
  return parts.join(" ").trim();
}

function amountToWords(a:number):string{
  const s=Number.isFinite(a)?a:0;const d=Math.floor(s);const f=Math.round((s-d)*100);
  let r=`${convertNumberToWords(d)} Dirhams`;if(f>0)r+=` and ${convertNumberToWords(f)} Fils`;return`${r} Only`;
}

export default function TaxInvoiceDocument({data}:{data:TaxInvoiceData}){
  const origin=typeof window!=="undefined"?window.location.origin:"";
  const bg=`${origin}/letterhead-bg.png`;

  const calcItem=(item:TaxInvoiceItem)=>{
    const qty=Number(item.qty||0),up=Number(item.unitPrice||0),dp=Math.max(0,Number(item.discount||0));
    const gross=qty*up,disc=gross*(dp/100),taxable=gross-disc,vat=taxable*0.05;
    return{gross,disc,taxable,vat,total:taxable+vat};
  };

  return(
    <Document>
      <Page size="A4" style={s.page} wrap>
        <Image fixed src={bg} style={s.bg}/>
        <View fixed style={s.fll}>
          <Link src="tel:+971551256488" style={s.pl}><Text style={s.ht}>p</Text></Link>
          <Link src="mailto:info@nexayraarc.com" style={s.el}><Text style={s.ht}>e</Text></Link>
          <Link src="https://nexayraarc.com/" style={s.wl}><Text style={s.ht}>w</Text></Link>
        </View>

        <View style={s.content}>
          {/* Header */}
          <View style={s.headerRow}>
            <View style={{flex:1}}/>
            <View style={s.titleBlock}>
              <Text style={s.title}>TAX INVOICE</Text>
              <Text style={s.meta}>Invoice No: {data.invoiceNo}</Text>
              <Text style={s.meta}>Date: {data.date}</Text>
              <Text style={s.meta}>Due Date: {data.dueDate||"-"}</Text>
              {data.poReference?<Text style={s.meta}>PO Ref: {data.poReference}</Text>:null}
            </View>
          </View>

          {/* Bill To / From */}
          <View style={s.parties}>
            <View style={s.partyBox}>
              <Text style={s.partyHeader}>FROM</Text>
              <Text style={s.b}>Nexayra Arc General Contracting L.L.C.</Text>
              <Text>Abu Dhabi, UAE</Text>
              <Text>Phone: +971 55 125 6488</Text>
              <Text>TRN: -</Text>
            </View>
            <View style={s.partyBox}>
              <Text style={s.partyHeader}>BILL TO</Text>
              <Text style={s.b}>{data.clientName||"-"}</Text>
              <Text>{data.clientAddress||"-"}</Text>
              <Text>Phone: {data.clientPhone||"-"}</Text>
              <Text>TRN: {data.clientTRN||"-"}</Text>
              {data.project?<Text>Project: {data.project}</Text>:null}
            </View>
          </View>

          {/* Items table */}
          <View style={s.thr}>
            <Text style={[s.thc,{width:"5%"}]}>S/N</Text>
            <Text style={[s.thc,{width:"33%"}]}>Description</Text>
            <Text style={[s.thc,{width:"7%"}]}>Qty</Text>
            <Text style={[s.thc,{width:"7%"}]}>Unit</Text>
            <Text style={[s.thc,{width:"12%",textAlign:"right"}]}>Unit Price</Text>
            <Text style={[s.thc,{width:"8%",textAlign:"right"}]}>Disc%</Text>
            <Text style={[s.thc,{width:"14%",textAlign:"right"}]}>Taxable</Text>
            <Text style={[s.thc,{width:"8%",textAlign:"right"}]}>VAT</Text>
            <Text style={[s.thc,{width:"14%",textAlign:"right",borderRightWidth:0}]}>Total</Text>
          </View>

          {data.items.map((item,i)=>{const r=calcItem(item);return(
            <View key={i} style={s.tr} wrap={false}>
              <Text style={[s.tc,{width:"5%"}]}>{i+1}</Text>
              <Text style={[s.tc,{width:"33%"}]}>{item.description||"-"}</Text>
              <Text style={[s.tc,{width:"7%"}]}>{item.qty||"0"}</Text>
              <Text style={[s.tc,{width:"7%"}]}>{item.uom||"-"}</Text>
              <Text style={[s.tc,{width:"12%",textAlign:"right"}]}>{Number(item.unitPrice||0).toFixed(2)}</Text>
              <Text style={[s.tc,{width:"8%",textAlign:"right"}]}>{Number(item.discount||0).toFixed(2)}</Text>
              <Text style={[s.tc,{width:"14%",textAlign:"right"}]}>{r.taxable.toFixed(2)}</Text>
              <Text style={[s.tc,{width:"8%",textAlign:"right"}]}>{r.vat.toFixed(2)}</Text>
              <Text style={[s.tc,{width:"14%",textAlign:"right",borderRightWidth:0}]}>{r.total.toFixed(2)}</Text>
            </View>
          );})}

          {/* Totals */}
          <View wrap={false}>
            <View style={s.totals}>
              <View style={s.totRow}><Text>Subtotal</Text><Text>{data.subtotal.toFixed(2)}</Text></View>
              <View style={s.totRow}><Text>Total Discount</Text><Text>{data.totalDiscount.toFixed(2)}</Text></View>
              <View style={s.totRow}><Text>Taxable Amount</Text><Text>{data.taxableAmount.toFixed(2)}</Text></View>
              <View style={s.totRow}><Text>VAT (5%)</Text><Text>{data.vatAmount.toFixed(2)}</Text></View>
              <View style={[s.totRow,{backgroundColor:"#eef2f8"}]}><Text style={s.b}>TOTAL (AED)</Text><Text style={s.b}>{data.total.toFixed(2)}</Text></View>
            </View>

            <View style={s.wordsBox}>
              <Text><Text style={s.b}>Amount in Words: </Text>{amountToWords(data.total)}</Text>
            </View>

            {/* Bank Details */}
            {data.bankName?(
              <View style={s.bankSection}>
                <Text style={s.sectionTitle}>BANK DETAILS</Text>
                <Text>Bank: {data.bankName}</Text>
                <Text>Account Name: {data.accountName||"-"}</Text>
                <Text>Account No: {data.accountNumber||"-"}</Text>
                {data.iban?<Text>IBAN: {data.iban}</Text>:null}
                {data.swiftCode?<Text>SWIFT: {data.swiftCode}</Text>:null}
              </View>
            ):null}

            {data.notes?(
              <View style={s.bankSection}>
                <Text style={s.sectionTitle}>NOTES</Text>
                <Text>{data.notes}</Text>
              </View>
            ):null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

const s=StyleSheet.create({
  page:{fontSize:8.5,fontFamily:"Helvetica",color:"#1c2143",position:"relative",backgroundColor:"#fff"},
  bg:{position:"absolute",top:0,left:0,width:A4W,height:A4H,objectFit:"fill"},
  content:{paddingTop:88,paddingLeft:20,paddingRight:20,paddingBottom:90},
  b:{fontWeight:"bold"},
  headerRow:{flexDirection:"row",justifyContent:"flex-end",marginBottom:16},
  titleBlock:{textAlign:"right"},
  title:{fontSize:18,fontWeight:"bold",marginBottom:4,color:"#1c2143"},
  meta:{fontSize:9,marginBottom:2},
  parties:{flexDirection:"row",gap:8,marginBottom:12},
  partyBox:{flex:1,borderWidth:1,borderColor:"#c8d1e6",padding:8,borderRadius:2},
  partyHeader:{backgroundColor:"#eef2f8",padding:3,fontWeight:"bold",marginBottom:4,fontSize:9},
  thr:{flexDirection:"row",borderWidth:1,borderColor:"#c8d1e6",backgroundColor:"#eef2f8",marginTop:8},
  thc:{padding:4,fontWeight:"bold",fontSize:7.5,borderRightWidth:1,borderColor:"#c8d1e6"},
  tr:{flexDirection:"row",borderLeftWidth:1,borderRightWidth:1,borderBottomWidth:1,borderColor:"#c8d1e6"},
  tc:{padding:4,fontSize:8,borderRightWidth:1,borderColor:"#c8d1e6"},
  totals:{width:"40%",alignSelf:"flex-end",marginTop:10},
  totRow:{flexDirection:"row",justifyContent:"space-between",borderWidth:1,borderColor:"#c8d1e6",borderTopWidth:0,padding:5,fontSize:9},
  wordsBox:{borderWidth:1,borderColor:"#c8d1e6",padding:6,marginTop:8},
  bankSection:{marginTop:10,borderWidth:1,borderColor:"#c8d1e6",padding:8},
  sectionTitle:{fontWeight:"bold",backgroundColor:"#eef2f8",padding:3,marginBottom:4},
  fll:{position:"absolute",left:20,bottom:12,width:555,height:47},
  ht:{fontSize:1,color:"#fff",opacity:0},
  pl:{position:"absolute",left:8,top:18,width:80,height:12},
  el:{position:"absolute",left:86,top:18,width:120,height:12},
  wl:{position:"absolute",left:248,top:18,width:135,height:12},
});