import { LogoMark } from '../components/ui/Logo'

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-8">
      <div className="mb-5 flex flex-col items-center gap-1.5">
        <LogoMark className="size-14" />
        <h1 className="text-lg font-semibold text-ink">EventHub</h1>
        <p className="text-sm text-muted">Event Registration App</p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
