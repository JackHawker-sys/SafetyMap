import type {
    RoadSegment, DangerScore, Incident, IncidentSeverity, LineString,
} from "../Models/MapModels";
import { getDangerLevel, type DangerLevel } from "./DangerLevel";
import { getRoadSegments, getDangerScores, getIncidents } from "../DAL/MapApi";

// Dữ liệu đã xử lý xong, GUI chỉ việc vẽ
export interface SegmentView {
    id: number;
    order: number;
    lengthM: number;
    positions: [number, number][]; // [lat, lng] cho Leaflet
    score: number;
    level: DangerLevel;
    color: string;
}

export interface IncidentView {
    id: number;
    position: [number, number];
    color: string;
    type: string;
    severity: IncidentSeverity;
    description: string;
    houseNumber: string | null;
}

export interface MapData {
    segments: SegmentView[];
    incidents: IncidentView[];
}

export const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
    LOW: "Nhẹ",
    MEDIUM: "Trung bình",
    HIGH: "Nghiêm trọng",
    CRITICAL: "Rất nghiêm trọng",
};

export const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
    LOW: "#43a047",
    MEDIUM: "#fbc02d",
    HIGH: "#f4511e",
    CRITICAL: "#b71c1c",
};

// GeoJSON [lng, lat] -> Leaflet [lat, lng]
export function toLatLngs(line: LineString): [number, number][] {
    return line.coordinates.map(([lng, lat]) => [lat, lng]);
}

// Duyệt danger_scores MỘT lần, giữ lại dòng mới nhất của mỗi segment
export function buildLatestScoreMap(scores: DangerScore[]): Map<number, number> {
    const latest = new Map<number, { score: number; time: number }>();
    for (const row of scores) {
        const time = Date.parse(row.calculated_at);
        if (Number.isNaN(time)) continue; // bỏ dòng có ngày lỗi
        const cur = latest.get(row.segment_id);
        if (!cur || time > cur.time) {
            latest.set(row.segment_id, { score: row.score, time });
        }
    }
    const result = new Map<number, number>();
    latest.forEach((v, id) => result.set(id, v.score));
    return result;
}

export function toSegmentViews(segments: RoadSegment[], scores: DangerScore[]): SegmentView[] {
    const latestScores = buildLatestScoreMap(scores); // O(n), chỉ 1 lần
    return segments.map((seg) => {
        const score = latestScores.get(seg.id) ?? 0;  // O(1) mỗi đoạn
        const info = getDangerLevel(score);
        return {
            id: seg.id,
            order: seg.segment_order,
            lengthM: seg.length_m,
            positions: toLatLngs(seg.road_shape),
            score,
            level: info.level,
            color: info.color,
        };
    });
}

// Bản đồ công khai chỉ hiện sự cố đã xác minh
export function toIncidentViews(incidents: Incident[]): IncidentView[] {
    return incidents
        .filter((i) => i.status === "VERIFIED")
        .map((i) => ({
            id: i.id,
            position: [i.latitude, i.longitude],
            color: SEVERITY_COLOR[i.severity],
            type: i.type,
            severity: i.severity,
            description: i.description,
            houseNumber: i.house_number,
        }));
}

// Hàm duy nhất GUI cần gọi
export async function loadMapData(): Promise<MapData> {
    const [segments, scores, incidents] = await Promise.all([
        getRoadSegments(),
        getDangerScores(),
        getIncidents(),
    ]);
    return {
        segments: toSegmentViews(segments, scores),
        incidents: toIncidentViews(incidents),
    };
}