// supabase-config.js
if (typeof supabase === 'undefined') {
  console.error('❌ Supabase SDK failed to load. Check network, script tags, or ad-blocker settings.');
  window.supabaseClient = null;
} else {
  const SUPABASE_URL = 'https://oowrmsisgogscqgnnahp.supabase.co';
  // Ensure this is your project's actual 'anon' public key from Supabase Settings -> API
  const SUPABASE_ANON_KEY = 'sb_publishable_iTDs1RBLyJifkqng8cnQvw_Q8V1NTyU'; 

  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  console.log('⚡ Supabase client initialized successfully.');
}