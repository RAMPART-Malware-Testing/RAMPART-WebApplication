import { requireSession } from "@/lib/session";

export async function requireAdminSession(): Promise<{ accessToken: string; role: "admin" | "master" } | null> {
    const session = await requireSession();
    if (!session?.data) return null;

    const role = session.data.role;
    if (role !== "admin" && role !== "master") return null;

    return { accessToken: session.accessToken, role };
}
