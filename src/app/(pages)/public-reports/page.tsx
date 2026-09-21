import { requireSession } from "@/lib/session"
import PublicReportsView from "./PublicReportsView"

export default async function PublicReportsPage() {
  const session = await requireSession()
  return <PublicReportsView isLoggedIn={!!session} />
}
