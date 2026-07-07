// lib/apns.js
// APNs push sender for ScriptShift WA (Vercel serverless, no external deps).
// Uses HTTP/2 + a manually signed ES256 JWT via node:crypto.
//
// Required environment variables (add in Vercel dashboard):
//   APNS_KEY      - full contents of the .p8 file (including BEGIN/END lines)
//   APNS_KEY_ID   - 10-char Key ID from developer.apple.com
//   APNS_TEAM_ID  - 10-char Team ID (top right of developer account)
//   APNS_HOST     - optional. Defaults to production.
//                   Use https://api.sandbox.push.apple.com for Xcode dev builds.

import http2 from "http2";
import crypto from "crypto";

const BUNDLE_ID = "com.scriptshiftwa.app";
const APNS_HOST =
  process.env.APNS_HOST || "https://api.push.apple.com";

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

// ---- Send one push. Resolves { status, body } ----
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
        // custom payload the web app can read on notification tap
        url: notification.url || "https://www.scriptshiftwa.com.au",
      })
    );
  });
}

// ---- Send to every stored token; prune dead ones (410) ----
// supabase: a client created with the SERVICE ROLE key
async function sendPushToAll(supabase, notification) {
  const { data: rows, error } = await supabase
    .from("push_tokens")
    .select("id, device_token")
    .eq("platform", "ios");

  if (error) {
    console.error("APNs: failed to load tokens -", error.message);
    return { sent: 0, failed: 0 };
  }
  if (!rows || rows.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const { status, body } = await sendToToken(
        row.device_token,
        notification
      );
      if (status === 200) {
        sent++;
      } else {
        failed++;
        console.error(`APNs: status ${status} for token ${row.id} - ${body}`);
        // 410 = token no longer valid; remove it
        if (status === 410) {
          await supabase.from("push_tokens").delete().eq("id", row.id);
        }
      }
    } catch (err) {
      failed++;
      console.error(`APNs: send error for token ${row.id} -`, err.message);
    }
  }

  console.log(`APNs: pushed "${notification.title}" - ${sent} ok, ${failed} failed`);
  return { sent, failed };
}

export { sendPushToAll };
