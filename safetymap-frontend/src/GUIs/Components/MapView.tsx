import { memo, useEffect, useState } from "react";
import { MapContainer, Polyline, CircleMarker, Marker, Popup, Tooltip, ZoomControl } from "react-leaflet";
import { loadMapData, type MapData } from "../../Business/Logic/MapLogic";
import CoordPicker from "./CoordPicker";
import MapLibreLayer from "./MapLibreLayer";
import MapLegend from "./MapLegend";
import MapClickHandler from "./MapClickHandler";
import type { GeoPlace, SavedPlace } from "../../Business/Models/MapModels";
import FitToPlaces, { type MapInsets } from "./FitToPlaces";
import { savedPinIcon, selectedPinIcon } from "./MapMarkers";
import { DEFAULT_CENTER, VIETNAM_BOUNDS } from "../../Business/Config/MapConfig";
import { ENV } from "../../Business/Config/Env";

const MAP_ATTRIBUTION =
    '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> ' +
    '<a href="https://www.openmaptiles.org/">&copy; OpenMapTiles</a> ' +
    'Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface Props {
    selected: GeoPlace | null;   // điểm đang xem (chế độ "place")
    from: GeoPlace | null;       // chế độ "directions"
    to: GeoPlace | null;
    savedPlaces: SavedPlace[];
    insets: MapInsets;
    onMapClick: (lat: number, lng: number) => void;
    onSavedClick: (place: GeoPlace) => void;
}

// Bấm vào đoạn đường / sự cố thì chỉ mở popup, KHÔNG lan xuống bản đồ (nếu lan sẽ ghim thêm 1 điểm)
const NO_BUBBLE = { bubblingMouseEvents: false } as const;

// Lớp dữ liệu nguy hiểm tách riêng + memo: chọn điểm / gõ chữ làm MapView render lại,
// nhưng hàng trăm Polyline này chỉ vẽ lại khi `data` đổi
const DangerLayer = memo(function DangerLayer({ data }: { data: MapData }) {
    return (
        <>
            {data.segments.map((seg) => (
                <Polyline key={seg.id} positions={seg.positions}
                    pathOptions={{ color: seg.color, weight: 8, opacity: 0.8, ...NO_BUBBLE }}>
                    <Popup>
                        Đoạn {seg.order} — {seg.lengthM} m<br />
                        Điểm nguy hiểm: {seg.score}
                    </Popup>
                </Polyline>
            ))}

            {data.incidents.map((inc) => (
                <CircleMarker key={inc.id} center={inc.position} radius={8}
                    pathOptions={{ color: "#fff", weight: 2, fillColor: inc.color, fillOpacity: 1, ...NO_BUBBLE }}>
                    <Popup>
                        <b>{inc.type}</b> ({inc.severity})<br />
                        {inc.description}<br />
                        {inc.houseNumber && `Số ${inc.houseNumber}, `}Trần Văn Ơn
                    </Popup>
                </CircleMarker>
            ))}
        </>
    );
});

export default function MapView({ selected, from, to, savedPlaces, insets, onMapClick, onSavedClick }: Props) {
    const [data, setData] = useState<MapData>({ segments: [], incidents: [] });

    useEffect(() => {
        let cancelled = false;
        loadMapData()
            .then((mapData) => { if (!cancelled) setData(mapData); })
            .catch((err) => { if (!cancelled) console.error("Lỗi tải dữ liệu", err); });
        return () => { cancelled = true; };
    }, []);

    return (
        <MapContainer
            center={DEFAULT_CENTER}
            zoom={16}
            minZoom={5}
            maxZoom={18}
            maxBounds={VIETNAM_BOUNDS}
            maxBoundsViscosity={1.0}
            zoomControl={false} // góc trên-trái nhường cho thanh tìm kiếm
            style={{ height: "100%", width: "100%" }}
        >
            {/* File style MapLibre (đã ẩn nhãn TQ, thêm nhãn Hoàng Sa, Trường Sa tiếng Việt)
                Đặt tại public/map/openfreemap_liberty_vn.json */}
            <MapLibreLayer style={ENV.mapStyleUrl} attribution={MAP_ATTRIBUTION} />
            <ZoomControl position="topright" />
            <MapLegend />

            {/* Hai công cụ cùng nghe click bản đồ -> chỉ bật 1 cái */}
            {ENV.enableCoordPicker ? <CoordPicker /> : <MapClickHandler onClick={onMapClick} />}

            <DangerLayer data={data} />

            {savedPlaces.map((s) => (
                <Marker key={s.key} position={s.place.position} icon={savedPinIcon}
                    eventHandlers={{ click: () => onSavedClick(s.place) }}>
                    <Tooltip direction="top" offset={[0, -8]}>{s.place.name}</Tooltip>
                </Marker>
            ))}

            <FitToPlaces places={selected ? [selected] : [from, to]} insets={insets} />

            {selected && (
                <Marker position={selected.position} icon={selectedPinIcon} zIndexOffset={1000} />
            )}

            {from && (
                <CircleMarker center={from.position} radius={8}
                    pathOptions={{ color: "#202124", weight: 3, fillColor: "#fff", fillOpacity: 1, ...NO_BUBBLE }}>
                    <Tooltip direction="top" offset={[0, -8]}>Điểm đi: {from.name}</Tooltip>
                </CircleMarker>
            )}

            {to && (
                <Marker position={to.position} icon={selectedPinIcon} zIndexOffset={1000}>
                    <Tooltip direction="top" offset={[0, -40]}>Điểm đến: {to.name}</Tooltip>
                </Marker>
            )}
        </MapContainer>
    );
}
