import { useCallback } from "react";
import { loginApi, logoutApi, registerApi } from "../../Business/DAL/AuthApi";
import { useAuthContext } from "../../Business/Logic/Auth/AuthContext";
import { endSession, startSession } from "../../Business/Logic/Auth/AuthSession";
import type { LoginRequest, SignupRequest, UserRole } from "../../Business/Models/User";
export type { UserRole } from "../../Business/Models/User";

export function useAuth() {
    const { user, roles, initializing, loading, error, dispatch } = useAuthContext();

    const login = useCallback(async (req: LoginRequest): Promise<boolean> => {
        dispatch({ type: "authenticate" });
        const result = await loginApi(req);
        if (!result.success) {
            dispatch({ type: "authenticateFailed", error: result.error }); return false;
        }
        startSession(result.data, dispatch);
        return true;
    }, [dispatch]);

    const signup = useCallback(async (req: SignupRequest): Promise<boolean> => {
        dispatch({ type: "authenticate" });
        const result = await registerApi(req);
        if (!result.success) {
            dispatch({ type: "authenticateFailed", error: result.error }); return false;
        }
        startSession(result.data, dispatch);
        return true;
    }, [dispatch]);
    const logout = useCallback(async (): Promise<void> => {
        await logoutApi();
        endSession(dispatch);
    }, [dispatch]);

    const clearError = useCallback(() => dispatch({ type: "clearError" }), [dispatch]);

    // Chỉ để ẩn/hiện giao diện; backend mới kiểm tra quyền thật
    const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles]);

    return {
        user,
        roles,
        isLoggedIn: user !== undefined,
        initializing,
        loading,
        error,
        clearError,
        login,
        signup,
        logout,
        hasRole,
    };
}