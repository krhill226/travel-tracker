import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create managers
  const managers = await Promise.all([
    prisma.manager.upsert({
      where: { email: 'sarah.johnson@company.com' },
      update: {},
      create: { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' }
    }),
    prisma.manager.upsert({
      where: { email: 'michael.chen@company.com' },
      update: {},
      create: { name: 'Michael Chen', email: 'michael.chen@company.com' }
    }),
    prisma.manager.upsert({
      where: { email: 'emily.williams@company.com' },
      update: {},
      create: { name: 'Emily Williams', email: 'emily.williams@company.com' }
    }),
    prisma.manager.upsert({
      where: { email: 'david.martinez@company.com' },
      update: {},
      create: { name: 'David Martinez', email: 'david.martinez@company.com' }
    }),
  ])

  console.log(`Created ${managers.length} managers`)

  // Sample employee names for each team
  const teamMembers = [
    // Sarah's team (10 people)
    ['Alex Thompson', 'Jamie Rodriguez', 'Chris Parker', 'Morgan Lee', 'Taylor Kim',
     'Jordan Brown', 'Casey Wilson', 'Riley Davis', 'Quinn Anderson', 'Avery Thomas'],
    // Michael's team (10 people)
    ['Sam Miller', 'Drew Jackson', 'Blake Harris', 'Reese Martin', 'Skyler Garcia',
     'Charlie Robinson', 'Peyton Clark', 'Cameron Lewis', 'Sydney Walker', 'Dakota Hall'],
    // Emily's team (10 people)
    ['Jessie Allen', 'Pat Young', 'Robin King', 'Terry Wright', 'Frankie Scott',
     'Sage Green', 'River Adams', 'Phoenix Baker', 'Emery Nelson', 'Finley Carter'],
    // David's team (10 people)
    ['Logan Mitchell', 'Hayden Perez', 'Parker Roberts', 'Sawyer Turner', 'Rowan Phillips',
     'Harley Campbell', 'Ashton Edwards', 'Kendall Collins', 'Blair Stewart', 'Lane Morris']
  ]

  let employeeCount = 0
  for (let i = 0; i < managers.length; i++) {
    const manager = managers[i]
    for (const name of teamMembers[i]) {
      const email = name.toLowerCase().replace(' ', '.') + '@company.com'
      await prisma.employee.upsert({
        where: { email },
        update: {},
        create: {
          name,
          email,
          managerId: manager.id
        }
      })
      employeeCount++
    }
  }

  console.log(`Created ${employeeCount} employees`)

  // Create some sample travel requests
  const employees = await prisma.employee.findMany({ take: 10 })
  
  const sampleCustomers = [
    { name: 'Acme Corporation', location: 'Chicago, IL' },
    { name: 'TechStart Inc', location: 'San Francisco, CA' },
    { name: 'Global Dynamics', location: 'New York, NY' },
    { name: 'Midwest Manufacturing', location: 'Detroit, MI' },
    { name: 'Pacific Solutions', location: 'Seattle, WA' },
    { name: 'Southern Energy', location: 'Houston, TX' },
    { name: 'Northeast Healthcare', location: 'Boston, MA' },
    { name: 'Mountain Tech', location: 'Denver, CO' },
  ]

  const reasons = [
    'Quarterly business review and relationship building',
    'Product implementation support',
    'New feature training and demonstration',
    'Issue resolution and technical support',
    'Contract renewal discussion',
    'Strategic planning session',
    'System upgrade assistance',
    'Customer feedback collection'
  ]

  const statuses = ['planned', 'in-progress', 'completed', 'denied']

  for (let i = 0; i < 15; i++) {
    const employee = employees[i % employees.length]
    const customer = sampleCustomers[i % sampleCustomers.length]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const travelDate = new Date()
    travelDate.setDate(travelDate.getDate() + Math.floor(Math.random() * 60) - 30)
    
    const returnDate = new Date(travelDate)
    returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 3) + 1)

    const request = await prisma.travelRequest.create({
      data: {
        employeeId: employee.id,
        customerName: customer.name,
        customerLocation: customer.location,
        travelDate,
        returnDate,
        reason: reasons[i % reasons.length],
        status,
        agendaItems: {
          create: [
            { description: 'Meet with stakeholders' },
            { description: 'Review current implementation' },
            { description: 'Discuss future roadmap' }
          ]
        }
      }
    })

    if (status === 'denied') {
      await prisma.denial.create({
        data: {
          travelRequestId: request.id,
          denialReason: 'Customer requested to reschedule due to internal scheduling conflict',
          rescheduledDate: new Date(travelDate.getTime() + 14 * 24 * 60 * 60 * 1000)
        }
      })
    }
  }

  console.log('Created sample travel requests')
  console.log('Database seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
