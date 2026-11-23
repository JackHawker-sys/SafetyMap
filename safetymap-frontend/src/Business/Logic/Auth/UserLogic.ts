import type { User, UserRole } from "../../Models/User";

// displayName có thể null -> dùng phần trước @ của email
export function getDisplayName(user: User): string {
    const name = user.displayName?.trim();
    return name ? name : user.email.split("@")[0];
}

const ROLE_PRIORITY: UserRole[] = ["ADMIN", "MODERATOR", "USER"];

// Badge chỉ hiện role cao nhất
export function getHighestRole(roles: UserRole[]): UserRole {
    return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? "USER";
}

export const EIU_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@eiu\.edu\.vn$/i;