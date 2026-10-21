import { useState } from "react";
import { Polyline, CircleMarker, useMapEvents } from "react-leaflet";
import { toSegmentDraft, type LatLngPoint } from "../../Business/Logic/GeoLogic";

// Công cụ dev để vẽ road_segment:
// - Click trái: thêm điểm
// - Click phải: kết thúc đoạn, bắt đầu đoạn mới TỪ điểm cuối (chung ngã tư)
export default function CoordPicker() {
    const [points, setPoints] = useState<LatLngPoint[]>([]);

    useMapEvents({
        click(e) {
            const p: LatLngPoint = [+e.latlng.lat.toFixed(6), +e.latlng.lng.toFixed(6)];
            const next = [...points, p];
            setPoints(next);
            if (next.length >= 2) {
                console.clear();
                console.log(JSON.stringify(toSegmentDraft(next), null, 2));
            }
        },
        contextmenu() {
            if (points.length === 0) return;
            const last = points[points.length - 1];
            setPoints([last]);
            console.log("--- Bắt đầu đoạn mới từ", last, "---");
        },
    });

    return (
        <>
            <Polyline positions={points} pathOptions={{ color: "#1565c0", weight: 4, dashArray: "6 6" }} />
            {points.map((p, i) => (
                <CircleMarker key={i} center={p} radius={4} pathOptions={{ color: "#1565c0" }} />
            ))}
        </>
    );
}