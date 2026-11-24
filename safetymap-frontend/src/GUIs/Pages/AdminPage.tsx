import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "../Context/LanguageContext";
import LanguageSwitcher from "../Components/LanguageSwitcher";
import styles from "../../assets/styles/AdminPage.module.css";
import type { UserRole } from "../Hooks/useAuth";

interface AdminUserRecord {
    id: number;
    name: string;
    email: string;
    roles: UserRole[];
    status: "ACTIVE" | "BANNED";
    createdAt: string;
}

// Danh sách tài khoản mẫu để Admin quản lý (gồm cả User, Mod, Admin)
const INITIAL_USERS: AdminUserRecord[] = [
    { id: 1, name: "ADMIN1", email: "admin1@safermap.vn", roles: ["USER", "MODERATOR", "ADMIN"], status: "ACTIVE", createdAt: "15/10/2026" },
    { id: 2, name: "MODERATOR1", email: "mod1@safermap.vn", roles: ["USER", "MODERATOR"], status: "ACTIVE", createdAt: "18/10/2026" },
    { id: 3, name: "MODERATOR2", email: "mod2@safermap.vn", roles: ["USER", "MODERATOR"], status: "ACTIVE", createdAt: "20/10/2026" },
    { id: 4, name: "USER1", email: "user1@safermap.vn", roles: ["USER"], status: "ACTIVE", createdAt: "24/10/2026" },
    { id: 5, name: "USER2", email: "user2@safermap.vn", roles: ["USER"], status: "ACTIVE", createdAt: "25/10/2026" },
    { id: 6, name: "USER3", email: "user3@safermap.vn", roles: ["USER"], status: "BANNED", createdAt: "28/10/2026" },
];

interface NewsSource {
    id: number;
    name: string;
    baseUrl: string;
    reliability: number;
    isActive: boolean;
}

// Danh sách nguồn báo cào tự động (source_reliabilities theo v2.2)
const INITIAL_SOURCES: NewsSource[] = [
    { id: 1, name: "VnExpress", baseUrl: "vnexpress.net", reliability: 0.95, isActive: true },
    { id: 2, name: "Báo Tuổi Trẻ", baseUrl: "tuoitre.vn", reliability: 0.92, isActive: true },
    { id: 3, name: "Báo Giao Thông", baseUrl: "baogiaothong.vn", reliability: 0.96, isActive: true },
    { id: 4, name: "Báo Thanh Niên", baseUrl: "thanhnien.vn", reliability: 0.90, isActive: false },
];

interface MapImport {
    id: number;
    area: string;
    sourceFile: string;
    segmentCount: number;
    blockCount: number;
    dataDate: string;
    importedAt: string;
}

// Danh sách các đợt import bản đồ từ OpenStreetMap (map_imports theo v2.6)
const INITIAL_IMPORTS: MapImport[] = [
    { id: 1, area: "TP. Thủ Dầu Một & Thuận An", sourceFile: "vietnam-latest.osm.pbf", segmentCount: 1420, blockCount: 380, dataDate: "20/10/2026", importedAt: "25/10/2026 09:30" },
    { id: 2, area: "Khu vực Quận 1 & Bình Thạnh (TP.HCM)", sourceFile: "vietnam-latest.osm.pbf", segmentCount: 2850, blockCount: 790, dataDate: "22/10/2026", importedAt: "28/10/2026 14:15" },
];

interface AuditLog {
    id: number;
    actor: string;
    role: string;
    action: string;
    target: string;
    time: string;
}

// Nhật ký kiểm toán thao tác hệ thống (audit_logs)
const INITIAL_LOGS: AuditLog[] = [
    { id: 101, actor: "MODERATOR1", role: "MODERATOR", action: "Duyệt báo cáo #101", target: "Tai nạn Trần Văn Ơn", time: "10:15 - 05/11/2026" },
    { id: 102, actor: "MODERATOR2", role: "MODERATOR", action: "Từ chối báo cáo #98", target: "Ảnh không đúng hiện trường", time: "09:40 - 05/11/2026" },
    { id: 103, actor: "ADMIN1", role: "ADMIN", action: "Thăng chức MODERATOR", target: "Tài khoản MODERATOR1", time: "14:20 - 04/11/2026" },
    { id: 104, actor: "ADMIN1", role: "ADMIN", action: "Bật crawler nguồn tin", target: "Báo Giao Thông (baogiaothong.vn)", time: "11:00 - 04/11/2026" },
];



export default function AdminPage() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [currentTab, setCurrentTab] = useState<"ACCOUNTS" | "SOURCES" | "MAP" | "LOGS">("ACCOUNTS");
    const [users, setUsers] = useState<AdminUserRecord[]>(INITIAL_USERS);
    const [sources, setSources] = useState<NewsSource[]>(INITIAL_SOURCES);
    const [imports, setImports] = useState<MapImport[]>(INITIAL_IMPORTS);
    const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Hiển thị thông báo toast nổi
    function showToast(msg: string) {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    }

    // Admin quản lý role: Thăng chức hoặc hạ bậc quyền MODERATOR
    function handleToggleModRole(userId: number) {
        setUsers((prev) =>
            prev.map((u) => {
                if (u.id === userId) {
                    const hasMod = u.roles.includes("MODERATOR");
                    const nextRoles: UserRole[] = hasMod
                        ? u.roles.filter((r) => r !== "MODERATOR")
                        : [...u.roles, "MODERATOR"];
                    showToast(
                        hasMod
                            ? `Đã hạ bậc Moderator của ${u.name} về lại User thường`
                            : `Đã nâng cấp ${u.name} lên quyền MODERATOR`
                    );
                    setLogs((prevLogs) => [
                        {
                            id: Date.now(),
                            actor: "ADMIN1",
                            role: "ADMIN",
                            action: hasMod ? "Thu hồi quyền MODERATOR" : "Cấp quyền MODERATOR",
                            target: u.name,
                            time: "Vừa xong",
                        },
                        ...prevLogs,
                    ]);
                    return { ...u, roles: nextRoles };
                }
                return u;
            })
        );
    }

    // Admin khóa hoặc mở khóa tài khoản (áp dụng cho cả Moderator lẫn User thường)
    function handleToggleStatus(userId: number) {
        setUsers((prev) =>
            prev.map((u) => {
                if (u.id === userId) {
                    const nextStatus = u.status === "ACTIVE" ? "BANNED" : "ACTIVE";
                    showToast(
                        nextStatus === "BANNED"
                            ? `Admin đã khóa tài khoản của ${u.name}`
                            : `Admin đã mở khóa tài khoản của ${u.name}`
                    );
                    setLogs((prevLogs) => [
                        {
                            id: Date.now(),
                            actor: "ADMIN1",
                            role: "ADMIN",
                            action: nextStatus === "BANNED" ? "Khóa tài khoản" : "Mở khóa tài khoản",
                            target: u.name,
                            time: "Vừa xong",
                        },
                        ...prevLogs,
                    ]);
                    return { ...u, status: nextStatus };
                }
                return u;
            })
        );
    }

    // Admin bật hoặc tắt crawler nguồn tin tức tự động
    function handleToggleSource(sourceId: number) {
        setSources((prev) =>
            prev.map((s) => {
                if (s.id === sourceId) {
                    const next = !s.isActive;
                    showToast(`${next ? "Bật" : "Tắt"} cào tin từ nguồn: ${s.name}`);
                    return { ...s, isActive: next };
                }
                return s;
            })
        );
    }

    // Admin mô phỏng chạy Re-import dữ liệu OpenStreetMap
    function handleTriggerImport() {
        const newImport: MapImport = {
            id: imports.length + 1,
            area: "TP. Hồ Chí Minh (Cập nhật mới)",
            sourceFile: "vietnam-latest.osm.pbf",
            segmentCount: 3120,
            blockCount: 840,
            dataDate: "05/11/2026",
            importedAt: "Vừa xong",
        };
        setImports([newImport, ...imports]);
        showToast("Re-import OSM thành công: Đã đồng bộ 3120 đoạn đường & 840 blocks!");
    }

    // Giao diện thanh Header của Admin Portal
    const headerElement = (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button type="button" className={styles.backBtn} onClick={() => navigate("/")}>
                    <span>← {t("common.backToMap")}</span>
                </button>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}><i className="fa-solid fa-gear" style={{ marginRight: 8, color: "#2563eb" }}></i>{t("admin.title")}</h1>
                    <span className={styles.roleBadge}>SUPER ADMIN</span>
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <LanguageSwitcher />
            </div>
        </header>
    );

    // Thông báo Toast góc dưới
    const toastElement = toastMessage && (
        <div
            style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                background: "#1a73e8",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                boxShadow: "0 4px 14px rgba(26,115,232,0.35)",
                zIndex: 3000,
            }}
        >
            {toastMessage}
        </div>
    );

    // Sidebar chứa menu chuyển 4 mục quản trị
    const sidebarElement = (
        <aside className={styles.sidebar}>
            <button
                type="button"
                className={`${styles.sidebarBtn} ${currentTab === "ACCOUNTS" ? styles.sidebarBtnActive : ""}`}
                onClick={() => setCurrentTab("ACCOUNTS")}
            >
                <span><i className="fa-solid fa-users"></i></span> {t("admin.tabAccounts")} ({users.length})
            </button>
            <button
                type="button"
                className={`${styles.sidebarBtn} ${currentTab === "SOURCES" ? styles.sidebarBtnActive : ""}`}
                onClick={() => setCurrentTab("SOURCES")}
            >
                <span><i className="fa-solid fa-newspaper"></i></span> {t("admin.tabSources")} ({sources.length})
            </button>
            <button
                type="button"
                className={`${styles.sidebarBtn} ${currentTab === "MAP" ? styles.sidebarBtnActive : ""}`}
                onClick={() => setCurrentTab("MAP")}
            >
                <span><i className="fa-solid fa-map-location-dot"></i></span> {t("admin.tabMap")} ({imports.length})
            </button>
            <button
                type="button"
                className={`${styles.sidebarBtn} ${currentTab === "LOGS" ? styles.sidebarBtnActive : ""}`}
                onClick={() => setCurrentTab("LOGS")}
            >
                <span><i className="fa-solid fa-clipboard-list"></i></span> {t("admin.tabAudit")} ({logs.length})
            </button>
        </aside>
    );

    // Tab 1: Quản lý phân quyền tài khoản User và Moderator
    const accountsTab = (
        <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
                <div>
                    <h2 className={styles.cardTitle}>{t("admin.accountsTitle")}</h2>
                    <p className={styles.cardDesc}>
                        {t("admin.accountsDesc")}
                    </p>
                </div>
            </div>

            <table className={styles.adminTable}>
                <thead>
                    <tr>
                        <th>{t("admin.colId")}</th>
                        <th>{t("admin.colUser")}</th>
                        <th>{t("admin.colEmail")}</th>
                        <th>{t("admin.colRoles")}</th>
                        <th>{t("admin.colStatus")}</th>
                        <th>{t("admin.colCreatedAt")}</th>
                        <th>{t("admin.colAdminActions")}</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => {
                        const hasMod = u.roles.includes("MODERATOR");
                        const hasAdmin = u.roles.includes("ADMIN");
                        return (
                            <tr key={u.id}>
                                <td>#{u.id}</td>
                                <td><strong>{u.name}</strong></td>
                                <td>{u.email}</td>
                                <td>
                                    <div className={styles.badgeGroup}>
                                        {u.roles.map((r) => (
                                            <span
                                                key={r}
                                                className={`${styles.pillRole} ${r === "ADMIN"
                                                    ? styles.pillAdmin
                                                    : r === "MODERATOR"
                                                        ? styles.pillMod
                                                        : styles.pillUser
                                                    }`}
                                            >
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td>
                                    <span
                                        className={
                                            u.status === "ACTIVE"
                                                ? styles.statusActive
                                                : styles.statusBanned
                                        }
                                    >
                                        {u.status === "ACTIVE" ? t("admin.statusActive") : t("admin.statusBanned")}
                                    </span>
                                </td>
                                <td style={{ color: "#70757a" }}>{u.createdAt}</td>
                                <td>
                                    {!hasAdmin && (
                                        <>
                                            {hasMod ? (
                                                <button
                                                    type="button"
                                                    className={styles.btnDemote}
                                                    onClick={() => handleToggleModRole(u.id)}
                                                >
                                                    {t("admin.btnDemote")}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={styles.btnPromote}
                                                    onClick={() => handleToggleModRole(u.id)}
                                                >
                                                    {t("admin.btnPromote")}
                                                </button>
                                            )}

                                            {u.status === "ACTIVE" ? (
                                                <button
                                                    type="button"
                                                    className={styles.btnLock}
                                                    onClick={() => handleToggleStatus(u.id)}
                                                >
                                                    {t("admin.btnLock")}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={styles.btnUnlock}
                                                    onClick={() => handleToggleStatus(u.id)}
                                                >
                                                    {t("admin.btnUnlock")}
                                                </button>
                                            )}
                                        </>
                                    )}
                                    {hasAdmin && (
                                        <span style={{ fontSize: 12, color: "#1a73e8", fontWeight: 600 }}>
                                            {t("admin.rootAccount")}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    // Tab 2: Quản lý các nguồn tin tức cào tự động
    const sourcesTab = (
        <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
                <div>
                    <h2 className={styles.cardTitle}>{t("admin.sourcesTitle")}</h2>
                    <p className={styles.cardDesc}>
                        {t("admin.sourcesDesc")}
                    </p>
                </div>
            </div>

            <table className={styles.adminTable}>
                <thead>
                    <tr>
                        <th>{t("admin.colId")}</th>
                        <th>{t("admin.colSourceName")}</th>
                        <th>{t("admin.colBaseUrl")}</th>
                        <th>{t("admin.colReliability")}</th>
                        <th>{t("admin.colCrawlStatus")}</th>
                        <th>{t("admin.colActions")}</th>
                    </tr>
                </thead>
                <tbody>
                    {sources.map((s) => (
                        <tr key={s.id}>
                            <td>#{s.id}</td>
                            <td><strong>{s.name}</strong></td>
                            <td><code>{s.baseUrl}</code></td>
                            <td>
                                <strong style={{ color: "#137333" }}>{s.reliability}</strong> / 1.0
                            </td>
                            <td>
                                <span
                                    className={
                                        s.isActive ? styles.statusActive : styles.statusBanned
                                    }
                                >
                                    {s.isActive ? t("admin.statusCrawling") : t("admin.statusPaused")}
                                </span>
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className={`${styles.btnToggleCrawler} ${s.isActive ? styles.crawlerActive : styles.crawlerInactive
                                        }`}
                                    onClick={() => handleToggleSource(s.id)}
                                >
                                    {s.isActive ? t("admin.btnPause") : t("admin.btnResume")}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Tab 3: Quản lý các đợt import bản đồ OpenStreetMap
    const mapTab = (
        <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
                <div>
                    <h2 className={styles.cardTitle}>{t("admin.mapTitle")}</h2>
                    <p className={styles.cardDesc}>
                        {t("admin.mapDesc")}
                    </p>
                </div>
                <button
                    type="button"
                    className={styles.importTriggerBtn}
                    onClick={handleTriggerImport}
                >
                    <i className="fa-solid fa-arrows-rotate" style={{ marginRight: 6 }}></i>{t("admin.btnTriggerImport")}
                </button>
            </div>

            <table className={styles.adminTable}>
                <thead>
                    <tr>
                        <th>{t("admin.colId")}</th>
                        <th>{t("admin.colArea")}</th>
                        <th>{t("admin.colSourceFile")}</th>
                        <th>{t("admin.colSegments")}</th>
                        <th>{t("admin.colBlocks")}</th>
                        <th>{t("admin.colDataDate")}</th>
                        <th>{t("admin.colImportTime")}</th>
                    </tr>
                </thead>
                <tbody>
                    {imports.map((imp) => (
                        <tr key={imp.id}>
                            <td>#{imp.id}</td>
                            <td><strong>{imp.area}</strong></td>
                            <td><code>{imp.sourceFile}</code></td>
                            <td><strong style={{ color: "#1a73e8" }}>{imp.segmentCount.toLocaleString()}</strong></td>
                            <td><strong style={{ color: "#137333" }}>{imp.blockCount.toLocaleString()}</strong></td>
                            <td>{imp.dataDate}</td>
                            <td style={{ color: "#5f6368" }}>{imp.importedAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    // Tab 4: Nhật ký kiểm toán các thao tác nhạy cảm
    const logsTab = (
        <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
                <div>
                    <h2 className={styles.cardTitle}>{t("admin.auditTitle")}</h2>
                    <p className={styles.cardDesc}>
                        {t("admin.auditDesc")}
                    </p>
                </div>
            </div>

            <table className={styles.adminTable}>
                <thead>
                    <tr>
                        <th>{t("admin.colId")}</th>
                        <th>{t("admin.colActor")}</th>
                        <th>{t("admin.colRole")}</th>
                        <th>{t("admin.colAction")}</th>
                        <th>{t("admin.colTargetDetails")}</th>
                        <th>{t("admin.colTime")}</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr key={log.id}>
                            <td>#{log.id}</td>
                            <td><strong>{log.actor}</strong></td>
                            <td>
                                <span
                                    className={`${styles.pillRole} ${log.role === "ADMIN" ? styles.pillAdmin : styles.pillMod
                                        }`}
                                >
                                    {log.role}
                                </span>
                            </td>
                            <td><strong style={{ color: "#202124" }}>{log.action}</strong></td>
                            <td style={{ color: "#5f6368" }}>{log.target}</td>
                            <td style={{ color: "#70757a", fontSize: 12 }}>{log.time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className={styles.page}>
            {headerElement}
            {toastElement}

            <div className={styles.mainContainer}>
                {sidebarElement}

                <main className={styles.contentArea}>
                    {currentTab === "ACCOUNTS" && accountsTab}
                    {currentTab === "SOURCES" && sourcesTab}
                    {currentTab === "MAP" && mapTab}
                    {currentTab === "LOGS" && logsTab}
                </main>
            </div>
        </div>
    );
}
