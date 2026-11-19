import { useEffect, useState } from "react";
import { useLanguage, type AppLanguage } from "../Context/LanguageContext";

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

export type TosLanguage = AppLanguage;

// Hook tải dữ liệu Điều khoản Dịch vụ từ file JSON tĩnh trong thư mục public/content
export function useTosContent() {
    const { lang, setLang } = useLanguage();
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

    return {
        lang,
        setLang,
        document,
        loading,
        error,
    };
}
