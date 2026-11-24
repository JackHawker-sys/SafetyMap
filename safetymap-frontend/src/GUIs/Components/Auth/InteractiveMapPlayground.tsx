import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../Context/LanguageContext";
import styles from "../../../assets/styles/InteractiveMapPlayground.module.css";

type RouteType = "DIRECT" | "BALANCED" | "NORTH_SAFE" | "SOUTH_MAX_SAFE";

interface RoadSegment {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    midX: number;
    midY: number;
    score: number;
    color: string;
    statusKey: "segSafeText" | "segVerySafeText" | "segModerateText" | "segDangerText";
    descKey: string;
}

interface MapZone {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fillColor: string;
    strokeColor: string;
    score: number;
    isPark?: boolean;
    adjacentTo: RouteType[];
}

interface PointCalloutData {
    x: number;
    y: number;
    title: string;
    score: number;
    color: string;
    description: string;
}

interface ZoneModalData {
    score: number;
    color: string;
    statusText: string;
    description: string;
}

const I18N = {
    vi: {
        appTitle: "S.A.F.E.R",
        appGoal: "BẢN ĐỒ CHỈ ĐƯỜNG AN TOÀN",
        appMission: "Hệ thống định vị & dẫn đường thông minh né tránh các phân đoạn nguy hiểm",
        legendTitle: "Mức an toàn:",
        legendSafe: "An toàn (>80%)",
        legendModerate: "Trung bình (50-80%)",
        legendDanger: "Nguy hiểm (<50%)",
        pointAccident: "NGUY HIỂM CAO",
        pointModerate: "MỨC ĐỘ VỪA",
        pointSafe: "AN TOÀN",
        pointScorePrefix: "Độ an toàn:",
        zoneModalTitle: "MỨC AN TOÀN KHU VỰC",
        zoneHighSafety: "AN TOÀN CAO",
        zoneCaution: "THẬN TRỌNG",
        zoneAdjacentDesc: "Vùng kề cận hành lang chỉ dẫn. Có camera và cảm biến giám sát.",
        zoneNonAdjacentDesc: "Vùng đô thị nằm ngoài hành lang di chuyển.",
        sliderLabel: "Độ an toàn tối thiểu:",
        telemetryNameDirect: "Tuyến Trực Tiếp",
        telemetryDirectPassed: "Có đoạn nguy hiểm",
        telemetryNameBalanced: "Tuyến Vượt Phố",
        telemetryBalancedAvoided: "Đã né đoạn nguy hiểm",
        telemetryNameNorth: "Tuyến Ven Sông",
        telemetryNorthAvoided: "Tuyến an toàn",
        telemetryNameMax: "Tuyến Đại Lộ",
        telemetryMaxAvoided: "An toàn tối đa",
        telemetryScoreLabel: "AN TOÀN",
        telemetryCurrentPrefix: "Đang đi:",
        btnPause: "Tạm dừng",
        btnResume: "Tiếp tục",
        segSafeText: "An toàn",
        segVerySafeText: "Rất an toàn",
        segModerateText: "Mức độ vừa",
        segDangerText: "Nguy hiểm",
        segWbotDesc: "Phân đoạn xuất phát an toàn, đường nội bộ lưu thông tốc độ thấp, thông thoáng.",
        segWtopDesc: "Tuyến nhánh phía Tây, lưu lượng phương tiện thưa thớt, không có điểm mù xung đột.",
        segM1Desc: "Phân đoạn trung tâm mật độ phương tiện đông đúc, từng ghi nhận va chạm ban đêm.",
        segM2Desc: "Đoạn đường nguy cơ cao: thường xuyên xảy ra va chạm tại nút giao. Tuyến an toàn sẽ né.",
        segCtopDesc: "Trục trung tâm cắt ngang, có dải phân cách cứng, lưu ý vào khung giờ cao điểm.",
        segN1Desc: "Phân đoạn ven sông phía Bắc, tầm nhìn thoáng đãng, lưu thông êm ái.",
        segN2Desc: "Phân đoạn kết nối nút giao phía Đông Bắc, chất lượng mặt đường tốt, an toàn cao.",
        segS1Desc: "Phân đoạn đại lộ phía Nam an toàn cao, mặt đường rộng 4 làn xe, đèn đường đầy đủ.",
        segS2Desc: "Phân đoạn đại lộ lưu thông thông suốt, có camera giám sát thông minh 24/7.",
        segEbotDesc: "Tuyến đường trục chính thông thoáng, vỉa hè rộng, mật độ giao thông ổn định.",
        segEtopDesc: "Phân đoạn về đích an toàn, tầm nhìn xa rõ ràng, không có vật cản giao thông.",
    },
    en: {
        appTitle: "S.A.F.E.R",
        appGoal: "SAFE NAVIGATION MAP",
        appMission: "Smart navigation prioritizing safe segments and bypassing high-risk areas",
        legendTitle: "Safety level:",
        legendSafe: "Safe (>80%)",
        legendModerate: "Moderate (50-80%)",
        legendDanger: "Dangerous (<50%)",
        pointAccident: "HIGH RISK",
        pointModerate: "MODERATE",
        pointSafe: "SAFE",
        pointScorePrefix: "Safety score:",
        zoneModalTitle: "AREA SAFETY SCORE",
        zoneHighSafety: "HIGH SAFETY",
        zoneCaution: "CAUTION",
        zoneAdjacentDesc: "Adjacent area along route corridor with active monitoring.",
        zoneNonAdjacentDesc: "Urban zone located outside recommended corridor.",
        sliderLabel: "Minimum safety:",
        telemetryNameDirect: "Direct Route",
        telemetryDirectPassed: "Contains hazard",
        telemetryNameBalanced: "Cross-Town Route",
        telemetryBalancedAvoided: "Avoids hazard",
        telemetryNameNorth: "Riverside Route",
        telemetryNorthAvoided: "Safe route",
        telemetryNameMax: "Boulevard Route",
        telemetryMaxAvoided: "Maximum safety",
        telemetryScoreLabel: "SAFETY",
        telemetryCurrentPrefix: "Current:",
        btnPause: "Pause",
        btnResume: "Resume",
        segSafeText: "Safe",
        segVerySafeText: "Very Safe",
        segModerateText: "Moderate",
        segDangerText: "Dangerous",
        segWbotDesc: "Safe departure segment, low-speed internal residential street, clear traffic.",
        segWtopDesc: "Western branch street, light traffic volume, zero hazardous blindspots.",
        segM1Desc: "Dense vehicle flow, moderate lighting, minor nighttime collisions recorded.",
        segM2Desc: "High collision risk: frequent intersection accidents. High-safety routes divert.",
        segCtopDesc: "Central cross arterial, physical median divider, peak-hour caution advised.",
        segN1Desc: "Northern riverside segment, wide panoramic view, smooth orderly traffic.",
        segN2Desc: "Northeast junction connecting segment, good road pavement, high safety.",
        segS1Desc: "High safety southern boulevard segment, 4-lane wide street, well lit.",
        segS2Desc: "Smooth boulevard segment with smart 24/7 security monitoring.",
        segEbotDesc: "Clear arterial route, wide sidewalks, stable traffic density.",
        segEtopDesc: "Safe destination arrival segment, clear visibility, unobstructed.",
    },
};

// ============================================================================
// ĐOẠN ĐƯỜNG RIÊNG BIỆT (Mỗi đoạn có điểm an toàn & tọa độ riêng)
// ============================================================================
const SEG_W_BOT: RoadSegment = {
    id: "seg_w_bot",
    x1: 120,
    y1: 335,
    x2: 120,
    y2: 210,
    midX: 120,
    midY: 272,
    score: 94,
    color: "#10b981",
    statusKey: "segSafeText",
    descKey: "segWbotDesc",
};

const SEG_W_TOP: RoadSegment = {
    id: "seg_w_top",
    x1: 120,
    y1: 210,
    x2: 120,
    y2: 85,
    midX: 120,
    midY: 147,
    score: 90,
    color: "#10b981",
    statusKey: "segSafeText",
    descKey: "segWtopDesc",
};

const SEG_M1: RoadSegment = {
    id: "seg_m1",
    x1: 120,
    y1: 210,
    x2: 280,
    y2: 210,
    midX: 200,
    midY: 210,
    score: 68,
    color: "#f59e0b",
    statusKey: "segModerateText",
    descKey: "segM1Desc",
};

const SEG_M2: RoadSegment = {
    id: "seg_m2",
    x1: 280,
    y1: 210,
    x2: 450,
    y2: 210,
    midX: 365,
    midY: 210,
    score: 32,
    color: "#ef4444",
    statusKey: "segDangerText",
    descKey: "segM2Desc",
};

const SEG_C_TOP: RoadSegment = {
    id: "seg_c_top",
    x1: 280,
    y1: 210,
    x2: 280,
    y2: 85,
    midX: 280,
    midY: 147,
    score: 74,
    color: "#f59e0b",
    statusKey: "segModerateText",
    descKey: "segCtopDesc",
};

const SEG_N1: RoadSegment = {
    id: "seg_n1",
    x1: 120,
    y1: 85,
    x2: 280,
    y2: 85,
    midX: 200,
    midY: 85,
    score: 88,
    color: "#10b981",
    statusKey: "segSafeText",
    descKey: "segN1Desc",
};

const SEG_N2: RoadSegment = {
    id: "seg_n2",
    x1: 280,
    y1: 85,
    x2: 450,
    y2: 85,
    midX: 365,
    midY: 85,
    score: 94,
    color: "#10b981",
    statusKey: "segSafeText",
    descKey: "segN2Desc",
};

const SEG_S1: RoadSegment = {
    id: "seg_s1",
    x1: 120,
    y1: 335,
    x2: 280,
    y2: 335,
    midX: 200,
    midY: 335,
    score: 96,
    color: "#10b981",
    statusKey: "segVerySafeText",
    descKey: "segS1Desc",
};

const SEG_S2: RoadSegment = {
    id: "seg_s2",
    x1: 280,
    y1: 335,
    x2: 450,
    y2: 335,
    midX: 365,
    midY: 335,
    score: 98,
    color: "#10b981",
    statusKey: "segVerySafeText",
    descKey: "segS2Desc",
};

const SEG_E_BOT: RoadSegment = {
    id: "seg_e_bot",
    x1: 450,
    y1: 335,
    x2: 450,
    y2: 210,
    midX: 450,
    midY: 272,
    score: 95,
    color: "#10b981",
    statusKey: "segSafeText",
    descKey: "segEbotDesc",
};

const SEG_E_TOP: RoadSegment = {
    id: "seg_e_top",
    x1: 450,
    y1: 210,
    x2: 450,
    y2: 85,
    midX: 450,
    midY: 147,
    score: 97,
    color: "#10b981",
    statusKey: "segSafeText",
    descKey: "segEtopDesc",
};

// ============================================================================
// 4 TUYẾN ĐƯỜNG TĨNH TƯƠNG ỨNG VỚI CÁC MỨC SLIDER (Không cần tính toán động)
// Chiều dài mỗi tuyến đều chính xác 580px -> Avatar chạy đều nhịp nhàng 60fps
// ============================================================================
const ROUTE_CONFIGS: Record<RouteType, {
    id: RouteType;
    minSafety: number;
    overallScore: number;
    distance: string;
    animSpeed: number;
    color: string;
    nameKey: "telemetryNameDirect" | "telemetryNameBalanced" | "telemetryNameNorth" | "telemetryNameMax";
    avoidNoteKey: "telemetryDirectPassed" | "telemetryBalancedAvoided" | "telemetryNorthAvoided" | "telemetryMaxAvoided";
    segments: RoadSegment[];
}> = {
    DIRECT: {
        id: "DIRECT",
        minSafety: 32,
        overallScore: 42,
        distance: "1.8 km",
        animSpeed: 0.013,
        color: "#ef4444",
        nameKey: "telemetryNameDirect",
        avoidNoteKey: "telemetryDirectPassed",
        segments: [SEG_W_BOT, SEG_M1, SEG_M2, SEG_E_TOP],
    },
    BALANCED: {
        id: "BALANCED",
        minSafety: 68,
        overallScore: 82,
        distance: "2.1 km",
        animSpeed: 0.011,
        color: "#f59e0b",
        nameKey: "telemetryNameBalanced",
        avoidNoteKey: "telemetryBalancedAvoided",
        segments: [SEG_W_BOT, SEG_M1, SEG_C_TOP, SEG_N2],
    },
    NORTH_SAFE: {
        id: "NORTH_SAFE",
        minSafety: 88,
        overallScore: 92,
        distance: "2.4 km",
        animSpeed: 0.0098,
        color: "#10b981",
        nameKey: "telemetryNameNorth",
        avoidNoteKey: "telemetryNorthAvoided",
        segments: [SEG_W_BOT, SEG_W_TOP, SEG_N1, SEG_N2],
    },
    SOUTH_MAX_SAFE: {
        id: "SOUTH_MAX_SAFE",
        minSafety: 95,
        overallScore: 97,
        distance: "2.7 km",
        animSpeed: 0.0088,
        color: "#10b981",
        nameKey: "telemetryNameMax",
        avoidNoteKey: "telemetryMaxAvoided",
        segments: [SEG_S1, SEG_S2, SEG_E_BOT, SEG_E_TOP],
    },
};

// ============================================================================
// CÁC VÙNG (ZONES)
// Điểm của vùng = trung bình các đoạn đường quanh nó (đã gán tĩnh, cực nhẹ)
// ============================================================================
const MAP_ZONES: MapZone[] = [
    {
        id: "zone-nw",
        x: 135,
        y: 98,
        width: 130,
        height: 98,
        fillColor: "#0a2a1f",
        strokeColor: "rgba(16, 185, 129, 0.4)",
        score: 80, // (90 + 88 + 74 + 68) / 4 = 80
        adjacentTo: ["DIRECT", "BALANCED", "NORTH_SAFE"],
    },
    {
        id: "zone-ne",
        x: 295,
        y: 98,
        width: 140,
        height: 98,
        fillColor: "#2a1e0b",
        strokeColor: "rgba(245, 158, 11, 0.45)",
        score: 74, // (74 + 94 + 97 + 32) / 4 = 74.25
        adjacentTo: ["DIRECT", "BALANCED", "NORTH_SAFE", "SOUTH_MAX_SAFE"],
    },
    {
        id: "zone-park",
        x: 135,
        y: 224,
        width: 130,
        height: 98,
        fillColor: "#064e3b",
        strokeColor: "rgba(16, 185, 129, 0.5)",
        score: 86, // (94 + 68 + 86 + 96) / 4 = 86
        isPark: true,
        adjacentTo: ["DIRECT", "BALANCED", "NORTH_SAFE", "SOUTH_MAX_SAFE"],
    },
    {
        id: "zone-se",
        x: 295,
        y: 224,
        width: 140,
        height: 98,
        fillColor: "#2a1e0b",
        strokeColor: "rgba(245, 158, 11, 0.45)",
        score: 78, // (86 + 32 + 95 + 98) / 4 = 77.75
        adjacentTo: ["DIRECT", "SOUTH_MAX_SAFE"],
    },
    {
        id: "zone-w-top",
        x: 35,
        y: 98,
        width: 70,
        height: 98,
        fillColor: "#0a2a1f",
        strokeColor: "rgba(16, 185, 129, 0.35)",
        score: 89,
        adjacentTo: ["NORTH_SAFE"],
    },
    {
        id: "zone-w-bot",
        x: 35,
        y: 224,
        width: 70,
        height: 98,
        fillColor: "#0a2a1f",
        strokeColor: "rgba(16, 185, 129, 0.35)",
        score: 92,
        adjacentTo: ["DIRECT", "BALANCED", "NORTH_SAFE"],
    },
    {
        id: "zone-e-top",
        x: 465,
        y: 98,
        width: 105,
        height: 98,
        fillColor: "#0a2a1f",
        strokeColor: "rgba(16, 185, 129, 0.35)",
        score: 96,
        adjacentTo: ["DIRECT", "BALANCED", "NORTH_SAFE", "SOUTH_MAX_SAFE"],
    },
    {
        id: "zone-e-bot",
        x: 465,
        y: 224,
        width: 105,
        height: 98,
        fillColor: "#0a2a1f",
        strokeColor: "rgba(16, 185, 129, 0.35)",
        score: 94,
        adjacentTo: ["SOUTH_MAX_SAFE"],
    },
];

function getRouteTypeByThreshold(threshold: number): RouteType {
    if (threshold <= 42) return "DIRECT";
    if (threshold <= 82) return "BALANCED";
    if (threshold <= 92) return "NORTH_SAFE";
    return "SOUTH_MAX_SAFE";
}

export default function InteractiveMapPlayground() {
    const { lang } = useLanguage();
    const str = I18N[lang] || I18N.vi;

    // Slider phần trăm an toàn tối thiểu (30% -> 95%)
    const [minSafetyThreshold, setMinSafetyThreshold] = useState<number>(85);
    const [isNavigating, setIsNavigating] = useState(true);
    const [progress, setProgress] = useState(0);

    // Callout có đầu nhọn (khi click vào điểm marker)
    const [pointCallout, setPointCallout] = useState<PointCalloutData | null>(null);

    // Modal cố định ở giữa (khi click vào 1 vùng)
    const [zoneModal, setZoneModal] = useState<ZoneModalData | null>(null);

    const animRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    const activeRouteType = getRouteTypeByThreshold(minSafetyThreshold);
    const activeConfig = ROUTE_CONFIGS[activeRouteType];
    const activeSegments = activeConfig.segments;

    const animSpeedRef = useRef(activeConfig.animSpeed);
    useEffect(() => {
        animSpeedRef.current = activeConfig.animSpeed;
    }, [activeConfig.animSpeed]);

    // Smooth movement loop along strictly orthogonal road lines
    useEffect(() => {
        lastTimeRef.current = performance.now();

        function step(now: number) {
            const dt = now - lastTimeRef.current;
            lastTimeRef.current = now;

            if (isNavigating) {
                setProgress((prev) => {
                    const next = prev + dt * animSpeedRef.current;
                    return next >= 100 ? 0 : next;
                });
            }
            animRef.current = requestAnimationFrame(step);
        }

        animRef.current = requestAnimationFrame(step);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [isNavigating]);

    // Vị trí avatar trên các tuyến vuông góc chuẩn xác
    function getAvatarPos(pct: number, routeType: RouteType): { x: number; y: number; currentSeg: RoadSegment } {
        const t = pct / 100;
        const segs = ROUTE_CONFIGS[routeType].segments;

        if (routeType === "SOUTH_MAX_SAFE") {
            // [S1 (len 160), S2 (len 170), E_bot (len 125), E_top (len 125)]
            if (t <= 0.2759) {
                const s = t / 0.2759;
                return { x: 120 + 160 * s, y: 335, currentSeg: segs[0] };
            } else if (t <= 0.5690) {
                const s = (t - 0.2759) / 0.2931;
                return { x: 280 + 170 * s, y: 335, currentSeg: segs[1] };
            } else if (t <= 0.7845) {
                const s = (t - 0.5690) / 0.2155;
                return { x: 450, y: 335 - 125 * s, currentSeg: segs[2] };
            } else {
                const s = (t - 0.7845) / 0.2155;
                return { x: 450, y: 210 - 125 * s, currentSeg: segs[3] };
            }
        } else if (routeType === "NORTH_SAFE") {
            // [W_bot (len 125), W_top (len 125), N1 (len 160), N2 (len 170)]
            if (t <= 0.2155) {
                const s = t / 0.2155;
                return { x: 120, y: 335 - 125 * s, currentSeg: segs[0] };
            } else if (t <= 0.4310) {
                const s = (t - 0.2155) / 0.2155;
                return { x: 120, y: 210 - 125 * s, currentSeg: segs[1] };
            } else if (t <= 0.7069) {
                const s = (t - 0.4310) / 0.2759;
                return { x: 120 + 160 * s, y: 85, currentSeg: segs[2] };
            } else {
                const s = (t - 0.7069) / 0.2931;
                return { x: 280 + 170 * s, y: 85, currentSeg: segs[3] };
            }
        } else if (routeType === "BALANCED") {
            // [W_bot (len 125), M1 (len 160), C_top (len 125), N2 (len 170)]
            if (t <= 0.2155) {
                const s = t / 0.2155;
                return { x: 120, y: 335 - 125 * s, currentSeg: segs[0] };
            } else if (t <= 0.4914) {
                const s = (t - 0.2155) / 0.2759;
                return { x: 120 + 160 * s, y: 210, currentSeg: segs[1] };
            } else if (t <= 0.7069) {
                const s = (t - 0.4914) / 0.2155;
                return { x: 280, y: 210 - 125 * s, currentSeg: segs[2] };
            } else {
                const s = (t - 0.7069) / 0.2931;
                return { x: 280 + 170 * s, y: 85, currentSeg: segs[3] };
            }
        } else {
            // DIRECT: [W_bot (len 125), M1 (len 160), M2 (len 170), E_top (len 125)]
            if (t <= 0.2155) {
                const s = t / 0.2155;
                return { x: 120, y: 335 - 125 * s, currentSeg: segs[0] };
            } else if (t <= 0.4914) {
                const s = (t - 0.2155) / 0.2759;
                return { x: 120 + 160 * s, y: 210, currentSeg: segs[1] };
            } else if (t <= 0.7845) {
                const s = (t - 0.4914) / 0.2931;
                return { x: 280 + 170 * s, y: 210, currentSeg: segs[2] };
            } else {
                const s = (t - 0.7845) / 0.2155;
                return { x: 450, y: 210 - 125 * s, currentSeg: segs[3] };
            }
        }
    }

    const { x: avatarX, y: avatarY, currentSeg } = getAvatarPos(progress, activeRouteType);

    // 1. Click vào ĐIỂM (Circle Marker): Hiện box có đầu nhọn chĩa vào điểm
    const openPointCallout = (seg: RoadSegment) => {
        setZoneModal(null);
        const title = seg.score < 50 ? str.pointAccident : seg.score < 80 ? str.pointModerate : str.pointSafe;
        const description = (str as Record<string, string>)[seg.descKey] || "";
        setPointCallout({
            x: seg.midX,
            y: seg.midY,
            title,
            score: seg.score,
            color: seg.color,
            description,
        });
    };

    // 2. Click vào VÙNG: Hiện pop up CỐ ĐỊNH Ở GIỮA báo độ an toàn
    const openZoneModal = (zone: MapZone, isAdjacent: boolean) => {
        setPointCallout(null);
        setZoneModal({
            score: zone.score,
            color: zone.score >= 80 ? "#10b981" : "#f59e0b",
            statusText: zone.score >= 80 ? str.zoneHighSafety : str.zoneCaution,
            description: isAdjacent ? str.zoneAdjacentDesc : str.zoneNonAdjacentDesc,
        });
    };

    // Tọa độ tính toán cho box có đầu nhọn trong SVG
    const calloutWidth = 240;
    const calloutHeight = 110;
    const isAbove = pointCallout ? pointCallout.y >= 125 : true;
    const boxX = pointCallout ? Math.max(16, Math.min(600 - calloutWidth - 16, pointCallout.x - calloutWidth / 2)) : 0;
    const boxY = pointCallout ? (isAbove ? pointCallout.y - calloutHeight - 10 : pointCallout.y + 12) : 0;
    const arrowLeft = pointCallout ? pointCallout.x - boxX : 0;

    return (
        <div className={styles.playgroundRoot}>
            {/* Header: Nổi bật Tên App và Mục Đích */}
            <div className={styles.mapHudHeader}>
                <div className={styles.brandContainer}>
                    <div className={styles.brandIconEmblem}>
                        <i className="fa-solid fa-shield-halved" />
                    </div>
                    <div className={styles.brandContent}>
                        <div className={styles.brandMainLine}>
                            <span className={styles.brandLogoName}>{str.appTitle}</span>
                            <span className={styles.brandDotDivider}>•</span>
                            <span className={styles.brandGoalHeading}>{str.appGoal}</span>
                        </div>
                        <div className={styles.brandMissionText}>
                            {str.appMission}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Interactive SVG Map Canvas */}
            <div className={styles.canvasContainer}>
                {/* Google Maps Style Safety Legend Header */}
                <div className={styles.safetyLegendBar}>
                    <span className={styles.legendTitle}>{str.legendTitle}</span>
                    <span className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: "#10b981" }} /> {str.legendSafe}
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: "#f59e0b" }} /> {str.legendModerate}
                    </span>
                    <span className={styles.legendItem}>
                        <span className={styles.legendDot} style={{ backgroundColor: "#ef4444" }} /> {str.legendDanger}
                    </span>
                </div>

                <svg
                    className={styles.mapSvg}
                    viewBox="0 0 600 420"
                    onClick={() => {
                        setPointCallout(null);
                        setZoneModal(null);
                    }}
                >
                    <defs>
                        {/* River Gradient */}
                        <linearGradient id="riverWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.45" />
                        </linearGradient>

                        {/* Subtle City Grid Pattern */}
                        <pattern id="cityGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                        </pattern>
                    </defs>

                    {/* Background Canvas */}
                    <rect width="600" height="420" fill="#090e1a" />
                    <rect width="600" height="420" fill="url(#cityGrid)" />

                    {/* VÙNG NƯỚC: Mép trên, tự nhiên, không chữ, thuần decor */}
                    <g pointerEvents="none">
                        <path
                            d="M 0 38 Q 150 18 300 35 T 600 22 L 600 0 L 0 0 Z"
                            fill="url(#riverWaterGrad)"
                        />
                        <path d="M 30 18 Q 75 14 120 18" stroke="rgba(186, 230, 253, 0.4)" strokeWidth="1" fill="none" />
                        <path d="M 180 22 Q 230 18 280 22" stroke="rgba(186, 230, 253, 0.4)" strokeWidth="1" fill="none" />
                        <path d="M 360 16 Q 420 12 480 16" stroke="rgba(186, 230, 253, 0.4)" strokeWidth="1" fill="none" />
                    </g>

                    {/* CÁC VÙNG (ZONES): CHỈ HIỂN THỊ MÀU CHO VÙNG KỀ VỚI ĐƯỜNG CHỈ DẪN */}
                    {MAP_ZONES.map((zone) => {
                        const isAdjacent = zone.adjacentTo.includes(activeRouteType);
                        return (
                            <g
                                key={zone.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openZoneModal(zone, isAdjacent);
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <rect
                                    x={zone.x}
                                    y={zone.y}
                                    width={zone.width}
                                    height={zone.height}
                                    rx="8"
                                    fill={isAdjacent ? zone.fillColor : "#131d31"}
                                    stroke={isAdjacent ? zone.strokeColor : "rgba(255,255,255,0.05)"}
                                    strokeWidth="1.2"
                                />

                                {zone.isPark && (
                                    <g pointerEvents="none" opacity={isAdjacent ? 1 : 0.4}>
                                        <circle cx="165" cy="255" r="15" fill="#059669" opacity="0.8" />
                                        <circle cx="200" cy="250" r="19" fill="#059669" opacity="0.85" />
                                        <circle cx="235" cy="268" r="14" fill="#059669" opacity="0.8" />
                                        <circle cx="178" cy="290" r="20" fill="#047857" opacity="0.9" />
                                        <circle cx="220" cy="290" r="16" fill="#047857" opacity="0.9" />
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* BASE ROAD NETWORK GRID */}
                    <line x1="20" y1="85" x2="580" y2="85" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
                    <line x1="20" y1="85" x2="580" y2="85" stroke="#0b1120" strokeWidth="14" strokeLinecap="round" />

                    <line x1="20" y1="210" x2="580" y2="210" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
                    <line x1="20" y1="210" x2="580" y2="210" stroke="#0b1120" strokeWidth="14" strokeLinecap="round" />

                    <line x1="20" y1="335" x2="580" y2="335" stroke="#1e293b" strokeWidth="22" strokeLinecap="round" />
                    <line x1="20" y1="335" x2="580" y2="335" stroke="#0b1120" strokeWidth="16" strokeLinecap="round" />

                    <line x1="120" y1="50" x2="120" y2="380" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
                    <line x1="120" y1="50" x2="120" y2="380" stroke="#0b1120" strokeWidth="14" strokeLinecap="round" />

                    <line x1="280" y1="50" x2="280" y2="380" stroke="#1e293b" strokeWidth="20" strokeLinecap="round" />
                    <line x1="280" y1="50" x2="280" y2="380" stroke="#0b1120" strokeWidth="14" strokeLinecap="round" />

                    <line x1="450" y1="50" x2="450" y2="380" stroke="#1e293b" strokeWidth="22" strokeLinecap="round" />
                    <line x1="450" y1="50" x2="450" y2="380" stroke="#0b1120" strokeWidth="16" strokeLinecap="round" />

                    {/* ACTIVE ROUTE SEGMENTS */}
                    {activeSegments.map((seg) => (
                        <g key={seg.id}>
                            <line
                                x1={seg.x1}
                                y1={seg.y1}
                                x2={seg.x2}
                                y2={seg.y2}
                                stroke={seg.color}
                                strokeWidth="7.5"
                                strokeLinecap="round"
                            />
                            <circle
                                cx={seg.midX}
                                cy={seg.midY}
                                r="7"
                                fill={seg.color}
                                stroke="#ffffff"
                                strokeWidth="2"
                                className={styles.segmentDot}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openPointCallout(seg);
                                }}
                                style={{ cursor: "pointer" }}
                            />
                        </g>
                    ))}

                    {/* Điểm xuất phát A: (120, 335) */}
                    <foreignObject x="104" y="319" width="32" height="32" pointerEvents="none">
                        <div className={styles.startBadge} title="Điểm xuất phát">
                            <i className="fa-solid fa-location-arrow" />
                        </div>
                    </foreignObject>

                    {/* Điểm đến B: (450, 85) */}
                    <foreignObject x="434" y="61" width="32" height="42" pointerEvents="none">
                        <div className={styles.destBadge} title="Điểm đến">
                            <i className="fa-solid fa-flag-checkered" />
                        </div>
                    </foreignObject>

                    {/* "Vị trí của tôi": Chấm định vị GPS xanh dương */}
                    <g transform={`translate(${avatarX}, ${avatarY})`} pointerEvents="none">
                        <circle r="16" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="1" className={styles.avatarRadar} />
                        <circle r="7.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                        <circle r="2.5" fill="#ffffff" />
                    </g>

                    {/* CALLOUT BOX CÓ ĐẦU NHỌN (CHỈ HIỆN KHI CLICK VÀO ĐIỂM) */}
                    {pointCallout && (
                        <foreignObject
                            x={boxX}
                            y={boxY}
                            width={calloutWidth}
                            height={calloutHeight}
                            style={{ overflow: "visible" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.pointedCalloutCard}>
                                <div className={styles.calloutHeader}>
                                    <span
                                        className={styles.calloutTitle}
                                        style={{
                                            color: pointCallout.score < 50 ? "#dc2626" : pointCallout.score < 80 ? "#d97706" : "#059669",
                                        }}
                                    >
                                        {pointCallout.title}
                                    </span>
                                    <button
                                        type="button"
                                        className={styles.calloutCloseBtn}
                                        onClick={() => setPointCallout(null)}
                                        title="Đóng"
                                    >
                                        <i className="fa-solid fa-xmark" />
                                    </button>
                                </div>
                                <div className={styles.calloutBody}>
                                    {pointCallout.description}
                                </div>
                                <div className={styles.calloutFooter}>
                                    <span className={styles.calloutScoreBadge} style={{ backgroundColor: pointCallout.color }}>
                                        {str.pointScorePrefix} {pointCallout.score}%
                                    </span>
                                </div>
                                <div
                                    className={isAbove ? styles.calloutArrowDown : styles.calloutArrowUp}
                                    style={{ left: `${arrowLeft}px` }}
                                />
                            </div>
                        </foreignObject>
                    )}
                </svg>

                {/* POP-UP CỐ ĐỊNH Ở GIỮA (KHI CLICK VÀO 1 VÙNG BẤT KỲ) */}
                {zoneModal && (
                    <div
                        className={styles.centeredZoneModal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.zoneModalHeader}>
                            <div className={styles.zoneModalTitleRow}>
                                <i className="fa-solid fa-shield-halved" style={{ color: zoneModal.color, marginRight: 8 }} />
                                <span>{str.zoneModalTitle}</span>
                            </div>
                            <button
                                type="button"
                                className={styles.zoneModalCloseBtn}
                                onClick={() => setZoneModal(null)}
                                title="Đóng"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>
                        <div className={styles.zoneModalBody}>
                            <div className={styles.zoneModalScoreRow}>
                                <span className={styles.zoneModalScoreBig} style={{ color: zoneModal.color }}>
                                    {zoneModal.score}%
                                </span>
                                <span className={styles.zoneModalBadge} style={{ backgroundColor: zoneModal.color }}>
                                    {zoneModal.statusText}
                                </span>
                            </div>
                            <p className={styles.zoneModalDesc}>
                                {zoneModal.description}
                            </p>
                        </div>
                    </div>
                )}

                {/* Floating Telemetry HUD Card on Map */}
                <div className={styles.telemetryCard}>
                    <div className={styles.telemetryHeader}>
                        <div
                            className={styles.telemetryShield}
                            style={{
                                backgroundColor: activeConfig.color === "#10b981"
                                    ? "rgba(16, 185, 129, 0.2)"
                                    : activeConfig.color === "#f59e0b"
                                    ? "rgba(245, 158, 11, 0.2)"
                                    : "rgba(239, 68, 68, 0.2)",
                                color: activeConfig.color,
                            }}
                        >
                            <i className={`fa-solid ${activeRouteType === "DIRECT" ? "fa-triangle-exclamation" : "fa-shield-halved"}`} />
                        </div>
                        <div className={styles.telemetryRouteName}>
                            {str[activeConfig.nameKey]}
                        </div>
                        <div className={styles.scoreGauge}>
                            <span
                                className={styles.scoreNumber}
                                style={{
                                    color: activeConfig.color,
                                    textShadow: `0 0 12px ${activeConfig.color}88`,
                                }}
                            >
                                {activeConfig.overallScore}%
                            </span>
                            <span className={styles.scoreUnit}>{str.telemetryScoreLabel}</span>
                        </div>
                    </div>

                    <div className={styles.telemetryMetricsRow}>
                        <div className={styles.telemetryMetric}>
                            <i className="fa-solid fa-location-dot" style={{ color: currentSeg.color }} />
                            <span>
                                {str.telemetryCurrentPrefix} <strong style={{ color: currentSeg.color }}>{currentSeg.score}%</strong>
                            </span>
                        </div>
                        <div className={styles.telemetryMetric}>
                            <i
                                className="fa-solid fa-shield-halved"
                                style={{ color: activeConfig.color }}
                            />
                            <span>{str[activeConfig.avoidNoteKey]}</span>
                        </div>
                        <div className={styles.telemetryMetric}>
                            <i className="fa-solid fa-route" style={{ color: "#38bdf8" }} />
                            <span>{activeConfig.distance}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Interactive Control Deck - Minimum Safety Slider */}
            <div className={styles.controlDeck}>
                <div className={styles.sliderControlContainer}>
                    <div className={styles.sliderHeaderRow}>
                        <div className={styles.sliderLabelGroup}>
                            <i className="fa-solid fa-sliders" style={{ color: "#38bdf8" }} />
                            <span className={styles.sliderLabel}>{str.sliderLabel}</span>
                            <span
                                className={styles.sliderValueBadge}
                                style={{
                                    backgroundColor: activeConfig.color,
                                    boxShadow: `0 0 12px ${activeConfig.color}66`,
                                }}
                            >
                                &ge; {minSafetyThreshold}%
                            </span>
                        </div>

                        <button
                            type="button"
                            className={`${styles.deckBtnPause} ${isNavigating ? styles.deckBtnRunning : ""}`}
                            onClick={() => setIsNavigating((prev) => !prev)}
                            title="Dừng lại hoặc tiếp tục di chuyển"
                        >
                            <i className={`fa-solid ${isNavigating ? "fa-pause" : "fa-play"}`} />
                            <span>{isNavigating ? str.btnPause : str.btnResume}</span>
                        </button>
                    </div>

                    <div className={styles.sliderInputWrapper}>
                        <input
                            type="range"
                            min="30"
                            max="95"
                            step="5"
                            value={minSafetyThreshold}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setMinSafetyThreshold(val);
                                setPointCallout(null);
                                setZoneModal(null);
                            }}
                            className={styles.safetySliderInput}
                            style={{
                                background: `linear-gradient(to right, ${activeConfig.color} 0%, ${activeConfig.color} ${((minSafetyThreshold - 30) / (95 - 30)) * 100}%, rgba(255,255,255,0.12) ${((minSafetyThreshold - 30) / (95 - 30)) * 100}%, rgba(255,255,255,0.12) 100%)`,
                            }}
                            aria-label={str.sliderLabel}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
