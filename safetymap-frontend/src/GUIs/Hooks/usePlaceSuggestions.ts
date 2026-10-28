import { useEffect, useState } from "react";
import { searchPlaces } from "../../Business/DAL/GeocodeApi";
import type { GeoPlace } from "../../Business/Models/MapModels";
import { useDebouncedValue } from "./useDebouncedValue";

const DEBOUNCE_MS = 400;

export function usePlaceSuggestions(query: string, nearLat?: number, nearLng?: number) {
    const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
    const [results, setResult] = useState<GeoPlace[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (debouncedQuery.trim().length < 3) {
            setResult([]);
            setLoading(false);
            setError(null);
            return;
        }

        const controller = new AbortController();
        setLoading(true);
        setError(null);

        searchPlaces(debouncedQuery, controller.signal, nearLat, nearLng)
            .then((places) => {
                if (!controller.signal.aborted)
                    setResult(places);
            })
            .catch((err) => {
                if (err.name === "AbortError" || controller.signal.aborted)
                    return;
                setResult([]);
                setError("Không tìm được địa chỉ, thử lại sau");
            })
            .finally(() => {
                if (!controller.signal.aborted)
                    setLoading(false)
            });

        return () => controller.abort();

    }, [debouncedQuery, nearLat, nearLng]);

    return { results, loading, error }

}