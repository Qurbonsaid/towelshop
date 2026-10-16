import React, { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

import { AppLayout } from './components/AppLayout'
import { auth, db } from './config/firebase'
import { COLLECTIONS } from './constants/models'
import { ROLES } from './constants/roles'
import { HeaderProvider } from './context/HeaderContext'
import { uz } from './i18n/uz'
import { BarberDetailsPage } from './pages/BarberDetailsPage'
import { BarbershopDetailsPage } from './pages/BarbershopDetailsPage'
import { BarbershopsPage } from './pages/BarbershopsPage'
import { LoginPage } from './pages/LoginPage'
import { MapView } from './pages/MapView'
import { ProfilePage } from './pages/ProfilePage'
import { SalesPage } from './pages/SalesPage'
import { StaffManagementPage } from './pages/StaffManagementPage'
import { StatsPage } from './pages/StatsPage'
import { loginWithPhone, logout } from './services/authService'
import { setupForegroundNotifications } from './services/fcmService'
import {
  subscribeBarbers,
  subscribeBarbershops,
  subscribeReturns,
  subscribeSales,
  subscribeUsers,
} from './services/firestoreService'
import { resolveDefaultRoute } from './utils/auth'

function ProtectedRoute({ allowedRoles, role, children }) {
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate replace to="/sartaroshxonalar" />
  }

  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [foregroundToast, setForegroundToast] = useState(null)

  // Real-time collections shared across app
  const [barbershops, setBarbershops] = useState([])
  const [barbers, setBarbers] = useState([])
  const [sales, setSales] = useState([])
  const [returns, setReturns] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    let unsubscribeDoc = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc()
        unsubscribeDoc = null
      }

      if (!currentUser) {
        setUser(null)
        setUserProfile(null)
        setRole(null)
        setLoading(false)
        return
      }

      setUser(currentUser)

      // Listen to user profile in real-time
      const userRef = doc(db, COLLECTIONS.USERS, currentUser.uid)
      unsubscribeDoc = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          setUserProfile(data)
          setRole(data.role || ROLES.STAFF)
        } else {
          setRole(ROLES.STAFF)
        }
        setLoading(false)
      })
    })

    // Setup FCM Foreground notifications listener
    setupForegroundNotifications((payload) => {
      setForegroundToast({
        title: payload.notification?.title || uz.fcm.newSaleTitle,
        body: payload.notification?.body,
      })
      setTimeout(() => setForegroundToast(null), 6000)
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeDoc) unsubscribeDoc()
    }
  }, [])

  // Subscribe to real-time collections when logged in
  useEffect(() => {
    if (!user) return

    const unsubShops = subscribeBarbershops(setBarbershops)
    const unsubBarbers = subscribeBarbers(setBarbers)
    const unsubSales = subscribeSales(setSales)
    const unsubReturns = subscribeReturns(setReturns)

    let unsubUsers = () => {}
    if (role === ROLES.ADMIN) {
      unsubUsers = subscribeUsers(setUsers)
    }

    return () => {
      unsubShops()
      unsubBarbers()
      unsubSales()
      unsubReturns()
      unsubUsers()
    }
  }, [user, role])

  const handleLogin = async (phone, password) => {
    const result = await loginWithPhone(phone, password)
    setUser(result.user)
    setUserProfile(result.profile)
    setRole(result.role || ROLES.STAFF)
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
    setUserProfile(null)
    setRole(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-700">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="mt-3 text-xs font-semibold text-slate-500">{uz.common.loading}</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <HeaderProvider>
      {/* Foreground Notification Toast for realtime updates */}
      {foregroundToast && (
        <div className="fixed top-4 left-1/2 z-50 w-11/12 max-w-sm -translate-x-1/2 rounded-2xl border border-emerald-300 bg-white p-3.5 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              🔔
            </div>
            <div className="flex-1">
              <h5 className="text-xs font-bold text-slate-900">{foregroundToast.title}</h5>
              <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{foregroundToast.body}</p>
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route element={<AppLayout onLogout={handleLogout} role={role} userProfile={userProfile} />}>
          {/* 1. Barbershops Route & Flow */}
          <Route
            index
            element={
              <BarbershopsPage
                role={role}
                barbershops={barbershops}
                barbers={barbers}
                sales={sales}
                returns={returns}
              />
            }
          />
          <Route
            path="/sartaroshxonalar"
            element={
              <BarbershopsPage
                role={role}
                barbershops={barbershops}
                barbers={barbers}
                sales={sales}
                returns={returns}
              />
            }
          />
          <Route
            path="/sartaroshxonalar/:shopId"
            element={
              <BarbershopDetailsPage
                role={role}
                barbershops={barbershops}
                barbers={barbers}
                sales={sales}
                returns={returns}
              />
            }
          />
          <Route
            path="/sartaroshxonalar/:shopId/barber/:barberId"
            element={
              <BarberDetailsPage
                role={role}
                userId={user.uid}
                userProfile={userProfile}
                barbershops={barbershops}
                barbers={barbers}
                sales={sales}
                returns={returns}
              />
            }
          />

          {/* 2. Sales / Transactions Route */}
          <Route
            path="/savdolar"
            element={
              <SalesPage
                role={role}
                userId={user.uid}
                sales={sales}
                returns={returns}
              />
            }
          />

          {/* 3. Statistics Route */}
          <Route
            path="/statistika"
            element={
              <StatsPage
                role={role}
                adminUser={user}
                sales={sales}
                barbers={barbers}
                returns={returns}
              />
            }
          />

          {/* 4. Staff Management Route (Admin Only) */}
          <Route
            path="/xodimlar"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]} role={role}>
                <StaffManagementPage users={users} />
              </ProtectedRoute>
            }
          />

          {/* Profile Page */}
          <Route
            path="/profile"
            element={
              <ProfilePage
                userProfile={userProfile}
                onLogout={handleLogout}
              />
            }
          />

          {/* Map view fallback */}
          <Route path="/xarita" element={<MapView />} />

          {/* Legacy redirects */}
          <Route path="/admin" element={<Navigate replace to="/sartaroshxonalar" />} />
          <Route path="/staff" element={<Navigate replace to="/sartaroshxonalar" />} />
        </Route>

        <Route element={<Navigate replace to={resolveDefaultRoute()} />} path="*" />
      </Routes>
    </HeaderProvider>
  )
}

export default App
