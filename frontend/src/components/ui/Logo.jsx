import { CalendarCheck } from 'lucide-react'

export function LogoMark({ className = 'size-10' }) {
  return (
    <span
      className={`flex items-center justify-center rounded-[10px] bg-ink text-white ${className}`}
      aria-hidden="true"
    >
      <CalendarCheck className="size-5" />
    </span>
  )
}

export default function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="text-base font-semibold text-ink">EventHub</span>
    </span>
  )
}
