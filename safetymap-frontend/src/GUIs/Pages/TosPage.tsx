import TosViewer from "../Components/TosViewer";
import styles from "../../../public/assets/TosPage.module.css";

interface Props {
    onBack: () => void;
}

// Trang hiển thị toàn màn hình Điều khoản Dịch vụ khi truy cập đường dẫn #tos
export default function TosPage({ onBack }: Props) {
    return (
        <div className={styles.pageWrapper}>
            <div className={styles.documentCard}>
                <TosViewer mode="page" onBack={onBack} />
            </div>
        </div>
    );
}
