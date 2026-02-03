/// <reference types="vite/client" />

interface ImportMetaEnv {
    VITE_API_URL?: string;
    // add other VITE_ env variables here if needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
