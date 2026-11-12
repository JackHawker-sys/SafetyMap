import { useCallback } from "react";
import { loginApi, logoutApi, registerApi } from "../../Business/DAL/AuthApi";
import { useAuthContext } from "../../Business/Logic/AuthContext";
import { endSession, startSession } from "../../Business/Logic/AuthSession";
import type { LoginRequest, SignupRequest, UserRole } from "../../Business/Models/User";

export function useAuth() {
    const { user, roles, initializing, loading, error, dispatch } = useAuthContext();


    // Trả về true/false để form biết có đóng modal hay không
    const login = useCallback(async (req: LoginRequest): Promise<boolean> => {
        dispatch({ type: "authenticate" });
        const result = await loginApi(req);
        if (!result.success) {
            dispatch({ type: "authenticateFailed", message: result.message });
            return false;
        }
        startSession(result.data, dispatch);
        return true;
    }, [dispatch]);

    // Đăng ký xong backend trả về giống login -> vào app luôn
    const signup = useCallback(async (req: SignupRequest): Promise<boolean> => {
        dispatch({ type: "authenticate" });
        const result = await registerApi(req);
        if (!result.success) {
            dispatch({ type: "authenticateFailed", message: result.message });
            return false;
        }
        startSession(result.data, dispatch);
        return true;
    }, [dispatch]);

    // Backend thu hồi refresh token + xoá cookie; dù gọi lỗi vẫn đăng xuất ở frontend
    const logout = useCallback(async (): Promise<void> => {
        await logoutApi();
        endSession(dispatch);
    }, [dispatch]);

    const clearError = useCallback(() => dispatch({ type: "clearError" }), [dispatch]);

    // Chỉ dùng để ẩn/hiện giao diện; backend mới là nơi kiểm tra quyền thật
    const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles]);

    return {
        user,
        roles,
        isLoggedIn: user !== undefined,
        loading,
        error,
        initializing,
        clearError,
        login,
        signup,
        logout,
        hasRole,
    };
}