import { useState } from "react";
import styles from "../../../public/assets/ModeratorPage.module.css";

interface ReportItem {
    id: number;
    type: string;
    description: string;
    imageUrl: string;
    street: string;
    ward: string;
    timeAgo: string;
    reporter: {
        id: number;
        name: string;
        distanceM: number;
        approvedCount: number;
        totalCount: number;
        isBanned: boolean;
    };
    ai: {
        verdict: "MATCH" | "MISMATCH" | "UNSURE";
        confidence: number;
        reason: string;
    };
}

// Danh sách các báo cáo sự cố mẫu chờ duyệt (trạng thái NEEDS_REVIEW theo v2.3)
const INITIAL_REPORTS: ReportItem[] = [
    {
        id: 101,
        type: "Tai nạn giao thông",
        description: "Va chạm giữa 2 xe máy tại ngã tư, 1 xe ngã chắn nửa làn đường bên phải. Giao thông đang ùn tắc nhẹ.",
        imageUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
        street: "Đường Trần Văn Ơn",
        ward: "Phường Phú Lợi, TP. Thủ Dầu Một",
        timeAgo: "8 phút trước",
        reporter: {
            id: 201,
            name: "USER1",
            distanceM: 65,
            approvedCount: 14,
            totalCount: 16,
            isBanned: false,
        },
        ai: {
            verdict: "UNSURE",
            confidence: 0.74,
            reason: "Ảnh chụp có phương tiện ngã nhưng góc máy hơi mờ, cần moderator đối chiếu với camera giao thông ngã tư.",
        },
    },
    {
        id: 102,
        type: "Cướp giật",
        description: "Hai thanh niên đi xe Wave giật túi xách người đi bộ rồi phóng nhanh về hướng ngã ba.",
        imageUrl: "https://images.unsplash.com/photo-1508847154043-be5407fcaa5a?w=600&auto=format&fit=crop&q=80",
        street: "Đường Phú Lợi",
        ward: "Phường Phú Lợi, TP. Thủ Dầu Một",
        timeAgo: "22 phút trước",
        reporter: {
            id: 202,
            name: "USER2",
            distanceM: 140,
            approvedCount: 5,
            totalCount: 6,
            isBanned: false,
        },
        ai: {
            verdict: "UNSURE",
            confidence: 0.68,
            reason: "Ảnh hiện trường không có dấu vết vật lý rõ ràng (chỉ chụp lòng đường), cần moderator xem xét độ tin cậy của mô tả.",
        },
    },
    {
        id: 103,
        type: "Ngập lụt",
        description: "Mưa lớn làm ngập đoạn đường khoảng 40cm, các xe máy đi qua bị chết máy la liệt.",
        imageUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=80",
        street: "Đường Cách Mạng Tháng 8",
        ward: "Phường Phú Cường, TP. Thủ Dầu Một",
        timeAgo: "35 phút trước",
        reporter: {
            id: 203,
            name: "USER3",
            distanceM: 185,
            approvedCount: 22,
            totalCount: 24,
            isBanned: false,
        },
        ai: {
            verdict: "MATCH",
            confidence: 0.88,
            reason: "Hình ảnh ngập nước rõ rệt khớp với cảnh báo triều cường và mô tả của người dân.",
        },
    },
];

interface NormalUser {
    id: number;
    name: string;
    email: string;
    totalReports: number;
    approvedReports: number;
    rejectedReports: number;
    status: "ACTIVE" | "BANNED";
}

// Danh sách người dùng thường mẫu để Moderator quản lý và chế tài
const INITIAL_NORMAL_USERS: NormalUser[] = [
    { id: 201, name: "USER1", email: "user1@safetymap.vn", totalReports: 16, approvedReports: 14, rejectedReports: 2, status: "ACTIVE" },
    { id: 202, name: "USER2", email: "user2@safetymap.vn", totalReports: 6, approvedReports: 5, rejectedReports: 1, status: "ACTIVE" },
    { id: 203, name: "USER3", email: "user3@safetymap.vn", totalReports: 24, approvedReports: 22, rejectedReports: 2, status: "ACTIVE" },
    { id: 204, name: "USER4 (Spam)", email: "user4@safetymap.vn", totalReports: 8, approvedReports: 1, rejectedReports: 7, status: "BANNED" },
];

// Định dạng thông tin sự cố có sẵn trên bản đồ để đối chiếu và gộp
interface NearbyIncidentCandidate {
    id: number;
    code: string;
    type: string;
    title: string;
    location: string;
    distanceM: number;
    timeAgo: string;
    source: string;
    mergedReportsCount: number;
}

// Tìm các sự cố lân cận thỏa mãn quy tắc v2.9 (cùng loại, cùng tuyến đường hoặc cách dưới 300m trong vòng 24h)
function getNearbyCandidates(report: ReportItem): NearbyIncidentCandidate[] {
    if (report.type === "Ngập lụt") {
        return [
            {
                id: 88,
                code: "INC-88",
                type: "Ngập lụt",
                title: "Đoạn ngập sâu 40-50cm tại nút giao Cách Mạng Tháng 8",
                location: "Đường Cách Mạng Tháng 8, Phường Phú Cường",
                distanceM: 95,
                timeAgo: "45 phút trước",
                source: "Báo Giao Thông",
                mergedReportsCount: 4,
            },
            {
                id: 85,
                code: "INC-85",
                type: "Ngập lụt",
                title: "Nước ngập tràn vào vỉa hè và nhà dân",
                location: "Đường Cách Mạng Tháng 8 x Bạch Đằng",
                distanceM: 260,
                timeAgo: "1.5 giờ trước",
                source: "USER2",
                mergedReportsCount: 1,
            },
        ];
    }
    if (report.type === "Tai nạn giao thông") {
        return [
            {
                id: 72,
                code: "INC-72",
                type: "Tai nạn giao thông",
                title: "Va chạm giữa xe tải và 2 xe máy tại ngã tư",
                location: "Đường Trần Văn Ơn x Đại lộ Bình Dương",
                distanceM: 80,
                timeAgo: "20 phút trước",
                source: "Tin báo dân cư",
                mergedReportsCount: 3,
            },
            {
                id: 69,
                code: "INC-69",
                type: "Tai nạn giao thông",
                title: "Xe trượt ngã chắn làn đường xe máy",
                location: "Đường Trần Văn Ơn",
                distanceM: 220,
                timeAgo: "1 giờ trước",
                source: "VnExpress",
                mergedReportsCount: 1,
            },
        ];
    }
    return [
        {
            id: 54,
            code: "INC-54",
            type: "Cướp giật",
            title: "Hai thanh niên cướp túi xách của người đi bộ",
            location: "Đường Phú Lợi, Phường Phú Lợi",
            distanceM: 110,
            timeAgo: "30 phút trước",
            source: "USER1",
            mergedReportsCount: 2,
        },
    ];
}

interface Props {
    onBack: () => void;
}

export default function ModeratorPage({ onBack }: Props) {
    const [tab, setTab] = useState<"QUEUE" | "USERS">("QUEUE");
    const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
    const [selectedId, setSelectedId] = useState<number>(INITIAL_REPORTS[0]?.id ?? 0);
    const [normalUsers, setNormalUsers] = useState<NormalUser[]>(INITIAL_NORMAL_USERS);

    // Quản lý trạng thái hộp thoại từ chối báo cáo
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("Ảnh không trùng khớp hiện trường");
    const [customRejectReason, setCustomRejectReason] = useState("");

    // Quản lý trạng thái hộp thoại cảnh cáo người dùng
    const [warnModalOpen, setWarnModalOpen] = useState(false);
    const [warnTargetUser, setWarnTargetUser] = useState<string>("");
    const [warnReason, setWarnReason] = useState<string>("Gửi ảnh chụp không đúng hoặc che khuất hiện trường");
    const [customWarnReason, setCustomWarnReason] = useState("");

    // Quản lý trạng thái hộp thoại gộp sự cố gần đó
    const [mergeModalOpen, setMergeModalOpen] = useState(false);
    const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Hiển thị thông báo toast nổi ở góc màn hình
    function showToast(msg: string) {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    }

    const currentReport = reports.find((r) => r.id === selectedId) ?? reports[0];
    const candidateIncidents = currentReport ? getNearbyCandidates(currentReport) : [];

    // Thao tác duyệt báo cáo và xuất bản thành sự cố chính thức
    function handleApprove(id: number) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        showToast(`Đã duyệt báo cáo #${id} và xuất bản thành sự cố chính thức!`);
        if (reports.length > 1) {
            const next = reports.find((r) => r.id !== id);
            if (next) setSelectedId(next.id);
        }
    }

    // Thao tác xác nhận từ chối báo cáo kèm lý do gửi cho người báo cáo
    function handleRejectConfirm() {
        if (!currentReport) return;
        const id = currentReport.id;
        const reason = rejectReason === "OTHER"
            ? (customRejectReason.trim() || "Không đạt tiêu chuẩn kiểm duyệt")
            : rejectReason;
        setReports((prev) => prev.filter((r) => r.id !== id));
        setRejectModalOpen(false);
        setCustomRejectReason("");
        showToast(`Đã từ chối báo cáo #${id} ("${reason}"). Đã gửi thông báo REPORT_REJECTED đến người báo cáo.`);
        if (reports.length > 1) {
            const next = reports.find((r) => r.id !== id);
            if (next) setSelectedId(next.id);
        }
    }

    // Mở modal gộp sự cố và tự động chọn ứng viên gần nhất
    function handleOpenMergeModal() {
        if (!currentReport) return;
        const candidates = getNearbyCandidates(currentReport);
        setSelectedCandidateId(candidates[0]?.id ?? null);
        setMergeModalOpen(true);
    }

    // Thao tác xác nhận gộp báo cáo vào sự cố đã chọn theo thiết kế v2.9
    function handleConfirmMerge() {
        if (!currentReport || !selectedCandidateId) return;
        const candidate = candidateIncidents.find((c) => c.id === selectedCandidateId);
        const reportId = currentReport.id;
        const reporterName = currentReport.reporter.name;

        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setMergeModalOpen(false);

        showToast(
            `Đã gộp báo cáo #${reportId} vào sự cố #${candidate?.code}! Đã gửi thông báo REPORT_MERGED cho ${reporterName}.`
        );

        if (reports.length > 1) {
            const next = reports.find((r) => r.id !== reportId);
            if (next) setSelectedId(next.id);
        }
    }

    // Thao tác khóa hoặc mở khóa tài khoản người dùng thường để chống spam
    function handleToggleBanUser(userId: number) {
        setNormalUsers((prev) =>
            prev.map((u) => {
                if (u.id === userId) {
                    const nextStatus = u.status === "ACTIVE" ? "BANNED" : "ACTIVE";
                    showToast(
                        nextStatus === "BANNED"
                            ? `Đã khóa tài khoản user ${u.name} (chống spam báo cáo)`
                            : `Đã mở khóa tài khoản user ${u.name}`
                    );
                    return { ...u, status: nextStatus };
                }
                return u;
            })
        );
    }

    // Mở hộp thoại cảnh cáo người dùng để chọn hoặc tự điền lý do
    function handleOpenWarnModal(userName: string) {
        setWarnTargetUser(userName);
        setWarnReason("Gửi ảnh chụp không đúng hoặc che khuất hiện trường");
        setCustomWarnReason("");
        setWarnModalOpen(true);
    }

    // Thao tác xác nhận gửi cảnh cáo đến người dùng kèm lý do vi phạm
    function handleConfirmWarn() {
        const reason = warnReason === "OTHER"
            ? (customWarnReason.trim() || "Vi phạm quy tắc cộng đồng")
            : warnReason;
        setWarnModalOpen(false);
        setCustomWarnReason("");
        showToast(`Đã gửi cảnh cáo đến ${warnTargetUser}: "${reason}".`);
    }

    // Giao diện thanh Header điều hướng và chọn tab kiểm duyệt
    const headerElement = (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button type="button" className={styles.backBtn} onClick={onBack}>
                    <span>← Quay lại Bản đồ</span>
                </button>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>🛡️ Bàn Kiểm duyệt (Moderator Hub)</h1>
                    <span className={styles.roleBadge}>MODERATOR</span>
                </div>
            </div>

            <div className={styles.tabNav}>
                <button
                    type="button"
                    className={`${styles.tabBtn} ${tab === "QUEUE" ? styles.tabActive : ""}`}
                    onClick={() => setTab("QUEUE")}
                >
                    Hàng đợi Duyệt Báo cáo ({reports.length})
                </button>
                <button
                    type="button"
                    className={`${styles.tabBtn} ${tab === "USERS" ? styles.tabActive : ""}`}
                    onClick={() => setTab("USERS")}
                >
                    Quản lý Người dùng thường ({normalUsers.length})
                </button>
            </div>
        </header>
    );

    // Hộp thông báo thao tác nổi ở góc dưới
    const toastElement = toastMessage && (
        <div
            style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                background: "#202124",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                fontSize: 13,
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                zIndex: 3000,
            }}
        >
            {toastMessage}
        </div>
    );

    // Cột bên trái: Danh sách hàng đợi các báo cáo đang chờ duyệt
    const queueListPanel = (
        <aside className={styles.queuePanel}>
            <div className={styles.queueHeader}>
                <span className={styles.queueTitle}>Báo cáo chờ duyệt (NEEDS_REVIEW)</span>
                <span className={styles.queueCount}>{reports.length}</span>
            </div>

            <div className={styles.queueList}>
                {reports.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "#70757a", fontSize: 13 }}>
                        Đã duyệt sạch hàng đợi! Không còn báo cáo nào cần xử lý.
                    </div>
                ) : (
                    reports.map((rep) => {
                        const active = rep.id === currentReport?.id;
                        return (
                            <div
                                key={rep.id}
                                className={`${styles.reportCard} ${active ? styles.reportCardActive : ""}`}
                                onClick={() => setSelectedId(rep.id)}
                            >
                                <div className={styles.cardTop}>
                                    <span className={styles.typeBadge}>{rep.type}</span>
                                    <span className={styles.timeText}>{rep.timeAgo}</span>
                                </div>
                                <div className={styles.cardStreet}>{rep.street}</div>
                                <div className={styles.cardSnippet}>{rep.description}</div>
                                <div>
                                    <span
                                        className={`${styles.aiVerdictChip} ${
                                            rep.ai.verdict === "MATCH"
                                                ? styles.chipMatch
                                                : rep.ai.verdict === "MISMATCH"
                                                ? styles.chipMismatch
                                                : styles.chipUnsure
                                        }`}
                                    >
                                        AI: {rep.ai.verdict} ({Math.round(rep.ai.confidence * 100)}%)
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </aside>
    );

    // Cột bên phải: Chi tiết báo cáo hiện tại và các nút xử lý duyệt
    const reportDetailPanel = currentReport ? (
        <main className={styles.detailPanel}>
            <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                    <div>
                        <h2 className={styles.detailTitle}>
                            Báo cáo #{currentReport.id}: {currentReport.type}
                        </h2>
                        <div className={styles.detailAddress}>
                            📍 {currentReport.street}, {currentReport.ward}
                        </div>
                    </div>
                    <span className={styles.timeText}>{currentReport.timeAgo}</span>
                </div>

                <div className={styles.reporterBox}>
                    <div className={styles.reporterInfo}>
                        <div className={styles.reporterAvatar}>
                            {currentReport.reporter.name.charAt(0)}
                        </div>
                        <div>
                            <div className={styles.reporterName}>
                                Người gửi: {currentReport.reporter.name}
                            </div>
                            <div className={styles.reporterStats}>
                                Khoảng cách gửi: <strong>{currentReport.reporter.distanceM}m</strong>{" "}
                                • Uy tín:{" "}
                                <strong>
                                    {Math.round(
                                        ((currentReport.reporter.approvedCount + 1) /
                                            (currentReport.reporter.totalCount + 2)) *
                                            100
                                    )}
                                    %
                                </strong>{" "}
                                ({currentReport.reporter.approvedCount}/{currentReport.reporter.totalCount}{" "}
                                duyệt)
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className={styles.manageUserBtn}
                        onClick={() => handleOpenWarnModal(currentReport.reporter.name)}
                    >
                        ⚠️ Cảnh cáo user
                    </button>
                </div>

                <div className={styles.photoContainer}>
                    <img
                        src={currentReport.imageUrl}
                        alt="Hiện trường sự cố"
                        className={styles.photoImg}
                    />
                </div>

                <div style={{ fontSize: 14, color: "#202124", lineHeight: 1.5, marginBottom: 16 }}>
                    <strong>Mô tả của người dân:</strong> {currentReport.description}
                </div>

                <div className={styles.aiBox}>
                    <div className={styles.aiHeader}>
                        <div className={styles.aiTitle}>
                            <span>🤖 Đánh giá từ AI (v2.3)</span>
                            <span
                                className={`${styles.aiVerdictChip} ${
                                    currentReport.ai.verdict === "MATCH"
                                        ? styles.chipMatch
                                        : currentReport.ai.verdict === "MISMATCH"
                                        ? styles.chipMismatch
                                        : styles.chipUnsure
                                }`}
                            >
                                {currentReport.ai.verdict}
                            </span>
                        </div>
                        <span className={styles.aiScore}>
                            Độ tin cậy: {Math.round(currentReport.ai.confidence * 100)}%
                        </span>
                    </div>
                    <p className={styles.aiReason}>
                        <strong>Lý do AI phân tích:</strong> {currentReport.ai.reason}
                    </p>
                </div>

                <div className={styles.actionRow}>
                    <button
                        type="button"
                        className={styles.approveBtn}
                        onClick={() => handleApprove(currentReport.id)}
                    >
                        ✓ Duyệt xuất bản sự cố
                    </button>
                    <button
                        type="button"
                        className={styles.rejectBtn}
                        onClick={() => setRejectModalOpen(true)}
                    >
                        ✕ Từ chối báo cáo
                    </button>
                    <button
                        type="button"
                        className={styles.mergeBtn}
                        onClick={handleOpenMergeModal}
                        title="Đối chiếu và gộp vào một sự cố đang có sẵn lân cận"
                    >
                        🔗 Gộp vào sự cố gần đó
                    </button>
                </div>
            </div>
        </main>
    ) : (
        <div style={{ flex: 1, padding: 32, textAlign: "center", color: "#5f6368" }}>
            Chọn một báo cáo ở danh sách bên trái để kiểm duyệt
        </div>
    );

    // Giao diện tab Quản lý người dùng thường của Moderator
    const normalUsersSection = (
        <div className={styles.userListSection}>
            <div className={styles.tableCard}>
                <div className={styles.tableHeaderBar}>
                    <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>
                            Danh sách Người dùng thường (Users)
                        </h3>
                        <div className={styles.tableNotice}>
                            🛡️ <em>Quy định phân quyền:</em> Moderator chỉ có thẩm quyền chế tài (Cảnh cáo / Khóa tạm thời) đối với tài khoản <strong>User thường</strong> nhằm chống spam. Không có quyền can thiệp vào tài khoản Moderator khác hoặc Admin.
                        </div>
                    </div>
                </div>

                <table className={styles.userTable}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ và tên</th>
                            <th>Email</th>
                            <th>Tổng báo cáo</th>
                            <th>Duyệt / Từ chối</th>
                            <th>Tỉ lệ uy tín</th>
                            <th>Trạng thái</th>
                            <th>Thao tác Moderator</th>
                        </tr>
                    </thead>
                    <tbody>
                        {normalUsers.map((u) => {
                            const score = Math.round(
                                ((u.approvedReports + 1) / (u.totalReports + 2)) * 100
                            );
                            return (
                                <tr key={u.id}>
                                    <td>#{u.id}</td>
                                    <td><strong>{u.name}</strong></td>
                                    <td>{u.email}</td>
                                    <td>{u.totalReports}</td>
                                    <td>
                                        <span style={{ color: "#188038", fontWeight: 600 }}>{u.approvedReports}</span> /{" "}
                                        <span style={{ color: "#d93025", fontWeight: 600 }}>{u.rejectedReports}</span>
                                    </td>
                                    <td>
                                        <strong>{score}%</strong>
                                    </td>
                                    <td>
                                        <span
                                            className={
                                                u.status === "ACTIVE"
                                                    ? styles.statusActive
                                                    : styles.statusBanned
                                            }
                                        >
                                            {u.status === "ACTIVE" ? "Hoạt động" : "Đã bị khóa"}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={styles.btnWarn}
                                            onClick={() => handleOpenWarnModal(u.name)}
                                        >
                                            Cảnh cáo
                                        </button>
                                        {u.status === "ACTIVE" ? (
                                            <button
                                                type="button"
                                                className={styles.btnBan}
                                                onClick={() => handleToggleBanUser(u.id)}
                                            >
                                                Khóa tài khoản
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={styles.btnUnban}
                                                onClick={() => handleToggleBanUser(u.id)}
                                            >
                                                Mở khóa
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // Hộp thoại modal chọn lý do khi bấm từ chối báo cáo
    const rejectReasonModal = rejectModalOpen && (
        <div className={styles.rejectModalOverlay} onClick={() => setRejectModalOpen(false)}>
            <div className={styles.rejectModal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.rejectModalTitle}>Từ chối báo cáo #{currentReport?.id}</h3>
                <p style={{ fontSize: 13, color: "#5f6368", marginTop: 0, marginBottom: 12 }}>
                    Lý do này sẽ được lưu vào hệ thống và gửi thông báo trực tiếp đến người dùng theo thiết kế v2.9.
                </p>

                <select
                    className={`${styles.reasonSelect} ${styles.rejectSelect}`}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                >
                    <option value="Ảnh không trùng khớp hiện trường">Ảnh không trùng khớp hiện trường</option>
                    <option value="Tọa độ GPS gửi quá xa vị trí sự cố">Tọa độ GPS gửi quá xa vị trí sự cố</option>
                    <option value="Thông tin báo cáo sai lệch hoặc spam">Thông tin báo cáo sai lệch hoặc spam</option>
                    <option value="Hình ảnh mờ, không xác định được sự cố">Hình ảnh mờ, không xác định được sự cố</option>
                    <option value="OTHER">Lý do khác...</option>
                </select>

                {rejectReason === "OTHER" && (
                    <textarea
                        className={styles.rejectReasonInput}
                        placeholder="Nhập lý do từ chối cụ thể..."
                        value={customRejectReason}
                        onChange={(e) => setCustomRejectReason(e.target.value)}
                        autoFocus
                    />
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        style={{
                            height: 36,
                            padding: "0 14px",
                            border: "1px solid #dadce0",
                            background: "#fff",
                            borderRadius: 8,
                            cursor: "pointer",
                        }}
                        onClick={() => setRejectModalOpen(false)}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        style={{
                            height: 36,
                            padding: "0 16px",
                            border: "none",
                            background: "#d93025",
                            color: "#fff",
                            fontWeight: 600,
                            borderRadius: 8,
                            cursor: "pointer",
                        }}
                        onClick={handleRejectConfirm}
                    >
                        Xác nhận từ chối
                    </button>
                </div>
            </div>
        </div>
    );

    // Hộp thoại modal đối chiếu và chọn sự cố lân cận để gộp báo cáo
    const mergeIncidentModal = mergeModalOpen && currentReport && (
        <div className={styles.rejectModalOverlay} onClick={() => setMergeModalOpen(false)}>
            <div className={styles.mergeModal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.mergeModalTitle}>
                    <span>🔗 Đối chiếu & Gộp Báo cáo vào Sự cố gần đó</span>
                </h3>
                <p className={styles.mergeSubtitle}>
                    Theo quy tắc v2.9: Các báo cáo cùng loại, cùng đoạn đường hoặc cách dưới 300m trong vòng 24h sẽ được gộp chung để tăng điểm tin cậy và tránh rác bản đồ.
                </p>

                <div className={styles.currentReportBox}>
                    <div>
                        <strong>Báo cáo #{currentReport.id}:</strong> {currentReport.type} — {currentReport.street} ({currentReport.ward})
                    </div>
                    <div style={{ fontSize: 12, color: "#5f6368", marginTop: 2 }}>
                        Người gửi: {currentReport.reporter.name} ({currentReport.timeAgo}) • <em>"{currentReport.description}"</em>
                    </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: "#202124", marginBottom: 8 }}>
                    Chọn sự cố đang có sẵn trên bản đồ để tiếp nhận báo cáo này:
                </div>

                <div className={styles.candidateList}>
                    {candidateIncidents.length === 0 ? (
                        <div style={{ padding: 20, textAlign: "center", color: "#70757a", fontSize: 13 }}>
                            Không tìm thấy sự cố nào trong bán kính 300m phù hợp để gộp.
                        </div>
                    ) : (
                        candidateIncidents.map((cand) => {
                            const isSelected = selectedCandidateId === cand.id;
                            return (
                                <div
                                    key={cand.id}
                                    className={`${styles.candidateCard} ${
                                        isSelected ? styles.candidateCardActive : ""
                                    }`}
                                    onClick={() => setSelectedCandidateId(cand.id)}
                                >
                                    <input
                                        type="radio"
                                        name="mergeTarget"
                                        className={styles.candidateRadio}
                                        checked={isSelected}
                                        onChange={() => setSelectedCandidateId(cand.id)}
                                    />
                                    <div className={styles.candidateBody}>
                                        <div className={styles.candidateTop}>
                                            <span className={styles.candidateCode}>#{cand.code}</span>
                                            <span className={styles.candidateDistance}>
                                                Cách {cand.distanceM}m
                                            </span>
                                        </div>
                                        <div className={styles.candidateTitle}>{cand.title}</div>
                                        <div className={styles.candidateMeta}>
                                            📍 {cand.location} • {cand.timeAgo}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: "#188038", fontWeight: 500, marginTop: 4 }}>
                                            Nguồn: {cand.source} • Đã có {cand.mergedReportsCount} báo cáo xác nhận
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        style={{
                            height: 38,
                            padding: "0 16px",
                            border: "1px solid #dadce0",
                            background: "#fff",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                        onClick={() => setMergeModalOpen(false)}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        style={{
                            height: 38,
                            padding: "0 18px",
                            border: "none",
                            background: selectedCandidateId ? "#1a73e8" : "#ccc",
                            color: "#fff",
                            fontWeight: 600,
                            borderRadius: 8,
                            cursor: selectedCandidateId ? "pointer" : "not-allowed",
                            fontSize: 13,
                        }}
                        disabled={!selectedCandidateId}
                        onClick={handleConfirmMerge}
                    >
                        Xác nhận gộp vào sự cố đã chọn
                    </button>
                </div>
            </div>
        </div>
    );

    // Hộp thoại modal chọn lý do khi cảnh cáo người dùng
    const warnUserModal = warnModalOpen && (
        <div className={styles.rejectModalOverlay} onClick={() => setWarnModalOpen(false)}>
            <div className={styles.rejectModal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.warnModalTitle}>⚠️ Cảnh cáo Người dùng: {warnTargetUser}</h3>
                <p style={{ fontSize: 13, color: "#5f6368", marginTop: 0, marginBottom: 12 }}>
                    Chọn lý do vi phạm để gửi thông báo cảnh cáo chính thức đến tài khoản này.
                </p>

                <select
                    className={`${styles.reasonSelect} ${styles.warnSelect}`}
                    value={warnReason}
                    onChange={(e) => setWarnReason(e.target.value)}
                >
                    <option value="Gửi ảnh chụp không đúng hoặc che khuất hiện trường">
                        Gửi ảnh chụp không đúng hoặc che khuất hiện trường
                    </option>
                    <option value="Báo cáo thông tin sai lệch / tin giả mạo">
                        Báo cáo thông tin sai lệch / tin giả mạo
                    </option>
                    <option value="Tọa độ GPS gửi quá xa vị trí sự cố thực tế">
                        Tọa độ GPS gửi quá xa vị trí sự cố thực tế
                    </option>
                    <option value="Nội dung mô tả không phù hợp quy định cộng đồng">
                        Nội dung mô tả không phù hợp quy định cộng đồng
                    </option>
                    <option value="Spam liên tục nhiều báo cáo trùng lặp">
                        Spam liên tục nhiều báo cáo trùng lặp
                    </option>
                    <option value="OTHER">Lý do khác...</option>
                </select>

                {warnReason === "OTHER" && (
                    <textarea
                        className={styles.warnReasonInput}
                        placeholder="Nhập lý do cảnh cáo cụ thể..."
                        value={customWarnReason}
                        onChange={(e) => setCustomWarnReason(e.target.value)}
                        autoFocus
                    />
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                        type="button"
                        style={{
                            height: 36,
                            padding: "0 14px",
                            border: "1px solid #dadce0",
                            background: "#fff",
                            borderRadius: 8,
                            cursor: "pointer",
                        }}
                        onClick={() => setWarnModalOpen(false)}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        style={{
                            height: 36,
                            padding: "0 16px",
                            border: "none",
                            background: "#f9ab00",
                            color: "#202124",
                            fontWeight: 600,
                            borderRadius: 8,
                            cursor: "pointer",
                        }}
                        onClick={handleConfirmWarn}
                    >
                        Xác nhận gửi cảnh cáo
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            {headerElement}
            {toastElement}

            {tab === "QUEUE" ? (
                <div className={styles.content}>
                    {queueListPanel}
                    {reportDetailPanel}
                </div>
            ) : (
                normalUsersSection
            )}

            {rejectReasonModal}
            {mergeIncidentModal}
            {warnUserModal}
        </div>
    );
}
