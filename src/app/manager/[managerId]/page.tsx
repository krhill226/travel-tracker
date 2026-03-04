'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Employee {
  id: number
  name: string
  email: string
  manager: { name: string }
}

interface TravelRequest {
  id: number
  customerName: string
  customerLocation: string
  travelDate: string
  returnDate: string
  reason: string
  status: string
  employee: Employee
  agendaItems: { id: number; description: string; completed: boolean }[]
  denial?: { denialReason: string; rescheduledDate: string | null }
}

interface Stats {
  total: number
  thisMonth: number
  upcoming: number
  inProgress: number
  denied: number
}

export default function ManagerDashboard() {
  const params = useParams()
  const managerId = params.managerId as string
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [managerName, setManagerName] = useState('')
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string>('')
  const [statusReason, setStatusReason] = useState('')
  const [rescheduledDate, setRescheduledDate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [travelRes, statsRes, managersRes] = await Promise.all([
          fetch(`/api/travel?managerId=${managerId}`),
          fetch(`/api/stats?managerId=${managerId}`),
          fetch('/api/managers')
        ])
        
        const travel = await travelRes.json()
        const statsData = await statsRes.json()
        const managers = await managersRes.json()
        
        setTravelRequests(travel)
        setStats(statsData)
        
        const manager = managers.find((m: { id: number; name: string }) => m.id === parseInt(managerId))
        if (manager) setManagerName(manager.name)
        
        setLoading(false)
      } catch (err) {
        console.error('Failed to load data:', err)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [managerId])

  const filteredRequests = travelRequests.filter(req => {
    if (filter === 'all') return true
    return req.status === filter
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'planned': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'denied': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const updateStatus = async (requestId: number, newStatus: string) => {
    if (newStatus === 'denied' || newStatus === 'cancelled') {
      const request = travelRequests.find(r => r.id === requestId)
      setSelectedRequest(request || null)
      setPendingStatus(newStatus)
      setShowReasonModal(true)
      return
    }

    const response = await fetch('/api/travel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId, status: newStatus })
    })

    if (response.ok) {
      const updated = await response.json()
      setTravelRequests(travelRequests.map(req => 
        req.id === requestId ? updated : req
      ))
    }
  }

  const submitStatusWithReason = async () => {
    if (!selectedRequest || !statusReason) return

    const response = await fetch('/api/travel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedRequest.id,
        status: pendingStatus,
        denialReason: statusReason,
        rescheduledDate: rescheduledDate || null
      })
    })

    if (response.ok) {
      const updated = await response.json()
      setTravelRequests(travelRequests.map(req => 
        req.id === selectedRequest.id ? updated : req
      ))
      setShowReasonModal(false)
      setSelectedRequest(null)
      setPendingStatus('')
      setStatusReason('')
      setRescheduledDate('')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{managerName}&apos;s Team</h1>
            <p className="text-gray-800">Travel Overview</p>
          </div>
          <a href="/manager" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to managers
          </a>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-medium">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">This Month</p>
              <p className="text-2xl font-bold text-blue-900">{stats.thisMonth}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Upcoming</p>
              <p className="text-2xl font-bold text-green-900">{stats.upcoming}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">In Progress</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.inProgress}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Denied</p>
              <p className="text-2xl font-bold text-red-900">{stats.denied}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          {['all', 'planned', 'in-progress', 'completed', 'denied'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-700">
                    No travel requests found for this filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{request.employee.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{request.customerName}</div>
                      <div className="text-sm text-gray-700">{request.customerLocation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      <div>{new Date(request.travelDate).toLocaleDateString()}</div>
                      <div className="text-gray-700">to {new Date(request.returnDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </div>
                      {request.denial && (
                        <div className="text-xs text-red-600 mt-1">
                          Denied: {request.denial.denialReason}
                          {request.denial.rescheduledDate && (
                            <span className="block">
                              Rescheduled: {new Date(request.denial.rescheduledDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={request.status}
                        onChange={(e) => updateStatus(request.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
                      >
                        <option value="planned">Planned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="denied">Denied</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {pendingStatus === 'denied' ? 'Record Denial' : 'Record Cancellation'}
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              {pendingStatus === 'denied' 
                ? `Recording denial for ${selectedRequest?.employee.name}'s visit to ${selectedRequest?.customerName}`
                : `Recording cancellation for ${selectedRequest?.employee.name}'s visit to ${selectedRequest?.customerName}`
              }
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {pendingStatus === 'denied' ? 'Denial Reason *' : 'Cancellation Reason *'}
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder={pendingStatus === 'denied' ? "Why was this visit denied?" : "Why is this visit being cancelled?"}
                />
              </div>
              
              {pendingStatus === 'denied' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rescheduled Date (optional)
                  </label>
                  <input
                    type="date"
                    value={rescheduledDate}
                    onChange={(e) => setRescheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={submitStatusWithReason}
                disabled={!statusReason}
                className={`flex-1 text-white px-4 py-2 rounded-md transition disabled:bg-gray-400 ${
                  pendingStatus === 'denied' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {pendingStatus === 'denied' ? 'Record Denial' : 'Record Cancellation'}
              </button>
              <button
                onClick={() => {
                  setShowReasonModal(false)
                  setSelectedRequest(null)
                  setPendingStatus('')
                  setStatusReason('')
                  setRescheduledDate('')
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
