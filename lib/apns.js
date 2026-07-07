// lib/apns.js
// APNs push sender for ScriptShift WA (Vercel serverless, no external deps).
// Loads device tokens straight from Supabase REST (same pattern as stripe-webhook.js).
//
// Required env vars:
//   APNS_KEY      - full contents of the .p8 file (including BEGIN/END lines)
//   APNS_KEY_ID   - 10-char Key ID
//   APNS_TEAM_ID  - 10-char Team ID
//   APNS_HOST     - optional; use https://api.sandbox.push.apple.com for Xcode dev builds
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - already set for the webhook

import http2 from "http2";
import crypto from "crypto";

const BUNDLE_ID = "com.scriptshiftwa.app";
const APNS_HOST = process.env.APNS_HOST || "https://api.push.apple.com";
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ---- JWT (cached ~50 min; Apple requires 20-60 min validity) ----
let cachedJwt = null;
let cachedJwtAt = 0;

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getJwt() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwtAt < 50 * 60) return cachedJwt;

  const header = base64url(
    JSON.stringify({ alg: "ES256", kid: process.env.APNS_KEY_ID })
  );
  const payload = base64url(
    JSON.stringify({ iss: process.env.APNS_TEAM_ID, iat: now })
  );
  const unsigned = `${header}.${payload}`;

  const signature = crypto
    .createSign("SHA256")
    .update(unsigned)
    .sign({
      key: process.env.APNS_KEY,
      dsaEncoding: "ieee-p1363", // JWT ES256 needs raw r||s, not DER
    });

  cachedJwt = `${unsigned}.${base64url(signature)}`;
  cachedJwtAt = now;
  return cachedJwt;
}

// ---- Supabase REST helpers (same style as stripe-webhook.js) ----
async function loadTokens() {
  const res = await fetch(
    `${SUPA_URL}/rest/v1/push_tokens?select=id,device_token&platform=eq.ios`,
    {
      headers: {
        apikey: SUPA_SERVICE_KEY,
        Authorization: `Bearer ${SUPA_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) {
    console.error("APNs: failed to load tokens -", res.status, await res.text());
    return [];
  }
  return res.json();
}

async function deleteToken(id) {
  await fetch(`${SUPA_URL}/rest/v1/push_tokens?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPA_SERVICE_KEY,
      Authorization: `Bearer ${SUPA_SERVICE_KEY}`,
    },
  });
}

// ---- Send one push over HTTP/2 ----
function sendToToken(deviceToken, notification) {
  return new Promise((resolve, reject) => {
    const client = http2.connect(APNS_HOST);
    client.on("error", reject);

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${getJwt()}`,
      "apns-topic": BUNDLE_ID,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let status = 0;
    let body = "";
    req.on("response", (headers) => (status = headers[":status"]));
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      client.close();
      resolve({ status, body });
    });
    req.on("error", (err) => {
      client.close();
      reject(err);
    });

    req.end(
      JSON.stringify({
        aps: {
          alert: {
            title: notification.title,
            body: notification.body,
          },
          sound: "default",
          badge: 1,
        },
        url: notification.url || "https://www.scriptshiftwa.com.au",
      })
    );
  });
}

// ---- Public API: send to every stored iOS token; prune dead ones ----
export async function sendPushToAll(notification) {
  const rows = await loadTokens();
  if (!rows.length) {
    console.log("APNs: no tokens registered, skipping push");
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const { status, body } = await sendToToken(row.device_token, notification);
      if (status === 200) {
        sent++;
      } else {
        failed++;
        console.error(`APNs: status ${status} for token ${row.id} - ${body}`);
        if (status === 410) await deleteToken(row.id); // token no longer valid
      }
    } catch (err) {
      failed++;
      console.error(`APNs: send error for token ${row.id} -`, err.message);
    }
  }

  console.log(
    `APNs: pushed "${notification.title}" - ${sent} ok, ${failed} failed`
  );
  return { sent, failed };
}
