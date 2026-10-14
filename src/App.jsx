import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

import { AppLayout } from './components/AppLayout'
import { auth, db } from './config/firebase'
import { COLLECTIONS } from './constants/models'
import { ROLES } from './constants/roles'
import { uz } from './i18n/uz'
import { AdminDashboard } from './pages/AdminDashboard'
import { LoginPage } from './pages/LoginPage'
import { MapView } from './pages/MapView'
import { StaffDashboard } from './pages/StaffDashboard'
import { loginWithPhone, logout } from './services/authService'
import { resolveDefaultRoute } from './utils/auth'

function ProtectedRoute({ allowedRoles, role, children }) {
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate replace to="/" />
  }

  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setRole(null)
        setLoading(false)
        return
      }

      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, currentUser.uid))
      setUser(currentUser)
      setRole(userDoc.exists() ? userDoc.data().role : ROLES.STAFF)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleLogin = async (phone, password) => {
    const result = await loginWithPhone(phone, password)
    setUser(result.user)
    setRole(result.role || ROLES.STAFF)
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
    setRole(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        {uz.common.loading}
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <Routes>
      <Route element={<AppLayout onLogout={handleLogout} role={role} />}>
        <Route
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]} role={role}>
              <AdminDashboard />
            </ProtectedRoute>
          }
          path="/admin"
        />
        <Route
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]} role={role}>
              <StaffDashboard userId={user.uid} />
            </ProtectedRoute>
          }
          path="/staff"
        />
        <Route
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.STAFF]} role={role}>
              <MapView />
            </ProtectedRoute>
          }
          path="/xarita"
        />
      </Route>

      <Route element={<Navigate replace to={resolveDefaultRoute(role)} />} path="*" />
    </Routes>
  )
}

export default App
