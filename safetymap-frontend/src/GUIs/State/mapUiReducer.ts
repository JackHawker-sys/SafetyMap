import type { GeoPlace } from "../../Business/Models/MapModels";

// STATE PATTERN (máy trạng thái hữu hạn): giao diện chỉ ở MỘT trong 3 trạng thái.
// Mỗi trạng thái chỉ mang đúng dữ liệu nó cần -> không thể có tình huống vô lý
// như "đang ở chế độ chỉ đường mà không có ô điểm đến".
//
//   idle ──chọn điểm──▶ place ──bấm "Đường đi"──▶ directions
//    ▲                   │  ▲                         │
//    └────đóng (X)───────┘  └────────quay lại (←)─────┘
export type RouteField = "from" | "to";

export type MapUiState =
    | { mode: "idle" }
    | { mode: "place"; place: GeoPlace }
    | {
        mode: "directions";
        from: GeoPlace | null;
        to: GeoPlace | null;
        activeField: RouteField; // ô sẽ nhận điểm khi người dùng click bản đồ
    };

export type MapUiAction =
    | { type: "SELECT_PLACE"; place: GeoPlace }       // chọn từ thanh tìm kiếm / điểm đã lưu
    | { type: "MAP_CLICK"; place: GeoPlace }          // click lên bản đồ
    | { type: "CLOSE" }                               // đóng sidebar / xóa ô tìm kiếm
    | { type: "OPEN_DIRECTIONS"; defaultFrom?: GeoPlace | null }
    | { type: "SET_MY_LOCATION"; place: GeoPlace }
    | { type: "EXIT_DIRECTIONS" }
    | { type: "SET_FIELD"; field: RouteField; place: GeoPlace | null }
    | { type: "FOCUS_FIELD"; field: RouteField }
    | { type: "SWAP" };

export const initialMapUiState: MapUiState = { mode: "idle" };

const other = (f: RouteField): RouteField => (f === "from" ? "to" : "from");

// Sau khi điền 1 ô: nếu ô còn lại đang trống thì chuyển sang ô đó (giống Google)
function nextActive(from: GeoPlace | null, to: GeoPlace | null, justFilled: RouteField): RouteField {
    const otherField = other(justFilled);
    const otherValue = otherField === "from" ? from : to;
    return otherValue === null ? otherField : justFilled;
}

// Hàm THUẦN: cùng state + action -> luôn cùng kết quả, không gọi API, không đụng DOM.
// Nhờ vậy dễ test và React có thể gọi lại (StrictMode) mà không sinh lỗi.
export function mapUiReducer(state: MapUiState, action: MapUiAction): MapUiState {
    switch (action.type) {
        case "SELECT_PLACE":
            if (state.mode === "directions") {
                // Đang chỉ đường mà chọn từ thanh tìm kiếm -> điền vào ô đang chọn
                return mapUiReducer(state, { type: "SET_FIELD", field: state.activeField, place: action.place });
            }
            return { mode: "place", place: action.place };

        case "MAP_CLICK":
            if (state.mode === "directions") {
                return mapUiReducer(state, { type: "SET_FIELD", field: state.activeField, place: action.place });
            }
            return { mode: "place", place: action.place };

        case "CLOSE":
            return { mode: "idle" };

        case "OPEN_DIRECTIONS":
            // Google: điểm đang xem trở thành ĐIỂM ĐẾN
            if (state.mode === "place") {
                return {
                    mode: "directions",
                    from: action.defaultFrom ?? null,
                    to: state.place,
                    activeField: action.defaultFrom ? "to" : "from",
                };
            }
            if (state.mode === "idle") {
                return {
                    mode: "directions",
                    from: action.defaultFrom ?? null,
                    to: null,
                    activeField: action.defaultFrom ? "to" : "from",
                };
            }
            return state;

        case "SET_MY_LOCATION":
            if (state.mode === "place") {
                // Đang chọn 1 điểm (đích đến) -> bấm Vị trí của tôi:
                // Tự động chuyển sang dẫn đường với Điểm đi = Vị trí của tôi, Điểm đến = Điểm vừa chọn
                return {
                    mode: "directions",
                    from: action.place,
                    to: state.place,
                    activeField: "to",
                };
            }
            if (state.mode === "directions") {
                // Đang trong giao diện chỉ đường -> bấm Vị trí của tôi:
                // Điền Vị trí của tôi vào ô Điểm đi (from)
                return {
                    ...state,
                    from: action.place,
                    activeField: state.to === null ? "to" : state.activeField,
                };
            }
            // mode === "idle": Chưa chọn điểm nào -> giữ nguyên idle, vị trí đã lưu và hiển thị trên bản đồ
            return state;

        case "EXIT_DIRECTIONS":
            if (state.mode !== "directions") return state;
            // Quay về xem điểm đến (nếu có), không thì về idle
            return state.to ? { mode: "place", place: state.to } : { mode: "idle" };

        case "SET_FIELD": {
            if (state.mode !== "directions") return state;
            const from = action.field === "from" ? action.place : state.from;
            const to = action.field === "to" ? action.place : state.to;
            const activeField = action.place
                ? (action.field === state.activeField ? nextActive(from, to, action.field) : state.activeField)
                : action.field;
            return { ...state, from, to, activeField };
        }

        case "FOCUS_FIELD":
            if (state.mode !== "directions" || state.activeField === action.field) return state;
            return { ...state, activeField: action.field };

        case "SWAP":
            if (state.mode !== "directions") return state;
            return { ...state, from: state.to, to: state.from, activeField: other(state.activeField) };
    }
}
