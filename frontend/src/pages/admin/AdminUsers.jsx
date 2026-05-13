// AdminUsers.jsx
import React, { useState, useEffect } from 'react'
import { adminService } from '../../services/api'
import { Search, UserCheck, UserX, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')

  const load = () => {
    setLoading(true)
    adminService.getUsers({ search, role, limit: 50 })
      .then(r => setUsers(r.data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, role])

  const toggle = async (id) => {
    try {
      const res = await adminService.toggleUser(id)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: res.data.user.is_active } : u))
      toast.success('User status updated')
    } catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-display text-3xl text-gray-900">User Management</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="patient">Patient</option>
          <option value="health_worker">Health Worker</option>
          <option value="clinician">Clinician</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Name','Role','Contact','Assessments','Status','Actions'].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center text-brand-700 font-bold text-xs">
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">{u.first_name} {u.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg font-medium">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email || u.phone || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{u.assessment_count || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(u.id)}
                      className={`p-1.5 rounded-lg transition-all ${u.is_active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-500'}`}>
                      {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
