function required(name: string, value: string | undefined): string {
    if (value === undefined || value.trim() === "") {
        throw new Error(`Thiếu biến môi trường ${name}. Kiểm tra file .env (xem .env.example)`);
    }
    return value.trim();
}

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

// Đọc TĨNH từng biến để Vite thay được giá trị lúc build
const raw = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    geocoderUrl: import.meta.env.VITE_GEOCODER_URL,
    mapStyleUrl: import.meta.env.VITE_MAP_STYLE_URL,
    useMockData: import.meta.env.VITE_USE_MOCK_DATA,
    enableCoordPicker: import.meta.env.VITE_ENABLE_COORD_PICKER,
};

export const ENV = Object.freeze({
    apiBaseUrl: stripTrailingSlash(raw.apiBaseUrl ?? ""),
    geocoderUrl: required("VITE_GEOCODER_URL", raw.geocoderUrl),
    mapStyleUrl: new URL(required("VITE_MAP_STYLE_URL", raw.mapStyleUrl), window.location.origin).href,
    useMockData: raw.useMockData === "true",
    // Công cụ vẽ road_segment (CoordPicker) chiếm sự kiện click bản đồ -> chỉ bật khi cần, và chỉ ở môi trường dev
    enableCoordPicker: import.meta.env.DEV && raw.enableCoordPicker === "true",
});