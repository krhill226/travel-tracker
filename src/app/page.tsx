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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Submit Travel Request</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Your Name
          </label>
          <select
            value={selectedEmployee || ''}
            onChange={(e) => setSelectedEmployee(Number(e.target.value))}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : '+ New Travel Request'}
          </button>
        )}

        {showForm && selectedEmployee && (
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {selectedEmployee && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Travel History</h2>
          
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : travelRequests.length === 0 ? (
            <p className="text-gray-500">No travel requests yet. Submit your first one above!</p>
          ) : (
            <div className="space-y-4">
              {travelRequests.map(request => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{request.customerName}</h3>
                      <p className="text-gray-600">{request.customerLocation}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <span>{new Date(request.travelDate).toLocaleDateString()}</span>
                    <span className="mx-2">→</span>
                    <span>{new Date(request.returnDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 mb-3">{request.reason}</p>
                  
                  {request.agendaItems.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Agenda:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {request.agendaItems.map(item => (
                          <li key={item.id}>{item.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {request.denial && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                      <p className="text-sm font-medium text-red-800">Denial Reason:</p>
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
          )}
        </div>
      )}
    </div>
  )
}
