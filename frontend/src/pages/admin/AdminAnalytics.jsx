import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { adminService } from '../../services/api'

const COLORS = ['#14b88a','#0a9470','#2dd1a8','#5ee8c4','#f59e0b','#f97316','#ef4444','#8b5cf6']

export default function AdminAnalytics() {
  const [cancerTypes, setCancerTypes] = useState([])
  const [highRisk, setHighRisk] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminService.getCancerTypes(), adminService.getHighRiskUsers()])
      .then(([ct, hr]) => {
        setCancerTypes(ct.data.distribution || [])
        setHighRisk(hr.data.users || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl text-gray-900">Analytics</h1>

      {/* Cancer type frequency */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Cancer Type Frequency (90 days)</h2>
        {cancerTypes.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cancerTypes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="cancer_name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v) => [`${v} cases`, 'Frequency']} />
              <Bar dataKey="frequency" radius={[0,4,4,0]} name="Cases">
                {cancerTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-400 text-sm text-center py-8">No data yet — assessments will populate this chart</p>}
      </div>

      {/* High risk users table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">High Risk Patients Requiring Follow-up</h2>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{highRisk.length} patients</span>
        </div>
        {highRisk.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>{['Patient','Risk Level','Score','Location','Date','Contact'].map(h =>
                  <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {highRisk.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.risk_level === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {u.risk_level}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-semibold text-gray-700">{Math.round((u.final_score || 0) * 100)}%</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{u.district}, {u.region}</td>
                    <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 text-gray-500 text-xs">{u.email || u.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-gray-400 text-sm text-center py-8">No high-risk patients found in recent assessments</p>}
      </div>
    </div>
  )
}
