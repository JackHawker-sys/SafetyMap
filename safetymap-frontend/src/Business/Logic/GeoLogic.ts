// Điểm dạng [lat, lng] như Leaflet dùng
export type LatLngPoint = [number, number];

const EARTH_RADIUS_M = 6371008.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;

// Khoảng cách giữa 2 điểm (công thức Haversine), đơn vị mét
export function distanceM(a: LatLngPoint, b: LatLngPoint): number {
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Chiều dài cả đường gấp khúc = tổng từng khúc nhỏ
export function lineLengthM(points: LatLngPoint[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += distanceM(points[i - 1], points[i]);
    }
    return total;
}

// Tạo phần JSON của một road_segment từ các điểm đã click
export function toSegmentDraft(points: LatLngPoint[]) {
    const first = points[0];
    const last = points[points.length - 1];
    return {
        start_latitude: first[0],
        start_longitude: first[1],
        end_latitude: last[0],
        end_longitude: last[1],
        length_m: Math.round(lineLengthM(points)),
        road_shape: {
            type: "LineString",
            coordinates: points.map(([lat, lng]) => [lng, lat]), // GeoJSON: lng trước
        },
    };
}