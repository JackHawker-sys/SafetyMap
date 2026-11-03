import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import type { GeoPlace } from "../../Business/Models/MapModels";
import { usePlaceSuggestions } from "../Hooks/usePlaceSuggestions";
import { useListNavigation } from "../Hooks/useListNavigation";
import styles from "../../../public/assets/PlaceInput.module.css";

interface Props {
    label: string;            // đọc bởi trình đọc màn hình (ẩn trên giao diện)
    placeholder: string;
    value: GeoPlace | null;
    onChange: (place: GeoPlace | null) => void;
    onFocus?: () => void;     // báo cho cha biết ô này đang được chọn (để click bản đồ điền vào đây)
    active?: boolean;         // ô đang nhận điểm click từ bản đồ
    autoFocus?: boolean;
    leading?: ReactNode;      // chấm tròn / ghim bên trái
    extraAction?: ReactNode;  // "khe" để chèn nút phụ, ví dụ nút GPS
    near?: [number, number];  // [lat, lng] để ưu tiên kết quả gần đó
}

const MIN_QUERY = 3;

export default function PlaceInput({
    label, placeholder, value, onChange, onFocus, active = false, autoFocus = false, leading, extraAction, near,
}: Props) {
    const inputId = useId();
    const listId = `${inputId}-list`;

    const [text, setText] = useState(value?.label ?? "");
    const [open, setOpen] = useState(false);

    // Phân biệt "cha xóa giá trị" (đảo chiều, click bản đồ...) với "chính ô này xóa vì người dùng đang gõ".
    // Nếu không phân biệt: gõ 1 chữ -> onChange(null) -> effect bên dưới xóa sạch chữ vừa gõ.
    const clearedByTyping = useRef(false);

    useEffect(() => {
        if (value) setText(value.label);
        else if (!clearedByTyping.current) setText("");
        clearedByTyping.current = false;
    }, [value]);

    const isTyping = open && !value && text.trim().length >= MIN_QUERY;
    const { results, loading, error } = usePlaceSuggestions(isTyping ? text : "", near?.[0], near?.[1]);

    function select(place: GeoPlace) {
        onChange(place);
        setText(place.label);
        setOpen(false);
    }

    const nav = useListNavigation(results, select, () => setOpen(false));

    function handleType(e: ChangeEvent<HTMLInputElement>) {
        setText(e.target.value);
        setOpen(true);
        nav.setActiveIndex(-1);
        if (value) {
            clearedByTyping.current = true;
            onChange(null);
        }
    }

    const showList = isTyping && (loading || error !== null || results.length > 0);

    return (
        <div className={styles.wrapper}>
            <label htmlFor={inputId} className={styles.srOnly}>{label}</label>

            <div className={`${styles.inputRow} ${active ? styles.activeRow : ""}`}>
                {leading && <span className={styles.leading}>{leading}</span>}
                <input
                    id={inputId}
                    className={styles.input}
                    value={text}
                    placeholder={placeholder}
                    autoComplete="off"
                    autoFocus={autoFocus}
                    role="combobox"
                    aria-expanded={showList}
                    aria-controls={listId}
                    onChange={handleType}
                    onKeyDown={nav.handleKeyDown}
                    onFocus={() => {
                        onFocus?.();
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
                            aria-selected={i === nav.activeIndex}
                            className={i === nav.activeIndex ? `${styles.item} ${styles.active}` : styles.item}
                            onMouseDown={(e) => {
                                e.preventDefault(); // giữ focus, không để blur đóng list trước
                                select(geoPlace);
                            }}
                            onMouseEnter={() => nav.setActiveIndex(i)}
                        >
                            <span className={styles.itemName}>{geoPlace.name}</span>
                            {geoPlace.address && <span className={styles.itemAddress}>{geoPlace.address}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
