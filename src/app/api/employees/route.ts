import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, requireHRWrite } from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  try {
    const snap = await adminDb.collection("employees").get();
    const employees = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id, ...data,
        joinDate: data.joinDate?.toDate?.()?.toISOString() || data.joinDate || "",
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });
    employees.sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")));
    return NextResponse.json({ ok: true, employees });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  const forbidden = requireHRWrite(auth); if (forbidden) return forbidden;
  try {
    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ ok: false, message: "Name required" }, { status: 400 });
    const docRef = await adminDb.collection("employees").add({
      name: body.name.trim(),
      empId: body.empId || "",
      role: body.role || "",
      department: body.department || "",
      monthlySalary: Number(body.monthlySalary || 0),
      phone: body.phone || "",
      email: body.email || "",
      emiratesId: body.emiratesId || "",
      visaExpiry: body.visaExpiry || "",
      passportExpiry: body.passportExpiry || "",
      joinDate: body.joinDate || "",
      status: body.status || "active",
      assignedProjectIds: body.assignedProjectIds || [],
      notes: body.notes || "",
      createdBy: auth.email || "",
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  const forbidden = requireHRWrite(auth); if (forbidden) return forbidden;
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ ok: false, message: "id required" }, { status: 400 });
    if (updates.monthlySalary !== undefined) updates.monthlySalary = Number(updates.monthlySalary);
    await adminDb.collection("employees").doc(id).set({ ...updates, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  const forbidden = requireHRWrite(auth); if (forbidden) return forbidden;
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, message: "id required" }, { status: 400 });
    await adminDb.collection("employees").doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}