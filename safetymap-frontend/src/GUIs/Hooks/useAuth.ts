import { useState, useCallback } from "react";

// Dữ liệu người dùng lưu tạm phía frontend (localStorage)
export interface User {
    name: string;
    email: string;
    isGoogle?: boolean;
}

const STORAGE_KEY = "safetymap_user_v1";

// Đọc user từ localStorage lúc khởi động
function getStoredUser(): User | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
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
        const newUser: User = { name, email };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        return true;
    }, []);

    // Đăng ký tài khoản mới phía frontend
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
        const newUser: User = { name: name.trim(), email: email.trim() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        setUser(newUser);
        return true;
    }, []);

    // Đăng nhập bằng Google (giả lập phía frontend)
    const loginWithGoogle = useCallback(() => {
        setError(null);
        const googleUser: User = {
            name: "Nguyễn",
            email: "safety@gmail.com",
            isGoogle: true,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
        setUser(googleUser);
    }, []);

    // Đăng xuất và dọn dẹp localStorage
    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setError(null);
    }, []);

    return {
        user,
        isLoggedIn: user !== null,
        error,
        clearError: () => setError(null),
        login,
        signup,
        loginWithGoogle,
        logout,
    };
}
