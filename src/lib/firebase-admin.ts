import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminAuth: any = null;
let adminDb: any = null;

if (getApps().length === 0) {
  try {
    // Get the private key and handle both formats: "key\nkey" and "key\\nkey"
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || "";
    
    // If the key contains literal \n (backslash-n), replace with actual newlines
    if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }
    
    if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
      throw new Error("Missing Firebase Admin environment variables: FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, or FIREBASE_ADMIN_PRIVATE_KEY");
    }

    // Validate private key format
    if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) {
      throw new Error("Invalid FIREBASE_ADMIN_PRIVATE_KEY format. Must be a PEM-formatted private key.");
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });

    adminAuth = getAuth();
    adminDb = getFirestore();
    console.log("✓ Firebase Admin SDK initialized successfully");
  } catch (error: any) {
    console.error("✗ Firebase Admin SDK initialization failed:", error.message);
    console.error("Check your .env.local file has FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY");
  }
}

export { adminAuth, adminDb };
