export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentType = "ACCIDENT" | "ROBBERY" | "ASSAULT" | "NATURAL_DISASTER" | "OTHER";
export type IncidentStatus = "PENDING" | "VERIFIED" | "REJECTED" | "RESOLVED";

export interface LineString {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat]
}

export interface RoadSegment {
    id: number;
    street_id: number;
    ward_id: number | null;
    segment_order: number;
    length_m: number;
    road_class: string;
    road_shape: LineString;
}

export interface DangerScore {
    id: number;
    segment_id: number;
    score: number;
    confidence_level: number;
    incident_count: number;
    calculated_at: string;
}

export interface Incident {
    id: number;
    house_number: string | null;
    street_id: number;
    neighborhood: string | null;
    segment_id: number | null;
    location_precision: "EXACT" | "STREET";
    description: string;
    severity: IncidentSeverity;
    type: IncidentType;
    status: IncidentStatus;
    latitude: number;
    longitude: number;
    occurred_at: string;
}

// Điểm này đến từ đâu -> quyết định hành vi giao diện (có bay bản đồ tới không, hiện tiêu đề gì)
export type PlaceSource = "SEARCH" | "MAP" | "GPS" | "SAVED";

// Một địa điểm đã chọn (từ gợi ý, click bản đồ, GPS hoặc danh sách đã lưu), dùng chung cho cả app
export interface GeoPlace {
    id: string;
    label: string;              // chuỗi đầy đủ, hiện trong ô input
    name: string;               // dòng tiêu đề lớn trên sidebar (vd: "1056 Phạm Văn Đồng")
    address: string | null;     // dòng phụ bên dưới (vd: "Phường Phú Lợi, TP. Hồ Chí Minh")
    position: [number, number]; // [lat, lng] cho Leaflet
    source: PlaceSource;
}

// Một điểm người dùng đã bấm "Lưu"
export interface SavedPlace {
    key: string;                // khóa chống trùng, sinh từ tọa độ (xem PlaceLogic.placeKey)
    place: GeoPlace;
    savedAt: string;            // ISO string
}

// Cặp điểm đi / điểm đến của một lần tìm đường
export interface RoutePoints {
    from: GeoPlace | null;
    to: GeoPlace | null;
}