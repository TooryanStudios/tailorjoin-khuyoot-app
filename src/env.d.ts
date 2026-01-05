/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_FAL_KEY: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
