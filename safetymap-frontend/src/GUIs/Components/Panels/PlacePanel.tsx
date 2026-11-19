import { useEffect, useRef, useState } from "react";

import type { GeoPlace } from "../../../Business/Models/MapModels";
import { formatCoords } from "../../../Business/Logic/PlaceLogic";
import { BookmarkFilledIcon, BookmarkIcon, CloseIcon, CopyIcon, DirectionsIcon, PinIcon, ShieldIcon } from "../Common/Icons";
import { useLanguage } from "../../Context/LanguageContext";
import styles from "../../../../public/assets/SidePanel.module.css";


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

// Sidebar trái khi đã chọn 1 điểm (giống thẻ địa điểm của Google Maps)
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
            <header className={styles.placeHeader}>
                <div className={styles.placeTitleRow}>
                    <h1 className={styles.placeName}>
                        {place.name === "Vị trí đã ghim" ? t("place.droppedPin") : place.name}
                    </h1>
                    <button type="button" className={styles.closeButton} onClick={onClose} title={t("common.close")}>
                        <CloseIcon />
                    </button>
                </div>
                {place.address && <p className={styles.placeAddress}>{place.address}</p>}
            </header>

            <div className={styles.actions}>
                <button type="button" className={styles.action} onClick={onDirections}>
                    <span className={`${styles.actionCircle} ${styles.actionPrimary}`}><DirectionsIcon size={22} /></span>
                    <span className={styles.actionLabel}>{t("place.directions")}</span>
                </button>
                <button type="button" className={styles.action} onClick={onToggleSave} disabled={saving}
                    aria-pressed={saved}>
                    <span className={`${styles.actionCircle} ${saved ? styles.actionOn : ""}`}>
                        {saved ? <BookmarkFilledIcon /> : <BookmarkIcon />}
                    </span>
                    <span className={styles.actionLabel}>{saved ? t("place.saved") : t("place.save")}</span>
                </button>
            </div>
            {saveError && <p className={styles.errorText}>{saveError}</p>}

            <ul className={styles.infoList}>
                <li className={styles.infoRow}>
                    <PinIcon className={styles.infoIcon} />
                    <span className={styles.infoText}>{formatCoords(place.position)}</span>
                    <button type="button" className={styles.smallButton} onClick={copyCoords} title={t("place.copyCoords")}>
                        {copied ? "✓" : <CopyIcon size={16} />}
                    </button>
                </li>
                <li className={styles.infoRow}>
                    <ShieldIcon className={styles.infoIcon} />
                    <span className={styles.infoText}>
                        {t("place.areaSafety")}
                        <span className={styles.muted}>{t("place.areaSafetyNote")}</span>
                    </span>
                </li>
            </ul>
        </section>
    );
}
