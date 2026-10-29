import { useState } from "react";
import type { GeoPlace, RoutePoints } from "../../Business/Models/MapModels";
import MapView from "../Components/MapView";
import RouteSearchBox from "../Components/RouteSearchBox";
import styles from "../../../public/assets/Home.module.css";

export default function Home() {
    const [route, setRoute] = useState<RoutePoints>({ from: null, to: null });

    const setForm = (from: GeoPlace | null) => setRoute((r) => ({ ...r, from }));
    const setTo = (to: GeoPlace | null) => setRoute((r) => ({ ...r, to }));
    const swap = () => setRoute((r) => ({ from: r.to, to: r.from }));

    const search = () => {
        console.log("Tìm đường:", route)
    };

    return (
        <div className={styles.page}>
            <aside className={styles.sidebar}>
                <RouteSearchBox
                    from={route.from}
                    to={route.to}
                    onFormChange={setForm}
                    onToChange={setTo}
                    onSwap={swap}
                    onSearch={search}
                />
            </aside>
            <main className={styles.map}>
                <MapView from={route.from} to={route.to} />
            </main>
        </div>
    )

}