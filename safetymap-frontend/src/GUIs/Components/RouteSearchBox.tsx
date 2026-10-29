import { useState } from "react";
import type { GeoPlace } from "../../Business/Models/MapModels";
import { getMyLocation } from "../../Business/DAL/GeocodeApi";
import PlaceInput from "./PlaceInput";
import styles from "../../../public/assets/RouteSearchBox.module.css";

// Tâm mặc định khi chưa có điểm nào: Phú Lợi (khu vực triển khai giai đoạn 1)
const DEFAULT_NEAR: [number, number] = [10.9822, 106.6719];

interface Props {
    from: GeoPlace | null;
    to: GeoPlace | null;
    onFormChange: (place: GeoPlace | null) => void;
    onToChange: (place: GeoPlace | null) => void;
    onSwap: () => void;
    onSearch: () => void;
}

export default function RouteSearchBox({ from, to, onFormChange, onToChange, onSwap, onSearch }: Props) {
    const [locating, setLocating] = useState(false);
    const [gpsError, setGpsError] = useState<string | null>(null);

    async function handleMyLocation() {
        setLocating(false);
        setGpsError(null);
        try {
            onFormChange(await getMyLocation());
        } catch (err) {
            setGpsError(err instanceof Error ? err.message : "Không lấy được vị trí");
        } finally {
            setLocating(false);
        }
    }

    const bothChosen = from !== null && to !== null;

    return (
        <div className={styles.box}>
            <h2 className={styles.title}>Tìm đường an toàn</h2>

            <PlaceInput
                label="Điểm đi"
                placeholder="Nhập vị trí điểm đi"
                value={from}
                onChange={onFormChange}
                extraAction={
                    <button
                        type="button"
                        className={styles.inconButton}
                        onClick={handleMyLocation}
                        disabled={locating}
                        title="Dùng vị trí hiện tại"
                    >
                        {locating ? "..." : "📍"}
                    </button>
                }
                near={to?.position ?? DEFAULT_NEAR}
            />
            {gpsError && <div className={styles.error}>{gpsError}</div>}

            <button
                type="button"
                className={styles.swapButton}
                onClick={onSwap}
                disabled={!bothChosen}
                title="Đảo điểm đi và điểm đến"
            >⇅</button>

            <PlaceInput
                label="Điểm đến"
                placeholder="Nhập địa chỉ điểm đến"
                value={to}
                onChange={onToChange}
                near={to?.position ?? DEFAULT_NEAR}
            />

            <button
                type="button"
                className={styles.searchButton}
                onClick={onSearch}
                disabled={!bothChosen}
            >
                Tìm đường
            </button>
        </div>
    );
}