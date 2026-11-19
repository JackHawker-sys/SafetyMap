// Access token chỉ giữ trong BỘ NHỚ; tải lại trang thì mất -> gọi /api/auth/refresh lấy lại
let accessToken: string | null = null;

export const tokenStorage = {
    get: (): string | null => accessToken,
    set: (token: string): void => { accessToken = token; },
    clear: (): void => { accessToken = null; },
};