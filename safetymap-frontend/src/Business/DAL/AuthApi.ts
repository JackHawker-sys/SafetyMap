import { ENV } from "../Config/Env";
import type { AuthResponse, LoginRequest, SignupRequest } from "../Models/User";

export type ApiError = {
    code: string;    // ví dụ INVALID_CREDENTIALS, EMAIL_TAKEN
    message: string; // message tiếng Việt từ backend, dùng khi không có bản dịch
};

export type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; status: number; error: ApiError };

const AUTH_URL = `${ENV.apiBaseUrl}/api/auth`;

const NETWORK_ERROR: ApiError = {
    code: "NETWORK_ERROR",
    message: "Không thể kết nối máy chủ, vui lòng thử lại sau",
};

// Backend trả { code, message, timestamp }
async function readError(res: Response): Promise<ApiError> {
    try {
        const body = (await res.json()) as { code?: unknown; message?: unknown };
        if (typeof body.message === "string" && body.message.trim() !== "") {
            return {
                code: typeof body.code === "string" ? body.code : `HTTP_${res.status}`,
                message: body.message,
            };
        }
    } catch {
        // body không phải JSON (ví dụ lỗi 500 trả HTML)
    }
    return NETWORK_ERROR;
}

async function post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    try {
        const res = await fetch(`${AUTH_URL}${path}`, {
            method: "POST",
            credentials: "include",
            headers: body === undefined ? undefined : { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (!res.ok) {
            return { success: false, status: res.status, error: await readError(res) };
        }
        if (res.status === 204) {
            return { success: true, data: undefined as T };
        }
        return { success: true, data: (await res.json()) as T };
    } catch {
        return { success: false, status: 0, error: NETWORK_ERROR };
    }
}

export const loginApi = (req: LoginRequest) => post<AuthResponse>("/login", req);
export const registerApi = (req: SignupRequest) => post<AuthResponse>("/register", req);
export const refreshApi = () => post<AuthResponse>("/refresh");
export const logoutApi = () => post<void>("/logout");