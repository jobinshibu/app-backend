import fetch from 'node-fetch';

// const ADMIN_API = process.env.ADMIN_API_URL + "/api/admin/admin-notifications";

export async function sendAdminNotification({ type, title, body, metadata }) {
  const adminUrl = process.env.ADMIN_API_URL ? process.env.ADMIN_API_URL : "http://13.126.236.126:5710";
  const ADMIN_API = adminUrl + "/api/admin/admin-notifications";

  // Debug log to catch URL issues
  console.log(`❌❌❌❌❌❌[AdminNotifier:Fetch] Sending to: ${ADMIN_API}`);

  const payload = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.AUTHORIZE_KEY || "5Q52tQ8k8E8VV9mh"
    },
    body: JSON.stringify({
      type,
      title,
      body,
      metadata
    }),
    timeout: 10000
  };

  try {
    let response;
    try {
      response = await fetch(ADMIN_API, payload);
    } catch (networkErr) {
      console.error(`⚠️ Primary connection failed: ${networkErr.message}`);

      // If the primary URL was NOT localhost, try localhost fallback
      if (!ADMIN_API.includes("localhost") && !ADMIN_API.includes("127.0.0.1")) {
        console.log("🔄 Attempting failover to localhost...");
        const fallbackUrl = "http://localhost:5710/api/admin/admin-notifications";
        response = await fetch(fallbackUrl, payload);
        console.log("✅ Failover connection successful.");
      } else {
        throw networkErr; // Re-throw if we were already trying localhost
      }
    }

    if (response.ok) {
      console.log("✅ Admin notification sent. Status:", response.status);
    } else {
      console.error("❌ Admin notification failed. Status:", response.status);
      const text = await response.text();
      console.error("Response body:", text);
    }
  } catch (err) {
    console.error("❌ Admin notification failed. Network Error.");
    console.error("   Message:", err.message);
  }
}

