import type { RoadSegment, DangerScore, Incident } from "../Models/MapModels";

const API_URL = "http://localhost:3001";//* */

async function getJson<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error(`Gọi ${path} lỗi: ${res.status}`);
    return res.json() as Promise<T>;
}

export const getRoadSegments = () => getJson<RoadSegment[]>("/road_segments");
export const getDangerScores = () => getJson<DangerScore[]>("/danger_scores");
export const getIncidents = () => getJson<Incident[]>("/incidents");