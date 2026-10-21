export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IncidentType = "ACCIDENT" | "ROBBERY" | "ASSAULT" | "NATURAL_DISASTER" | "OTHER";
export type IncidentStatus = "PENDING" | "VERIFIED" | "REJECTED" | "RESOLVED";

export interface LineString {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat]
}

export interface RoadSegment {
    id: number;
    street_id: number;
    ward_id: number | null;
    segment_order: number;
    length_m: number;
    road_class: string;
    road_shape: LineString;
}

export interface DangerScore {
    id: number;
    segment_id: number;
    score: number;
    confidence_level: number;
    incident_count: number;
    calculated_at: string;
}

export interface Incident {
    id: number;
    house_number: string | null;
    street_id: number;
    neighborhood: string | null;
    segment_id: number | null;
    location_precision: "EXACT" | "STREET";
    description: string;
    severity: IncidentSeverity;
    type: IncidentType;
    status: IncidentStatus;
    latitude: number;
    longitude: number;
    occurred_at: string;
}