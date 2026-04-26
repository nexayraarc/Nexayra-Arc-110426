"use client";

import { useEffect, useState } from "react";
import { apiCall } from "@/lib/api-client";
import { useRole } from "@/lib/use-role";
import { fmtAED, fmtDate } from "@/lib/format";
import { Plus, Trash2, Pencil, Check, X, Key } from "lucide-react";

type Vehicle = { id: string; plateNumber: string; make: string; model: string; year: string; color: string; registrationExpiry: string; insuranceExpiry: string; ownership: string; rentalCompany: string; rentalStartDate: string; rentalEndDate: string; monthlyRentalCost: number; notes: string; currentPossession: any };

export default function VehiclesPage() {
  const { canWriteLogistics } = useRole();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [registrationExpiry, setRegistrationExpiry] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [ownership, setOwnership] = useState("owned");
  const [rentalCompany, setRentalCompany] = useState("");
  const [rentalStartDate, setRentalStartDate] = useState("");
  const [rentalEndDate, setRentalEndDate] = useState("");
  const [monthlyRentalCost, setMonthlyRentalCost] = useState("");
  const [notes, setNotes] = useState("");

  // Assign possession
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [empName, setEmpName] = useState("");
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState("");

  // Edit vehicle
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Vehicle>>({});

  const load = async () => {
    try { const r = await apiCall<{ vehicles: Vehicle[] }>("/api/vehicles"); setVehicles(r.vehicles || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!plateNumber.trim()) { alert("Please add the plate number."); return; }
    if (ownership === "rented" && !rentalCompany.trim()) { alert("Please add the rental company."); return; }
    await apiCall("/api/vehicles", { method: "POST", body: {
      plateNumber, make, model, year, color, registrationExpiry, insuranceExpiry,
      ownership, rentalCompany, rentalStartDate, rentalEndDate, monthlyRentalCost: Number(monthlyRentalCost || 0), notes,
    }});
    setPlateNumber(""); setMake(""); setModel(""); setYear(""); setColor("");
    setRegistrationExpiry(""); setInsuranceExpiry(""); setOwnership("owned");
    setRentalCompany(""); setRentalStartDate(""); setRentalEndDate(""); setMonthlyRentalCost(""); setNotes("");
    load();
  };

  const del = async (id: string, plate: string) => {
    if (!confirm(`Delete vehicle ${plate}? This removes its possession history too.`)) return;
    try { await apiCall(`/api/vehicles?id=${id}`, { method: "DELETE" }); load(); }
    catch (e: any) { alert(e.message); }
  };

  const startEdit = (v: Vehicle) => { setEditingId(v.id); setEditData({ ...v }); };
  const saveEdit = async () => {
    await apiCall("/api/vehicles", { method: "PUT", body: { id: editingId, ...editData }});
    setEditingId(null); setEditData({}); load();
  };

  const assign = async (vehicleId: string) => {
    if (!empName.trim()) { alert("Please add the employee name."); return; }
    await apiCall("/api/vehicle-possessions", { method: "POST", body: { vehicleId, employeeName: empName, assignedDate: assignDate, purpose }});
    setAssigningId(null); setEmpName(""); setPurpose(""); load();
  };

  const returnVehicle = async (possessionId: string) => {
    if (!confirm("Mark this vehicle as returned?")) return;
    await apiCall("/api/vehicle-possessions", { method: "PUT", body: { id: possessionId, returnDate: new Date().toISOString() }});
    load();
  };

  if (loading) return <div className="w-6 h-6 border-[3px] border-navy border-t-transparent rounded-full animate-spin"/>;

  const inp = "w-full px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-600 rounded-lg text-navy dark:text-white text-sm";

  return (
    <div className="space-y-6">
      {canWriteLogistics && (
        <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-6 shadow-sm">
          <h2 className="font-lato text-navy dark:text-white text-lg font-bold mb-4">Add Vehicle</h2>
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <input placeholder="Plate Number *" value={plateNumber} onChange={e=>setPlateNumber(e.target.value)} className={inp}/>
            <input placeholder="Make (e.g. Toyota)" value={make} onChange={e=>setMake(e.target.value)} className={inp}/>
            <input placeholder="Model (e.g. Hilux)" value={model} onChange={e=>setModel(e.target.value)} className={inp}/>
            <input placeholder="Year" value={year} onChange={e=>setYear(e.target.value)} className={inp}/>
            <input placeholder="Color" value={color} onChange={e=>setColor(e.target.value)} className={inp}/>
            <div><label className="block text-[10px] text-navy dark:text-white font-bold uppercase tracking-wider mb-0.5">Registration Expiry</label><input type="date" value={registrationExpiry} onChange={e=>setRegistrationExpiry(e.target.value)} className={inp}/></div>
            <div><label className="block text-[10px] text-navy dark:text-white font-bold uppercase tracking-wider mb-0.5">Insurance Expiry</label><input type="date" value={insuranceExpiry} onChange={e=>setInsuranceExpiry(e.target.value)} className={inp}/></div>
            <select value={ownership} onChange={e=>setOwnership(e.target.value)} className={inp}>
              <option value="owned">Owned</option>
              <option value="rented">Rented from</option>
            </select>
            {ownership === "rented" && (
              <>
                <input placeholder="Rental Company *" value={rentalCompany} onChange={e=>setRentalCompany(e.target.value)} className={inp}/>
                <div><label className="block text-[10px] text-navy dark:text-white font-bold uppercase tracking-wider mb-0.5">Rental Start</label><input type="date" value={rentalStartDate} onChange={e=>setRentalStartDate(e.target.value)} className={inp}/></div>
                <div><label className="block text-[10px] text-navy dark:text-white font-bold uppercase tracking-wider mb-0.5">Rental End</label><input type="date" value={rentalEndDate} onChange={e=>setRentalEndDate(e.target.value)} className={inp}/></div>
                <input type="number" step="0.01" placeholder="Monthly Cost (AED)" value={monthlyRentalCost} onChange={e=>setMonthlyRentalCost(e.target.value)} className={inp}/>
              </>
            )}
          </div>
          <textarea placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} className={`${inp} mt-2 min-h-[60px]`}/>
          <button onClick={add} className="mt-3 px-5 py-2 bg-navy text-white font-semibold rounded-lg text-sm btn-press flex items-center gap-1"><Plus size={14}/> Add Vehicle</button>
        </div>
      )}

      <div className="bg-white dark:bg-navy-800 border border-navy-100 dark:border-navy-700 rounded-2xl p-6 shadow-sm">
        <h2 className="font-lato text-navy dark:text-white text-lg font-bold mb-4">Fleet ({vehicles.length})</h2>
        <div className="space-y-3">
          {vehicles.length === 0 ? <p className="text-center py-8 text-navy dark:text-white-300">No vehicles yet.</p> :
            vehicles.map(v => (
              <div key={v.id} className="p-4 border border-navy-100 dark:border-navy-700 rounded-xl">
                {editingId === v.id ? (
                  <div className="space-y-2">
                    <div className="grid sm:grid-cols-3 gap-2">
                      <input value={editData.plateNumber || ""} onChange={e=>setEditData(p=>({...p, plateNumber: e.target.value}))} className={inp} placeholder="Plate"/>
                      <input value={editData.make || ""} onChange={e=>setEditData(p=>({...p, make: e.target.value}))} className={inp} placeholder="Make"/>
                      <input value={editData.model || ""} onChange={e=>setEditData(p=>({...p, model: e.target.value}))} className={inp} placeholder="Model"/>
                      <input type="date" value={editData.registrationExpiry || ""} onChange={e=>setEditData(p=>({...p, registrationExpiry: e.target.value}))} className={inp}/>
                      <input type="date" value={editData.insuranceExpiry || ""} onChange={e=>setEditData(p=>({...p, insuranceExpiry: e.target.value}))} className={inp}/>
                      <input type="number" step="0.01" value={editData.monthlyRentalCost as any || 0} onChange={e=>setEditData(p=>({...p, monthlyRentalCost: Number(e.target.value)}))} className={inp} placeholder="Monthly Cost"/>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold btn-press flex items-center gap-1"><Check size={14}/> Save</button>
                      <button onClick={()=>setEditingId(null)} className="px-3 py-1.5 bg-navy-100 dark:bg-navy-700 text-navy dark:text-white rounded-lg text-sm btn-press"><X size={14}/></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-navy dark:text-white">{v.plateNumber} · {v.make} {v.model} {v.year && `(${v.year})`}</p>
                        <p className="text-navy dark:text-white text-xs">{v.color && `${v.color} · `}{v.ownership === "owned" ? "Owned by company" : `Rented from ${v.rentalCompany || "—"}`}
                          {v.ownership === "rented" && v.monthlyRentalCost > 0 && ` · ${fmtAED(v.monthlyRentalCost)}/mo`}
                        </p>
                        {(v.registrationExpiry || v.insuranceExpiry) && (
                          <p className="text-navy dark:text-white text-xs mt-1">
                            {v.registrationExpiry && <>Reg: {fmtDate(v.registrationExpiry)} </>}
                            {v.insuranceExpiry && <>· Insurance: {fmtDate(v.insuranceExpiry)}</>}
                          </p>
                        )}
                        {v.currentPossession && (
                          <p className="text-green-700 dark:text-green-400 text-xs mt-1 font-semibold">
                            🔑 With {v.currentPossession.employeeName} since {fmtDate(v.currentPossession.assignedDate)} {v.currentPossession.purpose && `· ${v.currentPossession.purpose}`}
                          </p>
                        )}
                      </div>
                      {canWriteLogistics && (
                        <div className="flex gap-1">
                          {!v.currentPossession ? (
                            <button onClick={()=>setAssigningId(v.id)} className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 text-green-700 rounded-lg text-xs font-semibold btn-press flex items-center gap-1"><Key size={12}/> Assign</button>
                          ) : (
                            <button onClick={()=>returnVehicle(v.currentPossession.id)} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold btn-press">Return</button>
                          )}
                          <button onClick={()=>startEdit(v)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Pencil size={14}/></button>
                          <button onClick={()=>del(v.id, v.plateNumber)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      )}
                    </div>
                    {assigningId === v.id && (
                      <div className="mt-3 pt-3 border-t border-navy-50 dark:border-navy-700 grid sm:grid-cols-4 gap-2">
                        <input placeholder="Employee name *" value={empName} onChange={e=>setEmpName(e.target.value)} className={inp}/>
                        <input type="date" value={assignDate} onChange={e=>setAssignDate(e.target.value)} className={inp}/>
                        <input placeholder="Purpose / project" value={purpose} onChange={e=>setPurpose(e.target.value)} className={inp}/>
                        <div className="flex gap-1">
                          <button onClick={()=>assign(v.id)} className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold btn-press">Save</button>
                          <button onClick={()=>setAssigningId(null)} className="px-3 py-1.5 bg-navy-100 dark:bg-navy-700 text-navy dark:text-white rounded-lg text-sm">✕</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}