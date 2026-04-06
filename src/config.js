const readEnv = key => {
  const value = import.meta.env[key]
  return typeof value === 'string' ? value.trim() : ''
}

export const config = {
  supabase: {
    url: readEnv('VITE_SUPABASE_URL'),
    anonKey: readEnv('VITE_SUPABASE_ANON_KEY'),
  },
}
