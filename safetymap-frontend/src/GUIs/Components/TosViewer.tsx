import { useRef } from "react";
import { useTosContent } from "../Hooks/useTosContent";
import { useLanguage } from "../Context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import styles from "../../../public/assets/TosViewer.module.css";

interface Props {
    mode?: "modal" | "page";
    onClose?: () => void;
    onAgreeAndClose?: () => void;
    onBack?: () => void;
}

export default function TosViewer({
    mode = "modal",
    onClose,
    onAgreeAndClose,
    onBack,
}: Props) {
    const { document, loading, error } = useTosContent();
    const { t } = useLanguage();
    const contentRef = useRef<HTMLDivElement>(null);

    // Thanh tiêu đề phía trên cùng
    const headerBar = (
        <div className={styles.header}>
            <div className={styles.headerLeft}>
                {mode === "page" && onBack && (
                    <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={onBack}
                        style={{ padding: "6px 12px", fontSize: 13 }}
                    >
                        ← {t("common.backToMap")}
                    </button>
                )}
                <div className={styles.iconShield}>🛡️</div>
                <div>
                    <h2 className={styles.headerTitle}>
                        {document ? document.title : t("tos.defaultTitle")}
                    </h2>
                    {document && (
                        <div className={styles.metaRow}>
                            <span className={styles.versionBadge}>v{document.version}</span>
                            <span>
                                {t("tos.updated")} {document.lastUpdated}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.headerActions}>
                <LanguageSwitcher />
                {mode === "modal" && onClose && (
                    <button
                        type="button"
                        className={styles.closeIconBtn}
                        onClick={onClose}
                        title={t("common.close")}
                        aria-label={t("common.close")}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );

    // Nội dung chi tiết các điều khoản được tải từ file JSON
    const contentBody = (
        <div ref={contentRef} className={styles.contentBody}>
            {loading && (
                <div style={{ padding: 40, textAlign: "center", color: "#5f6368" }}>
                    {t("tos.loading")}
                </div>
            )}

            {error && (
                <div style={{ padding: 20, background: "#fce8e6", color: "#c5221f", borderRadius: 8 }}>
                    {t("tos.loadError")}
                </div>
            )}

            {document && (
                <>
                    <div className={styles.introBox}>
                        <strong>{t("tos.preamble")}</strong> {document.introduction}
                    </div>

                    {document.sections.map((sec) => (
                        <div key={sec.id} id={`tos-sec-${sec.id}`} className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionNumber}>{sec.number}</div>
                                <h3 className={styles.sectionTitle}>{sec.title}</h3>
                                {sec.badge && <span className={styles.sectionBadge}>{sec.badge}</span>}
                            </div>

                            {sec.paragraphs.map((p, idx) => (
                                <p key={idx} className={styles.paragraph}>
                                    {p}
                                </p>
                            ))}

                            {sec.bullets && sec.bullets.length > 0 && (
                                <ul className={styles.bulletList}>
                                    {sec.bullets.map((b, bIdx) => (
                                        <li key={bIdx} className={styles.bulletItem}>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </>
            )}
        </div>
    );

    // Chân trang chứa các nút hành động trong chế độ modal
    const footerBar = mode === "modal" && (
        <div className={styles.footer}>
            {onClose && (
                <button type="button" className={styles.secondaryBtn} onClick={onClose}>
                    {t("common.close")}
                </button>
            )}
            {onAgreeAndClose && (
                <button type="button" className={styles.primaryBtn} onClick={onAgreeAndClose}>
                    ✓ {t("tos.agree")}
                </button>
            )}
        </div>
    );

    return (
        <div className={styles.container}>
            {headerBar}
            {contentBody}
            {footerBar}
        </div>
    );
}
