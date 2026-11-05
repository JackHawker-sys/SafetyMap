import { useCallback, useMemo, useReducer, useState } from "react";
import type { GeoPlace } from "../../Business/Models/MapModels";
import { createDroppedPin, withSource } from "../../Business/Logic/PlaceLogic";
import { DEFAULT_CENTER } from "../../Business/Config/MapConfig";
import { initialMapUiState, mapUiReducer, type RouteField } from "../State/mapUiReducer";
import { useSavedPlaces } from "../Hooks/useSavedPlaces";
import { useMediaQuery } from "../Hooks/useMediaQuery";
import { useAuth } from "../Hooks/useAuth";
import MapView from "../Components/MapView";
import SearchBar from "../Components/SearchBar";
import PlacePanel from "../Components/PlacePanel";
import DirectionsPanel from "../Components/DirectionsPanel";
import AuthModal from "../Components/AuthModal";
import { UserIcon } from "../Components/Icons";
import type { MapInsets } from "../Components/FitToPlaces";
import styles from "../../../public/assets/Home.module.css";

// Khớp với CSS trong Home.module.css (.panel width / max-height)
const PANEL_WIDTH_PX = 408;
const SHEET_RATIO = 0.5;

export default function Home() {
    const [ui, dispatch] = useReducer(mapUiReducer, initialMapUiState);
    const saved = useSavedPlaces();
    const isDesktop = useMediaQuery("(min-width: 769px)");

    // Quản lý xác thực người dùng thuần frontend (localStorage)
    const auth = useAuth();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    // Lần bấm "Tìm đường" gần nhất. Lưu theo id 2 điểm -> đổi điểm là thông báo cũ tự hết hiệu lực,
    // không cần effect dọn dẹp (và sau này kết quả API cũ về trễ cũng không hiện nhầm)
    const [routeRequest, setRouteRequest] = useState<{ fromId: string; toId: string } | null>(null);

    // dispatch của useReducer luôn ổn định -> các callback này không đổi giữa các lần render,
    // MapClickHandler / FitToPlaces không phải đăng ký lại
    const handleMapClick = useCallback((lat: number, lng: number) => {
        dispatch({ type: "MAP_CLICK", place: createDroppedPin(lat, lng) });
    }, []);
    const handleSelect = useCallback((place: GeoPlace) => dispatch({ type: "SELECT_PLACE", place }), []);
    const handleSavedClick = useCallback(
        (place: GeoPlace) => dispatch({ type: "SELECT_PLACE", place: withSource(place, "SAVED") }), []);
    const handleFieldChange = useCallback(
        (field: RouteField, place: GeoPlace | null) => dispatch({ type: "SET_FIELD", field, place }), []);
    const handleFieldFocus = useCallback((field: RouteField) => dispatch({ type: "FOCUS_FIELD", field }), []);

    const panelOpen = ui.mode !== "idle";
    const insets: MapInsets = useMemo(() => {
        if (!panelOpen) return { left: 0, bottom: 0 };
        return isDesktop
            ? { left: PANEL_WIDTH_PX, bottom: 0 }
            : { left: 0, bottom: Math.round(window.innerHeight * SHEET_RATIO) };
    }, [panelOpen, isDesktop]);

    const selected = ui.mode === "place" ? ui.place : null;
    const from = ui.mode === "directions" ? ui.from : null;
    const to = ui.mode === "directions" ? ui.to : null;

    function handleSearchRoute() {
        if (!from || !to) return;
        // TODO(backend): gọi API tìm đường an toàn (nhớ dùng AbortController + so khớp routeRequest)
        console.log("Tìm đường:", { from, to });
        setRouteRequest({ fromId: from.id, toId: to.id });
    }

    const routeNotice =
        routeRequest && from?.id === routeRequest.fromId && to?.id === routeRequest.toId
            ? "Chưa có API tìm đường. Sẽ vẽ tuyến khi kết nối backend."
            : null;

    // Giống Google: đang chỉ đường thì ẩn thanh tìm kiếm, 2 ô điểm đi/đến thay thế nó
    const showSearchBar = ui.mode !== "directions";
    // Nút Đăng nhập / Tài khoản nổi ở góc trên phải: mở modal đăng nhập / thông tin tài khoản

    return (
        <div className={styles.page}>
            <main className={styles.map}>
                <MapView
                    selected={selected}
                    from={from}
                    to={to}
                    savedPlaces={saved.items}
                    insets={insets}
                    onMapClick={handleMapClick}
                    onSavedClick={handleSavedClick}
                />
            </main>

            {panelOpen && (
                <aside className={`${styles.panel} ${ui.mode === "place" ? styles.panelWithSearch : ""}`}>
                    {ui.mode === "place" && (
                        <PlacePanel
                            place={ui.place}
                            saved={saved.isSaved(ui.place)}
                            saving={saved.isBusy(ui.place)}
                            saveError={saved.error}
                            onDirections={() => dispatch({ type: "OPEN_DIRECTIONS" })}
                            onToggleSave={() => void saved.toggle(ui.place)}
                            onClose={() => dispatch({ type: "CLOSE" })}
                        />
                    )}
                    {ui.mode === "directions" && (
                        <DirectionsPanel
                            from={ui.from}
                            to={ui.to}
                            activeField={ui.activeField}
                            routeNotice={routeNotice}
                            onFieldChange={handleFieldChange}
                            onFieldFocus={handleFieldFocus}
                            onSwap={() => dispatch({ type: "SWAP" })}
                            onSearch={handleSearchRoute}
                            onBack={() => dispatch({ type: "EXIT_DIRECTIONS" })}
                            onClose={() => dispatch({ type: "CLOSE" })}
                        />
                    )}
                </aside>
            )}

            {showSearchBar && (
                <div className={styles.searchSlot}>
                    <SearchBar
                        value={selected}
                        savedPlaces={saved.items}
                        near={selected?.position ?? DEFAULT_CENTER}
                        onSelect={handleSelect}
                        onClear={() => dispatch({ type: "CLOSE" })}
                        onOpenDirections={() => dispatch({ type: "OPEN_DIRECTIONS" })}
                    />
                </div>
            )}

            <div className={styles.topRightSlot}>
                <button
                    type="button"
                    className={styles.authTriggerBtn}
                    onClick={() => setAuthModalOpen(true)}
                    title={auth.user ? `Tài khoản: ${auth.user.name}` : "Đăng nhập / Đăng ký"}
                >
                    {auth.user ? (
                        <>
                            <span className={styles.authAvatar}>
                                {auth.user.name.charAt(0).toUpperCase()}
                            </span>
                            <span className={styles.authTriggerText}>{auth.user.name}</span>
                        </>
                    ) : (
                        <>
                            <UserIcon size={18} />
                            <span className={styles.authTriggerText}>Đăng nhập</span>
                        </>
                    )}
                </button>
            </div>

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                user={auth.user}
                error={auth.error}
                onClearError={auth.clearError}
                onLogin={auth.login}
                onSignup={auth.signup}
                onGoogleLogin={auth.loginWithGoogle}
                onLogout={auth.logout}
                onToggleRole={auth.toggleRole}
                onNavigate={(page) => {
                    window.location.hash = `#${page}`;
                }}
            />
        </div>
    );
}
