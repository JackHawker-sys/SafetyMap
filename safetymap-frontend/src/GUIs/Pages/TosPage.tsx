import { useNavigate } from "react-router-dom";
import TosViewer from "../Components/TosViewer";
import styles from "../../assets/styles/TosPage.module.css";

// Trang Điều khoản Dịch vụ toàn màn hình tại /tos
export default function TosPage() {
    const navigate = useNavigate();

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.documentCard}>
                <TosViewer mode="page" onBack={() => navigate("/")} />
            </div>
        </div>
    );
}