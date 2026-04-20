import SubTabLayout from "@/components/SubTabLayout";

const TABS = [
  { href: "/dashboard/estimation/quotation", label: "Create Quotation" },
  { href: "/dashboard/estimation/quotation/history", label: "Quotation History" },
  { href: "/dashboard/estimation/receiver-copy", label: "Create Receipt" },
  { href: "/dashboard/estimation/receiver-copy/history", label: "Receipt History" },
  { href: "/dashboard/estimation/tax-invoice", label: "Create Tax Invoice" },
  { href: "/dashboard/estimation/tax-invoice/history", label: "Tax Invoice History" },
];

export default function EstimationLayout({ children }: { children: React.ReactNode }) {
  return <SubTabLayout title="Estimation" tabs={TABS}>{children}</SubTabLayout>;
}