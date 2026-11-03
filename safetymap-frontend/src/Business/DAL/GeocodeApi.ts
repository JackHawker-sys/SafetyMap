import { ENV } from "../Config/Env";
import type { GeoPlace } from "../Models/MapModels";
import { VN_BBOX } from "../Config/MapConfig";
const FETCH_LIMIT = 20;  // xin Photon nhiều để còn dư sau khi gộp trùng
const MAX_RESULTS = 8;   // số dòng hiện cho người dùng

// Chỉ tìm trong khung Việt Nam: minLng,minLat,maxLng,maxLat

const MIN_QUERY_LENGTH = 3;

// Định dạng Photon trả về (chỉ khai báo những field ta dùng)
interface PhotonFeature {
    geometry: { coordinates: [number, number] }; // [lng, lat]
    properties: {
        osm_id: number;
        osm_type: string;
        name?: string;
        housenumber?: string;
        street?: string;
        district?: string;
        city?: string;
        county?: string;
        state?: string;
    };
}

interface PhotonResponse {
    features: PhotonFeature[];
}

// ADAPTER: đổi dữ liệu Photon -> GeoPlace của app
function toGeoPlace(feature: PhotonFeature): GeoPlace {
    const properties = feature.properties;
    const [lng, lat] = feature.geometry.coordinates;

    const streetPart = properties.street
        ? [properties.housenumber, properties.street].filter(Boolean).join(" ")
        : undefined

    const parts = [properties.name, streetPart, properties.district, properties.city ?? properties.county, properties.state]
        .filter((x): x is string => !!x && x.trim() !== "");

    const uniqueParts = [...new Set(parts)];
    const fallback = `${lat.toFixed(5)},${lng.toFixed(5)}`;

    return {
        id: `${properties.osm_type}${properties.osm_id}`,
        label: uniqueParts.join(", ") || fallback,
        // Giống Google: phần đầu làm tiêu đề, phần còn lại làm dòng địa chỉ
        name: uniqueParts[0] ?? fallback,
        address: uniqueParts.slice(1).join(", ") || null,
        position: [lat, lng],
        source: "SEARCH",
    };
}

export async function searchPlaces(query: string,
    signal?: AbortSignal,
    nearLat?: number,
    nearLng?: number,): Promise<GeoPlace[]> {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) return [];

    const params = new URLSearchParams({
        q,
        limit: String(FETCH_LIMIT),
        bbox: VN_BBOX,
        lang: "default",
        dedupe: "0", // tắt gộp trùng của Photon (gộp sai vì đường VN không có postcode)
    });
    if (nearLat !== undefined && nearLng !== undefined) {
        params.set("lat", String(nearLat));
        params.set("lon", String(nearLng));
    }

    const res = await fetch(`${ENV.geocoderUrl}?${params}`, { signal });
    if (!res.ok) throw new Error(`Tìm địa chỉ lỗi: ${res.status}`);

    const data = (await res.json()) as PhotonResponse;

    // Tự gộp trùng theo label: nhiều way của cùng 1 đường trong cùng phường -> 1 dòng
    // Map giữ thứ tự chèn -> giữ nguyên thứ hạng của Photon
    const unique = new Map<string, GeoPlace>();
    for (const f of data.features) {
        const place = toGeoPlace(f);
        const key = place.label.toLocaleLowerCase("vi");
        if (!unique.has(key)) unique.set(key, place);
    }
    return [...unique.values()].slice(0, MAX_RESULTS);
}

export function getMyLocation(): Promise<GeoPlace> {
    return new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) {
            reject(new Error("Trình duyệt không hỗ trợ định vị"))
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
                id: `my-location-${pos.timestamp}`,
                label: "Vị trí của tôi",
                name: "Vị trí của tôi",
                address: null,
                position: [pos.coords.latitude, pos.coords.longitude],
                source: "GPS",
            }),

            (err) => reject(new Error(
                err.code === err.PERMISSION_DENIED
                    ? "Bạn đã chặn quyền truy cập vị trí"
                    : "Không lấy được vị trí, thử lại sau",
            )),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        )
    })
}