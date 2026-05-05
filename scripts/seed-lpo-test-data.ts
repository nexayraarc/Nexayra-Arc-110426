// scripts/seed-lpo-test-data.ts

import { initializeApp, applicationDefault, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { loadEnvConfig } from "@next/env";

const COUNT = Number(process.argv[2] || 1000);
const BATCH_SIZE = 450;

loadEnvConfig(process.cwd());

function initFirebaseAdmin() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n");

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
    return;
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function money(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

const vendors = [
  "Al Futtaim Engineering",
  "Blue Star HVAC Trading",
  "Carrier Middle East",
  "LG Electronics Gulf",
  "Daikin UAE",
  "RAK Ceramics",
  "Jotun Paints UAE",
  "UltraTech Cement UAE",
  "Honeywell Controls",
  "Cosmoplast UAE",
];

const projects = [
  "ADJD - VIP Room",
  "Notary Hall - ADJD",
  "Al Sedirah School",
  "Sas Al Nakhl School",
  "Villa Refurbishment Works",
  "Nexayra Internal Project",
];

const statuses = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "received",
  "partially_received",
];

const items = [
  "Chilled Water FCU Unit",
  "GI Duct Installation",
  "Linear Slot Diffuser",
  "Square Ceiling Diffuser",
  "2 Way Modulating Valve",
  "Copper Pipe Installation",
  "Pipe Insulation",
  "Firefighting Pipe Modification",
  "Storm Water Drainage Work",
  "Transfer Pump Set",
  "Booster Pump Set",
  "Paint Material Supply",
  "Ceramic Tile Supply",
  "Electrical Room DX Unit",
];

function createDummyItems() {
  const itemCount = rand(1, 8);

  const list = Array.from({ length: itemCount }).map((_, index) => {
    const qty = rand(1, 20);
    const unitPrice = money(50, 7500);
    const amount = Number((qty * unitPrice).toFixed(2));

    return {
      lineNo: index + 1,
      description: pick(items),
      qty: String(qty),
      uom: pick(["Nos", "Set", "Lot", "Mtr", "Sqm"]),
      unitPrice,
      amount: String(unitPrice),
      discount: 0,
      lineTotal: amount,
    };
  });

  return list;
}

function createLpoRecord(index: number) {
  const lpoItems = createDummyItems();

  const subtotal = Number(
    lpoItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
  );

  const vat = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + vat).toFixed(2));

  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - rand(0, 365));

  return {
    testData: true,

    nxrNo: `NXR-TEST-${String(index).padStart(6, "0")}`,
    lpoNo: `LPO-TEST-${String(index).padStart(6, "0")}`,

    vendorName: pick(vendors),
    projectName: pick(projects),
    clientName: pick(projects),
    project: pick(projects),
    site: pick(projects),
    siteLocation: pick(projects),
    attn: pick(["Sales Team", "Procurement Team", "Accounts Department", "Project Engineer"]),
    contact: pick(["Sales Team", "Procurement Team", "Accounts Department", "Project Engineer"]),

    items: lpoItems,

    subtotal,
    totalDiscount: 0,
    vat: vat,
    vatPercentage: 5,
    vatAmount: vat,
    grandTotal,
    total: grandTotal,

    status: pick(statuses),

    requestedBy: pick([
      "test.user@nexayraarc.com",
      "accounts@nexayraarc.com",
      "procurement@nexayraarc.com",
      "engineer@nexayraarc.com",
    ]),

    createdAt: Timestamp.fromDate(createdDate),
    updatedAt: Timestamp.now(),

    remarks: "Auto-generated dummy test record for capacity testing.",
  };
}

async function seed() {
  initFirebaseAdmin();

  const db = getFirestore();

  console.log(`Creating ${COUNT} dummy LPO records...`);

  let batch = db.batch();
  let operationCount = 0;
  let created = 0;

  for (let i = 1; i <= COUNT; i++) {
    const ref = db.collection("lpos").doc(`test-lpo-${String(i).padStart(6, "0")}`);
    batch.set(ref, createLpoRecord(i));

    operationCount++;
    created++;

    if (operationCount === BATCH_SIZE) {
      await batch.commit();
      console.log(`Inserted ${created}/${COUNT}`);
      batch = db.batch();
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  console.log(`Done. Created ${created} test LPO records.`);
}

seed().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
