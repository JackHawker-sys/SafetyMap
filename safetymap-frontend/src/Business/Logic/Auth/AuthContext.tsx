import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import type { User, UserRole } from "../../Models/User";
import type { ApiError } from "../../DAL/AuthApi";
import { refreshSession } from "./AuthSession";
import { loadDemoSession } from "./DemoAccount";

const REFRESH_MARGIN_MS = 60_000; // refresh trước khi access token hết hạn 1 phút
const RETRY_MS = 30_000;          // mất mạng thì 30 giây sau thử lại

type State = {
    user: User | undefined;
    roles: UserRole[];
    expiresAt: number | undefined;
    initializing: boolean; // đang khôi phục phiên lúc tải trang
    loading: boolean;
    error: ApiError | null;
    isDemo: boolean;       // đang dùng tài khoản demo (không có JWT, không gọi được API thật)
};

const initState: State = {
    user: undefined,
    roles: [],
    expiresAt: undefined,
    initializing: true,
    loading: false,
    error: null,
    isDemo: false,
};

export type AuthAction =
    | { type: "authenticate" }
    | { type: "authenticated"; user: User; roles: UserRole[]; expiresAt: number }
    | { type: "authenticateFailed"; error: ApiError }
    | { type: "sessionChecked" }
    | { type: "logout" }
    | { type: "clearError" }
    | { type: "setDemoUser"; user: User; roles: UserRole[] }
    | { type: "toggleRole"; role: UserRole };

function reducer(state: State, action: AuthAction): State {
    switch (action.type) {
        case "authenticate":
            return { ...state, loading: true, error: null };
        case "authenticated":
            return {
                ...state,
                user: action.user,
                roles: action.roles,
                expiresAt: action.expiresAt,
                initializing: false,
                loading: false,
                error: null,
            };
        case "setDemoUser":
            return {
                ...state,
                user: action.user,
                roles: action.roles,
                expiresAt: undefined,  // demo không có token -> không hẹn giờ refresh
                isDemo: true,
                initializing: false,
                loading: false,
                error: null,
            };
        case "toggleRole": {
            if (!state.user || !state.isDemo) return state; // chỉ tài khoản demo được đổi quyền giả
            const exists = state.roles.includes(action.role);
            const nextRoles = exists
                ? state.roles.filter((r) => r !== action.role)
                : [...state.roles, action.role];
            const finalRoles = nextRoles.length === 0 ? ["USER" as UserRole] : nextRoles;
            return { ...state, roles: finalRoles };
        }
        case "authenticateFailed":
            return { ...state, loading: false, error: action.error };
        case "sessionChecked":
            return { ...state, initializing: false };
        case "logout":
            return { ...initState, initializing: false };
        case "clearError":
            return { ...state, error: null };
        default:
            return state;
    }
}

type AuthContextType = State & { dispatch: Dispatch<AuthAction> };

const AuthContext = createContext<AuthContextType>({ ...initState, dispatch: () => { } });

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initState);

    // 1. Tải trang: khôi phục phiên bằng cookie refresh token hoặc demo user trong localStorage
    useEffect(() => {
        let active = true;
        refreshSession(dispatch, () => active)
            .then((outcome) => {
                if (outcome !== "ok" && outcome !== "cancelled") {
                    const demo = loadDemoSession();
                    if (demo) dispatch({ type: "setDemoUser", user: demo.user, roles: demo.roles });
                }
            })
            .finally(() => dispatch({ type: "sessionChecked" }));
        return () => { active = false; };
    }, []);

    // 2. Đang đăng nhập: hẹn giờ refresh trước khi token hết hạn
    useEffect(() => {
        if (state.expiresAt === undefined) return;

        let active = true;
        let timer: number;

        const schedule = (delay: number) => {
            timer = window.setTimeout(async () => {
                const outcome = await refreshSession(dispatch, () => active);
                if (outcome === "network") schedule(RETRY_MS);
            }, delay);
        };

        const lifetime = state.expiresAt - Date.now();
        schedule(Math.max(lifetime - REFRESH_MARGIN_MS, lifetime / 2, 0));

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [state.expiresAt]);

    return <AuthContext.Provider value={{ ...state, dispatch }}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => useContext(AuthContext);