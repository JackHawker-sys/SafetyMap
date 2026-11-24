import { createContext, useEffect, useState, type ReactNode } from "react";

export type AppLanguage = "vi" | "en";

interface LanguageContextType {
    lang: AppLanguage;
    setLang: (lang: AppLanguage) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    loading: boolean;
}

export const LanguageContext = createContext<LanguageContextType>({
    lang: "vi",
    setLang: () => {},
    t: (key) => key,
    loading: false,
});

const STORAGE_KEY = "safetymap_lang";

// Trích xuất giá trị lồng nhau từ chuỗi khóa dạng "common.save" hoặc "auth.login"
function getNestedValue(obj: Record<string, unknown>, path: string): string | null {
    const keys = path.split(".");
    let current: unknown = obj;
    for (const k of keys) {
        if (current && typeof current === "object" && k in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[k];
        } else {
            return null;
        }
    }
    return typeof current === "string" ? current : null;
}

// Bộ cung cấp ngữ cảnh đa ngôn ngữ cho toàn bộ ứng dụng S.A.F.E.R
export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<AppLanguage>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return (saved === "en" || saved === "vi") ? saved : "vi";
        } catch {
            return "vi";
        }
    });

    const [dictionary, setDictionary] = useState<Record<string, unknown>>({});
    const [loading, setLoading] = useState<boolean>(true);

    // Tải từ điển ngôn ngữ tương ứng từ thư mục public/locales/
    useEffect(() => {
        let isCancelled = false;

        fetch(`/locales/${lang}.json`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data: Record<string, unknown>) => {
                if (!isCancelled) {
                    setDictionary(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [lang]);

    const setLang = (nextLang: AppLanguage) => {
        setLangState(nextLang);
        try {
            localStorage.setItem(STORAGE_KEY, nextLang);
        } catch {
            // bỏ qua nếu trình duyệt chặn localStorage
        }
    };

    // Hàm tra cứu bản dịch theo khóa với hỗ trợ tham số truyền vào: t("directions.hint", { name: "..." })
    const t = (key: string, params?: Record<string, string | number>): string => {
        const raw = getNestedValue(dictionary, key) ?? key;
        if (!params) return raw;

        return Object.entries(params).reduce((acc, [paramKey, val]) => {
            return acc.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
        }, raw);
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, loading }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Xuất lại hook useLanguage từ thư mục Hooks
export { useLanguage } from "../Hooks/useLanguage";
