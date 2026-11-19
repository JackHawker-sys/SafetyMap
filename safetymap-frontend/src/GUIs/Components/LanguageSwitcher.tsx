import { useLanguage, type AppLanguage } from "../Context/LanguageContext";
import styles from "../../../public/assets/LanguageSwitcher.module.css";

interface Props {
    className?: string;
}

// Nút chuyển đổi nhanh ngôn ngữ tiếng Việt (VI) và tiếng Anh (EN)
export default function LanguageSwitcher({ className }: Props) {
    const { lang, setLang } = useLanguage();

    return (
        <div className={`${styles.langSwitch} ${className ?? ""}`} role="group" aria-label="Select language">
            <button
                type="button"
                className={`${styles.langBtn} ${lang === "vi" ? styles.langBtnActive : ""}`}
                onClick={() => setLang("vi" as AppLanguage)}
                title="Tiếng Việt"
            >
                VI
            </button>
            <button
                type="button"
                className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
                onClick={() => setLang("en" as AppLanguage)}
                title="English"
            >
                EN
            </button>
        </div>
    );
}
