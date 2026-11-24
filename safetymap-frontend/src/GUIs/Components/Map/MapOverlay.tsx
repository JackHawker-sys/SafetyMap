import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";
import { Link } from "react-router-dom";
import type { GeoPlace, IncidentSeverity } from "../../../Business/Models/MapModels";
import { DANGER_LEVELS } from "../../../Business/Logic/DangerLevel";
import { SEVERITY_COLOR } from "../../../Business/Logic/MapLogic";
import { getMyLocation } from "../../../Business/DAL/GeocodeApi";
import { useLanguage } from "../../Context/LanguageContext";
import styles from "../../../assets/styles/MapOverlay.module.css";

const SEVERITIES: IncidentSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function rangeText(index: number): string {
    const min = DANGER_LEVELS[index].minScore;
    if (index === 0) return `≥ ${min}`;
    const upper = DANGER_LEVELS[index - 1].minScore;
    return `${min} – ${upper - 1}`;
}

interface Props {
    onLocationFound?: (place: GeoPlace) => void;
}

export default function MapOverlay({ onLocationFound }: Props) {
    const { t } = useLanguage();
    const map = useMap();
    const rightRef = useRef<HTMLDivElement>(null);
    const leftRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(true);
    const [infoOpen, setInfoOpen] = useState(false);
    const [legendOpen, setLegendOpen] = useState(false);
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (rightRef.current) {
            leaflet.DomEvent.disableClickPropagation(rightRef.current);
            leaflet.DomEvent.disableScrollPropagation(rightRef.current);
        }
        if (leftRef.current) {
            leaflet.DomEvent.disableClickPropagation(leftRef.current);
            leaflet.DomEvent.disableScrollPropagation(leftRef.current);
        }
    }, []);

    // Định vị người dùng, xoay spinner phản hồi trực quan trên mọi lần bấm, bay mượt mà và ghim pinpoint
    async function handleMyLocation() {
        if (locating) return;
        setLocating(true);
        setLocationError(null);
        const start = Date.now();
        try {
            const place = await getMyLocation();
            // Đảm bảo icon xoay tối thiểu 600ms để người dùng thấy rõ phản hồi trực quan trên mọi lần click
            const delay = Math.max(0, 600 - (Date.now() - start));
            if (delay > 0) {
                await new Promise((r) => setTimeout(r, delay));
            }
            if (!mountedRef.current) return;
            map.flyTo(place.position, 16, {
                animate: true,
                duration: 1.2,
            });
            if (onLocationFound) {
                onLocationFound(place);
            }
        } catch (err) {
            const delay = Math.max(0, 600 - (Date.now() - start));
            if (delay > 0) {
                await new Promise((r) => setTimeout(r, delay));
            }
            if (!mountedRef.current) return;
            const msg = err instanceof Error ? err.message : "Không lấy được vị trí";
            setLocationError(msg);
            setTimeout(() => {
                if (mountedRef.current) setLocationError(null);
            }, 3500);
        } finally {
            if (mountedRef.current) {
                setLocating(false);
            }
        }
    }

    // Góc dưới phải: Nút Zoom, Vị trí của tôi, và Nút Chú giải (Icon thu gọn, mở bảng sang trái không che nút)
    // Góc dưới trái: Nút Thông tin nguồn dữ liệu / Bản quyền
    return (
        <>
            <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: "none" }}>
                <div ref={rightRef} className={styles.bottomRightStack}>
                    {/* Bảng chú giải an toàn (Flyout mở sang bên trái, không che nút) */}
                    {legendOpen && (
                        <div className={styles.legendCard} role="region" aria-label={t("map.legendToggle")}>
                            <div className={styles.radarStatusHeader}>
                                <div className={styles.radarStatusLeft}>
                                    <span className={styles.radarPulseDot}></span>
                                    <span>{t("common.appName")} LIVE RADAR HUD</span>
                                </div>
                                <button
                                    type="button"
                                    className={styles.legendCloseBtn}
                                    onClick={() => setLegendOpen(false)}
                                    title={t("common.close")}
                                    aria-label={t("common.close")}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div className={styles.legendTitle}>
                                <i className="fa-solid fa-shield-halved" style={{ marginRight: 6, color: "var(--color-primary, #2563eb)" }}></i>
                                {t("map.legendDangerTitle")}
                            </div>
                            {DANGER_LEVELS.map((lv, i) => (
                                <div key={lv.level} className={styles.legendRow}>
                                    <span className={styles.lineSwatch} style={{ background: lv.color }} />
                                    {t(`map.danger_${lv.level}`)} ({rangeText(i)})
                                </div>
                            ))}

                            <div className={styles.legendTitle} style={{ marginTop: 10 }}>
                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6, color: "var(--color-safety-moderate, #f59e0b)" }}></i>
                                {t("map.legendIncidentTitle")}
                            </div>
                            {SEVERITIES.map((s) => (
                                <div key={s} className={styles.legendRow}>
                                    <span className={styles.dotSwatch} style={{ background: SEVERITY_COLOR[s] }} />
                                    {t(`map.severity_${s}`)}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Nút Chú giải (Thu gọn chỉ icon, kích thước vuông vắn 44x44 đồng bộ) */}
                    <button
                        type="button"
                        className={`${styles.controlBtn} ${legendOpen ? styles.legendToggleActive : ""}`}
                        onClick={() => setLegendOpen((prev) => !prev)}
                        title={t("map.legendToggle")}
                        aria-label={t("map.legendToggle")}
                        aria-expanded={legendOpen}
                    >
                        <i className="fa-solid fa-layer-group"></i>
                    </button>

                    {/* Nút Vị trí của tôi (Pinpoint / Crosshairs to, rõ, dễ bấm) */}
                    <div className={styles.locationBtnWrap}>
                        {locationError && (
                            <div className={styles.locationToast}>
                                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }}></i>
                                <span>{locationError}</span>
                            </div>
                        )}
                        <button
                            type="button"
                            className={`${styles.controlBtn} ${styles.myLocationBtn} ${locating ? styles.locating : ""}`}
                            onClick={handleMyLocation}
                            disabled={locating}
                            title={t("map.myLocation")}
                            aria-label={t("map.myLocation")}
                        >
                            <i className={`fa-solid ${locating ? "fa-spinner fa-spin" : "fa-location-crosshairs"}`}></i>
                        </button>
                    </div>

                    {/* Cụm Phóng to / Thu nhỏ Zoom Group */}
                    <div className={styles.zoomGroup}>
                        <button
                            type="button"
                            className={styles.zoomBtn}
                            onClick={() => map.zoomIn()}
                            title={t("map.zoomIn")}
                            aria-label={t("map.zoomIn")}
                        >
                            <i className="fa-solid fa-plus" style={{ fontSize: 13 }}></i>
                        </button>
                        <div className={styles.zoomDivider} />
                        <button
                            type="button"
                            className={styles.zoomBtn}
                            onClick={() => map.zoomOut()}
                            title={t("map.zoomOut")}
                            aria-label={t("map.zoomOut")}
                        >
                            <i className="fa-solid fa-minus" style={{ fontSize: 13 }}></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="leaflet-bottom leaflet-left" style={{ pointerEvents: "none" }}>
                <div ref={leftRef} className={styles.bottomLeftStack}>
                    <button
                        type="button"
                        className={styles.infoBtn}
                        onClick={() => setInfoOpen(!infoOpen)}
                        title={t("map.sourcesTitle")}
                        aria-label={t("map.sourcesTitle")}
                    >
                        <i className="fa-solid fa-circle-info"></i>
                    </button>

                    {infoOpen && (
                        <div className={styles.infoModal}>
                            <div className={styles.modalHeader}>
                                <span>{t("map.sourcesTitle")}</span>
                                <button
                                    type="button"
                                    className={styles.closeBtn}
                                    onClick={() => setInfoOpen(false)}
                                    aria-label={t("common.close")}
                                >
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <p>{t("map.sourcesIntro")}</p>
                                <ul>
                                    <li><a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a></li>
                                    <li><a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a></li>
                                    <li><a href="https://www.openmaptiles.org" target="_blank" rel="noreferrer">© OpenMapTiles</a></li>
                                    <li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></li>
                                </ul>
                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #ebebeb" }}>
                                    <Link to="/tos" style={{ color: "#2563eb", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                                        <i className="fa-solid fa-file-shield" style={{ marginRight: 6 }}></i>{t("map.tosLink")}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
