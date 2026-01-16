import admin from "firebase-admin";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File is in the SAME folder → no need for ../../
const serviceAccountPath = join(__dirname, "firebase-service-account.json");

// Read service account file
let serviceAccount;
try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} catch (err) {
    console.error("❌ Could not read firebase-service-account.json:", err);
}

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase admin initialized");
}

export default admin;
