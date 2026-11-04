import { useEffect, useRef, useState } from "react";
import type { GeoPlace } from "../../Business/Models/MapModels";
import type { RouteField } from "../State/mapUiReducer";
import { getMyLocation } from "../../Business/DAL/GeocodeApi";
import { DEFAULT_CENTER } from "../../Business/Config/MapConfig";
import PlaceInput from "./PlaceInput";
import { BackIcon, CloseIcon, MyLocationIcon, PinIcon, SwapIcon } from "./Icons";
import styles from "../../../public/assets/SidePanel.module.css";

interface Props {
    from: GeoPlace | null;
    to: GeoPlace | null;
    activeField: RouteField;
    routeNotice: string | null;
    onFieldChange: (field: RouteField, place: GeoPlace | null) => void;
    onFieldFocus: (field: RouteField) => void;
    onSwap: () => void;
    onSearch: () => void;
    onBack: () => void;
    onClose: () => void;
}

export default function DirectionsPanel({
    from, to, activeField, routeNotice, onFieldChange, onFieldFocus, onSwap, onSearch, onBack, onClose,
}: Props) {
    const [locating, setLocating] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // GPS có thể mất tới 10 giây. Trong lúc đó người dùng có thể đã click bản đồ chọn điểm khác
    // hoặc đóng panel -> chỉ áp dụng kết quả của LẦN BẤM MỚI NHẤT khi panel vẫn còn mở.
    const gpsRequestId = useRef(0);
    useEffect(() => () => { gpsRequestId.current += 1; }, []);

    async function handleMyLocation() {
        const requestId = ++gpsRequestId.current;
        setLocating(true);
        setGpsError(null);
        const start = Date.now();
        try {
            const place = await getMyLocation();
            // Đảm bảo icon xoay tối thiểu 600ms để người dùng thấy rõ phản hồi trực quan
            const delay = Math.max(0, 600 - (Date.now() - start));
            if (delay > 0) await new Promise((r) => setTimeout(r, delay));
            if (requestId === gpsRequestId.current) onFieldChange("from", place);
        } catch (err) {
            const delay = Math.max(0, 600 - (Date.now() - start));
            if (delay > 0) await new Promise((r) => setTimeout(r, delay));
            if (requestId === gpsRequestId.current)
                setGpsError(err instanceof Error ? err.message : "Không lấy được vị trí");
        } finally {
            if (requestId === gpsRequestId.current) setLocating(false);
        }
    }

    // Người dùng tự chọn điểm đi bằng tay -> hủy kết quả GPS đang chờ
    function handleFromChange(place: GeoPlace | null) {
        gpsRequestId.current += 1;
        setLocating(false);
        onFieldChange("from", place);
    }

    const bothChosen = from !== null && to !== null;
    const near = to?.position ?? from?.position ?? DEFAULT_CENTER;

    return (
        <section className={styles.panel} aria-label="Tìm đường">
            <div className={styles.directionsTop}>
                <button type="button" className={styles.closeButton} onClick={onBack} title="Quay lại">
                    <BackIcon />
                </button>
                <h1 className={styles.directionsTitle}>Tìm đường an toàn</h1>
                <button type="button" className={styles.closeButton} onClick={onClose} title="Đóng">
                    <CloseIcon />
                </button>
            </div>

            <div className={styles.routeFields}>
                <div className={styles.routeInputs}>
                    <PlaceInput
                        label="Điểm đi"
                        placeholder="Chọn điểm đi hoặc bấm lên bản đồ"
                        value={from}
                        onChange={handleFromChange}
                        onFocus={() => onFieldFocus("from")}
                        active={activeField === "from"}
                        autoFocus={from === null}
                        near={near}
                        leading={<span className={styles.fromDot} />}
                        extraAction={
                            <button type="button" className={styles.inlineIconButton} onClick={handleMyLocation}
                                disabled={locating} title="Dùng vị trí hiện tại">
                                <MyLocationIcon size={18} className={locating ? styles.spin : undefined} />
                            </button>
                        }
                    />
                    <span className={styles.routeConnector} aria-hidden="true" />
                    <PlaceInput
                        label="Điểm đến"
                        placeholder="Chọn điểm đến hoặc bấm lên bản đồ"
                        value={to}
                        onChange={(p) => onFieldChange("to", p)}
                        onFocus={() => onFieldFocus("to")}
                        active={activeField === "to"}
                        near={near}
                        leading={<PinIcon size={18} className={styles.toPin} />}
                        // ô trống bằng nút GPS -> 2 ô thẳng hàng
                        extraAction={<span className={styles.inlineSpacer} aria-hidden="true" />}
                    />
                </div>
                <button type="button" className={styles.swapButton} onClick={onSwap}
                    disabled={from === null && to === null} title="Đảo điểm đi và điểm đến">
                    <SwapIcon />
                </button>
            </div>

            {gpsError && <p className={styles.errorText}>{gpsError}</p>}

            <p className={styles.mapHint}>
                Bấm lên bản đồ để {(activeField === "from" ? from : to) ? "đổi" : "chọn"}{" "}
                <b>{activeField === "from" ? "điểm đi" : "điểm đến"}</b>
            </p>

            <button type="button" className={styles.searchButton} onClick={onSearch} disabled={!bothChosen}>
                Tìm đường
            </button>

            {routeNotice && <p className={styles.notice}>{routeNotice}</p>}
        </section>
    );
}
