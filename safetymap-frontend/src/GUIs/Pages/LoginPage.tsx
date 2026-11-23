import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { useAuth, type UserRole } from "../Hooks/useAuth";
import { useLanguage } from "../Context/LanguageContext";
import type { ApiError } from "../../Business/DAL/AuthApi";
import { GoogleIcon } from "../Components/Common/Icons";
import TosModal from "../Components/TosModal";
import LanguageSwitcher from "../Components/LanguageSwitcher";
import styles from "../../assets/styles/LoginPage.module.css";

type LoginFormValues = {
    email: string;
    password: string;
};

type SignupFormValues = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    captchaToken: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

function firstErrorMessage<T extends Record<string, unknown>>(errors: FieldErrors<T>): string | null {
    for (const key of Object.keys(errors)) {
        const msg = errors[key as keyof T]?.message;
        if (typeof msg === "string" && msg) return msg;
    }
    return null;
}

export default function LoginPage() {
    const { user, roles, error, clearError, login, signup, loginAsDemo } = useAuth();
    const { t, lang } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const [tab, setTab] = useState<"LOGIN" | "SIGNUP">("LOGIN");
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTos, setAgreedToTos] = useState(false);
    const [showTosModal, setShowTosModal] = useState(false);
    const [googleNotice, setGoogleNotice] = useState<string | null>(null);

    // Điểm đến mong muốn sau khi đăng nhập (từ router state hoặc query param ?redirect=...)
    const queryRedirect = new URLSearchParams(location.search).get("redirect");
    const targetPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || queryRedirect || "/";

    // Đã đăng nhập rồi thì tự động chuyển hướng về trang mong muốn
    useEffect(() => {
        if (user) {
            if (roles.includes("ADMIN") && targetPath.includes("/admin")) {
                navigate("/admin", { replace: true });
            } else if (roles.includes("MODERATOR") && targetPath.includes("/moderator")) {
                navigate("/moderator", { replace: true });
            } else {
                navigate(targetPath, { replace: true });
            }
        }
    }, [user, roles, targetPath, navigate]);

    const loginForm = useForm<LoginFormValues>({
        defaultValues: { email: "", password: "" },
    });

    const signupForm = useForm<SignupFormValues>({
        defaultValues: { name: "", email: "", password: "", confirmPassword: "", captchaToken: "" },
    });

    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const translateError = (err: ApiError): string => {
        const key = `errors.${err.code}`;
        const text = t(key);
        return text === key ? err.message : text;
    };

    const switchTab = (next: "LOGIN" | "SIGNUP") => {
        setTab(next);
        clearError();
    };

    const handleBack = () => {
        // Quay lại trang trước đó hoặc về bản đồ "/"
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate("/");
        }
    };

    const onLoginValid = async (data: LoginFormValues) => {
        const success = await login({ email: data.email, password: data.password });
        if (success) {
            loginForm.reset();
        }
    };

    const onSignupValid = async (data: SignupFormValues) => {
        if (!agreedToTos) return;
        const success = await signup({
            displayName: data.name,
            email: data.email,
            password: data.password,
            captchaToken: data.captchaToken,
        });

        recaptchaRef.current?.reset();
        signupForm.setValue("captchaToken", "");

        if (success) {
            signupForm.reset();
            setAgreedToTos(false);
        }
    };

    const handleGoogleClick = () => {
        setGoogleNotice(t("auth.googleSoon") || "Đăng nhập Google sắp ra mắt");
        setTimeout(() => setGoogleNotice(null), 3000);
    };

    const handleQuickDemo = (demoRoles: UserRole[], dest: string) => {
        loginAsDemo(demoRoles);
        navigate(dest, { replace: true });
    };

    const validationError =
        tab === "LOGIN"
            ? firstErrorMessage(loginForm.formState.errors)
            : firstErrorMessage(signupForm.formState.errors);
    const displayError = error ? translateError(error) : validationError;

    return (
        <div className={styles.pageContainer}>
            {/* ============================================================== */}
            {/* 1. Left Hero Column: S.A.F.E.R Tactical Security Showcase      */}
            {/* ============================================================== */}
            <div className={styles.heroSection}>
                {/* Radar Animated Visual Background */}
                <div className={styles.radarContainer}>
                    <div className={styles.radarGridLines} />
                    <div className={styles.radarRings}>
                        <div className={styles.radarScanner} />
                    </div>

                    {/* Floating Tactical Beacons */}
                    <div className={styles.tacticalBeacon1}>
                        <span className={styles.beaconDot} />
                        <span>RADAR SECTOR • 98.4% SAFE</span>
                    </div>
                    <div className={styles.tacticalBeacon2}>
                        <span className={styles.beaconDot} />
                        <span>AI INCIDENT DEFENSE • ACTIVE</span>
                    </div>
                    <div className={styles.tacticalBeacon3}>
                        <span className={styles.beaconDot} />
                        <span>LIVE TELEMETRY HUD</span>
                    </div>
                </div>

                {/* Hero Header & Brand Capsule */}
                <div className={styles.heroContent}>
                    <div className={styles.brandCapsule}>
                        <div className={styles.brandLogo}>
                            <i className="fa-solid fa-shield-halved" />
                        </div>
                        <span className={styles.brandTitle}>
                            <span className={styles.brandStatusDot} />
                            S.A.F.E.R PLATFORM
                        </span>
                    </div>

                    <h1 className={styles.heroHeading}>
                        {lang === "vi" ? (
                            <>Hệ Thống Lộ Trình <span className={styles.heroAccent}>An Toàn Thông Minh</span></>
                        ) : (
                            <>Intelligent <span className={styles.heroAccent}>Safe Route Platform</span></>
                        )}
                    </h1>

                    <p className={styles.heroSubtext}>
                        {lang === "vi"
                            ? "Bảo vệ hành trình của bạn với mạng lưới radar thời gian thực, thuật toán phân tích rủi ro bằng AI và tối ưu tuyến đường sáng đèn."
                            : "Safeguard your journeys with real-time radar networks, AI risk prediction algorithms, and well-lit optimal navigation."}
                    </p>

                    {/* Feature Cards Grid */}
                    <div className={styles.featureList}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrap}>
                                <i className="fa-solid fa-route" />
                            </div>
                            <div>
                                <div className={styles.featureTitle}>
                                    {lang === "vi" ? "Tuyến đường an toàn đa tiêu chí" : "Multi-criteria Safe Routing"}
                                </div>
                                <div className={styles.featureDesc}>
                                    {lang === "vi"
                                        ? "Ưu tiên độ sáng đèn, mật độ lưu thông và né tránh điểm đen rủi ro 24h."
                                        : "Prioritizes street illumination, traffic density, and 24h hazard avoidance."}
                                </div>
                            </div>
                        </div>

                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrap}>
                                <i className="fa-solid fa-robot" />
                            </div>
                            <div>
                                <div className={styles.featureTitle}>
                                    {lang === "vi" ? "Kiểm duyệt & AI Radar tự động" : "Automated AI Radar Moderation"}
                                </div>
                                <div className={styles.featureDesc}>
                                    {lang === "vi"
                                        ? "Phát hiện sự cố và đối chiếu báo cáo lân cận để cảnh báo ngay trên bản đồ."
                                        : "Detects hazards and cross-references citizen reports to warn instantly on the map."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hero Footer Stats */}
                <div className={styles.heroFooter}>
                    <div className={styles.statItem}>
                        <span className={styles.statVal}>98.4%</span>
                        <span className={styles.statLabel}>
                            {lang === "vi" ? "Độ tin cậy AI" : "AI Confidence"}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statVal}>24/7</span>
                        <span className={styles.statLabel}>
                            {lang === "vi" ? "Giám sát trực tuyến" : "Live Telemetry"}
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statVal}>0</span>
                        <span className={styles.statLabel}>
                            {lang === "vi" ? "Điểm mù dữ liệu" : "Blind Spots"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ============================================================== */}
            {/* 2. Right Form Column: Authentication Terminal                  */}
            {/* ============================================================== */}
            <div className={styles.formSection}>
                {/* Top Bar: Back to Map & Language Switcher */}
                <div className={styles.formTopBar}>
                    <button type="button" className={styles.backBtn} onClick={handleBack} title={t("common.backToMap")}>
                        <i className="fa-solid fa-arrow-left" />
                        <span>{t("common.backToMap")}</span>
                    </button>
                    <LanguageSwitcher />
                </div>

                {/* Center Form Card */}
                <div className={styles.authCardWrap}>
                    <div className={styles.authCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>
                                {tab === "LOGIN" ? t("auth.accountTitle") : t("auth.createAccount")}
                            </h2>
                            <p className={styles.cardSubtitle}>{t("auth.subtitle")}</p>
                        </div>

                        {/* Switch Tab */}
                        <div className={styles.tabSwitch} role="tablist">
                            <button
                                type="button"
                                className={`${styles.tabBtn} ${tab === "LOGIN" ? styles.tabBtnActive : ""}`}
                                onClick={() => switchTab("LOGIN")}
                                role="tab"
                                aria-selected={tab === "LOGIN"}
                            >
                                {t("auth.loginTab")}
                            </button>
                            <button
                                type="button"
                                className={`${styles.tabBtn} ${tab === "SIGNUP" ? styles.tabBtnActive : ""}`}
                                onClick={() => switchTab("SIGNUP")}
                                role="tab"
                                aria-selected={tab === "SIGNUP"}
                            >
                                {t("auth.signupTab")}
                            </button>
                        </div>

                        {/* Google OAuth Login */}
                        <button type="button" className={styles.googleBtn} onClick={handleGoogleClick}>
                            <GoogleIcon size={18} />
                            <span>{googleNotice || t("auth.googleLogin")}</span>
                        </button>

                        <div className={styles.dividerRow}>
                            <span className={styles.dividerLine} />
                            <span className={styles.dividerText}>{t("auth.orEmail")}</span>
                            <span className={styles.dividerLine} />
                        </div>

                        {/* Error Banner */}
                        {displayError && (
                            <div className={styles.errorBanner} role="alert">
                                <i className="fa-solid fa-triangle-exclamation" />
                                <span>{displayError}</span>
                            </div>
                        )}

                        {/* FORM: LOGIN */}
                        {tab === "LOGIN" ? (
                            <form method="POST" onSubmit={loginForm.handleSubmit(onLoginValid)} noValidate>
                                <div className={styles.formGroup}>
                                    <label className={styles.inputLabel}>{t("auth.email")}</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type="email"
                                            className={styles.textInput}
                                            placeholder="name@example.com"
                                            autoComplete="email"
                                            {...loginForm.register("email", {
                                                required: t("auth.emailRequired"),
                                                pattern: { value: EMAIL_PATTERN, message: t("auth.emailInvalid") },
                                            })}
                                        />
                                        <i className={`fa-solid fa-envelope ${styles.inputLeadingIcon}`} />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.inputLabel}>{t("auth.password")}</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={styles.textInput}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            {...loginForm.register("password", {
                                                required: t("auth.passwordRequired"),
                                            })}
                                        />
                                        <i className={`fa-solid fa-lock ${styles.inputLeadingIcon}`} />
                                        <button
                                            type="button"
                                            className={styles.pwdToggleBtn}
                                            onClick={() => setShowPassword((p) => !p)}
                                            title="Hiện / Ẩn mật khẩu"
                                        >
                                            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={loginForm.formState.isSubmitting}
                                >
                                    {loginForm.formState.isSubmitting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin" />
                                            <span>{t("auth.loggingIn")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-right-to-bracket" />
                                            <span>{t("auth.loginTab")}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            /* FORM: SIGNUP */
                            <form onSubmit={signupForm.handleSubmit(onSignupValid)} noValidate>
                                <div className={styles.formGroup}>
                                    <label className={styles.inputLabel}>{t("auth.fullName")}</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type="text"
                                            className={styles.textInput}
                                            placeholder="Nguyễn Văn A"
                                            autoComplete="name"
                                            {...signupForm.register("name", {
                                                required: t("auth.nameRequired"),
                                                maxLength: { value: 100, message: t("auth.nameMax") },
                                            })}
                                        />
                                        <i className={`fa-solid fa-user ${styles.inputLeadingIcon}`} />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.inputLabel}>{t("auth.email")}</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type="email"
                                            className={styles.textInput}
                                            placeholder="name@example.com"
                                            autoComplete="email"
                                            {...signupForm.register("email", {
                                                required: t("auth.emailRequired"),
                                                pattern: { value: EMAIL_PATTERN, message: t("auth.emailInvalid") },
                                            })}
                                        />
                                        <i className={`fa-solid fa-envelope ${styles.inputLeadingIcon}`} />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.inputLabel}>{t("auth.password")}</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={styles.textInput}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            {...signupForm.register("password", {
                                                required: t("auth.passwordRequired"),
                                                minLength: { value: 6, message: t("auth.passwordMin") },
                                            })}
                                        />
                                        <i className={`fa-solid fa-lock ${styles.inputLeadingIcon}`} />
                                        <button
                                            type="button"
                                            className={styles.pwdToggleBtn}
                                            onClick={() => setShowPassword((p) => !p)}
                                        >
                                            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.inputLabel}>{t("auth.confirmPassword")}</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className={styles.textInput}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            {...signupForm.register("confirmPassword", {
                                                required: t("auth.confirmRequired"),
                                                validate: (val) =>
                                                    val === signupForm.getValues("password") || t("auth.passwordMismatch"),
                                            })}
                                        />
                                        <i className={`fa-solid fa-lock ${styles.inputLeadingIcon}`} />
                                    </div>
                                </div>

                                {RECAPTCHA_SITE_KEY && (
                                    <Controller
                                        name="captchaToken"
                                        control={signupForm.control}
                                        rules={{ required: t("auth.captchaRequired") }}
                                        render={({ field }) => (
                                            <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
                                                <ReCAPTCHA
                                                    ref={recaptchaRef}
                                                    sitekey={RECAPTCHA_SITE_KEY}
                                                    onChange={(token) => field.onChange(token ?? "")}
                                                />
                                            </div>
                                        )}
                                    />
                                )}

                                <div className={styles.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        id="agreeTos"
                                        className={styles.checkboxInput}
                                        checked={agreedToTos}
                                        onChange={(e) => setAgreedToTos(e.target.checked)}
                                    />
                                    <label htmlFor="agreeTos">
                                        {t("auth.agreeTo")}{" "}
                                        <button
                                            type="button"
                                            className={styles.tosLinkBtn}
                                            onClick={() => setShowTosModal(true)}
                                        >
                                            {t("auth.tosLink")}
                                        </button>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={signupForm.formState.isSubmitting || !agreedToTos}
                                >
                                    {signupForm.formState.isSubmitting ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin" />
                                            <span>{t("auth.creatingAccount")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-user-plus" />
                                            <span>{t("auth.createAccount")}</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Quick Role Demo Hub (Dành riêng cho Mentor / Thử nghiệm) */}
                        <div className={styles.demoHub}>
                            <div className={styles.demoTitle}>
                                <span>{lang === "vi" ? "Truy cập nhanh Demo" : "Fast Demo Access"}</span>
                                <span className={styles.demoBadge}>MENTOR / TEST</span>
                            </div>
                            <div className={styles.demoButtonsGrid}>
                                <button
                                    type="button"
                                    className={styles.demoRoleBtn}
                                    onClick={() => handleQuickDemo(["USER"], "/")}
                                    title="Đăng nhập tài khoản User thường"
                                >
                                    <i className={`fa-solid fa-user ${styles.demoRoleIcon}`} style={{ color: "#2563eb" }} />
                                    <span>User</span>
                                </button>
                                <button
                                    type="button"
                                    className={styles.demoRoleBtn}
                                    onClick={() => handleQuickDemo(["USER", "MODERATOR"], "/moderator")}
                                    title="Đăng nhập tài khoản Kiểm duyệt viên"
                                >
                                    <i className={`fa-solid fa-shield-halved ${styles.demoRoleIcon}`} style={{ color: "#10b981" }} />
                                    <span>Moderator</span>
                                </button>
                                <button
                                    type="button"
                                    className={styles.demoRoleBtn}
                                    onClick={() => handleQuickDemo(["USER", "MODERATOR", "ADMIN"], "/admin")}
                                    title="Đăng nhập tài khoản Quản trị viên"
                                >
                                    <i className={`fa-solid fa-crown ${styles.demoRoleIcon}`} style={{ color: "#f59e0b" }} />
                                    <span>Admin</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ToS Modal khi bấm link điều khoản */}
            <TosModal
                isOpen={showTosModal}
                onClose={() => setShowTosModal(false)}
                onAgreeAndClose={() => {
                    setAgreedToTos(true);
                    setShowTosModal(false);
                }}
            />
        </div>
    );
}
