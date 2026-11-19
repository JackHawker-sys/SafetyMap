import type { UserRole } from "../Models/User";

type JwtPayload = {
    sub?: string;
    roles?: unknown;
    exp?: number; // thời điểm hết hạn, tính bằng giây
    iat?: number;
};

const VALID_ROLES: readonly UserRole[] = ["USER", "MODERATOR", "ADMIN"];

// JWT dùng base64url (- và _ thay cho + và /, bỏ dấu =) -> đổi về base64 thường rồi giải mã
// Dùng TextDecoder để đọc đúng ký tự tiếng Việt (UTF-8)
function base64UrlDecode(input: string): string {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

// Chỉ ĐỌC payload, KHÔNG kiểm tra chữ ký -> chỉ dùng để ẩn/hiện giao diện
export function decodeJwtPayload(token: string): JwtPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    try {
        return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
    } catch {
        return null;
    }
}

// Lấy claim "roles", bỏ qua giá trị lạ không thuộc USER / MODERATOR / ADMIN
export function getRolesFromToken(token: string): UserRole[] {
    const roles = decodeJwtPayload(token)?.roles;
    if (!Array.isArray(roles)) return [];
    return roles.filter((r): r is UserRole => VALID_ROLES.includes(r as UserRole));
}