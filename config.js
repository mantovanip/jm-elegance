/** JM Elegance. Use somente os dados PÚBLICOS do projeto Supabase da loja. */
export const CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_PUBLISHABLE_KEY: ''
};
export const isConfigured = () => Boolean(
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(CONFIG.SUPABASE_URL.replace(/\/$/,'')) &&
  (CONFIG.SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_') || CONFIG.SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ'))
);