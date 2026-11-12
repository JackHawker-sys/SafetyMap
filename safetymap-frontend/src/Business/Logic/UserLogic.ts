import type { User, UserRole } from "../Models/User";

// displayName có thể null -> dùng phần trước @ của email
export function getDisplayName(user: User): string {
    const name = user.displayName?.trim();
    return name ? name : user.email.split("@")[0];
}

// Badge theo role cao nhất
export function getRoleLabel(roles: UserRole[]): string {
    if (roles.includes("ADMIN")) return "Quản trị viên";
    if (roles.includes("MODERATOR")) return "Kiểm duyệt viên";
    return "Thành viên SafetyMap";
}

// Hiện nút vào trang quản trị (chỉ ẩn/hiện giao diện, backend vẫn kiểm tra quyền)
export function canAccessAdmin(roles: UserRole[]): boolean {
    return roles.includes("ADMIN") || roles.includes("MODERATOR");
}