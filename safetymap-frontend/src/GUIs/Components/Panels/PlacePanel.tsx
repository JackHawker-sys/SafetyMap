import { useEffect, useRef, useState } from "react";

import type { GeoPlace } from "../../../Business/Models/MapModels";
import { formatCoords } from "../../../Business/Logic/PlaceLogic";
import { BookmarkFilledIcon, BookmarkIcon, CloseIcon, CopyIcon, PinIcon } from "../Common/Icons";
import { useLanguage } from "../../Context/LanguageContext";
import styles from "../../../assets/styles/SidePanel.module.css";

interface Props {
    place: GeoPlace;
    saved: boolean;
    saving: boolean;
    saveError: string | null;
    onDirections: () => void;
    onToggleSave: () => void;
    onClose: () => void;
}

const COPIED_RESET_MS = 1500;

// Sidebar trái khi đã chọn 1 điểm (Tactical Midnight Obsidian Safety Card)
export default function PlacePanel({ place, saved, saving, saveError, onDirections, onToggleSave, onClose }: Props) {
    const { t } = useLanguage();
    // Lưu ID của điểm vừa bấm sao chép -> khi đổi sang điểm khác, tự reset mà không cần useEffect
    const [copiedPlaceId, setCopiedPlaceId] = useState<string | null>(null);
    const timer = useRef<number | undefined>(undefined);

    // Đổi sang điểm khác hoặc đóng panel -> hủy timer, tránh setState sau khi component đã unmount
    useEffect(() => () => window.clearTimeout(timer.current), []);

    const copied = copiedPlaceId === place.id;

    async function copyCoords() {
        try {
            await navigator.clipboard.writeText(formatCoords(place.position));
            setCopiedPlaceId(place.id);
            window.clearTimeout(timer.current); // bấm liên tục -> chỉ giữ timer mới nhất
            timer.current = window.setTimeout(() => setCopiedPlaceId(null), COPIED_RESET_MS);
        } catch {
            // Trình duyệt chặn clipboard (http, iframe) -> bỏ qua, tọa độ vẫn hiện để tự chọn
        }
    }

    // TODO(backend): gọi API điểm nguy hiểm các đoạn đường quanh điểm này
    return (
        <section className={styles.panel} aria-label={place.name === "Vị trí đã ghim" ? t("place.droppedPin") : place.name}>
            {/* Tactical Navigation Bar */}
            <div className={styles.panelNavRow}>
                <button type="button" className={styles.closeButton} onClick={onClose} title={t("common.backToMap")}>
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className={styles.telemetryTag}>
                    <span className={styles.telemetryDot} />
                    <span>SECTOR TELEMETRY • S.A.F.E.R</span>
                </div>
                <button type="button" className={styles.closeButton} onClick={onClose} title={t("common.close")}>
                    <CloseIcon />
                </button>
            </div>

            <header className={styles.placeHeader}>
                <div className={styles.placeTitleRow}>
                    <h1 className={styles.placeName}>
                        <i className="fa-solid fa-location-dot" style={{ color: "#ef4444", marginRight: 8, fontSize: 18 }}></i>
                        {place.name === "Vị trí đã ghim" ? t("place.droppedPin") : place.name}
                    </h1>
                </div>
                {place.address && <p className={styles.placeAddress}>{place.address}</p>}
            </header>

            {/* Tactical Safety Evaluation Card */}
            <div className={styles.safetyCard}>
                <div className={styles.safetyCardHeader}>
                    <div className={styles.safetyBadge}>
                        <div className={styles.shieldPulseWrap}>
                            <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <div>
                            <div className={styles.safetyTitle}>{t("place.areaSafety")}</div>
                            <div className={styles.safetyStatusText}>
                                {t("place.areaSafetyNote") || "VÙNG AN TOÀN CAO • MỨC ĐỘ 1"}
                            </div>
                        </div>
                    </div>

                    <div className={styles.scoreGauge}>
                        <svg className={styles.gaugeSvg} viewBox="0 0 48 48">
                            <circle className={styles.gaugeTrack} cx="24" cy="24" r="20" />
                            <circle className={styles.gaugeBar} cx="24" cy="24" r="20" />
                        </svg>
                        <div className={styles.gaugeContent}>
                            <span className={styles.gaugeVal}>94</span>
                            <span className={styles.gaugeUnit}>%</span>
                        </div>
                    </div>
                </div>

                <div className={styles.safetyMetricsGrid}>
                    <div className={styles.safetyMetricItem}>
                        <i className="fa-solid fa-lightbulb" style={{ color: "#f59e0b" }}></i>
                        <div>
                            <div className={styles.metricLabel}>Chiếu sáng</div>
                            <div className={styles.metricVal}>Đèn cao áp 90%</div>
                        </div>
                    </div>
                    <div className={styles.safetyMetricItem}>
                        <i className="fa-solid fa-shield-halved" style={{ color: "#10b981" }}></i>
                        <div>
                            <div className={styles.metricLabel}>Sự cố 24h</div>
                            <div className={styles.metricVal}>0 báo cáo</div>
                        </div>
                    </div>
                    <div className={styles.safetyMetricItem}>
                        <i className="fa-solid fa-robot" style={{ color: "#38bdf8" }}></i>
                        <div>
                            <div className={styles.metricLabel}>AI bảo vệ</div>
                            <div className={styles.metricVal}>Tin cậy 98%</div>
                        </div>
                    </div>
                </div>

                {/* Visual Gradient Threat Meter */}
                <div className={styles.threatMeterContainer}>
                    <div className={styles.threatMeterLabels}>
                        <span style={{ color: "#10b981" }}>AN TOÀN (0)</span>
                        <span style={{ color: "#f59e0b" }}>TRUNG BÌNH (35)</span>
                        <span style={{ color: "#ef4444" }}>NGUY HIỂM (60+)</span>
                    </div>
                    <div className={styles.threatMeterTrack}>
                        <div className={styles.threatMeterMarker} style={{ "--marker-left": "12%" } as React.CSSProperties} />
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button type="button" className={`${styles.action} ${styles.actionPrimaryBtn}`} onClick={onDirections}>
                    <i className="fa-solid fa-diamond-turn-right" style={{ marginRight: 6, fontSize: 16 }}></i>
                    <span className={styles.actionLabel}>{t("place.directions")}</span>
                </button>
                <button type="button" className={`${styles.action} ${styles.actionSaveBtn} ${saved ? styles.actionOn : ""}`} onClick={onToggleSave} disabled={saving} aria-pressed={saved}>
                    {saved ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                    <span className={styles.actionLabel}>{saved ? t("place.saved") : t("place.save")}</span>
                </button>
            </div>
            {saveError && <p className={styles.errorText}>{saveError}</p>}

            <div className={styles.coordCard}>
                <div className={styles.coordInfo}>
                    <PinIcon className={styles.infoIcon} />
                    <span className={styles.coordValue}>{formatCoords(place.position)}</span>
                </div>
                <button type="button" className={styles.smallButton} onClick={copyCoords} title={t("place.copyCoords")}>
                    {copied ? (
                        <>
                            <i className="fa-solid fa-check" style={{ color: "#10b981", marginRight: 5 }}></i>
                            <span>{t("place.coordsCopied") || "Đã chép"}</span>
                        </>
                    ) : (
                        <>
                            <CopyIcon size={15} />
                            <span>{t("place.copyCoords")}</span>
                        </>
                    )}
                </button>
            </div>
        </section>
    );
}
