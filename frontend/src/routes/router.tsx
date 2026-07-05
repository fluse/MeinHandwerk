import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/core/layout/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { TeamPage } from '@/features/team/pages/TeamPage'
import { WeekPage } from '@/features/scheduling/pages/WeekPage'
import { EmployeeWeekPage } from '@/features/scheduling/pages/EmployeeWeekPage'
import { DayPage } from '@/features/scheduling/pages/DayPage'
import { OrderFormPage } from '@/features/scheduling/pages/OrderFormPage'
import { CustomersPage } from '@/features/customers/pages/CustomersPage'
import { CustomerFormPage } from '@/features/customers/pages/CustomerFormPage'
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage'
import { ProjectFormPage } from '@/features/projects/pages/ProjectFormPage'
import { PinboardPage } from '@/features/pinboard/pages/PinboardPage'
import { EventsPage } from '@/features/events/pages/EventsPage'
import { TimetrackingPage } from '@/features/timetracking/pages/TimetrackingPage'
import { OrderRapportsPage } from '@/features/timetracking/pages/OrderRapportsPage'
import { RapportFormPage } from '@/features/timetracking/pages/RapportFormPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleRoute } from './RoleRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <WeekPage /> },
          { path: 'week/:userId', element: <EmployeeWeekPage /> },
          { path: 'week/:userId/:date', element: <DayPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'pinboard', element: <PinboardPage /> },
          { path: 'events', element: <EventsPage /> },
          { path: 'timetracking', element: <TimetrackingPage /> },
          { path: 'orders/:orderId/rapports', element: <OrderRapportsPage /> },
          { path: 'orders/:orderId/rapport/new', element: <RapportFormPage /> },
          { path: 'orders/:orderId/rapport/:rapportId/edit', element: <RapportFormPage /> },
          {
            element: <RoleRoute allow={['chef', 'buero']} />,
            children: [
              { path: 'team', element: <TeamPage /> },
              { path: 'orders/new', element: <OrderFormPage /> },
              { path: 'orders/:orderId/edit', element: <OrderFormPage /> },
              { path: 'customers/new', element: <CustomerFormPage /> },
              { path: 'customers/:customerId/edit', element: <CustomerFormPage /> },
              { path: 'projects/new', element: <ProjectFormPage /> },
              { path: 'projects/:projectId/edit', element: <ProjectFormPage /> },
            ],
          },
        ],
      },
    ],
  },
])
