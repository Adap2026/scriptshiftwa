// ============================================================
// SUPABASE SETUP
// ============================================================
// 1. Go to https://supabase.com and create a free project
// 2. Copy your Project URL and anon key from:
//    Project Settings → API → Project URL & anon/public key
// 3. Replace the placeholders below (or use a .env file)
//
// .env file (recommended):
//   REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
//   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL || "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY || "YOUR_ANON_KEY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// AUTH HELPERS
// ============================================================

export const signUp = async ({ email, password, fullName, role, ahpra }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role, ahpra_number: ahpra },
    },
  });
  if (error) throw error;

  // Create profile row
  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: fullName,
      role, // 'pharmacist' | 'owner'
      ahpra_number: ahpra || null,
      email,
    });
  }
  return data;
};

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
};

// ============================================================
// SHIFT HELPERS
// ============================================================

export const fetchShifts = async ({ region, type } = {}) => {
  let query = supabase
    .from("shifts")
    .select(
      `
      *,
      profiles:owner_id (full_name, pharmacy_name)
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (region && region !== "All") query = query.eq("region", region);
  if (type && type !== "All") query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const createShift = async (shiftData) => {
  const { data, error } = await supabase
    .from("shifts")
    .insert(shiftData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const applyForShift = async ({ shiftId, pharmacistId, message }) => {
  // Check not already applied
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("shift_id", shiftId)
    .eq("pharmacist_id", pharmacistId)
    .single();

  if (existing) throw new Error("Already applied for this shift");

  const { data, error } = await supabase
    .from("applications")
    .insert({
      shift_id: shiftId,
      pharmacist_id: pharmacistId,
      message,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  // Increment applicant count
  await supabase.rpc("increment_applicants", { shift_id: shiftId });

  return data;
};

export const getMyApplications = async (pharmacistId) => {
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      shifts (*)
    `
    )
    .eq("pharmacist_id", pharmacistId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const getShiftApplications = async (shiftId) => {
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      profiles:pharmacist_id (full_name, ahpra_number, rating)
    `
    )
    .eq("shift_id", shiftId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
};

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

export const subscribeToNewShifts = (callback) => {
  const channel = supabase
    .channel("public:shifts")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "shifts" },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => supabase.removeChannel(channel); // call to unsubscribe
};

export const subscribeToApplications = (shiftId, callback) => {
  const channel = supabase
    .channel(`applications:${shiftId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "applications",
        filter: `shift_id=eq.${shiftId}`,
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
};
