// 3 mức nguy hiểm, khớp với tài liệu database v2.7 (mục "Proposed levels and weights")
export type DangerLevel = "SAFE" | "SLIGHT" | "DANGER";

export interface DangerLevelInfo {
    level: DangerLevel;
    label: string;
    color: string;
    weight: number;
    minScore: number;
}

// Sắp xếp từ mức cao xuống thấp để find() lấy mức đầu tiên thỏa
export const DANGER_LEVELS: readonly DangerLevelInfo[] = Object.freeze([
    { level: "DANGER", label: "Nguy hiểm", color: "#d32f2f", weight: 2, minScore: 60 },
    { level: "SLIGHT", label: "Hơi nguy hiểm", color: "#f57c00", weight: 1.5, minScore: 35 },
    { level: "SAFE", label: "An toàn", color: "#388e3c", weight: 1, minScore: 0 },
]);

// Điểm 0–100 -> thông tin mức
export function getDangerLevel(score: number): DangerLevelInfo {
    // Chặn dữ liệu bẩn: NaN, undefined, âm, quá 100
    const s = Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 0;
    return DANGER_LEVELS.find((lv) => s >= lv.minScore) ?? DANGER_LEVELS[DANGER_LEVELS.length - 1];
}