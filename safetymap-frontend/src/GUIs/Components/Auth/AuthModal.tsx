import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { useAuth } from "../../Hooks/useAuth";
import { useLanguage } from "../../Context/LanguageContext";
import { getDisplayName, getHighestRole } from "../../../Business/Logic/Auth/UserLogic";
import type { ApiError } from "../../../Business/DAL/AuthApi";
import type { UserRole } from "../../../Business/Models/User";
import { CloseIcon, GoogleIcon, UserIcon } from "../Common/Icons";
import TosModal from "../TosModal";
import "../../../assets/styles/AuthModal.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type LoginFormValues = {
    email: string;
    password: string;
    captchaToken: string;
};

type SignupFormValues = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    captchaToken: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Site key lấy từ file .env (Vite): VITE_RECAPTCHA_SITE_KEY=...
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

// Badge theo role cao nhất: khoá dịch + class màu
const ROLE_BADGE: Record<UserRole, { labelKey: string; className: string }> = {
    ADMIN: { labelKey: "auth.roleAdmin", className: "auth-badge-admin" },
    MODERATOR: { labelKey: "auth.roleModerator", className: "auth-badge-mod" },
    USER: { labelKey: "auth.roleUser", className: "auth-badge-user" },
};

// Lấy thông báo lỗi đầu tiên của form để hiển thị trong errorBox
function firstErrorMessage<T extends Record<string, unknown>>(errors: FieldErrors<T>): string | null {
    for (const key of Object.keys(errors)) {
        const msg = errors[key as keyof T]?.message;
        if (typeof msg === "string" && msg) return msg;
    }
    return null;
}

export default function AuthModal({ isOpen, onClose }: Props) {
    // Mọi hook phải gọi TRƯỚC "if (!isOpen) return null"
    const { user, roles, isDemo, error, clearError, login, signup, logout, loginAsDemo, toggleRole } = useAuth();
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const [tab, setTab] = useState<"LOGIN" | "SIGNUP">("LOGIN");

    // Đồng ý điều khoản dịch vụ + popup ToS
    const [agreedToTos, setAgreedToTos] = useState(false);
    const [showTosModal, setShowTosModal] = useState(false);

    const loginForm = useForm<LoginFormValues>({
        defaultValues: { email: "", password: "", captchaToken: "" },
    });

    const signupForm = useForm<SignupFormValues>({
        defaultValues: { name: "", email: "", password: "", confirmPassword: "", captchaToken: "" },
    });

    // Token reCAPTCHA chỉ dùng được 1 lần -> reset sau mỗi lần submit
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    if (!isOpen) return null;

    // Dịch lỗi backend theo mã; không có bản dịch thì dùng message gốc
    const translateError = (err: ApiError): string => {
        const key = `errors.${err.code}`;
        const text = t(key);
        return text === key ? err.message : text;
    };

    const handleClose = () => {
        clearError();
        onClose();
    };

    const switchTab = (next: "LOGIN" | "SIGNUP") => {
        setTab(next);
        clearError();
        // Widget captcha của tab cũ bị gỡ -> token cũ không còn dùng được
        loginForm.setValue("captchaToken", "");
        signupForm.setValue("captchaToken", "");
    };

    const goTo = (path: string) => {
        onClose();
        navigate(path);
    };

    // Handler async -> react-hook-form tự bật isSubmitting, nút bị khoá trong lúc chờ
    const onLoginValid = async (data: LoginFormValues) => {
        const success = await login({
            email: data.email,
            password: data.password,
            captchaToken: data.captchaToken,
        });

        // Token reCAPTCHA chỉ dùng 1 lần -> luôn reset
        recaptchaRef.current?.reset();
        loginForm.setValue("captchaToken", "");

        if (success) {
            loginForm.reset();
            onClose();
        }
    };

    const onSignupValid = async (data: SignupFormValues) => {
        if (!agreedToTos) return;

        // confirmPassword chỉ kiểm tra ở client, không gửi đi
        const success = await signup({
            displayName: data.name,
            email: data.email,
            password: data.password,
            captchaToken: data.captchaToken,
        });

        // Luôn reset captcha, dù thành công hay thất bại
        recaptchaRef.current?.reset();
        signupForm.setValue("captchaToken", "");

        if (success) {
            signupForm.reset();
            setAgreedToTos(false);
            onClose();
        }
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    // Lỗi server ưu tiên, sau đó tới lỗi validate của tab hiện tại
    const validationError =
        tab === "LOGIN"
            ? firstErrorMessage(loginForm.formState.errors)
            : firstErrorMessage(signupForm.formState.errors);
    const displayError = error ? translateError(error) : validationError;

    const badge = ROLE_BADGE[getHighestRole(roles)];
    const hasMod = roles.includes("MODERATOR");
    const hasAdmin = roles.includes("ADMIN");

    // ===== Hồ sơ khi đã đăng nhập =====
    const profileSection = user && (
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
                                    {active ? <i className="fa-solid fa-check" style={{ marginRight: 4 }}></i> : <i className="fa-solid fa-plus" style={{ marginRight: 4 }}></i>}
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
    );

    // ===== Form đăng nhập / đăng ký =====
    const authForm = (
        <>
            <div className="auth-header">
                <div className="auth-icon-circle">
                    <UserIcon size={24} />
                </div>
                <h2 className="auth-title">{t("auth.accountTitle")}</h2>
                <p className="auth-subtitle">{t("auth.subtitle")}</p>
            </div>

            {/* Backend chưa hỗ trợ Google -> tạm vô hiệu hoá */}
            <button
                type="button"
                className="auth-google-btn"
                disabled
                title={t("auth.featureInDevelopment")}
            >
                <GoogleIcon size={18} />
                <span>{t("auth.googleSoon")}</span>
            </button>

            <div className="auth-divider">
                <span>{t("auth.orEmail")}</span>
            </div>

            <div className="auth-tab-row">
                <button
                    type="button"
                    className={`auth-tab-btn ${tab === "LOGIN" ? "auth-tab-active" : ""}`}
                    onClick={() => switchTab("LOGIN")}
                >
                    {t("auth.loginTab")}
                </button>
                <button
                    type="button"
                    className={`auth-tab-btn ${tab === "SIGNUP" ? "auth-tab-active" : ""}`}
                    onClick={() => switchTab("SIGNUP")}
                >
                    {t("auth.signupTab")}
                </button>
            </div>

            {displayError && <div className="auth-errorBox">{displayError}</div>}

            {tab === "LOGIN" ? (
                <form className="auth-form" onSubmit={loginForm.handleSubmit(onLoginValid)} noValidate>
                    <label className="auth-label">
                        <span>{t("auth.email")}</span>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="usermail@safer.com"
                            autoComplete="email"
                            {...loginForm.register("email", {
                                required: t("auth.emailRequired"),
                                pattern: { value: EMAIL_PATTERN, message: t("auth.emailInvalid") },
                                setValueAs: (v: string) => v.trim(),
                            })}
                        />
                    </label>
                    <label className="auth-label">
                        <span>{t("auth.password")}</span>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...loginForm.register("password", {
                                required: t("auth.passwordRequired"),
                            })}
                        />
                    </label>

                    <Controller
                        name="captchaToken"
                        control={loginForm.control}
                        rules={{ required: t("auth.captchaRequired") }}
                        render={({ field }) => (
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={RECAPTCHA_SITE_KEY}
                                onChange={(token) => field.onChange(token ?? "")}
                                onExpired={() => field.onChange("")}
                                onError={() => field.onChange("")}
                            />
                        )}
                    />
                    <button
                        type="submit"
                        className="auth-primary-btn"
                        disabled={loginForm.formState.isSubmitting}
                    >
                        {loginForm.formState.isSubmitting ? t("auth.loggingIn") : t("auth.loginTab")}
                    </button>
                </form>
            ) : (
                <form className="auth-form" onSubmit={signupForm.handleSubmit(onSignupValid)} noValidate>
                    <label className="auth-label">
                        <span>{t("auth.fullName")}</span>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder={t("auth.fullName")}
                            autoComplete="name"
                            {...signupForm.register("name", {
                                required: t("auth.nameRequired"),
                                maxLength: { value: 100, message: t("auth.nameMax") }, // display_name VARCHAR(100)
                                setValueAs: (v: string) => v.trim(),
                            })}
                        />
                    </label>
                    <label className="auth-label">
                        <span>{t("auth.email")}</span>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="usermail@safer.com"
                            autoComplete="email"
                            {...signupForm.register("email", {
                                required: t("auth.emailRequired"),
                                pattern: { value: EMAIL_PATTERN, message: t("auth.emailInvalid") },
                                setValueAs: (v: string) => v.trim(),
                            })}
                        />
                    </label>
                    <label className="auth-label">
                        <span>{t("auth.password")}</span>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...signupForm.register("password", {
                                required: t("auth.passwordRequired"),
                                minLength: { value: 6, message: t("auth.passwordMin") },
                                deps: "confirmPassword", // đổi mật khẩu -> kiểm tra lại ô nhập lại
                            })}
                        />
                    </label>
                    <label className="auth-label">
                        <span>{t("auth.confirmPassword")}</span>
                        <input
                            type="password"
                            className="auth-input"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...signupForm.register("confirmPassword", {
                                required: t("auth.confirmRequired"),
                                validate: (value, formValues) =>
                                    value === formValues.password || t("auth.passwordMismatch"),
                            })}
                        />
                    </label>

                    <Controller
                        name="captchaToken"
                        control={signupForm.control}
                        rules={{ required: t("auth.captchaRequired") }}
                        shouldUnregister
                        render={({ field }) => (
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={RECAPTCHA_SITE_KEY}
                                onChange={(token) => field.onChange(token ?? "")}
                                onExpired={() => field.onChange("")}
                                onError={() => field.onChange("")}
                            />
                        )}
                    />

                    <div className="auth-tos-row">
                        <label className="auth-tos-label">
                            <input
                                type="checkbox"
                                className="auth-tos-checkbox"
                                checked={agreedToTos}
                                onChange={(e) => setAgreedToTos(e.target.checked)}
                            />
                            <span className="auth-tos-text">
                                {t("auth.agreeTo")}{" "}
                                <button
                                    type="button"
                                    className="auth-tos-link-btn"
                                    onClick={() => setShowTosModal(true)}
                                >
                                    {t("auth.tosLink")}
                                </button>
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="auth-primary-btn"
                        disabled={!agreedToTos || signupForm.formState.isSubmitting}
                    >
                        {signupForm.formState.isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
                    </button>
                </form>
            )}
        </>
    );

    return (
        <>
            <div className="auth-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
                <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="auth-close-btn" onClick={handleClose} title={t("common.close")}>
                        <CloseIcon size={20} />
                    </button>

                    {user ? profileSection : authForm}
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