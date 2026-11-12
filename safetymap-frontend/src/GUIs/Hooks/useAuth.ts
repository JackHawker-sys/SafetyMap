import { useState, useCallback } from "react";

export type UserRole = "USER" | "MODERATOR" | "ADMIN";

// Dữ liệu người dùng lưu tạm phía frontend (localStorage)
export interface User {
    name: string;
    email: string;
    isGoogle?: boolean;
    roles: UserRole[];
}

const STORAGE_KEY = "safetymap_user";

// Đọc user từ localStorage lúc khởi động
function getStoredUser(): User | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<User>;
        if (!parsed.name || !parsed.email) return null;
        // Đảm bảo luôn có mảng roles (mặc định cấp đủ quyền cho tài khoản demo test)
        const roles = Array.isArray(parsed.roles) && parsed.roles.length > 0
            ? parsed.roles
            : ["USER", "MODERATOR", "ADMIN"] as UserRole[];
        return {
            name: parsed.name,
            email: parsed.email,
            isGoogle: Boolean(parsed.isGoogle),
            roles,
        };
    } catch {
        return null;
    }
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(getStoredUser);
    const [error, setError] = useState<string | null>(null);

    // Đăng nhập email/mật khẩu giả lập phía frontend
    const login = useCallback((email: string, pass: string): boolean => {
        setError(null);
        if (!email.trim() || !pass.trim()) {
            setError("Vui lòng điền đầy đủ email và mật khẩu");
            return false;
        }
        if (pass.length < 4) {
            setError("Mật khẩu phải có ít nhất 4 ký tự");
            return false;
        }
        const name = email.split("@")[0].toUpperCase();
        // Tài khoản test mặc định cấp full role để kiểm thử
        const newUser: User = { name, email, roles: ["USER", "MODERATOR", "ADMIN"] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        return true;
    }, []);

    // Đăng ký tài khoản mới phía frontend (mặc định role USER)
    const signup = useCallback((name: string, email: string, pass: string): boolean => {
        setError(null);
        if (!name.trim() || !email.trim() || !pass.trim()) {
            setError("Vui lòng điền đầy đủ các trường thông tin");
            return false;
        }
        if (pass.length < 4) {
            setError("Mật khẩu phải có ít nhất 4 ký tự");
            return false;
        }
        const newUser: User = { name: name.trim(), email: email.trim(), roles: ["USER"] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        return true;
    }, []);

    // Đăng nhập bằng Google (tên tài khoản mặc định là TEST)
    const loginWithGoogle = useCallback(() => {
        setError(null);
        const googleUser: User = {
            name: "TEST",
            email: "test@safermap.vn",
            isGoogle: true,
            roles: ["USER", "MODERATOR", "ADMIN"],
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
        setUser(googleUser);
    }, []);

    // Bật/tắt quyền role nhanh để phục vụ việc test giao diện phân quyền
    const toggleRole = useCallback((role: UserRole) => {
        setUser((prev) => {
            if (!prev) return null;
            const exists = prev.roles.includes(role);
            const nextRoles = exists
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role];
            // Luôn giữ tối thiểu role USER
            const finalRoles: UserRole[] = nextRoles.length === 0 ? ["USER"] : nextRoles;
            const updated: User = { ...prev, roles: finalRoles };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Đăng xuất và dọn dẹp localStorage
    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setError(null);
    }, []);

    const hasRole = useCallback((role: UserRole): boolean => {
        return Boolean(user?.roles.includes(role));
    }, [user]);

    return {
        user,
        isLoggedIn: user !== null,
        error,
        clearError: () => setError(null),
        login,
        signup,
        loginWithGoogle,
        logout,
        toggleRole,
        hasRole,
    };
}
