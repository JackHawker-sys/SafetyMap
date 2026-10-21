import type {
    RoadSegment, DangerScore, Incident, IncidentSeverity, LineString,
} from "../Models/MapModels";
import { getRoadSegments, getDangerScores, getIncidents } from "../DAL/MapApi";

// Dữ liệu đã xử lý xong, GUI chỉ việc vẽ
export interface SegmentView {
    id: number;
    order: number;
    lengthM: number;
    positions: [number, number][]; // [lat, lng] cho Leaflet
    score: number;
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

// Điểm 0–100 -> màu
export function scoreColor(score: number): string {
    if (score >= 60) return "#d32f2f";
    if (score >= 30) return "#f57c00";
    return "#388e3c";
}

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

// Điểm hiện tại của một đoạn = dòng có calculated_at mới nhất; không có dòng nào thì là 0
export function latestScoreOf(segmentId: number, scores: DangerScore[]): number {
    const rows = scores
        .filter((s) => s.segment_id === segmentId)
        .sort((a, b) => b.calculated_at.localeCompare(a.calculated_at));
    return rows.length > 0 ? rows[0].score : 0;
}

export function toSegmentViews(segments: RoadSegment[], scores: DangerScore[]): SegmentView[] {
    return segments.map((seg) => {
        const score = latestScoreOf(seg.id, scores);
        return {
            id: seg.id,
            order: seg.segment_order,
            lengthM: seg.length_m,
            positions: toLatLngs(seg.road_shape),
            score,
            color: scoreColor(score),
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