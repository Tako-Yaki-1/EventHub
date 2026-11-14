import { NavLink } from 'react-router-dom'

export default function Tabs({ items, className = '' }) {
  return (
    <nav aria-label="Main" className={`flex items-center gap-1 ${className}`}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive ? 'bg-tab-active text-ink' : 'text-muted hover:text-ink'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
