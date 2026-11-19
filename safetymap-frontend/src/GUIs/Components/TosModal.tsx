import TosViewer from "./TosViewer";
import styles from "../../../public/assets/TosViewer.module.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAgreeAndClose: () => void;
}

// Modal hiển thị Điều khoản Dịch vụ ngay trên giao diện đăng ký
export default function TosModal({ isOpen, onClose, onAgreeAndClose }: Props) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <TosViewer
                    mode="modal"
                    onClose={onClose}
                    onAgreeAndClose={onAgreeAndClose}
                />
            </div>
        </div>
    );
}
