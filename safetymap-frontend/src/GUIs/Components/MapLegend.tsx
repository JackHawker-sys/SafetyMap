import type { IncidentSeverity } from "../../Business/Models/MapModels";
import { DANGER_LEVELS } from "../../Business/Logic/DangerLevel";
import { SEVERITY_COLOR, SEVERITY_LABEL } from "../../Business/Logic/MapLogic";
import { useEffect, useRef } from "react";
import mapLegendStyle from '../../../public/assets/MapLegend.module.css';
import leaflet from "leaflet";

const SEVERITIES: IncidentSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Tạo chữ khoảng điểm từ chính mảng ngưỡng, không gõ tay số nào
function rangeText(index: number): string {
    const min = DANGER_LEVELS[index].minScore;
    if (index === 0) return `≥ ${min}`;
    const upper = DANGER_LEVELS[index - 1].minScore;
    return `${min} – ${upper - 1}`;
}

export default function MapLegend() {
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!boxRef.current) return;
        // Click / cuộn trên legend không được lọt xuống bản đồ
        leaflet.DomEvent.disableClickPropagation(boxRef.current);
        leaflet.DomEvent.disableScrollPropagation(boxRef.current);
    }, []);

    return (
        <div className="leaflet-bottom leaflet-right">
            <div ref={boxRef} className={`leaflet-control ${mapLegendStyle.boxStyle}`}>
                <div className={mapLegendStyle.titleStyle}>Mức nguy hiểm đoạn đường</div>
                {DANGER_LEVELS.map((lv, i) => (
                    <div key={lv.level} className={mapLegendStyle.rowStyle}>
                        <span className={mapLegendStyle.lineSwatch} style={{ background: lv.color }} />
                        {lv.label} ({rangeText(i)})
                    </div>
                ))}

                <div className={mapLegendStyle.titleStyle} style={{ marginTop: 8 }}>Sự cố</div>
                {SEVERITIES.map((s) => (
                    <div key={s} className={mapLegendStyle.rowStyle}>
                        <span className={mapLegendStyle.dotSwatch} style={{ background: SEVERITY_COLOR[s] }} />
                        {SEVERITY_LABEL[s]}
                    </div>
                ))}
            </div>
        </div>
    );
}