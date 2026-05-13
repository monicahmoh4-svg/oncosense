import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Users, Activity, AlertTriangle, Video, TrendingUp } from 'lucide-react'
import { adminService } from '../../services/api'

const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }
const PIE_COLORS = ['#10b981','#f59e0b','#f97316','#ef4444']

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
)

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminService.getDashboard()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  const totalUsers = data?.total_users?.reduce((s, r) => s + parseInt(r.count), 0) || 0
  const patientCount = data?.total_users?.find(r => r.role === 'patient')?.count || 0
  const highRisk = data?.risk_breakdown?.find(r => r.risk_level === 'high')?.count || 0
  const critical = data?.risk_breakdown?.find(r => r.risk_level === 'critical')?.count || 0
  const activeConsults = data?.consultation_stats?.find(r => r.status === 'active')?.count || 0

  const riskData = data?.risk_breakdown?.map(r => ({
    name: r.risk_level.charAt(0).toUpperCase() + r.risk_level.slice(1),
    value: parseInt(r.count),
    color: RISK_COLORS[r.risk_level]
  })) || []

  const weeklyData = data?.weekly_trend?.map(w => ({
    week: new Date(w.week).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    assessments: parseInt(w.assessments),
    high_risk: parseInt(w.high_risk)
  })) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview · {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={totalUsers} color="text-brand-600" sub={`${patientCount} patients`} />
        <StatCard icon={Activity} label="Assessments (30d)" value={riskData.reduce((s,r) => s + r.value, 0)} color="text-blue-600" />
        <StatCard icon={AlertTriangle} label="High Risk (30d)" value={parseInt(highRisk) + parseInt(critical)} color="text-red-600" sub="Need follow-up" />
        <StatCard icon={Video} label="Active Consults" value={activeConsults} color="text-purple-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk breakdown pie */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Risk Level Distribution (30 days)</h2>
          {riskData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={riskData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {riskData.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                    <span className="text-sm text-gray-600">{r.name}</span>
                    <span className="font-bold text-gray-900 ml-auto">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-gray-400 text-sm py-8 text-center">No assessment data yet</p>}
        </div>

        {/* Weekly trend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Weekly Assessment Trend</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="assessments" stroke="#14b88a" strokeWidth={2} dot={{ fill: '#14b88a', r: 4 }} name="Total" />
                <Line type="monotone" dataKey="high_risk" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} name="High Risk" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm py-8 text-center">No trend data yet</p>}
        </div>
      </div>

      {/* Regional data */}
      {data?.regional_data?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Regional Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.regional_data.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="users" fill="#14b88a" radius={[4,4,0,0]} name="Users" />
              <Bar dataKey="high_risk" fill="#f97316" radius={[4,4,0,0]} name="High Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent assessments */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Recent Assessments</h2>
        {data?.recent_assessments?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 font-semibold">Patient</th>
                <th className="pb-3 font-semibold">Risk Level</th>
                <th className="pb-3 font-semibold">Score</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent_assessments.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{a.first_name} {a.last_name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold border
                        ${a.risk_level === 'low' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          a.risk_level === 'medium' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          a.risk_level === 'high' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                          'bg-red-50 border-red-200 text-red-700'}`}>
                        {a.risk_level}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-gray-700">{Math.round((a.final_score || 0) * 100)}%</td>
                    <td className="py-3 text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400 text-sm py-6 text-center">No assessments yet</p>}
      </div>
    </div>
  )
}
