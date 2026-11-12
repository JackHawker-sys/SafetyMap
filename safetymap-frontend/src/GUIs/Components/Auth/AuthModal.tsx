import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { CloseIcon, GoogleIcon, UserIcon } from "../Common/Icons";
import "../../../../public/assets/AuthModal.css";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { useAuth } from "../../Hooks/useAuth";
import { canAccessAdmin, getDisplayName, getRoleLabel } from "../../../Business/Logic/UserLogic";

interface Props {
    isOpen: boolean;
    onClose: () => void;
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

export default function AuthModal({ isOpen, onClose }: Props) {
    // Hook phải gọi TRƯỚC "if (!isOpen) return null"
    const { user, roles, error, clearError, login, signup, logout } = useAuth();
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

    // Đóng modal thì xoá lỗi cũ, lần mở sau không còn hiện
    const handleClose = () => {
        clearError();
        onClose();
    };

    // Handler async -> react-hook-form tự bật isSubmitting, nút bị khoá trong lúc chờ
    const onLoginValid = async (data: LoginFormValues) => {
        const success = await login({ email: data.email, password: data.password });
        if (success) {
            loginForm.reset();
            onClose();
        }
    };

    const onSignupValid = async (data: SignupFormValues) => {
        // confirmPassword chỉ dùng để kiểm tra phía client, không gửi đi
        const success = await signup({
            displayName: data.name,
            email: data.email,
            password: data.password,
            captchaToken: data.captchaToken,
        });

        // Token reCAPTCHA chỉ verify được 1 lần -> luôn reset, dù thành công hay thất bại
        recaptchaRef.current?.reset();
        signupForm.setValue("captchaToken", "");

        if (success) {
            signupForm.reset();
            onClose();
        }
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    // Lỗi từ server ưu tiên, sau đó tới lỗi validate của tab hiện tại
    const validationError =
        tab === "LOGIN"
            ? firstErrorMessage(loginForm.formState.errors)
            : firstErrorMessage(signupForm.formState.errors);
    const displayError = error ?? validationError;

    return (
        <div className="auth-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className={"auth-close-btn"} onClick={handleClose} title="Đóng">
                    <CloseIcon size={20} />
                </button>

                {user ? (
                    <div className="auth-profile-section">
                        <div className="auth-avatar-circle">
                            {getDisplayName(user).charAt(0).toUpperCase()}
                        </div>
                        <h2 className="auth-user-name">{getDisplayName(user)}</h2>
                        <p className="auth-user-email">{user.email}</p>
                        <div className="auth-badge">{getRoleLabel(roles)}</div>

                        {/* Chưa có router: tạm dùng thẻ <a>, khi dựng router đổi sang <Link to="/admin"> */}
                        {canAccessAdmin(roles) && (
                            <a href="/admin" className="auth-admin-btn">
                                Trang quản trị
                            </a>
                        )}

                        <button type="button" className={"auth-logout-btn"} onClick={handleLogout}>
                            Đăng xuất
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="auth-header">
                            <div className="auth-iconCircle">
                                <UserIcon size={24} />
                            </div>
                            <h2 className="auth-title">Tài khoản SafetyMap</h2>
                            <p className="auth-subtitle">Đăng nhập để có thể trải nghiệm đầy đủ các tính năng</p>
                        </div>

                        {/* Chưa có FR và cột DB cho tài khoản Google -> tạm vô hiệu hoá */}
                        <button
                            type="button"
                            className="auth-google-btn"
                            disabled
                            title="Tính năng đang phát triển"
                        >
                            <GoogleIcon size={18} />
                            <span>Đăng nhập bằng Google (sắp ra mắt)</span>
                        </button>

                        <div className="auth-divider">
                            <span>hoặc tài khoản email</span>
                        </div>

                        <div className="auth-tabRow">
                            <button
                                type="button"
                                className={`auth-tab-btn ${tab === "LOGIN" ? "auth-tabActive" : ""}`}
                                onClick={() => { setTab("LOGIN"); clearError(); }}
                            >
                                Đăng nhập
                            </button>
                            <button
                                type="button"
                                className={`auth-tab-btn ${tab === "SIGNUP" ? "auth-tabActive" : ""}`}
                                onClick={() => { setTab("SIGNUP"); clearError(); }}
                            >
                                Đăng ký
                            </button>
                        </div>

                        {displayError && <div className="auth-errorBox">{displayError}</div>}

                        {tab === "LOGIN" ? (
                            <form
                                className="auth-form"
                                onSubmit={loginForm.handleSubmit(onLoginValid)}
                                noValidate
                            >
                                <label className="auth-label">
                                    <span>Email</span>
                                    <input
                                        type="email"
                                        className="auth-input"
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
                                <label className="auth-label">
                                    <span>Mật khẩu</span>
                                    <input
                                        type="password"
                                        className="auth-input"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        {...loginForm.register("password", {
                                            required: "Vui lòng nhập mật khẩu",
                                        })}
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className="auth-primary-btn"
                                    disabled={loginForm.formState.isSubmitting}
                                >
                                    {loginForm.formState.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                                </button>
                            </form>
                        ) : (
                            <form className="auth-form"
                                onSubmit={signupForm.handleSubmit(onSignupValid)}
                                noValidate
                            >
                                <label className="auth-label">
                                    <span>Họ và tên</span>
                                    <input
                                        type="text"
                                        className="auth-input"
                                        placeholder="Full name"
                                        autoComplete="name"
                                        {...signupForm.register("name", {
                                            required: "Vui lòng nhập Họ và Tên",
                                            // users.display_name là VARCHAR(100)
                                            maxLength: { value: 100, message: "Họ và tên tối đa 100 ký tự" },
                                            setValueAs: (v: string) => v.trim(),
                                        })}
                                    />
                                </label>
                                <label className="auth-label">
                                    <span>Email</span>
                                    <input
                                        type="email"
                                        className="auth-input"
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
                                <label className="auth-label">
                                    <span>Mật khẩu</span>
                                    <input
                                        type="password"
                                        className="auth-input"
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
                                <label className="auth-label">
                                    <span>Nhập lại mật khẩu</span>
                                    <input
                                        type="password"
                                        className="auth-input"
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
                                    className="auth-primary-btn"
                                    disabled={signupForm.formState.isSubmitting}
                                >
                                    {signupForm.formState.isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}