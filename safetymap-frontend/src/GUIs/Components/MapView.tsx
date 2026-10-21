import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { loadMapData, type MapData } from "../../Business/Logic/MapLogic";
import CoordPicker from "./CoordPicker";

// Tâm bản đồ: khoảng giữa Việt Nam
const PHU_LOI_CENTER: LatLngExpression = [10.9822, 106.6719];
const VIETNAM_CENTER: LatLngExpression = [16.0, 107.5];

// Khung giới hạn: không cho kéo bản đồ ra quá xa Việt Nam
// (đã tính cả Hoàng Sa và Trường Sa ở phía đông)
const VIETNAM_BOUNDS: LatLngBoundsExpression = [
    [7.0, 101.5],  // góc Tây Nam
    [24.0, 118.0], // góc Đông Bắc
];

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
            maxBounds={VIETNAM_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

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