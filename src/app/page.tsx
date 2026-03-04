'use client'

import { useState, useEffect } from 'react'

interface Employee {
  id: number
  name: string
  email: string
}

interface TravelRequest {
  id: number
  customerName: string
  customerLocation: string
  travelDate: string
  returnDate: string
  reason: string
  status: string
  agendaItems: { id: number; description: string; completed: boolean }[]
  denial?: { denialReason: string; rescheduledDate: string | null }
}

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string>('')
  const [statusReason, setStatusReason] = useState('')
  const [rescheduledDate, setRescheduledDate] = useState('')
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerLocation: '',
    travelDate: '',
    returnDate: '',
    reason: '',
    agendaItems: ['']
  })

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => setEmployees(data))
      .catch(err => console.error('Failed to load employees:', err))
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      setLoading(true)
      fetch(`/api/travel?employeeId=${selectedEmployee}`)
        .then(res => res.json())
        .then(data => {
          setTravelRequests(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load travel requests:', err)
          setLoading(false)
        })
    }
  }, [selectedEmployee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployee) return

    const response = await fetch('/api/travel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: selectedEmployee,
        ...formData,
        agendaItems: formData.agendaItems.filter(item => item.trim())
      })
    })

    if (response.ok) {
      const newRequest = await response.json()
      setTravelRequests([newRequest, ...travelRequests])
      setFormData({
        customerName: '',
        customerLocation: '',
        travelDate: '',
        returnDate: '',
        reason: '',
        agendaItems: ['']
      })
      setShowForm(false)
    }
  }

  const addAgendaItem = () => {
    setFormData({ ...formData, agendaItems: [...formData.agendaItems, ''] })
  }

  const updateAgendaItem = (index: number, value: string) => {
    const newItems = [...formData.agendaItems]
    newItems[index] = value
    setFormData({ ...formData, agendaItems: newItems })
  }

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

  const handleStatusChange = (request: TravelRequest, newStatus: string) => {
    if (newStatus === 'denied' || newStatus === 'cancelled') {
      setSelectedRequest(request)
      setPendingStatus(newStatus)
      setShowReasonModal(true)
    } else {
      updateStatus(request.id, newStatus)
    }
  }

  const updateStatus = async (requestId: number, newStatus: string, reason?: string, reschedDate?: string) => {
    const response = await fetch('/api/travel', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: requestId,
        status: newStatus,
        denialReason: reason,
        rescheduledDate: reschedDate || null
      })
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

    await updateStatus(selectedRequest.id, pendingStatus, statusReason, rescheduledDate)
    
    setShowReasonModal(false)
    setSelectedRequest(null)
    setPendingStatus('')
    setStatusReason('')
    setRescheduledDate('')
  }

  const activeTravel = travelRequests.filter(r => 
    r.status === 'planned' || r.status === 'in-progress'
  ).sort((a, b) => new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime())

  const pastTravel = travelRequests.filter(r => 
    r.status === 'completed' || r.status === 'cancelled' || r.status === 'denied'
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Employee Travel Portal</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Name
          </label>
          <select
            value={selectedEmployee || ''}
            onChange={(e) => setSelectedEmployee(Number(e.target.value))}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="">-- Select Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedEmployee && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Upcoming & Active Travel</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              {showForm ? 'Cancel' : '+ New Travel Request'}
            </button>
          </div>
          
          {loading ? (
            <p className="text-gray-700">Loading...</p>
          ) : activeTravel.length === 0 ? (
            <p className="text-gray-700">No upcoming or active travel. Create a new request below!</p>
          ) : (
            <div className="space-y-4">
              {activeTravel.map(request => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{request.customerName}</h3>
                      <p className="text-gray-800">{request.customerLocation}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 text-gray-900"
                      >
                        <option value="planned">Planned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="denied">Denied</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 mb-2">
                    <span>{new Date(request.travelDate).toLocaleDateString()}</span>
                    <span className="mx-2">→</span>
                    <span>{new Date(request.returnDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 mb-3">{request.reason}</p>
                  
                  {request.agendaItems.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Agenda:</p>
                      <ul className="list-disc list-inside text-sm text-gray-800">
                        {request.agendaItems.map(item => (
                          <li key={item.id}>{item.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Location
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerLocation}
                  onChange={(e) => setFormData({ ...formData, customerLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                  placeholder="e.g., Chicago, IL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.travelDate}
                  onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Visit
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                placeholder="Describe the purpose of this customer visit..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agenda Items
              </label>
              {formData.agendaItems.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateAgendaItem(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder={`Agenda item ${index + 1}`}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addAgendaItem}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add another agenda item
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition font-medium"
              >
                Submit Travel Request
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
          )}
        </div>
      )}

      {selectedEmployee && pastTravel.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Past Travel</h2>
          
          <div className="space-y-4">
            {pastTravel.map(request => (
              <div key={request.id} className="border rounded-lg p-4 opacity-75">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{request.customerName}</h3>
                    <p className="text-gray-800">{request.customerLocation}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <div className="text-sm text-gray-800 mb-2">
                  <span>{new Date(request.travelDate).toLocaleDateString()}</span>
                  <span className="mx-2">→</span>
                  <span>{new Date(request.returnDate).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 mb-3">{request.reason}</p>
                
                {request.agendaItems.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Agenda:</p>
                    <ul className="list-disc list-inside text-sm text-gray-800">
                      {request.agendaItems.map(item => (
                        <li key={item.id}>{item.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {request.denial && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                    <p className="text-sm font-medium text-red-800">
                      {request.status === 'cancelled' ? 'Cancellation Reason:' : 'Denial Reason:'}
                    </p>
                    <p className="text-sm text-red-700">{request.denial.denialReason}</p>
                    {request.denial.rescheduledDate && (
                      <p className="text-sm text-red-700 mt-1">
                        Rescheduled to: {new Date(request.denial.rescheduledDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {pendingStatus === 'denied' ? 'Record Denial' : 'Record Cancellation'}
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              {pendingStatus === 'denied' 
                ? `Why was your visit to ${selectedRequest?.customerName} denied?`
                : `Why are you cancelling your visit to ${selectedRequest?.customerName}?`
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
                  placeholder={pendingStatus === 'denied' ? "Why was this visit denied?" : "Why are you cancelling this visit?"}
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
