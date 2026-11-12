import { useRef } from "react";
import { useTosContent, type TosLanguage } from "../Hooks/useTosContent";
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
    const { lang, setLang, document, loading, error } = useTosContent();
    const contentRef = useRef<HTMLDivElement>(null);

    // Nút chuyển đổi ngôn ngữ Việt / Anh
    const languageSwitcher = (
        <div className={styles.langSwitch} role="group" aria-label="Language selection">
            <button
                type="button"
                className={`${styles.langBtn} ${lang === "vi" ? styles.langBtnActive : ""}`}
                onClick={() => setLang("vi" as TosLanguage)}
            >
                VI
            </button>
            <button
                type="button"
                className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
                onClick={() => setLang("en" as TosLanguage)}
            >
                EN
            </button>
        </div>
    );

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
                        ← {lang === "vi" ? "Quay lại Bản đồ" : "Back to Map"}
                    </button>
                )}
                <div className={styles.iconShield}>🛡️</div>
                <div>
                    <h2 className={styles.headerTitle}>
                        {document ? document.title : (lang === "vi" ? "Điều khoản Dịch vụ S.A.F.E.R" : "S.A.F.E.R Terms of Service")}
                    </h2>
                    {document && (
                        <div className={styles.metaRow}>
                            <span className={styles.versionBadge}>v{document.version}</span>
                            <span>
                                {lang === "vi" ? "Cập nhật:" : "Updated:"} {document.lastUpdated}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.headerActions}>
                {languageSwitcher}
                {mode === "modal" && onClose && (
                    <button
                        type="button"
                        className={styles.closeIconBtn}
                        onClick={onClose}
                        title={lang === "vi" ? "Đóng" : "Close"}
                        aria-label="Close"
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
                    {lang === "vi" ? "Đang tải điều khoản..." : "Loading terms..."}
                </div>
            )}

            {error && (
                <div style={{ padding: 20, background: "#fce8e6", color: "#c5221f", borderRadius: 8 }}>
                    {lang === "vi"
                        ? "Không thể tải văn bản điều khoản. Vui lòng thử lại sau."
                        : "Failed to load terms document. Please try again."}
                </div>
            )}

            {document && (
                <>
                    <div className={styles.introBox}>
                        <strong>{lang === "vi" ? "Lời mở đầu:" : "Preamble:"}</strong> {document.introduction}
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
                    {lang === "vi" ? "Đóng" : "Close"}
                </button>
            )}
            {onAgreeAndClose && (
                <button type="button" className={styles.primaryBtn} onClick={onAgreeAndClose}>
                    ✓ {lang === "vi" ? "Đã hiểu & Đồng ý" : "I Understand & Agree"}
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
