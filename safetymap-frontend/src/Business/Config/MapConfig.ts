import type { LatLngBoundsExpression } from "leaflet";

// Khung Việt Nam (gồm Hoàng Sa, Trường Sa)
export const VN_SOUTH_WEST: [number, number] = [7.0, 101.5];   // [lat, lng]
export const VN_NORTH_EAST: [number, number] = [24.0, 118.0];

export const VIETNAM_BOUNDS: LatLngBoundsExpression = [VN_SOUTH_WEST, VN_NORTH_EAST];

// Photon cần dạng minLng,minLat,maxLng,maxLat -> sinh ra từ cùng nguồn, không gõ lại số
export const VN_BBOX = [VN_SOUTH_WEST[1], VN_SOUTH_WEST[0], VN_NORTH_EAST[1], VN_NORTH_EAST[0]].join(",");

// Tâm mặc định: Phú Lợi (giai đoạn 1)
export const DEFAULT_CENTER: [number, number] = [10.9822, 106.6719];