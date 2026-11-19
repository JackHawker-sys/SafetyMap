import { useContext } from "react";
import { LanguageContext } from "../Context/LanguageContext";

// Hook lấy hàm t() tra cứu từ điển và trạng thái chuyển đổi ngôn ngữ
export function useLanguage() {
    return useContext(LanguageContext);
}
