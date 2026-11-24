import L from "leaflet";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";
import { createLayerComponent } from "@react-leaflet/core";

// Vite không tự đặt đúng file worker cho maplibre-gl, nên chỉ đường dẫn thủ công
setWorkerUrl(workerUrl);

interface Props {
    style: string;
    attribution?: string;
}

const MapLibreLayer = createLayerComponent<L.Layer, Props>(
    ({ style, attribution }, ctx) => {
        const layer = L.maplibreGL({ style, attribution } as any);

        layer.on("add", () => {
            layer
                .getMaplibreMap()
                .on("error", (e) => console.error("MapLibre error:", e.error ?? e));
        });

        return { instance: layer, context: ctx };
    },
);

export default MapLibreLayer;