const config = {
  model: import.meta.env.VITE_MODEL,
  botUrl: import.meta.env.VITE_BOT_URL,
} as const;

export default config;