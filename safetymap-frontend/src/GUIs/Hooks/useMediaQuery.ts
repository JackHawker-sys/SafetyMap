import { useSyncExternalStore } from "react";

// Theo dõi media query (vd: màn hình rộng hay hẹp).
// useSyncExternalStore: React tự đăng ký / hủy listener và không bị "tearing" khi render đồng thời
export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (notify) => {
            const mql = window.matchMedia(query);
            mql.addEventListener("change", notify);
            return () => mql.removeEventListener("change", notify);
        },
        () => window.matchMedia(query).matches,
    );
}
