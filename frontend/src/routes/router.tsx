import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/core/layout/AppLayout'
import { SettingsLayout } from '@/core/layout/SettingsLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { TeamPage } from '@/features/team/pages/TeamPage'
import { GeneralSettingsPage } from '@/features/settings/pages/GeneralSettingsPage'
import { DayBoardPage } from '@/features/scheduling/pages/DayBoardPage'
import { WeekPage } from '@/features/scheduling/pages/WeekPage'
import { OrdersListPage } from '@/features/scheduling/pages/OrdersListPage'
import { EmployeeWeekPage } from '@/features/scheduling/pages/EmployeeWeekPage'
import { OrderFormPage } from '@/features/scheduling/pages/OrderFormPage'
import { CustomersPage } from '@/features/customers/pages/CustomersPage'
import { CustomerFormPage } from '@/features/customers/pages/CustomerFormPage'
import { ProjectsPage } from '@/features/projects/pages/ProjectsPage'
import { ProjectFormPage } from '@/features/projects/pages/ProjectFormPage'
import { PinboardPage } from '@/features/pinboard/pages/PinboardPage'
import { VehiclesPage } from '@/features/vehicles/pages/VehiclesPage'
import { VehicleSettingsPage } from '@/features/vehicles/pages/VehicleSettingsPage'
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
          { index: true, element: <DayBoardPage /> },
          { path: 'week', element: <WeekPage /> },
          { path: 'week/:userId', element: <EmployeeWeekPage /> },
          { path: 'auftraege', element: <OrdersListPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'pinboard', element: <PinboardPage /> },
          { path: 'vehicles', element: <VehiclesPage /> },
          { path: 'events', element: <EventsPage /> },
          { path: 'timetracking', element: <TimetrackingPage /> },
          { path: 'orders/:orderId/rapports', element: <OrderRapportsPage /> },
          { path: 'orders/:orderId/rapport/new', element: <RapportFormPage /> },
          { path: 'orders/:orderId/rapport/:rapportId/edit', element: <RapportFormPage /> },
          {
            element: <RoleRoute allow={['chef', 'buero']} />,
            children: [
              {
                path: 'settings',
                element: <SettingsLayout />,
                children: [
                  { index: true, element: <Navigate to="general" replace /> },
                  { path: 'general', element: <GeneralSettingsPage /> },
                  { path: 'team', element: <TeamPage /> },
                  { path: 'vehicles', element: <VehicleSettingsPage /> },
                ],
              },
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
