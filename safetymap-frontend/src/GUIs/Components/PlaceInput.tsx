import { useId, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import type { GeoPlace } from "../../Business/Models/MapModels";
import { usePlaceSuggestions } from "../Hooks/usePlaceSuggestions";
import styles from "../../../public/assets/PlaceInput.module.css";

interface Props {
    label: string;
    placeholder: string;
    value: GeoPlace | null;
    onChange: (place: GeoPlace | null) => void;
    extraAction?: ReactNode; // "khe" để chèn nút phụ, ví dụ nút GPS
    near?: [number, number]; // [lat, lng] để ưu tiên kết quả gần đó
}

export default function PlaceInput({ label, placeholder, value, onChange, extraAction, near }: Props) {
    const inputId = useId();
    const listId = `${inputId}-list`;

    const [text, setText] = useState(value?.label ?? "");
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Chỉ tìm khi danh sách đang mở -> chọn xong không gửi request cho chính label đó
    const { results, loading, error } = usePlaceSuggestions(open ? text : "", near?.[0], near?.[1]);

    // Khi cha đổi value (GPS, đảo chiều) -> cập nhật chữ trong ô
    const [preValue, setPreValue] = useState(value);
    if (value != preValue) {
        setPreValue(value);
        if (value)
            setText(value.label);
    }

    function select(place: GeoPlace) {
        onChange(place);
        setText(place.label);
        setOpen(false);
        setActiveIndex(-1);
    }

    function handleType(e: ChangeEvent<HTMLInputElement>) {
        setText(e.target.value);
        setOpen(true);
        setActiveIndex(-1);
        if (value)
            onChange(null);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Escape") {
            setOpen(false);
            return;
        }

        if (!open || results.length === 0)
            return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            select(results[activeIndex >= 0 ? activeIndex : 0]);
        }
    }

    const showList = open && (loading || error !== null || results.length > 0);

    return (
        <div className={styles.wrapper}>
            <label htmlFor={inputId} className={styles.label}>{label}</label>

            <div className={styles.inputRow}>
                <input
                    id={inputId}
                    className={styles.input}
                    value={text}
                    placeholder={placeholder}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    onChange={handleType}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (!value && text.trim().length >= 3)
                            setOpen(true);
                    }}
                    onBlur={() => setOpen(false)}
                />
                {extraAction}
            </div>

            {showList && (
                <ul id={listId} role="listbox" className={styles.list}>
                    {loading && <li className={styles.hint}>Đang tìm...</li>}
                    {error && <li className={styles.error}>{error}</li>}
                    {results.map((geoPlace, i) => (
                        <li
                            key={geoPlace.id}
                            role="option"
                            aria-selected={i === activeIndex}
                            className={i === activeIndex ? `${styles.item} ${styles.active}` : styles.item}
                            onMouseDown={(e) => {
                                e.preventDefault(); // giữ focus, không để blur đóng list trước
                                select(geoPlace)
                            }}
                            onMouseEnter={() => setActiveIndex(i)}
                        >
                            {geoPlace.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}