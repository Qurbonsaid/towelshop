import React, { useState } from 'react'
import {
  AlertCircle,
  Plus,
  Shield,
  Trash2,
  User,
  Users,
} from '../components/icons'
import { StaffModal } from '../components/StaffModal'
import { ROLES } from '../constants/roles'
import { useHeader } from '../context/HeaderContext'
import { uz } from '../i18n/uz'
import { createStaffAccount } from '../services/authService'
import { deleteUserDoc, updateUserRole } from '../services/firestoreService'
import { formatPhoneDisplay } from '../utils/auth'

export function StaffManagementPage({ users = [] }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  useHeader({
    title: uz.nav.staff,
    subtitle: `${users.length} ta foydalanuvchi`,
    showBack: false,
    actions: (
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
        title={uz.admin.staff.addBtn}
      >
        <Plus size={18} />
      </button>
    ),
  }, [users.length])

  const handleCreateStaff = async (data) => {
    await createStaffAccount(data)
  }

  const handleDeleteUser = async (uid) => {
    if (window.confirm(uz.admin.staff.deleteConfirm)) {
      try {
        await deleteUserDoc(uid)
      } catch (err) {
        console.error(err)
        setActionError(uz.common.error)
      }
    }
  }

  const handleRoleToggle = async (uid, currentRole) => {
    const newRole = currentRole === ROLES.ADMIN ? ROLES.STAFF : ROLES.ADMIN
    try {
      await updateUserRole(uid, newRole)
    } catch (err) {
      console.error(err)
      setActionError(uz.common.error)
    }
  }

  return (
    <div className="space-y-3.5 pb-6">
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={15} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Add Staff Button */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100/60 active:scale-98 transition-all"
      >
        <Plus size={16} />
        {uz.admin.staff.addBtn}
      </button>

      {/* Staff List */}
      <div className="space-y-2.5">
        {users.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <Users size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Hozircha xodimlar mavjud emas</p>
          </div>
        ) : (
          users.map((staff) => {
            const isStaffAdmin = staff.role === ROLES.ADMIN

            return (
              <div
                key={staff.uid || staff.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                      isStaffAdmin
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isStaffAdmin ? <Shield size={18} /> : <User size={18} />}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{staff.name || 'Xodim'}</h4>
                    <p className="text-xs font-mono text-slate-500">
                      +998 {formatPhoneDisplay(staff.phone)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRoleToggle(staff.uid || staff.id, staff.role)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                      isStaffAdmin
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title="Rolni o'zgartirish"
                  >
                    {isStaffAdmin ? uz.roles.admin : uz.roles.staff}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteUser(staff.uid || staff.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title={uz.common.delete}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {isAddModalOpen && (
        <StaffModal
          onSave={handleCreateStaff}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}
    </div>
  )
}

