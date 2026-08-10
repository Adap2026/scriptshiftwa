// Drop this into App.js (or its own file imported into App.js) — it follows
// the same raw-fetch Supabase pattern as the rest of the app (no
// @supabase/supabase-js, no Tailwind). Ideally SUPA_URL/SUPA_KEY get pulled
// out into a shared constants file at some point, but for now this just
// mirrors the values already defined at the top of App.js.

import React, { useState, useEffect, useCallback } from "react";

const SUPA_URL = "https://ageszwwbtawphfmtmrfj.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZXN6d3didGF3cGhmbXRtcmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMjM0MzgsImV4cCI6MjA5NTY5OTQzOH0.YkPqcazPk11CoCecf1m9LCIU9zXIH96XnIDtvRyZVWE";
const FEED_BASE = "https://www.scriptshiftwa.com.au/api/calendar-feed";

// Match the T design tokens already declared in App.js
const T = {
  bg: "#0E0F13", bgCard: "#16181F", border: "#252830",
  amber: "#F0A500", amberDim: "#3D2D00", amberText: "#FFD166",
  white: "#F5F6FA", dim: "#8B8FA8", dimmer: "#545770",
};

export default function CalendarSubscribe({ user }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchOrCreateToken = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const sessionToken = localStorage.getItem("ss_token") || SUPA_KEY;

    try {
      const res = await fetch(
        `${SUPA_URL}/rest/v1/calendar_feed_tokens?user_id=eq.${user.id}&select=token`,
        { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${sessionToken}` } }
      );
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        setToken(rows[0].token);
        setLoading(false);
        return;
      }

      // No token yet (e.g. pre-migration account) — create one
      const createRes = await fetch(`${SUPA_URL}/rest/v1/calendar_feed_tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPA_KEY,
          Authorization: `Bearer ${sessionToken}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({ user_id: user.id }),
      });
      const created = await createRes.json();
      const row = Array.isArray(created) ? created[0] : created;
      if (row?.token) setToken(row.token);
    } catch (e) {
      console.warn("Calendar token fetch/create failed:", e);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchOrCreateToken(); }, [fetchOrCreateToken]);

  if (!user) return null;

  if (loading) {
    return <div style={{ fontSize: 13, color: T.dim }}>Loading calendar link…</div>;
  }

  if (!token) {
    return (
      <div style={{ fontSize: 13, color: "#e05555" }}>
        Couldn't load your calendar link. Try refreshing.
      </div>
    );
  }

  const httpsUrl = `${FEED_BASE}?token=${token}`;
  const webcalUrl = httpsUrl.replace("https://", "webcal://");
  const googleAddUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(httpsUrl)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(httpsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 4 }}>📅 Shift Calendar</div>
      <div style={{ fontSize: 12, color: T.dim, lineHeight: 1.6, marginBottom: 12 }}>
        Subscribe once and every accepted shift — as owner or as pharmacist — stays synced automatically, even after it's marked filled in ScriptShift.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <a href={googleAddUrl} target="_blank" rel="noreferrer"
          style={{ padding: "8px 16px", borderRadius: 8, background: T.amber, color: "#000", fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit',sans-serif" }}>
          Add to Google Calendar
        </a>
        <a href={webcalUrl}
          style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.amber}`, color: T.amberText, fontSize: 12, fontWeight: 700, textDecoration: "none", fontFamily: "'Outfit',sans-serif" }}>
          Add to Apple / Outlook
        </a>
        <button onClick={handleCopy}
          style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.dim, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <details style={{ fontSize: 11, color: T.dimmer }}>
        <summary style={{ cursor: "pointer" }}>Manual setup instructions</summary>
        <ul style={{ marginTop: 8, paddingLeft: 18, lineHeight: 1.7 }}>
          <li>Google Calendar: Settings → Add calendar → From URL → paste the copied link</li>
          <li>Apple Calendar: File → New Calendar Subscription → paste the copied link</li>
          <li>Outlook: Add calendar → Subscribe from web → paste the copied link</li>
        </ul>
      </details>
    </div>
  );
}
