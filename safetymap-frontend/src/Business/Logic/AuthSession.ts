import type { Dispatch } from "react";
import { refreshApi, type ApiResult } from "../DAL/AuthApi";
import { tokenStorage } from "../DAL/TokenStorage";
import type { AuthResponse } from "../Models/User";
import type { AuthAction } from "./AuthContext";
import { getRolesFromToken } from "./Jwt";

export function startSession(data: AuthResponse, dispatch: Dispatch<AuthAction>): void {
    tokenStorage.set(data.accessToken);
    dispatch({
        type: "authenticated",
        user: data.user,
        roles: getRolesFromToken(data.accessToken),
        expiresAt: Date.now() + data.expiresIn * 1000,
    });
}

export function endSession(dispatch: Dispatch<AuthAction>): void {
    tokenStorage.clear();
    dispatch({ type: "logout" });
}

// Gộp các lần refresh đồng thời thành 1 request (StrictMode chạy effect 2 lần;
// request thứ 2 sẽ dùng refresh token đã bị thu hồi -> bị đăng xuất oan)
let inflight: Promise<ApiResult<AuthResponse>> | null = null;

function refreshOnce(): Promise<ApiResult<AuthResponse>> {
    if (!inflight) {
        inflight = refreshApi().finally(() => { inflight = null; });
    }
    return inflight;
}

export type RefreshOutcome = "ok" | "expired" | "network" | "cancelled";

export async function refreshSession(
    dispatch: Dispatch<AuthAction>,
    isActive: () => boolean = () => true,
): Promise<RefreshOutcome> {
    const result = await refreshOnce();
    if (!isActive()) return "cancelled";

    if (result.success) {
        startSession(result.data, dispatch);
        return "ok";
    }
    if (result.status === 0) return "network"; // mất mạng: giữ phiên, thử lại sau

    endSession(dispatch);
    return "expired";
}