import { useCallback, useMemo, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GeoPlace } from "../../Business/Models/MapModels";
import { createDroppedPin, withSource } from "../../Business/Logic/PlaceLogic";
import { DEFAULT_CENTER } from "../../Business/Config/MapConfig";
import { initialMapUiState, mapUiReducer, type RouteField } from "../State/mapUiReducer";
import { useSavedPlaces } from "../Hooks/useSavedPlaces";
import { useMediaQuery } from "../Hooks/useMediaQuery";
import { useAuth } from "../Hooks/useAuth";
import MapView from "../Components/Map/MapView";
import SearchBar from "../Components/Search/SearchBar";
import PlacePanel from "../Components/Panels/PlacePanel";
import DirectionsPanel from "../Components/Panels/DirectionsPanel";
import AuthModal from "../Components/Auth/AuthModal";
import LanguageSwitcher from "../Components/LanguageSwitcher";
import { useLanguage } from "../Context/LanguageContext";
import { UserIcon } from "../Components/Common/Icons";
import type { MapInsets } from "../Components/Map/FitToPlaces";
import styles from "../../assets/styles/Home.module.css";
import { getDisplayName } from "../../Business/Logic/Auth/UserLogic";

// Khớp với CSS trong Home.module.css (.panel width / max-height)
const PANEL_WIDTH_PX = 408;
const SHEET_RATIO = 0.5;

export default function Home() {
    const [ui, dispatch] = useReducer(mapUiReducer, initialMapUiState);
    const saved = useSavedPlaces();
    const isDesktop = useMediaQuery("(min-width: 769px)");
    const navigate = useNavigate();

    // Trạng thái đăng nhập dùng chung toàn app (AuthContext)

    const auth = useAuth();
    const { t } = useLanguage();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    // Lần bấm "Tìm đường" gần nhất. Lưu theo id 2 điểm -> đổi điểm là thông báo cũ tự hết hiệu lực,
    // không cần effect dọn dẹp (và sau này kết quả API cũ về trễ cũng không hiện nhầm)
    const [routeRequest, setRouteRequest] = useState<{ fromId: string; toId: string } | null>(null);
    const [userPlace, setUserPlace] = useState<GeoPlace | null>(null);

    // dispatch của useReducer luôn ổn định -> các callback này không đổi giữa các lần render,
    // MapClickHandler / FitToPlaces không phải đăng ký lại
    const handleMapClick = useCallback((lat: number, lng: number) => {
        dispatch({ type: "MAP_CLICK", place: createDroppedPin(lat, lng) });
    }, []);
    const handleSelect = useCallback((place: GeoPlace) => dispatch({ type: "SELECT_PLACE", place }), []);
    const handleLocationFound = useCallback((place: GeoPlace) => {
        setUserPlace(place);
        dispatch({ type: "SET_MY_LOCATION", place });
    }, []);
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
                    onLocationFound={handleLocationFound}
                />
            </main>

            {/* Unified Floating Tactical Command Island - No Overlap */}
            <aside className={styles.commandIsland}>
                {ui.mode === "idle" && (
                    <div className={styles.idlePanel}>
                        <div className={styles.brandCapsule}>
                            <div className={styles.brandLogo}>
                                <i className="fa-solid fa-shield-halved"></i>
                            </div>
                            <div className={styles.brandText}>
                                <span className={styles.brandTitle}>S.A.F.E.R</span>
                                <span className={styles.brandSubtitle}>
                                    <span className={styles.livePulseDot}></span>
                                    SAFETY RADAR • ONLINE
                                </span>
                            </div>
                        </div>

                        <SearchBar
                            value={selected}
                            savedPlaces={saved.items}
                            near={selected?.position ?? DEFAULT_CENTER}
                            onSelect={handleSelect}
                            onClear={() => dispatch({ type: "CLOSE" })}
                            onOpenDirections={() => dispatch({ type: "OPEN_DIRECTIONS", defaultFrom: userPlace })}
                        />
                    </div>
                )}

                {ui.mode === "place" && (
                    <PlacePanel
                        place={ui.place}
                        saved={saved.isSaved(ui.place)}
                        saving={saved.isBusy(ui.place)}
                        saveError={saved.error}
                        onDirections={() => dispatch({ type: "OPEN_DIRECTIONS", defaultFrom: userPlace })}
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
                        onSwap={() => {
                            dispatch({ type: "SWAP" });
                            setRouteRequest(null);
                        }}
                        onSearch={handleSearchRoute}
                        onBack={() => dispatch({ type: "EXIT_DIRECTIONS" })}
                        onClose={() => dispatch({ type: "CLOSE" })}
                    />
                )}
            </aside>

            <div className={styles.topRightSlot}>
                <LanguageSwitcher />
                {/* Đang khôi phục phiên lúc tải trang -> ẩn nút để không nháy "Đăng nhập" */}
                {!auth.initializing && (

                    <button
                        type="button"
                        className={styles.authTriggerBtn}
                        onClick={() => {
                            if (auth.user) {
                                setAuthModalOpen(true);
                            } else {
                                navigate("/login");
                            }
                        }}
                        title={auth.user ? `${t("auth.accountTitle")}: ${getDisplayName(auth.user)}` : t("common.login")}

                    >
                        {auth.user ? (
                            <>
                                <span className={styles.authAvatar}>
                                    {getDisplayName(auth.user).charAt(0).toUpperCase()}
                                </span>
                                <span className={styles.authTriggerText}>{getDisplayName(auth.user)}</span>
                            </>
                        ) : (
                            <>
                                <UserIcon size={18} />

                                <span className={styles.authTriggerText}>{t("common.login")}</span>
                            </>
                        )}
                    </button>
                )}
            </div>


            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
            />
        </div>
    );
}
