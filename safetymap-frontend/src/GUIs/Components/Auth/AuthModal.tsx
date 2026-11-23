import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Hooks/useAuth";
import { useLanguage } from "../../Context/LanguageContext";
import { getDisplayName, getHighestRole } from "../../../Business/Logic/Auth/UserLogic";
import type { UserRole } from "../../../Business/Models/User";
import { CloseIcon } from "../Common/Icons";
import "../../../assets/styles/AuthModal.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Badge theo role cao nhất: khoá dịch + class màu
const ROLE_BADGE: Record<UserRole, { labelKey: string; className: string }> = {
    ADMIN: { labelKey: "auth.roleAdmin", className: "auth-badge-admin" },
    MODERATOR: { labelKey: "auth.roleModerator", className: "auth-badge-mod" },
    USER: { labelKey: "auth.roleUser", className: "auth-badge-user" },
};

// Modal hồ sơ: chỉ dùng khi ĐÃ đăng nhập. Đăng nhập/đăng ký nằm ở LoginPage (/login)
export default function AuthModal({ isOpen, onClose }: Props) {
    const { user, roles, isDemo, logout, toggleRole } = useAuth();
    const { t, lang } = useLanguage();
    const navigate = useNavigate();

    if (!isOpen || !user) return null;

    const goTo = (path: string) => {
        onClose();
        navigate(path);
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    const badge = ROLE_BADGE[getHighestRole(roles)];
    const hasMod = roles.includes("MODERATOR");
    const hasAdmin = roles.includes("ADMIN");

    return (
        <div className="auth-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="auth-close-btn" onClick={onClose} title={t("common.close")}>
                    <CloseIcon size={20} />
                </button>

                <div className="auth-profile-section">
                    <div className="auth-avatar-circle">
                        {getDisplayName(user).charAt(0).toUpperCase()}
                    </div>
                    <h2 className="auth-user-name">{getDisplayName(user)}</h2>
                    <p className="auth-user-email">{user.email}</p>

                    <div className="auth-role-badge-row">
                        <span className={`auth-role-badge ${badge.className}`}>{t(badge.labelKey)}</span>
                    </div>

                    {/* Chỉ ẩn/hiện nút; backend vẫn kiểm tra quyền ở mọi API */}
                    {(hasMod || hasAdmin) && (
                        <div className="auth-nav-actions">
                            {hasMod && (
                                <button type="button" className="auth-moderator-btn" onClick={() => goTo("/moderator")}>
                                    <i className="fa-solid fa-shield-halved" style={{ marginRight: 8 }}></i>{t("auth.modBtn")}
                                </button>
                            )}
                            {hasAdmin && (
                                <button type="button" className="auth-admin-btn" onClick={() => goTo("/admin")}>
                                    <i className="fa-solid fa-gear" style={{ marginRight: 8 }}></i>{t("auth.adminBtn")}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Chỉ tài khoản demo mới được bật/tắt quyền giả để xem giao diện */}
                    {isDemo && (
                        <div className="auth-role-tester">
                            <div className="auth-role-tester-title">
                                <i className="fa-solid fa-sliders" style={{ marginRight: 6 }}></i>
                                {lang === "vi" ? "Thử nghiệm bật/tắt quyền" : "Role Testing Switcher"}
                            </div>
                            <div className="auth-role-chips">
                                {(["USER", "MODERATOR", "ADMIN"] as UserRole[]).map((r) => {
                                    const active = roles.includes(r);
                                    return (
                                        <button
                                            key={r}
                                            type="button"
                                            className={`auth-chip ${active ? "auth-chip-active" : ""}`}
                                            onClick={() => toggleRole(r)}
                                        >
                                            <i className={`fa-solid ${active ? "fa-check" : "fa-plus"}`} style={{ marginRight: 4 }}></i>
                                            {r}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button type="button" className="auth-logout-btn" onClick={handleLogout}>
                        {t("common.logout")}
                    </button>
                </div>
            </div>
        </div>
    );
}