import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you were looking for does not exist."
        action={
          <Link to="/">
            <Button>Go home</Button>
          </Link>
        }
      />
    </div>
  )
}
