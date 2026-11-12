import leaflet from "leaflet";

// Marker vẽ bằng HTML/SVG (divIcon) thay vì ảnh PNG mặc định -> đổi màu bằng CSS, nét ở mọi độ phân giải.
// Tạo 1 lần ở cấp module: React render lại không tạo icon mới -> Leaflet không phải vẽ lại marker.
const pinSvg = (fill: string) =>
    `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 41 15 41s14-15.7 14-26.1C29 7.2 22.7 1 15 1z"
              fill="${fill}" stroke="#fff" stroke-width="2"/>
        <circle cx="15" cy="15" r="5" fill="#fff"/>
    </svg>`;

// Ghim đỏ: điểm đang xem / điểm đến
export const selectedPinIcon = leaflet.divIcon({
    className: "sm-pin",
    html: pinSvg("#ea4335"),
    iconSize: [30, 42],
    iconAnchor: [15, 41], // mũi ghim chạm đúng tọa độ
});

// Ghim xanh: điểm đã lưu
export const savedPinIcon = leaflet.divIcon({
    className: "sm-pin sm-pin-saved",
    html: `<span class="sm-saved-dot"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});
