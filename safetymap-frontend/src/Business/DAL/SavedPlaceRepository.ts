import type { GeoPlace, SavedPlace } from "../Models/MapModels";
import { placeKey } from "../Logic/PlaceLogic";

// REPOSITORY PATTERN: GUI chỉ biết interface này, không biết dữ liệu nằm ở localStorage hay backend.
// Mọi hàm đều async -> khi đổi sang gọi API, code ở GUI không phải sửa.
export interface SavedPlaceRepository {
    list(): Promise<SavedPlace[]>;
    save(place: GeoPlace): Promise<SavedPlace>;
    remove(key: string): Promise<void>;
}

const STORAGE_KEY = "safetymap.savedPlaces.v1";
export const SAVED_PLACES_STORAGE_KEY = STORAGE_KEY;

// Bản lưu tạm trên trình duyệt, dùng tới khi backend có API (vd: GET/POST/DELETE /api/me/saved-places)
class LocalSavedPlaceRepository implements SavedPlaceRepository {
    private read(): SavedPlace[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            const parsed: unknown = JSON.parse(raw);
            // Dữ liệu trong localStorage có thể bị sửa tay / từ version cũ -> lọc dòng hỏng thay vì crash
            return Array.isArray(parsed) ? parsed.filter(isSavedPlace) : [];
        } catch {
            // Tab ẩn danh, bị chặn storage, JSON hỏng -> coi như chưa lưu gì
            return [];
        }
    }

    private write(items: SavedPlace[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            throw new Error("Không lưu được trên trình duyệt này");
        }
    }

    async list(): Promise<SavedPlace[]> {
        return this.read();
    }

    async save(place: GeoPlace): Promise<SavedPlace> {
        // Đọc lại NGAY trước khi ghi (không dùng state cũ trong React) -> tab khác vừa lưu cũng không bị ghi đè
        const items = this.read();
        const key = placeKey(place);
        const existing = items.find((s) => s.key === key);
        if (existing) return existing; // idempotent: lưu 2 lần = lưu 1 lần

        const saved: SavedPlace = { key, place: { ...place, source: "SAVED" }, savedAt: new Date().toISOString() };
        this.write([saved, ...items]);
        return saved;
    }

    async remove(key: string): Promise<void> {
        this.write(this.read().filter((s) => s.key !== key));
    }
}

function isSavedPlace(x: unknown): x is SavedPlace {
    if (typeof x !== "object" || x === null) return false;
    const s = x as Partial<SavedPlace>;
    const pos = s.place?.position;
    return typeof s.key === "string"
        && typeof s.place?.id === "string"
        && typeof s.place?.name === "string"
        && Array.isArray(pos) && pos.length === 2
        && Number.isFinite(pos[0]) && Number.isFinite(pos[1]);
}

// Chỉ có 1 instance cho cả app. Khi có backend: thêm ApiSavedPlaceRepository rồi đổi dòng này
export const savedPlaceRepository: SavedPlaceRepository = new LocalSavedPlaceRepository();
