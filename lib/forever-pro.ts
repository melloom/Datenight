const splitCsv = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export function isForeverProUser(uid: string, email?: string | null): boolean {
  const uidAllowlist = new Set(splitCsv(process.env.FOREVER_PRO_UIDS))
  if (uidAllowlist.has(uid)) {
    return true
  }

  if (email) {
    const emailAllowlist = new Set(splitCsv(process.env.FOREVER_PRO_EMAILS).map((item) => item.toLowerCase()))
    if (emailAllowlist.has(email.toLowerCase())) {
      return true
    }
  }

  return false
}
