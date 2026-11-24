import leaflet from "leaflet";

// ==========================================================================
// S.A.F.E.R Tactical Marker System - Modern Distinctive Security HUD
// ==========================================================================

// 1. Điểm đến mục tiêu (Destination / Target Waypoint / Selected Pin)
// Ghim tác chiến đỏ Crimson có vòng radar chạm đất & icon cờ đích đến
export const destinationWaypointIcon = leaflet.divIcon({
    className: "sm-pin sm-pin-destination",
    html: `
        <div class="sm-target-beacon">
            <span class="sm-target-ripple"></span>
            <div class="sm-target-pin-wrap">
                <svg width="34" height="46" viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="smDestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#f87171" />
                            <stop offset="40%" stop-color="#ef4444" />
                            <stop offset="100%" stop-color="#b91c1c" />
                        </linearGradient>
                    </defs>
                    <path d="M17 1C8.2 1 1 8.2 1 17c0 12.2 16 28 16 28s16-15.8 16-28C33 8.2 25.8 1 17 1z"
                          fill="url(#smDestGrad)" stroke="#ffffff" stroke-width="2.5"/>
                    <circle cx="17" cy="17" r="7.5" fill="#ffffff"/>
                    <!-- Icon Cờ về đích (Finish Flag) -->
                    <path d="M14 11.5v11h1.4v-4.2h5.6l-1.8-3.4 1.8-3.4H14z" fill="#b91c1c"/>
                </svg>
            </div>
        </div>
    `,
    iconSize: [34, 46],
    iconAnchor: [17, 45],
});

// Ghim chọn điểm bình thường trên bản đồ (Dropped Pin / Vị trí đã ghim)
// Thiết kế ghim đỏ kinh điển chuẩn bản đồ, phối bóng đổ chân thực (Ground Drop Shadow) và hiệu ứng cắm ghim nảy nhẹ
export const selectedPinIcon = leaflet.divIcon({
    className: "sm-pin sm-pin-dropped",
    html: `
        <div class="sm-dropped-pin-wrap">
            <span class="sm-pin-ground-shadow"></span>
            <div class="sm-dropped-pin-body">
                <svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="smDropPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#f87171" />
                            <stop offset="45%" stop-color="#ef4444" />
                            <stop offset="100%" stop-color="#dc2626" />
                        </linearGradient>
                    </defs>
                    <path d="M16 1C7.7 1 1 7.7 1 16c0 11.5 15 27 15 27s15-15.5 15-27C31 7.7 24.3 1 16 1z"
                          fill="url(#smDropPinGrad)" stroke="#ffffff" stroke-width="2.5"/>
                    <circle cx="16" cy="16" r="5.5" fill="#ffffff"/>
                </svg>
            </div>
        </div>
    `,
    iconSize: [32, 44],
    iconAnchor: [16, 43],
});

// 2. Điểm xuất phát thủ công (Manual Departure Waypoint)
// Mốc Waypoint màu xanh lục Emerald phát quang có icon Mũi tên định hướng xuất phát
export const departureWaypointIcon = leaflet.divIcon({
    className: "sm-pin sm-pin-departure",
    html: `
        <div class="sm-waypoint-beacon">
            <span class="sm-waypoint-pulse"></span>
            <div class="sm-waypoint-badge">
                <i class="fa-solid fa-location-arrow sm-waypoint-icon"></i>
            </div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

// 3. Vị trí của tôi - Radar Sonar Beacon phát sóng liên tục (GPS Live Telemetry)
// Dùng cho bản đồ thường
export const userLocationDotIcon = leaflet.divIcon({
    className: "sm-pin sm-pin-user-dot",
    html: `
        <div class="sm-user-sonar-wrap">
            <span class="sm-sonar-wave sm-sonar-wave-1"></span>
            <span class="sm-sonar-wave sm-sonar-wave-2"></span>
            <div class="sm-sonar-core">
                <span class="sm-sonar-core-glow"></span>
            </div>
        </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

// 4. Vị trí của tôi khi ĐƯỢC CHỌN LÀM ĐIỂM ĐI (GPS Departure Beacon)
// Giữ nguyên bản sắc Sonar Beacon nhưng gắn thêm badge tag Mũi tên xuất phát
export const userLocationOriginIcon = leaflet.divIcon({
    className: "sm-pin sm-pin-user-origin",
    html: `
        <div class="sm-user-origin-wrap">
            <span class="sm-sonar-wave sm-sonar-wave-1"></span>
            <span class="sm-sonar-wave sm-sonar-wave-2"></span>
            <div class="sm-sonar-core sm-sonar-core-origin">
                <span class="sm-sonar-core-glow"></span>
            </div>
            <div class="sm-origin-tag-badge">
                <i class="fa-solid fa-location-arrow" style="font-size: 8px;"></i>
            </div>
        </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
});

// 5. Điểm đã lưu (Saved Bookmark Dot)
export const savedPinIcon = leaflet.divIcon({
    className: "sm-pin sm-pin-saved",
    html: `<span class="sm-saved-dot"><i class="fa-solid fa-bookmark"></i></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

