import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function main() {
  console.log('Creating tables in Turso...')

  // Create tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS Manager (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Employee (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      managerId INTEGER NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (managerId) REFERENCES Manager(id)
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS TravelRequest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER NOT NULL,
      customerName TEXT NOT NULL,
      customerLocation TEXT NOT NULL,
      travelDate DATETIME NOT NULL,
      returnDate DATETIME NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'planned',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employeeId) REFERENCES Employee(id)
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS AgendaItem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travelRequestId INTEGER NOT NULL,
      description TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY (travelRequestId) REFERENCES TravelRequest(id) ON DELETE CASCADE
    )
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS Denial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      travelRequestId INTEGER UNIQUE NOT NULL,
      denialReason TEXT NOT NULL,
      rescheduledDate DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (travelRequestId) REFERENCES TravelRequest(id) ON DELETE CASCADE
    )
  `)

  console.log('Tables created. Seeding data...')

  // Insert managers
  const managers = [
    { name: 'Kristine Hill', email: 'krhill@axon.com' },
    { name: 'Phil Capizzi', email: 'pcapizzi@axon.com' },
    { name: 'Emilyn Dale', email: 'edale@axon.com' },
    { name: 'Kirsten Ash', email: 'kash@axon.com' },
  ]

  for (const mgr of managers) {
    await client.execute({
      sql: 'INSERT OR IGNORE INTO Manager (name, email) VALUES (?, ?)',
      args: [mgr.name, mgr.email]
    })
  }

  // Get manager IDs
  const managerRows = await client.execute('SELECT id, name FROM Manager')
  const managerMap: Record<string, number> = {}
  for (const row of managerRows.rows) {
    managerMap[row.name as string] = row.id as number
  }

  // Insert employees
  const employees = [
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
    { name: 'Aman Singh', email: 'asingh@axon.com', manager: 'Phil Capizzi' },
    { name: 'Brandon Wahl', email: 'bwahl@axon.com', manager: 'Phil Capizzi' },
    { name: 'Ed Shuman', email: 'eshuman@axon.com', manager: 'Phil Capizzi' },
    { name: 'Edward Hallahan', email: 'ehallahan@axon.com', manager: 'Phil Capizzi' },
    { name: 'Lauren Jackson', email: 'ljackson@axon.com', manager: 'Phil Capizzi' },
    { name: 'Linda Tran', email: 'ltran@axon.com', manager: 'Phil Capizzi' },
    { name: 'Robert Otero', email: 'rotero@axon.com', manager: 'Phil Capizzi' },
    { name: 'Sayalee Lanjewar', email: 'slanjewar@axon.com', manager: 'Phil Capizzi' },
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
    { name: 'Mark Wesolowski', email: 'mwesolowski@axon.com', manager: 'Kirsten Ash' },
    { name: 'April Larsh', email: 'alarsh@axon.com', manager: 'Kirsten Ash' },
    { name: 'Chad Alcorn', email: 'calcorn@axon.com', manager: 'Kirsten Ash' },
    { name: 'Daniel Ruales', email: 'druales@axon.com', manager: 'Kirsten Ash' },
    { name: 'Meedy Abdulsattar', email: 'mabdulsattar@axon.com', manager: 'Kirsten Ash' },
    { name: 'Melissa Clemens', email: 'mclemens@axon.com', manager: 'Kirsten Ash' },
    { name: 'Mirage Jelani', email: 'mjelani@axon.com', manager: 'Kirsten Ash' },
    { name: 'Nikko Elliott', email: 'nelliott@axon.com', manager: 'Kirsten Ash' },
  ]

  for (const emp of employees) {
    const managerId = managerMap[emp.manager]
    if (managerId) {
      await client.execute({
        sql: 'INSERT OR IGNORE INTO Employee (name, email, managerId) VALUES (?, ?, ?)',
        args: [emp.name, emp.email, managerId]
      })
    }
  }

  console.log('Seeding complete!')
  
  const mgrCount = await client.execute('SELECT COUNT(*) as count FROM Manager')
  const empCount = await client.execute('SELECT COUNT(*) as count FROM Employee')
  console.log(`Managers: ${mgrCount.rows[0].count}`)
  console.log(`Employees: ${empCount.rows[0].count}`)
}

main().catch(console.error)
