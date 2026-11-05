import { lazy, Suspense, useState, useEffect } from "react";

const Home = lazy(() => import("./GUIs/Pages/Home"));
const ModeratorPage = lazy(() => import("./GUIs/Pages/ModeratorPage"));
const AdminPage = lazy(() => import("./GUIs/Pages/AdminPage"));

export type AppView = "map" | "moderator" | "admin";

function getViewFromHash(): AppView {
    const hash = window.location.hash.toLowerCase();
    if (hash === "#moderator") return "moderator";
    if (hash === "#admin") return "admin";
    return "map";
}

export default function App() {
    const [view, setView] = useState<AppView>(getViewFromHash);

    useEffect(() => {
        const handleHashChange = () => setView(getViewFromHash());
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

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
            {view === "map" && <Home />}
        </Suspense>
    );
}
