import { useState, type FormEvent } from "react";
import type { User, UserRole } from "../Hooks/useAuth";
import { UserIcon, GoogleIcon, CloseIcon } from "./Icons";
import TosModal from "./TosModal";
import styles from "../../../public/assets/AuthModal.module.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    error: string | null;
    onClearError: () => void;
    onLogin: (email: string, pass: string) => boolean;
    onSignup: (name: string, email: string, pass: string) => boolean;
    onGoogleLogin: () => void;
    onLogout: () => void;
    onToggleRole?: (role: UserRole) => void;
    onNavigate?: (page: "moderator" | "admin" | "tos") => void;
}

export default function AuthModal({
    isOpen, onClose, user, error, onClearError, onLogin, onSignup, onGoogleLogin, onLogout, onToggleRole, onNavigate,
}: Props) {
    const [tab, setTab] = useState<"LOGIN" | "SIGNUP">("LOGIN");

    // Dữ liệu trong các ô nhập của form đăng nhập / đăng ký
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPass, setLoginPass] = useState("");
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPass, setSignupPass] = useState("");

    // Trạng thái đồng ý điều khoản dịch vụ và hiển thị popup ToS
    const [agreedToTos, setAgreedToTos] = useState(false);
    const [showTosModal, setShowTosModal] = useState(false);

    if (!isOpen) return null;

    // Xử lý gửi form đăng nhập
    function handleLoginSubmit(e: FormEvent) {
        e.preventDefault();
        const success = onLogin(loginEmail, loginPass);
        if (success) onClose();
    }

    // Xử lý gửi form đăng ký tài khoản mới (yêu cầu phải đồng ý điều khoản)
    function handleSignupSubmit(e: FormEvent) {
        e.preventDefault();
        if (!agreedToTos) return;
        const success = onSignup(signupName, signupEmail, signupPass);
        if (success) onClose();
    }

    // Xử lý đăng nhập giả lập bằng Google (tên tài khoản mặc định là TEST)
    function handleGoogleClick() {
        onGoogleLogin();
        onClose();
    }

    const hasMod = Boolean(user?.roles.includes("MODERATOR"));
    const hasAdmin = Boolean(user?.roles.includes("ADMIN"));

    // Danh sách huy hiệu hiển thị các quyền tài khoản đang sở hữu (User, Moderator, Admin)
    const roleBadges = user && (
        <div className={styles.roleBadgeRow}>
            {user.roles.map((r) => (
                <span
                    key={r}
                    className={`${styles.roleBadge} ${r === "ADMIN"
                        ? styles.badgeAdmin
                        : r === "MODERATOR"
                            ? styles.badgeMod
                            : styles.badgeUser
                        }`}
                >
                    {r}
                </span>
            ))}
        </div>
    );

    // Các nút chuyển hướng đến Dashboard dành cho tài khoản có quyền Moderator hoặc Admin
    const navigationButtons = (
        <div className={styles.navActions}>
            {hasMod && (
                <button
                    type="button"
                    className={styles.moderatorBtn}
                    onClick={() => {
                        onNavigate?.("moderator");
                        onClose();
                    }}
                >
                    🛡️ Bàn Kiểm duyệt (Moderator)
                </button>
            )}
            {hasAdmin && (
                <button
                    type="button"
                    className={styles.adminBtn}
                    onClick={() => {
                        onNavigate?.("admin");
                        onClose();
                    }}
                >
                    ⚙️ Bảng Quản trị (Admin)
                </button>
            )}
        </div>
    );

    // Hộp công cụ thử nghiệm bật/tắt quyền nhanh ở frontend để kiểm tra phân quyền
    const roleTester = user && (
        <div className={styles.roleTester}>
            <div className={styles.roleTesterTitle}>Thử nghiệm bật/tắt quyền</div>
            <div className={styles.roleChips}>
                {(["USER", "MODERATOR", "ADMIN"] as UserRole[]).map((r) => {
                    const active = user.roles.includes(r);
                    return (
                        <button
                            key={r}
                            type="button"
                            className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                            onClick={() => onToggleRole?.(r)}
                        >
                            {active ? `✓ ${r}` : `+ ${r}`}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // Checkbox xác nhận đồng ý Điều khoản Dịch vụ trong form đăng ký
    const tosCheckboxSection = (
        <div className={styles.tosRow}>
            <label className={styles.tosLabel}>
                <input
                    type="checkbox"
                    className={styles.tosCheckbox}
                    checked={agreedToTos}
                    onChange={(e) => setAgreedToTos(e.target.checked)}
                />
                <span className={styles.tosText}>
                    Tôi đồng ý với{" "}
                    <button
                        type="button"
                        className={styles.tosLinkBtn}
                        onClick={() => setShowTosModal(true)}
                    >
                        Điều khoản Dịch vụ
                    </button>
                </span>
            </label>
        </div>
    );

    // Form đăng nhập hoặc đăng ký khi chưa đăng nhập
    const authForm = (
        <>
            <div className={styles.header}>
                <div className={styles.iconCircle}>
                    <UserIcon size={24} />
                </div>
                <h2 className={styles.title}>Tài khoản SafetyMap</h2>
                <p className={styles.subtitle}>Đăng nhập để có thể trải nghiệm đầy đủ các tính năng</p>
            </div>

            <button type="button" className={styles.googleBtn} onClick={handleGoogleClick}>
                <GoogleIcon size={18} />
                <span>Đăng nhập bằng Google</span>
            </button>

            <div className={styles.divider}>
                <span>hoặc tài khoản email</span>
            </div>

            <div className={styles.tabRow}>
                <button
                    type="button"
                    className={`${styles.tabBtn} ${tab === "LOGIN" ? styles.tabActive : ""}`}
                    onClick={() => {
                        setTab("LOGIN");
                        onClearError();
                    }}
                >
                    Đăng nhập
                </button>
                <button
                    type="button"
                    className={`${styles.tabBtn} ${tab === "SIGNUP" ? styles.tabActive : ""}`}
                    onClick={() => {
                        setTab("SIGNUP");
                        onClearError();
                    }}
                >
                    Đăng ký
                </button>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            {tab === "LOGIN" ? (
                <form className={styles.form} onSubmit={handleLoginSubmit}>
                    <label className={styles.label}>
                        <span>Email</span>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="vidu@safetymap.vn"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                        />
                    </label>
                    <label className={styles.label}>
                        <span>Mật khẩu</span>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={loginPass}
                            onChange={(e) => setLoginPass(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit" className={styles.primaryBtn}>
                        Đăng nhập
                    </button>
                </form>
            ) : (
                <form className={styles.form} onSubmit={handleSignupSubmit}>
                    <label className={styles.label}>
                        <span>Họ và tên</span>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="USER1"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            required
                        />
                    </label>
                    <label className={styles.label}>
                        <span>Email</span>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="vidu@safetymap.vn"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                        />
                    </label>
                    <label className={styles.label}>
                        <span>Mật khẩu</span>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={signupPass}
                            onChange={(e) => setSignupPass(e.target.value)}
                            required
                        />
                    </label>
                    {tosCheckboxSection}
                    <button
                        type="submit"
                        className={styles.primaryBtn}
                        disabled={!agreedToTos}
                    >
                        Tạo tài khoản
                    </button>
                </form>
            )}
        </>
    );

    return (
        <>
            <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <button type="button" className={styles.closeBtn} onClick={onClose} title="Đóng">
                        <CloseIcon size={20} />
                    </button>

                    {user ? (
                        <div className={styles.profileSection}>
                            <div className={styles.avatarCircle}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className={styles.userName}>{user.name}</h2>
                            <p className={styles.userEmail}>{user.email}</p>
                            {roleBadges}
                            {navigationButtons}
                            {roleTester}
                            <button
                                type="button"
                                className={styles.logoutBtn}
                                onClick={() => {
                                    onLogout();
                                    onClose();
                                }}
                            >
                                Đăng xuất
                            </button>
                        </div>
                    ) : (
                        authForm
                    )}
                </div>
            </div>

            <TosModal
                isOpen={showTosModal}
                onClose={() => setShowTosModal(false)}
                onAgreeAndClose={() => {
                    setAgreedToTos(true);
                    setShowTosModal(false);
                }}
            />
        </>
    );
}
