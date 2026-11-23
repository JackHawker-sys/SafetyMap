import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Hooks/useAuth";
import { useLanguage } from "../Context/LanguageContext";
import type { UserRole } from "../../Business/Models/User";

interface Props {
    role: UserRole;
    children: ReactNode;
}

// Chỉ chặn ở GIAO DIỆN; API /api/admin/** và /api/moderation/** vẫn do backend kiểm tra quyền
export default function RequireRole({ role, children }: Props) {
    const { user, initializing, hasRole } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();

    // F5 ở /admin: chờ /api/auth/refresh xong mới quyết định, tránh bị đẩy về "/" nhầm
    if (initializing) {
        return <div style={{ padding: 24, fontFamily: "sans-serif" }}>{t("common.loading")}</div>;
    }

    // Chưa đăng nhập -> chuyển sang trang /login kèm vị trí đích để đăng nhập xong tự quay lại
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Đã đăng nhập nhưng thiếu role -> về bản đồ
    if (!hasRole(role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}