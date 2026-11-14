/** `/jobs` is the board; a job's own pages (`/jobs/12`, `/jobs/12/capture`) belong to Active. */
export function isTabActive(tabUrl: string, pathname: string): boolean {
  if (tabUrl === "/jobs") return pathname === "/jobs"
  if (tabUrl === "/active") return pathname === "/active" || /^\/jobs\/\d+/.test(pathname)
  return pathname.startsWith(tabUrl)
}
