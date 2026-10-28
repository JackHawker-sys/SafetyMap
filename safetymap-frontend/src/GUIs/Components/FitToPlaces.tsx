import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";
import type { GeoPlace } from "../../Business/Models/MapModels";

interface Props {
    from: GeoPlace | null;
    to: GeoPlace | null
}

// Đưa bản đồ tới điểm vừa được CHỌN (không chạy khi một điểm bị xóa)
export default function FitToPlaces({ from, to }: Props) {
    const map = useMap();
    const prevIds = useRef<{ from?: string; to?: string }>({});

    useEffect(() => {
        const fromId = from?.id;
        const toId = to?.id;
        const added =
            (fromId !== undefined && fromId !== prevIds.current.from) ||
            (toId !== undefined && toId !== prevIds.current.to)
        prevIds.current = { from: fromId, to: toId };
        if (!added) return;

        const points = [from, to]
            .filter((pos): pos is GeoPlace => pos !== null)
            .map((pos) => pos.position)

        if (points.length === 1) {
            map.flyTo(points[0], Math.max(map.getZoom(), 16));
        } else {
            map.flyToBounds(leaflet.latLngBounds(points), { padding: [60, 60] });
        }
    }, [map, from, to]);

    return null
}