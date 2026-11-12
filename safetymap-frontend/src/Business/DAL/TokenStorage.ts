// Access token chỉ giữ trong BỘ NHỚ (biến của module), không ghi localStorage.
// Tải lại trang thì mất -> app gọi /api/auth/refresh để lấy lại (cookie HttpOnly tự được gửi).
// Để ở DAL để các API khác sau này (báo cáo, saved routes...) lấy token gắn vào header.
let accessToken: string | null = null;

export const tokenStorage = {
    get: (): string | null => accessToken,
    set: (token: string): void => { accessToken = token; },
    clear: (): void => { accessToken = null; },
};