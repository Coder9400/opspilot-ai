import DashboardLayout from './DashboardLayout'

/**
 * AppShell — the authenticated layout wrapper.
 * All protected pages use this instead of the old topnav-based layout.
 */
export default function AppShell({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}
