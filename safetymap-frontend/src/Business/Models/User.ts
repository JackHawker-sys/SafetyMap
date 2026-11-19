// Khớp enum UserRole trong database (bảng user_roles)
export type UserRole = "USER" | "MODERATOR" | "ADMIN";

// User DTO backend trả về: KHÔNG có password, KHÔNG có role (role đọc từ JWT)
export type User = {
    id: number;
    email: string;
    displayName: string | null;
    isActive: boolean;
    createdAt: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type SignupRequest = {
    displayName: string;
    email: string;
    password: string;
    captchaToken: string;
};

// Response của /api/auth/login, /register, /refresh (refresh token nằm trong cookie HttpOnly)
export type AuthResponse = {
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number; // giây
    user: User;
};