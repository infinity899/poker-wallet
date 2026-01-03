// Run with: npx tsx scripts/generate-mock-data.ts

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

type SessionType = 'live' | 'online'
type GameType = 'NLH' | 'PLO' | 'PLO5' | 'Mixed'
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'RON'

interface CashSession {
  id: string
  date: string
  startTime?: string
  endTime?: string
  type: SessionType
  currency: Currency
  stake: string
  smallBlind: number
  bigBlind: number
  game: GameType
  result: number
  duration: number
  location?: string
  site?: string
  tableCount?: number
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface Tournament {
  id: string
  date: string
  type: SessionType
  currency: Currency
  buyIn: number
  fee: number
  entries: number
  winnings: number
  name: string
  venue?: string
  site?: string
  fieldSize?: number
  finishPosition?: number
  cashed?: boolean
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

const liveVenues = ['Bellagio', 'Aria', 'Wynn', 'Commerce Casino', 'Venetian']
const onlineSites = ['PokerStars', 'GGPoker', '888poker', 'partypoker', 'WPT Global']
const games: GameType[] = ['NLH', 'PLO', 'PLO5']
const liveStakes = ['1/2', '1/3', '2/5', '5/10']
const onlineStakes = ['0.10/0.25', '0.25/0.50', '0.50/1', '1/2', '2/5']
const tags = ['Deepstack', 'Turbo', 'Good Run', 'Bad Beat', 'Soft Table', 'Tough Table', 'Tilted', 'Shot Take']
const tournamentNames = [
  'Daily Deepstack',
  'Sunday Million',
  'Friday Night Special',
  'Bounty Builder',
  'High Roller',
  'Monday Night Madness',
  'Turbo Series',
  'Weekend Warrior',
  'Mini Main Event',
  'Micro Stakes Madness'
]

function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomTags(): string[] {
  const count = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0
  const selected: string[] = []
  for (let i = 0; i < count; i++) {
    const tag = randomElement(tags)
    if (!selected.includes(tag)) selected.push(tag)
  }
  return selected
}

function parseStake(stake: string): { sb: number; bb: number } {
  const parts = stake.split('/')
  return {
    sb: parseFloat(parts[0]),
    bb: parseFloat(parts[1])
  }
}

function generateSessions(count: number = 100): CashSession[] {
  const sessions: CashSession[] = []
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)

  for (let i = 0; i < count; i++) {
    const type: SessionType = Math.random() > 0.4 ? 'online' : 'live'
    const date = randomDate(startDate, endDate)
    const dateStr = date.toISOString().split('T')[0]
    const stakes = type === 'live' ? liveStakes : onlineStakes
    const stake = randomElement(stakes)
    const { sb, bb } = parseStake(stake)

    // Duration: 1-8 hours, more variance for live (longer sessions)
    const baseDuration = type === 'live' ? 180 : 90
    const variance = type === 'live' ? 300 : 180
    const duration = Math.floor(baseDuration + Math.random() * variance)

    // Result: simulate a slightly winning player (55% win rate)
    // Results vary by stake level
    const isWin = Math.random() < 0.52
    const bbMultiplier = type === 'live' ? 40 : 30
    const resultBBs = isWin
      ? Math.floor(Math.random() * bbMultiplier) + 5
      : -(Math.floor(Math.random() * (bbMultiplier - 10)) + 5)
    const result = Math.round(resultBBs * bb)

    const game: GameType = Math.random() > 0.15 ? 'NLH' : randomElement(['PLO', 'PLO5'])

    const session: CashSession = {
      id: randomId(),
      date: dateStr,
      type,
      currency: 'USD',
      stake,
      smallBlind: sb,
      bigBlind: bb,
      game,
      result,
      duration,
      tags: randomTags(),
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    }

    if (type === 'live') {
      session.location = randomElement(liveVenues)
      if (Math.random() > 0.7) {
        session.notes = randomElement([
          'Good table dynamics',
          'Loose aggressive table',
          'Nitty table, had to adjust',
          'Running good',
          'Card dead but made the most of it'
        ])
      }
    } else {
      session.site = randomElement(onlineSites)
      session.tableCount = Math.floor(Math.random() * 3) + 1
      if (Math.random() > 0.8) {
        session.notes = randomElement([
          'Multi-tabling went well',
          'Focused session',
          'Some tough spots',
          'Ran into coolers'
        ])
      }
    }

    sessions.push(session)
  }

  return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function generateTournaments(count: number = 50): Tournament[] {
  const tournaments: Tournament[] = []
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)

  for (let i = 0; i < count; i++) {
    const type: SessionType = Math.random() > 0.5 ? 'online' : 'live'
    const date = randomDate(startDate, endDate)
    const dateStr = date.toISOString().split('T')[0]

    // Buy-ins vary by type
    const buyIns = type === 'live'
      ? [100, 200, 300, 500, 1000, 1500]
      : [5, 10, 20, 50, 100, 200]
    const buyIn = randomElement(buyIns)
    const fee = Math.round(buyIn * 0.1)

    // Field size
    const fieldSize = type === 'live'
      ? Math.floor(50 + Math.random() * 300)
      : Math.floor(100 + Math.random() * 1500)

    // Re-entries (0-2)
    const entries = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0
    const totalCost = (buyIn + fee) * (entries + 1)

    // ITM rate ~18%
    const inTheMoney = Math.random() < 0.18
    let finishPosition: number
    let winnings = 0

    if (inTheMoney) {
      // Top 15% of field cash
      const itmSpots = Math.floor(fieldSize * 0.15)
      finishPosition = Math.floor(Math.random() * itmSpots) + 1

      // Prize calculation (simplified)
      const totalPrize = buyIn * fieldSize * 0.9
      if (finishPosition === 1) {
        winnings = Math.round(totalPrize * 0.22)
      } else if (finishPosition === 2) {
        winnings = Math.round(totalPrize * 0.14)
      } else if (finishPosition === 3) {
        winnings = Math.round(totalPrize * 0.10)
      } else if (finishPosition <= 5) {
        winnings = Math.round(totalPrize * 0.06)
      } else if (finishPosition <= 10) {
        winnings = Math.round(totalPrize * 0.03)
      } else {
        winnings = Math.round(totalCost * (1.5 + Math.random() * 1.5))
      }
    } else {
      // Busted position
      finishPosition = Math.floor(fieldSize * 0.15 + Math.random() * (fieldSize * 0.85))
    }

    const tournament: Tournament = {
      id: randomId(),
      date: dateStr,
      type,
      currency: 'USD',
      buyIn,
      fee,
      entries,
      winnings,
      name: randomElement(tournamentNames),
      fieldSize,
      finishPosition,
      cashed: inTheMoney,
      tags: randomTags(),
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    }

    if (type === 'live') {
      tournament.venue = randomElement(liveVenues)
    } else {
      tournament.site = randomElement(onlineSites)
    }

    if (Math.random() > 0.8) {
      tournament.notes = inTheMoney
        ? randomElement(['Played well', 'Got lucky at the right time', 'Good reads'])
        : randomElement(['Cooler spot', 'Bad beat', 'Made a mistake', 'Variance'])
    }

    tournaments.push(tournament)
  }

  return tournaments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const referenceData = {
  venues: [
    { id: '1', name: 'Bellagio', type: 'live', location: 'Las Vegas, NV' },
    { id: '2', name: 'Aria', type: 'live', location: 'Las Vegas, NV' },
    { id: '3', name: 'Wynn', type: 'live', location: 'Las Vegas, NV' },
    { id: '4', name: 'Commerce Casino', type: 'live', location: 'Los Angeles, CA' },
    { id: '5', name: 'Venetian', type: 'live', location: 'Las Vegas, NV' },
    { id: '6', name: 'PokerStars', type: 'online' },
    { id: '7', name: 'GGPoker', type: 'online' },
    { id: '8', name: '888poker', type: 'online' },
    { id: '9', name: 'partypoker', type: 'online' },
    { id: '10', name: 'WPT Global', type: 'online' }
  ],
  tags: [
    { id: '1', name: 'Deepstack', color: '#3b82f6' },
    { id: '2', name: 'Turbo', color: '#ef4444' },
    { id: '3', name: 'Good Run', color: '#22c55e' },
    { id: '4', name: 'Bad Beat', color: '#f59e0b' },
    { id: '5', name: 'Soft Table', color: '#8b5cf6' },
    { id: '6', name: 'Tough Table', color: '#64748b' },
    { id: '7', name: 'Tilted', color: '#dc2626' },
    { id: '8', name: 'Shot Take', color: '#0891b2' }
  ],
  currencies: ['USD', 'EUR', 'GBP', 'CAD', 'RON'],
  gameTypes: ['NLH', 'PLO', 'PLO5', 'Mixed']
}

// Generate data
console.log('Generating mock data...')
const sessions = generateSessions(120)
const tournaments = generateTournaments(60)

// Ensure public/data directory exists
const dataDir = join(process.cwd(), 'public', 'data')
try {
  mkdirSync(dataDir, { recursive: true })
} catch {}

// Write files
writeFileSync(join(dataDir, 'sessions.json'), JSON.stringify(sessions, null, 2))
writeFileSync(join(dataDir, 'tournaments.json'), JSON.stringify(tournaments, null, 2))
writeFileSync(join(dataDir, 'reference.json'), JSON.stringify(referenceData, null, 2))

console.log(`Generated:`)
console.log(`- ${sessions.length} cash sessions`)
console.log(`- ${tournaments.length} tournaments`)
console.log(`- Reference data`)

// Calculate some stats for verification
const totalSessionProfit = sessions.reduce((sum, s) => sum + s.result, 0)
const totalTournamentProfit = tournaments.reduce((sum, t) => {
  const cost = (t.buyIn + t.fee) * (t.entries + 1)
  return sum + (t.winnings - cost)
}, 0)

console.log(`\nStats:`)
console.log(`- Total session profit: $${totalSessionProfit.toLocaleString()}`)
console.log(`- Total tournament profit: $${totalTournamentProfit.toLocaleString()}`)
console.log(`- ITM tournaments: ${tournaments.filter(t => t.cashed).length}`)
