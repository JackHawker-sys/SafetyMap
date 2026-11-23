import type { User, UserRole } from "../../Models/User";

// Tài khoản demo: CHỈ dùng để trình bày giao diện khi chưa có backend.
// Không gọi được API thật (không có JWT) -> backend vẫn chặn mọi thao tác.
// Lưu ý: email/mật khẩu này nằm trong bundle JS, ai mở DevTools cũng đọc được.
export const DEMO_LOGIN_ENABLED = import.meta.env.VITE_ENABLE_DEMO_LOGIN === "true";

const DEMO_EMAIL = "test@gmail.com";
const DEMO_PASSWORD = "123456";
const DEMO_ROLES: UserRole[] = ["USER", "MODERATOR", "ADMIN"];
const STORAGE_KEY = "safetymap_demo_user";

export type DemoSession = { user: User; roles: UserRole[] };

export function isDemoCredentials(email: string, password: string): boolean {
    return DEMO_LOGIN_ENABLED
        && email.trim().toLowerCase() === DEMO_EMAIL
        && password === DEMO_PASSWORD;
}

export function createDemoSession(): DemoSession {
    const session: DemoSession = {
        user: {
            id: 0,
            email: DEMO_EMAIL,
            displayName: "TEST (DEMO)",
            isActive: true,
            createdAt: new Date().toISOString(),
        },
        roles: [...DEMO_ROLES],
    };
    saveDemoSession(session);
    return session;
}

export function saveDemoSession(session: DemoSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

// Khôi phục khi F5. Chỉ chấp nhận đúng email demo, tránh ai đó tự ghi localStorage để "đăng nhập"
export function loadDemoSession(): DemoSession | null {
    if (!DEMO_LOGIN_ENABLED) {
        clearDemoSession();
        return null;
    }
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as DemoSession | null;
        if (parsed?.user?.email === DEMO_EMAIL && Array.isArray(parsed.roles)) return parsed;
    } catch {
        // dữ liệu hỏng
    }
    clearDemoSession();
    return null;
}

export function clearDemoSession(): void {
    localStorage.removeItem(STORAGE_KEY);
}
