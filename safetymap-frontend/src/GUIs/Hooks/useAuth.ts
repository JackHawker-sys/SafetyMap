import { useCallback } from "react";
import { loginApi, logoutApi, registerApi } from "../../Business/DAL/AuthApi";
import { useAuthContext } from "../../Business/Logic/Auth/AuthContext";
import { endSession, startSession } from "../../Business/Logic/Auth/AuthSession";
import {
    clearDemoSession,
    createDemoSession,
    isDemoCredentials,
    loadDemoSession,
    saveDemoSession,
} from "../../Business/Logic/Auth/DemoAccount";
import type { LoginRequest, SignupRequest, UserRole } from "../../Business/Models/User";
export type { UserRole } from "../../Business/Models/User";

export function useAuth() {
    const { user, roles, initializing, loading, error, isDemo, dispatch } = useAuthContext();

    // Bật/tắt quyền giả để xem giao diện: CHỈ áp dụng cho tài khoản demo
    const toggleRole = useCallback((role: UserRole) => {
        if (!isDemo) return;
        dispatch({ type: "toggleRole", role });
        const demo = loadDemoSession();
        if (demo) {
            const next = demo.roles.includes(role)
                ? demo.roles.filter((r) => r !== role)
                : [...demo.roles, role];
            saveDemoSession({ ...demo, roles: next.length === 0 ? ["USER"] : next });
        }
    }, [dispatch, isDemo]);

    const login = useCallback(async (req: LoginRequest): Promise<boolean> => {
        dispatch({ type: "authenticate" });
        clearDemoSession();

        // Luôn thử backend trước: nếu có tài khoản thật thì tài khoản thật được ưu tiên
        const result = await loginApi(req);
        if (result.success) {
            startSession(result.data, dispatch);
            return true;
        }

        // Backend từ chối hoặc không kết nối được -> chỉ đúng test@gmail.com / 123456 mới vào chế độ demo
        if (isDemoCredentials(req.email, req.password)) {
            const demo = createDemoSession();
            dispatch({ type: "setDemoUser", user: demo.user, roles: demo.roles });
            return true;
        }

        dispatch({ type: "authenticateFailed", error: result.error });
        return false;
    }, [dispatch]);

    // Đăng ký luôn đi qua backend, không có chế độ demo
    const signup = useCallback(async (req: SignupRequest): Promise<boolean> => {
        dispatch({ type: "authenticate" });
        const result = await registerApi(req);
        if (!result.success) {
            dispatch({ type: "authenticateFailed", error: result.error });
            return false;
        }
        clearDemoSession();
        startSession(result.data, dispatch);
        return true;
    }, [dispatch]);

    const logout = useCallback(async (): Promise<void> => {
        clearDemoSession();
        if (!isDemo) await logoutApi(); // demo không có cookie refresh để thu hồi
        endSession(dispatch);
    }, [dispatch, isDemo]);

    const clearError = useCallback(() => dispatch({ type: "clearError" }), [dispatch]);

    // Chỉ để ẩn/hiện giao diện; backend mới kiểm tra quyền thật
    const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles]);

    return {
        user,
        roles,
        isLoggedIn: user !== undefined,
        isDemo,
        initializing,
        loading,
        error,
        clearError,
        login,
        signup,
        toggleRole,
        logout,
        hasRole,
    };
}
