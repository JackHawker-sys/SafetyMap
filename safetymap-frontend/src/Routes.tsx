import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import RequireRole from "./GUIs/Components/RequireRole";

// Mỗi trang tải riêng: người chỉ xem bản đồ không phải tải code trang quản trị
const Home = lazy(() => import("./GUIs/Pages/Home"));
const TosPage = lazy(() => import("./GUIs/Pages/TosPage"));
const ModeratorPage = lazy(() => import("./GUIs/Pages/ModeratorPage"));
const AdminPage = lazy(() => import("./GUIs/Pages/AdminPage"));

// Khung chung: hiện chữ chờ trong lúc tải code của trang
function RootLayout() {
    return (
        <Suspense fallback={<div style={{ padding: 24, fontFamily: "sans-serif" }}>Đang tải...</div>}>
            <Outlet />
        </Suspense>
    );
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            { index: true, element: <Home /> },
            { path: "tos", element: <TosPage /> },
            {
                path: "moderator",
                element: (
                    <RequireRole role="MODERATOR">
                        <ModeratorPage />
                    </RequireRole>
                ),
            },
            {
                path: "admin",
                element: (
                    <RequireRole role="ADMIN">
                        <AdminPage />
                    </RequireRole>
                ),
            },
            // Đường dẫn không tồn tại -> về bản đồ
            { path: "*", element: <Navigate to="/" replace /> },
        ],
    },
]);

export default router;