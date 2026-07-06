/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MODEL: string;
  readonly VITE_BOT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}