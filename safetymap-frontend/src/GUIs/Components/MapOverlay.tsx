import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import leaflet from "leaflet";
import type { IncidentSeverity } from "../../Business/Models/MapModels";
import { DANGER_LEVELS } from "../../Business/Logic/DangerLevel";
import { SEVERITY_COLOR, SEVERITY_LABEL } from "../../Business/Logic/MapLogic";
import styles from "../../../public/assets/MapOverlay.module.css";

const SEVERITIES: IncidentSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function rangeText(index: number): string {
    const min = DANGER_LEVELS[index].minScore;
    if (index === 0) return `≥ ${min}`;
    const upper = DANGER_LEVELS[index - 1].minScore;
    return `${min} – ${upper - 1}`;
}

export default function MapOverlay() {
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
                            title="Phóng to"
                            aria-label="Zoom in"
                        >
                            +
                        </button>
                        <div className={styles.zoomDivider} />
                        <button
                            type="button"
                            className={styles.zoomBtn}
                            onClick={() => map.zoomOut()}
                            title="Thu nhỏ"
                            aria-label="Zoom out"
                        >
                            −
                        </button>
                    </div>

                    <div className={styles.legendCard}>
                        <div className={styles.legendTitle}>Mức nguy hiểm đoạn đường</div>
                        {DANGER_LEVELS.map((lv, i) => (
                            <div key={lv.level} className={styles.legendRow}>
                                <span className={styles.lineSwatch} style={{ background: lv.color }} />
                                {lv.label} ({rangeText(i)})
                            </div>
                        ))}

                        <div className={styles.legendTitle} style={{ marginTop: 8 }}>Sự cố</div>
                        {SEVERITIES.map((s) => (
                            <div key={s} className={styles.legendRow}>
                                <span className={styles.dotSwatch} style={{ background: SEVERITY_COLOR[s] }} />
                                {SEVERITY_LABEL[s]}
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
                        title="Nguồn dữ liệu & Bản quyền"
                        aria-label="About map data"
                    >
                        ℹ
                    </button>

                    {infoOpen && (
                        <div className={styles.infoModal}>
                            <div className={styles.modalHeader}>
                                <span>Nguồn dữ liệu & Bản quyền</span>
                                <button
                                    type="button"
                                    className={styles.closeBtn}
                                    onClick={() => setInfoOpen(false)}
                                    aria-label="Close"
                                >
                                    ×
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <p>Bản đồ sử dụng dữ liệu từ:</p>
                                <ul>
                                    <li><a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a></li>
                                    <li><a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a></li>
                                    <li><a href="https://www.openmaptiles.org" target="_blank" rel="noreferrer">© OpenMapTiles</a></li>
                                    <li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></li>
                                </ul>
                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #ebebeb" }}>
                                    <a href="#tos" style={{ color: "#1a73e8", fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
                                        📜 Điều khoản Dịch vụ S.A.F.E.R (Terms of Service)
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
