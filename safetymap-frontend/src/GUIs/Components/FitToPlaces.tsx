import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";
import type { GeoPlace } from "../../Business/Models/MapModels";

// Phần bản đồ đang bị sidebar che (px) -> điểm được đưa vào giữa phần CÒN NHÌN THẤY
export interface MapInsets {
    left: number;   // desktop: sidebar bên trái
    bottom: number; // điện thoại: sidebar thành bottom sheet
}

interface Props {
    places: (GeoPlace | null)[];
    insets: MapInsets;
}

const MIN_FOCUS_ZOOM = 16;

// Đưa bản đồ tới điểm vừa được CHỌN.
// Không chạy khi: một điểm bị xóa, hoặc điểm mới đến từ click bản đồ (người dùng đang nhìn đúng chỗ đó rồi, giống Google)
export default function FitToPlaces({ places, insets }: Props) {
    const map = useMap();
    const prevIds = useRef<Set<string>>(new Set());

    // Gom id thành 1 chuỗi để effect chỉ chạy khi danh sách điểm THỰC SỰ đổi,
    // không chạy lại chỉ vì cha render lại tạo mảng mới
    const present = places.filter((p): p is GeoPlace => p !== null);
    const idsKey = present.map((p) => p.id).join("|");

    // Đọc insets / places mới nhất qua ref -> mở/đóng sidebar KHÔNG làm bản đồ bay lại.
    // Effect không deps chạy sau mỗi lần render và chạy TRƯỚC effect bên dưới (React chạy theo thứ tự khai báo)
    const insetsRef = useRef(insets);
    const placesRef = useRef(present);
    useEffect(() => {
        insetsRef.current = insets;
        placesRef.current = present;
    });

    useEffect(() => {
        const current = placesRef.current;
        const added = current.filter((p) => !prevIds.current.has(p.id));
        prevIds.current = new Set(current.map((p) => p.id));

        if (added.length === 0 || added.every((p) => p.source === "MAP")) return;

        const { left, bottom } = insetsRef.current;
        if (current.length === 1) {
            const zoom = Math.max(map.getZoom(), MIN_FOCUS_ZOOM);
            // Dời tâm sang trái / xuống dưới nửa phần bị che -> điểm nằm giữa vùng nhìn thấy
            const target = map.project(current[0].position, zoom).add([-left / 2, bottom / 2]);
            map.flyTo(map.unproject(target, zoom), zoom);
        } else {
            map.flyToBounds(leaflet.latLngBounds(current.map((p) => p.position)), {
                paddingTopLeft: [left + 60, 60],
                paddingBottomRight: [60, bottom + 60],
            });
        }
    }, [map, idsKey]);

    return null;
}
