export default function CompanyOverviewPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-4">
        <span className="text-3xl">🏢</span>
      </div>
      <h2 className="font-lato text-navy dark:text-white text-2xl font-bold mb-2">Company Overview</h2>
      <p className="text-navy dark:text-white max-w-md">Company information and organizational details. Coming soon.</p>
    </div>
  );
}