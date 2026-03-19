function normalize(value: string | null | undefined): string {
  return (value || '').toLowerCase().trim();
}

export function isPublishedLikeStatus(status: string | null | undefined): boolean {
  const normalized = normalize(status);
  return normalized === 'published' || normalized === 'active' || normalized === 'live';
}

export function isOfflineLikeStatus(status: string | null | undefined): boolean {
  const normalized = normalize(status);
  return normalized === 'offline' || normalized === 'suspended';
}

export function getWebsiteStatusMeta(status: string | null | undefined): { label: string; dotClass: string } {
  if (isPublishedLikeStatus(status)) {
    return { label: 'Published', dotClass: 'bg-green-600' };
  }
  if (isOfflineLikeStatus(status)) {
    return { label: 'Offline', dotClass: 'bg-red-600' };
  }
  return { label: 'Draft', dotClass: 'bg-yellow-500' };
}

export function getStatusBadgeClasses(status: string | null | undefined): string {
  if (isPublishedLikeStatus(status)) return 'bg-green-100 text-green-800';
  if (isOfflineLikeStatus(status) || normalize(status) === 'flagged') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
}

export function getStatusLabel(status: string | null | undefined): string {
  if (isPublishedLikeStatus(status)) return 'Live';
  if (normalize(status) === 'suspended') return 'Suspended';
  return status || 'Draft';
}
