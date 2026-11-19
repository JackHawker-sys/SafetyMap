/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_GEOCODER_URL: string;
    readonly VITE_MAP_STYLE_URL: string;
    readonly VITE_USE_MOCK_DATA: string;
    readonly VITE_ENABLE_COORD_PICKER?: string; // "true" = bật công cụ vẽ road_segment (chỉ dev)
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}