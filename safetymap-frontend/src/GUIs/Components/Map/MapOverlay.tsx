import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";
import { Link } from "react-router-dom";
import type { IncidentSeverity } from "../../../Business/Models/MapModels";
import { DANGER_LEVELS } from "../../../Business/Logic/DangerLevel";
import { SEVERITY_COLOR } from "../../../Business/Logic/MapLogic";
import { useLanguage } from "../../Context/LanguageContext";
import styles from "../../../../public/assets/MapOverlay.module.css";

const SEVERITIES: IncidentSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function rangeText(index: number): string {
    const min = DANGER_LEVELS[index].minScore;
    if (index === 0) return `≥ ${min}`;
    const upper = DANGER_LEVELS[index - 1].minScore;
    return `${min} – ${upper - 1}`;
}

export default function MapOverlay() {
    const { t } = useLanguage();
    const map = useMap();
    const rightRef = useRef<HTMLDivElement>(null);
    const leftRef = useRef<HTMLDivElement>(null);
    const [infoOpen, setInfoOpen] = useState(false);

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

    // Góc dưới phải: Nút Zoom & Legend
    // Góc dưới trái: Nút Thông tin nguồn dữ liệu / Bản quyền
    return (
        <>
            <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: "none" }}>
                <div ref={rightRef} className={styles.bottomRightStack}>
                    <div className={styles.zoomGroup}>
                        <button
                            type="button"
                            className={styles.zoomBtn}
                            onClick={() => map.zoomIn()}
                            title={t("map.zoomIn")}
                            aria-label={t("map.zoomIn")}
                        >
                            +
                        </button>
                        <div className={styles.zoomDivider} />
                        <button
                            type="button"
                            className={styles.zoomBtn}
                            onClick={() => map.zoomOut()}
                            title={t("map.zoomOut")}
                            aria-label={t("map.zoomOut")}
                        >
                            −
                        </button>
                    </div>

                    <div className={styles.legendCard}>
                        <div className={styles.legendTitle}>{t("map.legendDangerTitle")}</div>
                        {DANGER_LEVELS.map((lv, i) => (
                            <div key={lv.level} className={styles.legendRow}>
                                <span className={styles.lineSwatch} style={{ background: lv.color }} />
                                {t(`map.danger_${lv.level}`)} ({rangeText(i)})
                            </div>
                        ))}

                        <div className={styles.legendTitle} style={{ marginTop: 8 }}>{t("map.legendIncidentTitle")}</div>
                        {SEVERITIES.map((s) => (
                            <div key={s} className={styles.legendRow}>
                                <span className={styles.dotSwatch} style={{ background: SEVERITY_COLOR[s] }} />
                                {t(`map.severity_${s}`)}
                            </div>
                        ))}
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
                        ℹ
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
                                    ×
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
                                    <Link to="/tos" style={{ color: "#1a73e8", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                                        {t("map.tosLink")}
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
