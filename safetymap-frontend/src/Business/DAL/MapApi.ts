import type { RoadSegment, DangerScore, Incident } from "../Models/MapModels";

// Cấu trúc file public/db.json
interface Db {
    road_segments: RoadSegment[];
    danger_scores: DangerScore[];
    incidents: Incident[];
}

// Chỉ tải db.json một lần, các lần gọi sau dùng lại kết quả
let dbPromise: Promise<Db> | null = null;

function loadDb(): Promise<Db> {
    if (!dbPromise) {
        dbPromise = fetch("/db.json").then((res) => {
            if (!res.ok) throw new Error(`Tải db.json lỗi: ${res.status}`);
            return res.json() as Promise<Db>;
        });
    }
    return dbPromise;
}

export const getRoadSegments = async () => (await loadDb()).road_segments;
export const getDangerScores = async () => (await loadDb()).danger_scores;
export const getIncidents = async () => (await loadDb()).incidents;