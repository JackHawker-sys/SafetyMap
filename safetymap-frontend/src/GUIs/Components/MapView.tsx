import { useEffect, useState } from "react";
import { MapContainer, Polyline, CircleMarker, Popup } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { loadMapData, type MapData } from "../../Business/Logic/MapLogic";
import CoordPicker from "./CoordPicker";
import MapLibreLayer from "./MapLibreLayer";

// Tâm bản đồ: khoảng giữa Việt Nam
const PHU_LOI_CENTER: LatLngExpression = [10.9822, 106.6719];
// const VIETNAM_CENTER: LatLngExpression = [16.0, 107.5];

// Khung giới hạn: không cho kéo bản đồ ra quá xa Việt Nam
// (đã tính cả Hoàng Sa và Trường Sa ở phía đông)
const VIETNAM_BOUNDS: LatLngBoundsExpression = [
    [7.0, 101.5],  // góc Tây Nam
    [24.0, 118.0], // góc Đông Bắc
];

// File style MapLibre (đã ẩn nhãn TQ, thêm nhãn Hoàng Sa, Trường Sa tiếng Việt)
// Đặt tại public/map/openfreemap_positron.json
const MAP_STYLE_URL = new URL(
    "/map/openfreemap_positron.json",
    window.location.origin,
).href;

const MAP_ATTRIBUTION =
    '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> ' +
    '<a href="https://www.openmaptiles.org/">&copy; OpenMapTiles</a> ' +
    'Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export default function MapView() {
    const [data, setData] = useState<MapData>({ segments: [], incidents: [] });

    useEffect(() => {
        loadMapData()
            .then(setData)
            .catch((err) => console.error("Lỗi tải dữ liệu:", err));
    }, []);

    return (
        <MapContainer
            center={PHU_LOI_CENTER}
            zoom={16}
            minZoom={5}
            maxZoom={18}
            maxBounds={VIETNAM_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }}
        >
            <MapLibreLayer style={MAP_STYLE_URL} attribution={MAP_ATTRIBUTION} />

            {import.meta.env.DEV && <CoordPicker />}

            {data.segments.map((seg) => (
                <Polyline
                    key={seg.id}
                    positions={seg.positions}
                    pathOptions={{ color: seg.color, weight: 8, opacity: 0.8 }}
                >
                    <Popup>
                        Đoạn {seg.order} — {seg.lengthM} m<br />
                        Điểm nguy hiểm: {seg.score}
                    </Popup>
                </Polyline>
            ))}

            {data.incidents.map((inc) => (
                <CircleMarker
                    key={inc.id}
                    center={inc.position}
                    radius={8}
                    pathOptions={{ color: "#fff", weight: 2, fillColor: inc.color, fillOpacity: 1 }}
                >
                    <Popup>
                        <b>{inc.type}</b> ({inc.severity})<br />
                        {inc.description}<br />
                        {inc.houseNumber && `Số ${inc.houseNumber}, `}Trần Văn Ơn
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}