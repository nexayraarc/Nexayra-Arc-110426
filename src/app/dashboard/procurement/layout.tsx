import SubTabLayout from "@/components/SubTabLayout";

const TABS = [
  { href: "/dashboard/procurement/lpo", label: "Create LPO" },
  { href: "/dashboard/procurement/lpo/history", label: "LPO History" },
];

export default function ProcurementLayout({ children }: { children: React.ReactNode }) {
  return <SubTabLayout title="Procurement" tabs={TABS}>{children}</SubTabLayout>;
}