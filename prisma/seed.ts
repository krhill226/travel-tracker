import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with real team data...')

  // Create managers
  const managers = await Promise.all([
    prisma.manager.upsert({
      where: { email: 'krhill@axon.com' },
      update: {},
      create: { name: 'Kristine Hill', email: 'krhill@axon.com' }
    }),
    prisma.manager.upsert({
      where: { email: 'pcapizzi@axon.com' },
      update: {},
      create: { name: 'Phil Capizzi', email: 'pcapizzi@axon.com' }
    }),
    prisma.manager.upsert({
      where: { email: 'edale@axon.com' },
      update: {},
      create: { name: 'Emilyn Dale', email: 'edale@axon.com' }
    }),
    prisma.manager.upsert({
      where: { email: 'kash@axon.com' },
      update: {},
      create: { name: 'Kirsten Ash', email: 'kash@axon.com' }
    }),
  ])

  console.log(`Created ${managers.length} managers`)

  // Map manager names to their records
  const managerMap: Record<string, typeof managers[0]> = {}
  for (const mgr of managers) {
    managerMap[mgr.name] = mgr
  }

  // All employees with their managers
  const employeeData = [
    // Kristine Hill's team
    { name: 'Alex Grega', email: 'agrega@axon.com', manager: 'Kristine Hill' },
    { name: 'Ashley Vaghela', email: 'avaghela@axon.com', manager: 'Kristine Hill' },
    { name: 'Gabriel Sigman', email: 'gsigman@axon.com', manager: 'Kristine Hill' },
    { name: 'Joe Holeman', email: 'jholeman@axon.com', manager: 'Kristine Hill' },
    { name: 'Kathryn Shipley Berry', email: 'kberry@axon.com', manager: 'Kristine Hill' },
    { name: 'Katy Cronk', email: 'kcronk@axon.com', manager: 'Kristine Hill' },
    { name: 'Margie Herrman', email: 'mherrman@axon.com', manager: 'Kristine Hill' },
    { name: 'Megan Youtkus', email: 'myoutkus@axon.com', manager: 'Kristine Hill' },
    { name: 'Michael Cao', email: 'mcao@axon.com', manager: 'Kristine Hill' },
    { name: 'Pat Salas', email: 'psalas@axon.com', manager: 'Kristine Hill' },
    { name: 'Tyler Deaver', email: 'tdeaver@axon.com', manager: 'Kristine Hill' },

    // Phil Capizzi's team
    { name: 'Aman Singh', email: 'asingh@axon.com', manager: 'Phil Capizzi' },
    { name: 'Brandon Wahl', email: 'bwahl@axon.com', manager: 'Phil Capizzi' },
    { name: 'Ed Shuman', email: 'eshuman@axon.com', manager: 'Phil Capizzi' },
    { name: 'Edward Hallahan', email: 'ehallahan@axon.com', manager: 'Phil Capizzi' },
    { name: 'Lauren Jackson', email: 'ljackson@axon.com', manager: 'Phil Capizzi' },
    { name: 'Linda Tran', email: 'ltran@axon.com', manager: 'Phil Capizzi' },
    { name: 'Robert Otero', email: 'rotero@axon.com', manager: 'Phil Capizzi' },
    { name: 'Sayalee Lanjewar', email: 'slanjewar@axon.com', manager: 'Phil Capizzi' },

    // Emilyn Dale's team
    { name: 'Brooke Deneen', email: 'bdeneen@axon.com', manager: 'Emilyn Dale' },
    { name: 'Eric Mergens', email: 'emergens@axon.com', manager: 'Emilyn Dale' },
    { name: 'Harrison Brandenburg', email: 'hbrandenburg@axon.com', manager: 'Emilyn Dale' },
    { name: 'Hayden Carper', email: 'hcarper@axon.com', manager: 'Emilyn Dale' },
    { name: 'Jessica Pressley', email: 'jpressley@axon.com', manager: 'Emilyn Dale' },
    { name: 'Jonathan Chen', email: 'jchen@axon.com', manager: 'Emilyn Dale' },
    { name: 'Terrence Smith', email: 'tsmith@axon.com', manager: 'Emilyn Dale' },
    { name: 'Liz Dziallo', email: 'ldziallo@axon.com', manager: 'Emilyn Dale' },
    { name: 'Marcus Coulter', email: 'mcoulter@axon.com', manager: 'Emilyn Dale' },
    { name: 'Mark Canenguez', email: 'mcanenguez@axon.com', manager: 'Emilyn Dale' },
    { name: 'Michi Slaughter', email: 'mslaughter@axon.com', manager: 'Emilyn Dale' },
    { name: 'Mike Schweiger', email: 'mschweiger@axon.com', manager: 'Emilyn Dale' },
    { name: 'Shekirah Mckenzie', email: 'smckenzie@axon.com', manager: 'Emilyn Dale' },
    { name: 'Young Kim', email: 'ykim@axon.com', manager: 'Emilyn Dale' },

    // Kirsten Ash's team
    { name: 'Mark Wesolowski', email: 'mwesolowski@axon.com', manager: 'Kirsten Ash' },
    { name: 'April Larsh', email: 'alarsh@axon.com', manager: 'Kirsten Ash' },
    { name: 'Chad Alcorn', email: 'calcorn@axon.com', manager: 'Kirsten Ash' },
    { name: 'Daniel Ruales', email: 'druales@axon.com', manager: 'Kirsten Ash' },
    { name: 'Meedy Abdulsattar', email: 'mabdulsattar@axon.com', manager: 'Kirsten Ash' },
    { name: 'Melissa Clemens', email: 'mclemens@axon.com', manager: 'Kirsten Ash' },
    { name: 'Mirage Jelani', email: 'mjelani@axon.com', manager: 'Kirsten Ash' },
    { name: 'Nikko Elliott', email: 'nelliott@axon.com', manager: 'Kirsten Ash' },
  ]

  let employeeCount = 0
  for (const emp of employeeData) {
    const manager = managerMap[emp.manager]
    if (manager) {
      await prisma.employee.upsert({
        where: { email: emp.email },
        update: { name: emp.name, managerId: manager.id },
        create: {
          name: emp.name,
          email: emp.email,
          managerId: manager.id
        }
      })
      employeeCount++
    }
  }

  console.log(`Created ${employeeCount} employees`)
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
