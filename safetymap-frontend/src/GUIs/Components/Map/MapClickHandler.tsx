import { useEffect, useRef } from "react";
import { useMapEvents } from "react-leaflet";

interface Props {
    onClick: (lat: number, lng: number) => void;
}

// Double-click trên bản đồ = zoom, nhưng trình duyệt vẫn bắn 2 lần "click" trước đó.
// -> Chờ một chút: nếu có dblclick theo sau thì hủy, không ghim điểm.
const SINGLE_CLICK_DELAY_MS = 250;

export default function MapClickHandler({ onClick }: Props) {
    const timer = useRef<number | undefined>(undefined);

    // Luôn gọi bản onClick MỚI NHẤT, kể cả khi timer được đặt từ lần render trước
    // (tránh "stale closure": điền điểm vào ô cũ sau khi người dùng vừa đổi ô)
    const onClickRef = useRef(onClick);
    useEffect(() => { onClickRef.current = onClick; }, [onClick]);

    // Component bị gỡ (vd: bật CoordPicker) khi timer còn chạy -> hủy để không gọi vào state đã mất
    useEffect(() => () => window.clearTimeout(timer.current), []);

    useMapEvents({
        click(e) {
            window.clearTimeout(timer.current);
            const { lat, lng } = e.latlng;
            timer.current = window.setTimeout(() => onClickRef.current(lat, lng), SINGLE_CLICK_DELAY_MS);
        },
        dblclick() {
            window.clearTimeout(timer.current);
        },
    });

    return null;
}
