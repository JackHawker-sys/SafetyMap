import { useEffect, useState } from "react";

// Trả về giá trị chỉ sau khi `value` đứng yên đủ `delayMs`
export function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        // value đổi trước khi hết giờ -> hủy timer cũ, đếm lại từ đầ
        return () => clearTimeout(timer);
    }, [value, delayMs]);

    return debounced;
}