import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoPlace, SavedPlace } from "../../Business/Models/MapModels";
import { savedPlaceRepository, SAVED_PLACES_STORAGE_KEY } from "../../Business/DAL/SavedPlaceRepository";
import { placeKey } from "../../Business/Logic/PlaceLogic";

export function useSavedPlaces() {
    const [items, setItems] = useState<SavedPlace[]>([]);
    const [error, setError] = useState<string | null>(null);
    // Các key đang lưu/xóa dở -> chặn bấm liên tục gây 2 request chồng nhau (race condition)
    const pending = useRef(new Set<string>());
    const [busyKeys, setBusyKeys] = useState<ReadonlySet<string>>(new Set());

    const reload = useCallback(async () => {
        try {
            setItems(await savedPlaceRepository.list());
        } catch {
            setError("Không tải được danh sách đã lưu");
        }
    }, []);

    useEffect(() => {
        void reload();
        // Tab khác lưu/xóa -> tab này cập nhật theo (sự kiện "storage" chỉ bắn ở các tab KHÁC)
        const onStorage = (e: StorageEvent) => {
            if (e.key === SAVED_PLACES_STORAGE_KEY) void reload();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [reload]);

    // Set để tra "đã lưu chưa" O(1) thay vì find() mỗi lần render
    const savedKeys = useMemo(() => new Set(items.map((s) => s.key)), [items]);

    const isSaved = useCallback((place: GeoPlace) => savedKeys.has(placeKey(place)), [savedKeys]);

    const toggle = useCallback(async (place: GeoPlace) => {
        const key = placeKey(place);
        if (pending.current.has(key)) return; // đang xử lý điểm này rồi
        pending.current.add(key);
        setBusyKeys(new Set(pending.current));
        setError(null);
        try {
            if (savedKeys.has(key)) await savedPlaceRepository.remove(key);
            else await savedPlaceRepository.save(place);
            // Lấy lại từ nguồn thay vì tự sửa mảng -> luôn khớp với dữ liệu thật
            await reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không lưu được");
        } finally {
            pending.current.delete(key);
            setBusyKeys(new Set(pending.current));
        }
    }, [savedKeys, reload]);

    const isBusy = useCallback((place: GeoPlace) => busyKeys.has(placeKey(place)), [busyKeys]);

    return { items, isSaved, isBusy, toggle, error };
}
