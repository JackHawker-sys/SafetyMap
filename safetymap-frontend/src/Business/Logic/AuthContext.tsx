import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import type { User, UserRole } from "../Models/User";
import { refreshSession } from "./AuthSession";

// Refresh trước khi access token hết hạn 1 phút; mất mạng thì 30 giây sau thử lại
const REFRESH_MARGIN_MS = 60_000;
const RETRY_MS = 30_000;

type State = {
    user: User | undefined;
    roles: UserRole[];
    expiresAt: number | undefined; // thời điểm access token hết hạn (ms)
    initializing: boolean;         // đang khôi phục phiên lúc tải trang
    loading: boolean;              // đang gọi login / register
    error: string | null;          // message backend gửi về
};

const initState: State = {
    user: undefined,
    roles: [],
    expiresAt: undefined,
    initializing: true,
    loading: false,
    error: null,
};

export type AuthAction =
    | { type: "authenticate" }
    | { type: "authenticated"; user: User; roles: UserRole[]; expiresAt: number }
    | { type: "authenticateFailed"; message: string }
    | { type: "sessionChecked" }
    | { type: "logout" }
    | { type: "clearError" };

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
        case "authenticateFailed":
            return { ...state, loading: false, error: action.message };
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

type AuthContextType = State & {
    dispatch: Dispatch<AuthAction>;
};

const AuthContext = createContext<AuthContextType>({
    ...initState,
    dispatch: () => { },
});

type Props = {
    children: ReactNode;
};

export function AuthProvider({ children }: Props) {
    const [state, dispatch] = useReducer(reducer, initState);

    // 1. Tải trang: thử khôi phục phiên bằng cookie refresh token
    useEffect(() => {
        let active = true;
        refreshSession(dispatch, () => active)
            .finally(() => dispatch({ type: "sessionChecked" }));
        return () => { active = false; };
    }, []);

    // 2. Đang đăng nhập: hẹn giờ refresh trước khi access token hết hạn.
    //    Refresh thành công -> expiresAt mới -> effect chạy lại và hẹn giờ lần sau.
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
        // Token sống ngắn hơn 2 phút thì refresh ở nửa thời gian sống
        schedule(Math.max(lifetime - REFRESH_MARGIN_MS, lifetime / 2, 0));

        return () => {
            active = false; // đăng xuất giữa chừng thì bỏ kết quả refresh về trễ
            window.clearTimeout(timer);
        };
    }, [state.expiresAt]);

    return <AuthContext.Provider value={{ ...state, dispatch }}>
        {children}
    </AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = () => useContext(AuthContext);