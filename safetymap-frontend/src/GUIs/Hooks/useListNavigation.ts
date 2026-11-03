import { useState, type KeyboardEvent } from "react";

// Điều khiển danh sách gợi ý bằng bàn phím (↑ ↓ Enter Esc), dùng chung cho SearchBar và PlaceInput
export function useListNavigation<T>(items: readonly T[], onPick: (item: T) => void, onEscape: () => void) {
    const [activeIndex, setActiveIndex] = useState(-1);

    // Danh sách đổi (kết quả mới về) mà index cũ vượt quá độ dài -> coi như chưa chọn dòng nào.
    // Tính ngay lúc render thay vì setState trong effect -> không bao giờ trỏ ra ngoài mảng
    const safeIndex = activeIndex < items.length ? activeIndex : -1;

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Escape") {
            onEscape();
            return;
        }
        if (items.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((safeIndex + 1) % items.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(safeIndex <= 0 ? items.length - 1 : safeIndex - 1);
        } else if (e.key === "Enter") {
            e.preventDefault();
            onPick(items[safeIndex >= 0 ? safeIndex : 0]);
        }
    }

    return { activeIndex: safeIndex, setActiveIndex, handleKeyDown };
}
