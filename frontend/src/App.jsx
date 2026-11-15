import { Route, Routes } from 'react-router-dom'
import GuestRoute from './components/routing/GuestRoute'
import ProtectedRoute from './components/routing/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import StudentLayout from './layouts/StudentLayout'
import Login from './features/auth/Login'
import Signup from './features/auth/Signup'
import ForgotPassword from './features/auth/ForgotPassword'
import ResetPassword from './features/auth/ResetPassword'
import Home from './features/home/Home'
import Events from './features/events/Events'
import EventDetails from './features/events/EventDetails'
import MyRegistrations from './features/registrations/MyRegistrations'
import Profile from './features/profile/Profile'
import Notifications from './features/notifications/Notifications'
import AnalyticsDashboard from './features/admin/AnalyticsDashboard'
import AdminEvents from './features/admin/AdminEvents'
import AdminEventForm from './features/admin/AdminEventForm'
import EventAttendees from './features/admin/EventAttendees'
import AuditLog from './features/admin/AuditLog'
import AdminUsers from './features/admin/AdminUsers'
import AiSettings from './features/admin/AiSettings'
import Assistant from './features/assistant/Assistant'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute role="student" />}>
        <Route element={<StudentLayout />}>
          <Route index element={<Home />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="my-registrations" element={<MyRegistrations />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="admin" element={<AnalyticsDashboard />} />
          <Route path="admin/events" element={<AdminEvents />} />
          <Route path="admin/events/new" element={<AdminEventForm />} />
          <Route path="admin/events/:id/edit" element={<AdminEventForm />} />
          <Route path="admin/events/:id/attendees" element={<EventAttendees />} />
          <Route path="admin/audit" element={<AuditLog />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/ai" element={<AiSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
