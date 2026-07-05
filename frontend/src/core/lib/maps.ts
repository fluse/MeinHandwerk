export interface MapsTarget {
  address?: string
  lat?: number
  lng?: number
}

export function buildGoogleMapsUrl(target: MapsTarget): string {
  if (target.lat != null && target.lng != null) {
    return `https://maps.google.com/?q=${target.lat},${target.lng}`
  }
  return `https://maps.google.com/?q=${encodeURIComponent(target.address ?? '')}`
}

export function buildAppleMapsUrl(target: MapsTarget): string {
  if (target.lat != null && target.lng != null) {
    return `https://maps.apple.com/?ll=${target.lat},${target.lng}`
  }
  return `https://maps.apple.com/?q=${encodeURIComponent(target.address ?? '')}`
}
