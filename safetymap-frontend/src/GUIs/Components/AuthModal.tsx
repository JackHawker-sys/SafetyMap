import { useState, type FormEvent } from "react";
import type { User } from "../Hooks/useAuth";
import { CloseIcon, GoogleIcon, UserIcon } from "./Icons";
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
}

export default function AuthModal({
    isOpen, onClose, user, error, onClearError, onLogin, onSignup, onGoogleLogin, onLogout,
}: Props) {
    const [tab, setTab] = useState<"LOGIN" | "SIGNUP">("LOGIN");

    // Quản lý dữ liệu form
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPass, setLoginPass] = useState("");
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPass, setSignupPass] = useState("");

    if (!isOpen) return null;

    function handleLoginSubmit(e: FormEvent) {
        e.preventDefault();
        const success = onLogin(loginEmail, loginPass);
        if (success) onClose();
    }

    function handleSignupSubmit(e: FormEvent) {
        e.preventDefault();
        const success = onSignup(signupName, signupEmail, signupPass);
        if (success) onClose();
    }

    function handleGoogleClick() {
        onGoogleLogin();
        onClose();
    }

    return (
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
                        <div className={styles.badge}>
                            {user.isGoogle ? "Đã liên kết Google" : "Thành viên SafetyMap"}
                        </div>

                        <button type="button" className={styles.logoutBtn} onClick={() => { onLogout(); onClose(); }}>
                            Đăng xuất
                        </button>
                    </div>
                ) : (
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
                                onClick={() => { setTab("LOGIN"); onClearError(); }}
                            >
                                Đăng nhập
                            </button>
                            <button
                                type="button"
                                className={`${styles.tabBtn} ${tab === "SIGNUP" ? styles.tabActive : ""}`}
                                onClick={() => { setTab("SIGNUP"); onClearError(); }}
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
                                        placeholder="Biện Tấn Phúc"
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
                                <button type="submit" className={styles.primaryBtn}>
                                    Tạo tài khoản
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
