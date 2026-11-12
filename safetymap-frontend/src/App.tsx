import { lazy, Suspense, useState, useEffect } from "react";

const Home = lazy(() => import("./GUIs/Pages/Home"));
const ModeratorPage = lazy(() => import("./GUIs/Pages/ModeratorPage"));
const AdminPage = lazy(() => import("./GUIs/Pages/AdminPage"));
const TosPage = lazy(() => import("./GUIs/Pages/TosPage"));

export type AppView = "map" | "moderator" | "admin" | "tos";

// Xác định chế độ hiển thị từ hash URL (#moderator, #admin, #tos)
function getViewFromHash(): AppView {
    const hash = window.location.hash.toLowerCase();
    if (hash === "#moderator") return "moderator";
    if (hash === "#admin") return "admin";
    if (hash === "#tos") return "tos";
    return "map";
}

export default function App() {
    const [view, setView] = useState<AppView>(getViewFromHash);

    useEffect(() => {
        const handleHashChange = () => setView(getViewFromHash());
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    // Điều hướng chuyển đổi trang qua hash
    const navigate = (nextView: AppView) => {
        if (nextView === "map") {
            window.location.hash = "";
        } else {
            window.location.hash = `#${nextView}`;
        }
    };

    return (
        <Suspense fallback={<div style={{ padding: 24, fontFamily: "sans-serif" }}>Đang tải bản đồ...</div>}>
            {view === "moderator" && <ModeratorPage onBack={() => navigate("map")} />}
            {view === "admin" && <AdminPage onBack={() => navigate("map")} />}
            {view === "tos" && <TosPage onBack={() => navigate("map")} />}
            {view === "map" && <Home />}
        </Suspense>
    );
}
