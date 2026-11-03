import type { GeoPlace, PlaceSource } from "../Models/MapModels";

// 6 chữ số thập phân ~ 0.11 m, đủ để coi 2 lần click là "cùng một điểm"
const COORD_DECIMALS = 6;

export function formatCoords([lat, lng]: [number, number]): string {
    return `${lat.toFixed(COORD_DECIMALS)}, ${lng.toFixed(COORD_DECIMALS)}`;
}

// Khóa ổn định theo tọa độ: cùng 1 điểm dù tìm bằng search hay click -> cùng khóa
// -> bấm "Lưu" 2 lần (hoặc lưu từ 2 nguồn) không tạo 2 bản ghi
export function placeKey(place: Pick<GeoPlace, "position">): string {
    const [lat, lng] = place.position;
    return `${lat.toFixed(COORD_DECIMALS)},${lng.toFixed(COORD_DECIMALS)}`;
}

// FACTORY METHOD: mọi chỗ tạo "điểm ghim từ bản đồ" đều đi qua đây,
// GUI không tự ráp object -> sau này đổi cấu trúc GeoPlace chỉ sửa 1 chỗ
let pinCounter = 0;
export function createDroppedPin(lat: number, lng: number): GeoPlace {
    const position: [number, number] = [+lat.toFixed(COORD_DECIMALS), +lng.toFixed(COORD_DECIMALS)];
    pinCounter += 1;
    return {
        // Counter đảm bảo id luôn mới, kể cả khi click 2 lần đúng 1 điểm trong cùng 1 ms
        id: `pin-${pinCounter}-${placeKey({ position })}`,
        label: formatCoords(position),
        name: "Vị trí đã ghim",
        // TODO(backend): gọi API reverse-geocode để lấy địa chỉ thật (số nhà, đường, phường)
        address: null,
        position,
        source: "MAP",
    };
}

// Đổi nguồn của một điểm (vd: lấy từ danh sách đã lưu) mà không sửa object gốc
export function withSource(place: GeoPlace, source: PlaceSource): GeoPlace {
    return { ...place, source };
}
