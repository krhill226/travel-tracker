'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Manager {
  id: number
  name: string
  email: string
  _count: { employees: number }
}

export default function ManagerSelect() {
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/managers')
      .then(res => res.json())
      .then(data => {
        setManagers(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load managers:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-700">Loading managers...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manager Dashboard</h1>
      <p className="text-gray-800 mb-6">Select a manager to view their team&apos;s travel:</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {managers.map(manager => (
          <Link
            key={manager.id}
            href={`/manager/${manager.id}`}
            className="block p-6 border rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold text-gray-900">{manager.name}</h2>
            <p className="text-gray-700">{manager.email}</p>
            <p className="text-sm text-gray-700 mt-2">
              {manager._count.employees} team members
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
