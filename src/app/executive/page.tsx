'use client'

import { useState, useEffect } from 'react'

interface Manager {
  id: number
  name: string
  _count: { employees: number }
}

interface Employee {
  id: number
  name: string
  manager: { id: number; name: string }
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
  agendaItems: { id: number; description: string }[]
  denial?: { denialReason: string; rescheduledDate: string | null }
}

interface Stats {
  total: number
  thisMonth: number
  upcoming: number
  inProgress: number
  denied: number
}

export default function ExecutiveView() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterManager, setFilterManager] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [managersRes, travelRes, statsRes] = await Promise.all([
          fetch('/api/managers'),
          fetch('/api/travel'),
          fetch('/api/stats')
        ])
        
        setManagers(await managersRes.json())
        setTravelRequests(await travelRes.json())
        setStats(await statsRes.json())
        setLoading(false)
      } catch (err) {
        console.error('Failed to load data:', err)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const filteredRequests = travelRequests
    .filter(req => {
      if (filterManager !== 'all' && req.employee.manager.id !== parseInt(filterManager)) {
        return false
      }
      if (filterStatus !== 'all' && req.status !== filterStatus) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.travelDate).getTime() - new Date(a.travelDate).getTime()
      }
      if (sortBy === 'manager') {
        return a.employee.manager.name.localeCompare(b.employee.manager.name)
      }
      if (sortBy === 'customer') {
        return a.customerName.localeCompare(b.customerName)
      }
      return 0
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

  const getManagerStats = (managerId: number) => {
    const managerRequests = travelRequests.filter(r => r.employee.manager.id === managerId)
    return {
      total: managerRequests.length,
      upcoming: managerRequests.filter(r => r.status === 'planned').length,
      denied: managerRequests.filter(r => r.status === 'denied').length
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Loading executive dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Executive Overview</h1>
        <p className="text-gray-600 mb-6">Organization-wide travel visibility</p>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">This Month</p>
              <p className="text-3xl font-bold text-blue-900">{stats.thisMonth}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Upcoming</p>
              <p className="text-3xl font-bold text-green-900">{stats.upcoming}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">In Progress</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.inProgress}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Denied</p>
              <p className="text-3xl font-bold text-red-900">{stats.denied}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Team Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {managers.map(manager => {
            const managerStats = getManagerStats(manager.id)
            return (
              <div key={manager.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{manager.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{manager._count.employees} team members</p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Trips:</span>
                    <span className="font-medium ml-1">{managerStats.total}</span>
                  </div>
                  <div>
                    <span className="text-blue-500">Upcoming:</span>
                    <span className="font-medium ml-1">{managerStats.upcoming}</span>
                  </div>
                  <div>
                    <span className="text-red-500">Denied:</span>
                    <span className="font-medium ml-1">{managerStats.denied}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <h2 className="text-lg font-bold text-gray-900">All Travel</h2>
          
          <div className="flex gap-4 ml-auto flex-wrap">
            <div>
              <label className="text-sm text-gray-600 mr-2">Team:</label>
              <select
                value={filterManager}
                onChange={(e) => setFilterManager(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Teams</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm text-gray-600 mr-2">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="denied">Denied</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mr-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="date">Date</option>
                <option value="manager">Manager</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No travel requests match your filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm">
                      <span className="font-medium text-gray-900">{request.employee.manager.name}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {request.employee.name}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{request.customerName}</div>
                      <div className="text-xs text-gray-500">{request.customerLocation}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(request.travelDate).toLocaleDateString()} - {new Date(request.returnDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={request.reason}>
                        {request.reason}
                      </div>
                      {request.denial && (
                        <div className="text-xs text-red-600 mt-1" title={request.denial.denialReason}>
                          Denied: {request.denial.denialReason.substring(0, 50)}...
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredRequests.length} of {travelRequests.length} travel requests
        </div>
      </div>
    </div>
  )
}
