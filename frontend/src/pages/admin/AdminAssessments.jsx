import React, { useState, useEffect } from 'react'
import { adminService } from '../../services/api'
import { AlertTriangle, CheckCircle2, Filter } from 'lucide-react'

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ risk_level: '', reviewed: '' })

  useEffect(() => {
    setLoading(true)
    adminService.getAssessments(filter)
      .then(r => setAssessments(r.data.assessments || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  const riskBadge = (l) => {
    const cls = { low:'bg-emerald-100 text-emerald-700', medium:'bg-amber-100 text-amber-700', high:'bg-orange-100 text-orange-700', critical:'bg-red-100 text-red-700' }
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls[l] || cls.low}`}>{l}</span>
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-display text-3xl text-gray-900">Risk Assessments</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3 flex-wrap">
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          value={filter.risk_level} onChange={e => setFilter(p => ({ ...p, risk_level: e.target.value }))}>
          <option value="">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          value={filter.reviewed} onChange={e => setFilter(p => ({ ...p, reviewed: e.target.value }))}>
          <option value="">All</option>
          <option value="false">Unreviewed</option>
          <option value="true">Reviewed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No assessments found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Patient','Risk','Score','Confidence','Date','Reviewed'].map(h =>
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              )}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assessments.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.first_name} {a.last_name}</td>
                  <td className="px-4 py-3">{riskBadge(a.risk_level)}</td>
                  <td className="px-4 py-3 font-semibold">{Math.round((a.final_score || 0) * 100)}%</td>
                  <td className="px-4 py-3 text-gray-500">{Math.round((a.confidence_score || 0) * 100)}%</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {a.reviewed_at
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : <span className="text-xs text-amber-600 font-medium">Pending</span>}
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
