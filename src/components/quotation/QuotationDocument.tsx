"use client";

import { Document, Page, Text, View, StyleSheet, Image, Link } from "@react-pdf/renderer";

export interface QuotationItem {
  srNo: string;
  description: string;
  unit: string;
  amount: string;
}

export interface QuotationData {
  quotationNo: string;
  date: string;
  to: string;
  attn: string;
  project: string;
  serviceTitle: string;
  introParagraph: string;
  annexure1Title: string;
  annexure2Title: string;
  annexure3Title: string;
  closingParagraph: string;
  signatoryName: string;
  signatoryDesignation: string;
  inclusionItems: string[];
  exclusionItems: string[];
  boqItems: QuotationItem[];
  totalWithoutVat: number;
  vatPercent: number;
  vatAmount: number;
  totalWithVat: number;
  amountInWords: string;
  paymentTerms: string[];
  validity: string;
  attachmentNames?: string[];
}

const A4W = 595.28;
const A4H = 841.89;

const SAFE_TOP = 92;
const SAFE_BOTTOM_WITH_STAMP = 176;
const SAFE_BOTTOM_NO_STAMP = 76;
const SAFE_SIDE = 56;

function fmtMoney(v: number): string {
  return `${v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}/-`;
}

function Footer() {
  return (
    <View fixed style={s.fll}>
      <Link src="tel:+971551256488" style={s.pl}><Text style={s.ht}>p</Text></Link>
      <Link src="mailto:info@nexayraarc.com" style={s.el}><Text style={s.ht}>e</Text></Link>
      <Link src="https://nexayraarc.com/" style={s.wl}><Text style={s.ht}>w</Text></Link>
      <Link src="https://instagram.com/nexayraarc" style={s.il}><Text style={s.ht}>i</Text></Link>
      <Link src="https://www.linkedin.com/in/nexayra" style={s.ll}><Text style={s.ht}>l</Text></Link>
    </View>
  );
}

function TableHeader() {
  return (
    <View style={s.thr}>
      <Text style={[s.cS, s.b, s.cn]}>Sr. no.</Text>
      <Text style={[s.cD, s.b, s.cn]}>Description</Text>
      <Text style={[s.cU, s.b, s.cn]}>Unit</Text>
      <Text style={[s.cA, s.b, s.cn]}>Amount (AED)</Text>
    </View>
  );
}

function TableRow({ item }: { item: QuotationItem }) {
  return (
    <View style={s.tbr} wrap={false}>
      <Text style={[s.cS, s.cn]}>{item.srNo || "-"}</Text>
      <Text style={s.cD}>{item.description || "-"}</Text>
      <Text style={[s.cU, s.cn]}>{item.unit || "-"}</Text>
      <Text style={[s.cA, s.rt]}>{item.amount || "-"}</Text>
    </View>
  );
}

export default function QuotationDocument({ quotationData: q }: { quotationData: QuotationData }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const bg = `${origin}/letterhead-bg.png`;
  const stamp = `${origin}/approved-stamp.png`;
  const sig = `${origin}/quotation-signature.png`;

  const subject = `Quotation & Proposal for ${q.serviceTitle || "-"}`;

  return (
    <Document>
      {/* COVER PAGE */}
      <Page size="A4" style={s.coverPage}>
        <Image fixed src={bg} style={s.bg} />
        <Image fixed src={stamp} style={s.ps} />
        <Footer />

        <View style={s.ct}>
          <Text style={s.ln}><Text style={s.b}>Date:</Text> {q.date || "-"}</Text>
          <Text style={s.ln}><Text style={s.b}>To:</Text> {q.to || "-"}</Text>
          <Text style={s.ln}><Text style={s.b}>Attn:</Text> {q.attn || "-"}</Text>
          <Text style={s.ln}><Text style={s.b}>Project:</Text> {q.project || "-"}</Text>
          <Text style={s.ln}><Text style={s.b}>Subject:</Text> {subject}</Text>

          <Text style={[s.p, { marginTop: 24 }]}>Dear Sir,</Text>
          <Text style={s.p}>{q.introParagraph || "-"}</Text>

          <View style={s.ar}>
            <Text style={s.al}>ANNEXURE – 1</Text>
            <Text style={s.av}>{q.annexure1Title}</Text>
          </View>

          <View style={s.ar}>
            <Text style={s.al}>ANNEXURE – 2</Text>
            <Text style={s.av}>{q.annexure2Title}</Text>
          </View>

          <View style={s.ar}>
            <Text style={s.al}>ANNEXURE – 3</Text>
            <Text style={s.av}>{q.annexure3Title}</Text>
          </View>

          <Text style={[s.p, { marginTop: 28 }]}>{q.closingParagraph}</Text>

          <View style={s.sb} wrap={false}>
            <Text>Truly yours,</Text>
            <Text>For Nexayra Arc General Contracting L.L.C</Text>
            <Image src={sig} style={s.si} />
            <Text>{q.signatoryName}</Text>
            <Text>{q.signatoryDesignation}</Text>
          </View>
        </View>
      </Page>

      {/* ANNEXURE PAGES - NO STAMP */}
      <Page size="A4" style={s.annexPage} wrap>
        <Image fixed src={bg} style={s.bg} />
        <Footer />

        <View style={s.ct}>
          <Text style={s.cuh} minPresenceAhead={40}>ANNEXURE-1:</Text>
          <Text style={s.uh}>OUR PROPOSAL INCLUDES THE FOLLOWING:</Text>

          <View style={s.bw}>
            {q.inclusionItems.map((it, i) => (
              <View key={`inc-${i}`} style={s.br}>
                <Text style={s.bs}>•</Text>
                <Text style={s.bt}>{it}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.uh, { marginTop: 12 }]} minPresenceAhead={30}>EXCLUSIONS:</Text>

          <View style={s.bw}>
            {q.exclusionItems.map((it, i) => (
              <View key={`exc-${i}`} style={s.br}>
                <Text style={s.bs}>•</Text>
                <Text style={s.bt}>{it}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.cuh, { marginTop: 16 }]} minPresenceAhead={55}>ANNEXURE-2:</Text>
          <Text style={s.uh}>SCHEDULE OF PRICES</Text>
          <Text style={s.p}>Our price for the execution of the above-mentioned scope of works is as follows:</Text>

          {q.boqItems.length > 0 && (
  <View minPresenceAhead={70}>
    <TableHeader />
    <TableRow item={q.boqItems[0]} />
  </View>
)}

{q.boqItems.slice(1).map((item, i) => (
  <TableRow
    key={`${item.srNo}-${i + 1}`}
    item={item}
  />
))}

          <View style={{ marginTop: 16 }} wrap={false}>
            <View style={[s.tr, s.trFirst, { marginTop: 16 }]}>
  <Text style={s.tlw}>Total Amount without Vat (AED)</Text>
  <Text style={s.tvn}>{fmtMoney(q.totalWithoutVat)}</Text>
</View>
            <View style={s.tr}>
              <Text style={s.tlw}>Vat@{q.vatPercent}%</Text>
              <Text style={s.tvn}>{fmtMoney(q.vatAmount)}</Text>
            </View>
            <View style={s.tr}>
              <Text style={s.tlw}>Total Amount with Vat</Text>
              <Text style={s.tvn}>{fmtMoney(q.totalWithVat)}</Text>
            </View>
          </View>

          <Text style={[s.cuh, { marginTop: 16 }]} minPresenceAhead={40}>ANNEXURE-3:</Text>
          <Text style={s.uh}>TERMS AND CONDITIONS</Text>

          <Text style={[s.uh, { marginTop: 20 }]} minPresenceAhead={30}>PAYMENT TERMS:</Text>
          <View style={s.bw}>
            {q.paymentTerms.map((t, i) => (
              <View key={`inc-${i}`} style={s.br}>
                <Text style={s.bs}>•</Text>
                <Text style={s.bt}>{t}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.uh, { marginTop: 20 }]} minPresenceAhead={20}>VALIDITY:</Text>
          <Text style={s.stl}>{q.validity}</Text>
        </View>
      </Page>
    </Document>
  );
}

const s = StyleSheet.create({
  coverPage: {
    fontSize: 12,
    fontFamily: "Times-Roman",
    color: "#111827",
    backgroundColor: "#fff",
    position: "relative",
    paddingTop: SAFE_TOP,
    paddingBottom: SAFE_BOTTOM_WITH_STAMP,
    paddingLeft: SAFE_SIDE,
    paddingRight: SAFE_SIDE,
  },

  annexPage: {
    fontSize: 12,
    fontFamily: "Times-Roman",
    color: "#111827",
    backgroundColor: "#fff",
    position: "relative",
    paddingTop: SAFE_TOP,
    paddingBottom: SAFE_BOTTOM_NO_STAMP,
    paddingLeft: SAFE_SIDE,
    paddingRight: SAFE_SIDE,
  },

  bg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: A4W,
    height: A4H,
    objectFit: "fill",
  },

  ps: {
    position: "absolute",
    bottom: 74,
    right: 52,
    width: 92,
    height: 92,
    objectFit: "contain",
  },

  ct: {
    flexDirection: "column",
  },

  ln: { marginBottom: 10, lineHeight: 1.35 },
  b: { fontWeight: 700, fontFamily: "Times-Bold" },
  cn: { textAlign: "center" },
  rt: { textAlign: "right" },
  p: { lineHeight: 1.35, marginBottom: 10, textAlign: "left" },

  ar: { flexDirection: "row", marginTop: 16 },
  al: { width: 130, fontSize: 14, fontWeight: 700, fontFamily: "Times-Bold" },
  av: { flex: 1, fontSize: 14, fontWeight: 700, fontFamily: "Times-Bold" },

  sb: { marginTop: 28, lineHeight: 1.35 },
  si: { width: 90, height: 34, objectFit: "contain", marginTop: 8, marginBottom: 4 },

  cuh: {
    fontSize: 16,
    fontWeight: 700,
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    textAlign: "center",
    marginBottom: 16,
  },

  uh: {
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "Times-Bold",
    textDecoration: "underline",
    marginBottom: 10,
  },

  bw: { marginLeft: 18 },
  br: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  bs: { width: 12, fontSize: 13, lineHeight: 1.25 },
  bt: { flex: 1, fontSize: 12, lineHeight: 1.25 },

  thr: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#111827",
    backgroundColor: "#d8e4f2",
    minHeight: 28,
  },

  tbr: {
  flexDirection: "row",
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderTopWidth: 1,
  borderBottomWidth: 1,
  borderColor: "#111827",
  minHeight: 34,
  alignItems: "stretch",
  marginTop: -1,
},

  cS: {
    width: "12%",
    borderRightWidth: 1,
    borderColor: "#111827",
    padding: 6,
    fontSize: 12,
  },

  cD: {
    width: "59%",
    borderRightWidth: 1,
    borderColor: "#111827",
    padding: 6,
    fontSize: 12,
    lineHeight: 1.2,
  },

  wrFirst: {
  borderTopWidth: 1,
},

  cU: {
    width: "11%",
    borderRightWidth: 1,
    borderColor: "#111827",
    padding: 6,
    fontSize: 12,
  },

  trFirst: {
  borderTopWidth: 1,
},

  cA: {
    width: "18%",
    padding: 6,
    fontSize: 12,
  },

  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#111827",
    minHeight: 26,
    alignItems: "center",
  },

  tlw: {
    width: "82%",
    padding: 6,
    fontSize: 12,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#111827",
    fontWeight: "bold",
  },

  tvn: {
    width: "18%",
    padding: 6,
    fontSize: 12,
    textAlign: "right",
    fontWeight: "bold",
  },

  stb: { marginTop: 4 },
  stl: { fontSize: 12, lineHeight: 1.3, marginBottom: 2 },

  fll: {
    position: "absolute",
    left: 20,
    bottom: 12,
    width: 555,
    height: 47,
  },

  ht: { fontSize: 1, color: "#fff", opacity: 0 },
  pl: { position: "absolute", left: 8, top: 18, width: 80, height: 12 },
  el: { position: "absolute", left: 86, top: 18, width: 120, height: 12 },
  wl: { position: "absolute", left: 248, top: 18, width: 135, height: 12 },
  il: { position: "absolute", left: 385, top: 15, width: 85, height: 10 },
  ll: { position: "absolute", left: 385, top: 27, width: 145, height: 10 },
});