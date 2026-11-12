// Khớp enum UserRole trong database (bảng user_roles)
export type UserRole = "USER" | "MODERATOR" | "ADMIN";

// User DTO backend trả về: KHÔNG có password_hash, KHÔNG có role (role đọc từ JWT)
export type User = {
    id: number;
    email: string;
    displayName: string | null;
    isActive: boolean;
    createdAt: string; // ISO 8601, ví dụ "2026-11-12T03:40:00Z"
};

export type LoginRequest = {
    email: string;
    password: string;
}

// Response của POST /api/auth/login và POST /api/auth/refresh
// Refresh token KHÔNG nằm ở đây: backend đặt trong cookie HttpOnly
export type AuthResponse = {
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number; // số giây access token còn hiệu lực
    user: User;
};

// Body của POST /api/auth/register (confirmPassword chỉ kiểm tra ở frontend, không gửi)
export type SignupRequest = {
    displayName: string;
    email: string;
    password: string;
    captchaToken: string; // backend gửi token này cho Google để xác minh
};