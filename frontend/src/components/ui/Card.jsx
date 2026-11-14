export default function Card({ as: Component = 'div', className = '', children, ...props }) {
  return (
    <Component
      className={`rounded-card border border-card-border bg-white ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
