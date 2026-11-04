import { useEffect, useId, useState, type ChangeEvent } from "react";
import type { GeoPlace, SavedPlace } from "../../Business/Models/MapModels";
import { usePlaceSuggestions } from "../Hooks/usePlaceSuggestions";
import { useListNavigation } from "../Hooks/useListNavigation";
import { BookmarkFilledIcon, CloseIcon, DirectionsIcon, PinIcon, SearchIcon } from "./Icons";
import styles from "../../../public/assets/SearchBar.module.css";

interface Props {
    value: GeoPlace | null;                 // điểm đang mở trên sidebar (để hiện chữ trong ô)
    savedPlaces: SavedPlace[];
    near: [number, number];
    onSelect: (place: GeoPlace) => void;
    onClear: () => void;
    onOpenDirections: () => void;
}

const MIN_QUERY = 3;
const MAX_SAVED_SHOWN = 5;

export default function SearchBar({
    value, savedPlaces, near, onSelect, onClear, onOpenDirections,
}: Props) {
    const inputId = useId();
    const listId = `${inputId}-list`;

    const [text, setText] = useState(value?.label ?? "");
    const [open, setOpen] = useState(false);

    // Điểm đổi từ bên ngoài (click bản đồ, chọn điểm đã lưu, đóng sidebar) -> cập nhật chữ trong ô
    useEffect(() => {
        setText(value?.label ?? "");
    }, [value?.id, value?.label]);

    // Chỉ gọi API khi người dùng THẬT SỰ gõ (chữ khác label của điểm đang chọn)
    const isTyping = open && text.trim().length >= MIN_QUERY && text !== value?.label;
    const { results, loading, error } = usePlaceSuggestions(isTyping ? text : "", near[0], near[1]);

    // Chưa gõ đủ 3 ký tự -> hiện danh sách "Đã lưu" như Google hiện lịch sử gần đây
    const showingSaved = !isTyping;
    const items: GeoPlace[] = showingSaved
        ? savedPlaces.slice(0, MAX_SAVED_SHOWN).map((s) => s.place)
        : results;

    function pick(place: GeoPlace) {
        setOpen(false);
        setText(place.label);
        onSelect(place);
    }

    const nav = useListNavigation(items, pick, () => setOpen(false));

    function handleType(e: ChangeEvent<HTMLInputElement>) {
        setText(e.target.value);
        setOpen(true);
        nav.setActiveIndex(-1);
    }

    function handleClear() {
        setText("");
        setOpen(false);
        onClear();
    }

    const showList = open && (isTyping ? (loading || error !== null || results.length > 0) : items.length > 0);

    return (
        <div className={`${styles.wrapper} ${showList ? styles.wrapperOpen : ""}`}>
            <div className={styles.bar}>
                <label htmlFor={inputId} className={styles.leadingLabel} aria-label="Tìm kiếm" title="Tìm kiếm">
                    <SearchIcon className={styles.leadingIcon} />
                </label>
                <input
                    id={inputId}
                    className={styles.input}
                    value={text}
                    placeholder="Tìm kiếm địa điểm hoặc tuyến đường..."
                    autoComplete="off"
                    role="combobox"
                    aria-label="Tìm kiếm địa điểm"
                    aria-expanded={showList}
                    aria-controls={listId}
                    aria-activedescendant={nav.activeIndex >= 0 ? `${listId}-${nav.activeIndex}` : undefined}
                    onChange={handleType}
                    onKeyDown={nav.handleKeyDown}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                />
                {text !== "" && (
                    <button type="button" className={styles.iconButton} onClick={handleClear} title="Xóa tìm kiếm">
                        <CloseIcon />
                    </button>
                )}
                <span className={styles.divider} />
                <button type="button" className={`${styles.iconButton} ${styles.directionsButton}`}
                    onClick={onOpenDirections} title="Tìm đường">
                    <DirectionsIcon size={22} />
                </button>
            </div>

            {showList && (
                <ul id={listId} role="listbox" className={styles.list}>
                    {showingSaved && <li className={styles.sectionTitle}>Đã lưu</li>}
                    {isTyping && loading && <li className={styles.hint}>Đang tìm...</li>}
                    {isTyping && error && <li className={styles.error}>{error}</li>}
                    {items.map((place, i) => (
                        <li
                            key={place.id}
                            id={`${listId}-${i}`}
                            role="option"
                            aria-selected={i === nav.activeIndex}
                            className={`${styles.item} ${i === nav.activeIndex ? styles.active : ""}`}
                            // mousedown + preventDefault: chọn TRƯỚC khi input bị blur đóng danh sách
                            onMouseDown={(e) => { e.preventDefault(); pick(place); }}
                            onMouseEnter={() => nav.setActiveIndex(i)}
                        >
                            <span className={styles.itemIcon}>
                                {showingSaved ? <BookmarkFilledIcon size={18} /> : <PinIcon size={18} />}
                            </span>
                            <span className={styles.itemText}>
                                <span className={styles.itemName}>{place.name}</span>
                                {place.address && <span className={styles.itemAddress}>{place.address}</span>}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
