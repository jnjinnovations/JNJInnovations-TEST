/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WEB3FORMS_KEY?: string;
  readonly VITE_FORMSPREE_ID?: string;
  readonly VITE_ATLAS_DATA_API_URL?: string;
  readonly VITE_ATLAS_DATA_API_KEY?: string;
  readonly VITE_ATLAS_CLUSTER_NAME?: string;
  readonly VITE_ATLAS_DB_NAME?: string;
  readonly VITE_ATLAS_COLLECTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
