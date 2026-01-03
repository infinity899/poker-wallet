import { z } from 'zod'

export const sessionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  type: z.enum(['live', 'online']),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'RON']),
  stake: z
    .string()
    .min(1, 'Stakes are required')
    .regex(/^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/, 'Invalid format. Use format like 1/2 or 2/5'),
  game: z.enum(['NLH', 'PLO', 'PLO5', 'Mixed']),
  result: z.number({ required_error: 'Result is required' }),
  duration: z
    .number({ required_error: 'Duration is required' })
    .min(1, 'Duration must be at least 1 minute'),
  location: z.string().optional(),
  site: z.string().optional(),
  tableCount: z.number().min(1).optional(),
  buyInTotal: z.number().min(0).optional(),
  cashOutTotal: z.number().min(0).optional(),
  rakeFees: z.number().min(0).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([])
}).refine(
  data => {
    // If live, should have location; if online, should have site
    if (data.type === 'live') return true // location optional but recommended
    return true // site optional but recommended
  },
  {
    message: 'Location is recommended for live sessions, site for online',
    path: ['location']
  }
)

export const tournamentSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['live', 'online']),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'RON']),
  buyIn: z
    .number({ required_error: 'Buy-in is required' })
    .min(0, 'Buy-in must be positive'),
  fee: z.number().min(0).default(0),
  entries: z.number().int().min(0).default(0), // 0 = single entry
  winnings: z.number().min(0).default(0),
  name: z.string().min(1, 'Tournament name is required'),
  venue: z.string().optional(),
  site: z.string().optional(),
  fieldSize: z.number().int().min(1).optional(),
  finishPosition: z.number().int().min(1).optional(),
  cashed: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([])
})

export const venueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['live', 'online']),
  location: z.string().optional()
})

export const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
})

export type SessionFormData = z.infer<typeof sessionSchema>
export type TournamentFormData = z.infer<typeof tournamentSchema>
export type VenueFormData = z.infer<typeof venueSchema>
export type TagFormData = z.infer<typeof tagSchema>
