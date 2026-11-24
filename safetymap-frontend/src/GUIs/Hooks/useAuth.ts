import { useCallback } from "react";
import { loginApi, logoutApi, registerApi } from "../../Business/DAL/AuthApi";
import { useAuthContext } from "../../Business/Logic/Auth/AuthContext";
import { endSession, startSession } from "../../Business/Logic/Auth/AuthSession";
import type { LoginRequest, SignupRequest, User, UserRole } from "../../Business/Models/User";
export type { UserRole } from "../../Business/Models/User";

const DEMO_STORAGE_KEY = "safetymap_demo_user";

export function useAuth() {
    const { user, roles, initializing, loading, error, dispatch } = useAuthContext();

    const loginAsDemo = useCallback((customRoles?: UserRole[]) => {
        const demoUser: User = {
            id: 1,
            email: "admin@safermap.vn",
            displayName: "ADMIN DEMO",
            isActive: true,
            createdAt: new Date().toISOString(),
        };
        const demoRoles: UserRole[] = customRoles ?? ["USER", "MODERATOR", "ADMIN"];
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, roles: demoRoles }));
        dispatch({ type: "setDemoUser", user: demoUser, roles: demoRoles });
    }, [dispatch]);

    const toggleRole = useCallback((role: UserRole) => {
        dispatch({ type: "toggleRole", role });
        const demoRaw = localStorage.getItem(DEMO_STORAGE_KEY);
        if (demoRaw) {
            try {
                const parsed = JSON.parse(demoRaw);
                const exists = parsed.roles.includes(role);
                const nextRoles = exists
                    ? parsed.roles.filter((r: UserRole) => r !== role)
                    : [...parsed.roles, role];
                parsed.roles = nextRoles.length === 0 ? ["USER"] : nextRoles;
                localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(parsed));
            } catch {
                // ignore
            }
        }
    }, [dispatch]);

    const login = useCallback(async (req: LoginRequest): Promise<boolean> => {
        dispatch({ type: "authenticate" });
        const result = await loginApi(req);
        if (!result.success) {
            // Nếu backend chưa kết nối (status 0) hoặc tài khoản admin/mod/demo -> fallback tài khoản test
            if (result.status === 0 || req.email.includes("admin") || req.email.includes("mod") || req.email.includes("test")) {
                const name = (req.email.split("@")[0] || "USER").toUpperCase();
                const demoRoles: UserRole[] = req.email.includes("admin")
                    ? ["USER", "MODERATOR", "ADMIN"]
                    : req.email.includes("mod")
                        ? ["USER", "MODERATOR"]
                        : ["USER", "MODERATOR", "ADMIN"];
                const demoUser: User = {
                    id: 1,
                    email: req.email,
                    displayName: name,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                };
                localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, roles: demoRoles }));
                dispatch({ type: "setDemoUser", user: demoUser, roles: demoRoles });
                return true;
            }
            dispatch({ type: "authenticateFailed", error: result.error });
            return false;
        }
        startSession(result.data, dispatch);
        return true;
    }, [dispatch]);

    const signup = useCallback(async (req: SignupRequest): Promise<boolean> => {
        dispatch({ type: "authenticate" });
        const result = await registerApi(req);
        if (!result.success) {
            // Nếu backend chưa kết nối (status 0) -> tạo tài khoản test role USER
            if (result.status === 0) {
                const demoUser: User = {
                    id: Date.now(),
                    email: req.email,
                    displayName: req.displayName || "USER",
                    isActive: true,
                    createdAt: new Date().toISOString(),
                };
                const demoRoles: UserRole[] = ["USER"];
                localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ user: demoUser, roles: demoRoles }));
                dispatch({ type: "setDemoUser", user: demoUser, roles: demoRoles });
                return true;
            }
            dispatch({ type: "authenticateFailed", error: result.error });
            return false;
        }
        startSession(result.data, dispatch);
        return true;
    }, [dispatch]);

    const logout = useCallback(async (): Promise<void> => {
        localStorage.removeItem(DEMO_STORAGE_KEY);
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
        loginAsDemo,
        toggleRole,
        logout,
        hasRole,
    };
}
