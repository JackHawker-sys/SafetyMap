import { lazy, Suspense } from "react";
const Home = lazy(() => import("./GUIs/Pages/Home"));

export default function App() {
    return (
        <Suspense fallback={<div style={{ padding: 16 }}>Đang tải bản đồ...</div>}>
            <Home />
        </Suspense>
    );
}