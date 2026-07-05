// api/register-device-token.js
// Vercel serverless function — stores an iOS/Android push token
// against the authenticated user in Supabase.

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { device_token, platform } = req.body;

    if (!device_token) {
      return res.status(400).json({ error: 'device_token is required' });
    }

    // Get user from Authorization header (optional — token still stored if not authed)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Upsert the device token into the push_tokens table
    // (create the table via the SQL migration below if it doesn't exist)
    const { error } = await supabaseAdmin
      .from('push_tokens')
      .upsert({
        device_token,
        platform: platform || 'ios',
        user_id: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'device_token',
      });

    if (error) {
      console.error('push_tokens upsert error:', error);
      return res.status(500).json({ error: 'Failed to store token' });
    }

    console.log(`Device token registered: ${device_token.slice(0, 8)}... user: ${userId || 'anonymous'}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('register-device-token error:', err);
    return res.status(500).json({ error: 'Unexpected error' });
  }
};
