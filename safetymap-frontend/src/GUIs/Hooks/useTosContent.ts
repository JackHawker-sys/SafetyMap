import { useEffect, useState } from "react";

export interface TosSection {
    id: string;
    number: string;
    title: string;
    badge?: string;
    paragraphs: string[];
    bullets?: string[];
}

export interface TosDocument {
    title: string;
    lastUpdated: string;
    version: string;
    introduction: string;
    sections: TosSection[];
}

export type TosLanguage = "vi" | "en";

// Hook tải dữ liệu Điều khoản Dịch vụ từ file JSON tĩnh trong thư mục public/content
export function useTosContent(initialLang: TosLanguage = "vi") {
    const [lang, setLang] = useState<TosLanguage>(() => {
        const saved = localStorage.getItem("safetymap_lang");
        return (saved === "en" || saved === "vi") ? saved : initialLang;
    });
    const [document, setDocument] = useState<TosDocument | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        fetch(`/content/tos.${lang}.json`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                return res.json();
            })
            .then((data: TosDocument) => {
                if (!isCancelled) {
                    setDocument(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!isCancelled) {
                    setError(err.message || "Failed to load ToS");
                    setLoading(false);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [lang]);

    const changeLang = (nextLang: TosLanguage) => {
        setLang(nextLang);
        setLoading(true);
        setError(null);
        try {
            localStorage.setItem("safetymap_lang", nextLang);
        } catch {
            // bỏ qua nếu localStorage không khả dụng
        }
    };

    return {
        lang,
        setLang: changeLang,
        document,
        loading,
        error,
    };
}
