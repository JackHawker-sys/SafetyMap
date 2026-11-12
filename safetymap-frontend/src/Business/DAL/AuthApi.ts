import { ENV } from "../Config/Env";
import type { AuthResponse, LoginRequest, SignupRequest } from "../Models/User";

// Trả kết quả thay vì throw
export type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; status: number; message: string };

const AUTH_URL = `${ENV.apiBaseUrl}/api/auth`;

// Dùng khi mất mạng hoặc backend lỗi mà không gửi { message } (ví dụ lỗi 500 trả về HTML)
const FALLBACK_MESSAGE = "Không thể kết nối máy chủ, vui lòng thử lại sau";

// Backend trả lỗi dạng { "message": "..." } -> hiển thị nguyên văn
async function readErrorMessage(res: Response): Promise<string> {
    try {
        const body = (await res.json()) as { message?: unknown };
        if (typeof body.message === "string" && body.message.trim() !== "") return body.message;
    } catch {
        // body không phải JSON
    }
    return FALLBACK_MESSAGE;
}

async function post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    try {
        const res = await fetch(`${AUTH_URL}${path}`, {
            method: "POST",
            credentials: "include", // gửi và nhận cookie refresh token
            headers: body === undefined ? undefined : { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
        });

        if (!res.ok) {
            return { success: false, status: res.status, message: await readErrorMessage(res) };
        }
        if (res.status === 204) {
            return { success: true, data: undefined as T }; // logout không có body
        }
        return { success: true, data: (await res.json()) as T };
    } catch {
        return { success: false, status: 0, message: FALLBACK_MESSAGE }; // status 0 = không tới được server
    }
}

export const loginApi = (req: LoginRequest) => post<AuthResponse>("/login", req);
export const registerApi = (req: SignupRequest) => post<AuthResponse>("/register", req);
export const refreshApi = () => post<AuthResponse>("/refresh");
export const logoutApi = () => post<void>("/logout");