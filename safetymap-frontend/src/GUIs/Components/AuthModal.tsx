import { useRef, useState } from "react";
import type { User } from "../Hooks/useAuth";
import ReCAPTCHA from "react-google-recaptcha";
import { CloseIcon, GoogleIcon, UserIcon } from "./Icons";
import styles from "../../../public/assets/AuthModal.module.css";
import { Controller, useForm, type FieldErrors } from "react-hook-form";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    error: string | null;
    onClearError: () => void;
    onLogin: (email: string, pass: string) => boolean;
    onSignup: (name: string, email: string, pass: string, captchaToken: string) => boolean;
    onGoogleLogin: () => void;
    onLogout: () => void;
};

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

// Site key lấy từ file .env (Vite): VITE_RECAPTCHA_SITE_KEY=...
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string;

// Lấy thông báo lỗi đầu tiên của form (để hiển thị trong errorBox có sẵn)
function firstErrorMessage<T extends Record<string, unknown>>(errors: FieldErrors<T>): string | null {
    for (const key of Object.keys(errors)) {
        const msg = errors[key as keyof T]?.message;
        if (typeof msg === "string" && msg) return msg;
    }
    return null;
};

export default function AuthModal({
    isOpen, onClose, user, error, onClearError, onLogin, onSignup, onGoogleLogin, onLogout,
}: Props) {
    const [tab, setTab] = useState<"LOGIN" | "SIGNUP">("LOGIN");

    const loginForm = useForm<LoginFormValues>({
        defaultValues: { email: "", password: "" },
    });

    const signupForm = useForm<SignupFormValues>({
        defaultValues: { name: "", email: "", password: "", confirmPassword: "", captchaToken: "" },
    });

    // Ref tới widget captcha để reset sau mỗi lần submit (token chỉ dùng được 1 lần)
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    if (!isOpen) return null;

    const onLoginValid = (data: LoginFormValues) => {
        const success = onLogin(data.email, data.password);
        if (success) {
            loginForm.reset();
            onClose();
        }
    };

    const onSignupValid = (data: SignupFormValues) => {
        // confirmPassword chỉ dùng để kiểm tra phía client, không gửi đi
        const success = onSignup(data.name, data.email, data.password, data.captchaToken);

        // Token reCAPTCHA chỉ verify được 1 lần → luôn reset, dù thành công hay thất bại
        recaptchaRef.current?.reset();
        signupForm.setValue("captchaToken", "");

        if (success) {
            signupForm.reset();
            onClose();
        }
    };

    function handleGoogleClick() {
        onGoogleLogin();
        onClose();
    }

    // Lỗi từ server (prop `error`) ưu tiên, sau đó tới lỗi validate của tab hiện tại
    const validationError =
        tab === "LOGIN"
            ? firstErrorMessage(loginForm.formState.errors)
            : firstErrorMessage(signupForm.formState.errors);
    const displayError = error ?? validationError;

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

                        {displayError && <div className={styles.errorBox}>{displayError}</div>}

                        {tab === "LOGIN" ? (
                            <form
                                className={styles.form}
                                onSubmit={loginForm.handleSubmit(onLoginValid)}
                                noValidate
                            >
                                <label className={styles.label}>
                                    <span>Email</span>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        placeholder="vidu@safetymap.vn"
                                        autoComplete="email"
                                        {...loginForm.register("email", {
                                            required: "Vui lòng nhập email",
                                            pattern: {
                                                value: EMAIL_PATTERN,
                                                message: "Email không hợp lệ"
                                            },
                                            setValueAs: (v: string) => v.trim(),
                                        })}

                                    />
                                </label>
                                <label className={styles.label}>
                                    <span>Mật khẩu</span>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        {...loginForm.register("password", {
                                            required: "Vui lòng nhập mật khẩu",
                                        })}
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className={styles.primaryBtn}
                                    disabled={loginForm.formState.isSubmitting}
                                >
                                    Đăng nhập
                                </button>
                            </form>
                        ) : (
                            <form className={styles.form}
                                onSubmit={signupForm.handleSubmit(onSignupValid)}
                                noValidate
                            >
                                <label className={styles.label}>
                                    <span>Họ và tên</span>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Full name"
                                        autoComplete="name"
                                        {...signupForm.register("name", {
                                            required: "Vui lòng nhập Họ và Tên",
                                            setValueAs: (v: string) => v.trim(),
                                        })}
                                    />
                                </label>
                                <label className={styles.label}>
                                    <span>Email</span>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        placeholder="vidu@safetymap.vn"
                                        autoComplete="email"
                                        {...signupForm.register("email", {
                                            required: "Vui lòng nhập email",
                                            pattern: {
                                                value: EMAIL_PATTERN,
                                                message: "Email không hợp lệ",
                                            },
                                            setValueAs: (v: string) => v.trim(),
                                        })}
                                    />
                                </label>
                                <label className={styles.label}>
                                    <span>Mật khẩu</span>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        {...signupForm.register("password", {
                                            required: "Vui lòng nhập mật khẩu",
                                            minLength: {
                                                value: 6,
                                                message: "Mật khẩu tối thiểu 6 ký tự",
                                            },
                                            // Khi password đổi, validate lại confirmPassword
                                            deps: "confirmPassword",
                                        })}
                                    />
                                </label>
                                <label className={styles.label}>
                                    <span>Nhập lại mật khẩu</span>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        {...signupForm.register("confirmPassword", {
                                            required: "Vui lòng nhập lại mật khẩu",
                                            validate: (value, formValues) =>
                                                value === formValues.password || "Mật khẩu nhập lại không khớp",
                                        })}
                                    />
                                </label>
                                <Controller
                                    name="captchaToken"
                                    control={signupForm.control}
                                    rules={{ required: "Bạn không phải là robot" }}
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
                                <button
                                    type="submit"
                                    className={styles.primaryBtn}
                                    disabled={signupForm.formState.isSubmitting}
                                >
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
