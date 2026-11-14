export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-card bg-tile ${className}`} aria-hidden="true" />
}
