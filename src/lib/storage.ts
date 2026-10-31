/**
 * Bubble Pop Adventure - Zero-Friction Invisible Storage Engine
 * Handles instant offline persistence, anonymous animal passcodes,
 * and silent background synchronization.
 */

export interface PlayerProfile {
  id: string
  recoveryCode: string // e.g., "HAPPY-DOLPHIN-STAR-77"
  displayName: string  // e.g., "Sunny Bunny"
  activeCharacter: string
  createdAt: number
  lastSyncAt: number
}

export interface LevelRecord {
  status: 'locked' | 'unlocked' | 'completed'
  stars: number
  highScore: number
  bossDefeated: boolean
  clearedAt: number | null
}

export interface SavedGameData {
  profile: PlayerProfile
  mode: 'kids' | 'adults'
  kidsHighestLevel: number
  adultsHighestLevel: number
  kidsStarsTotal: number
  adultsStarsTotal: number
  kidsLevelsRecord: Record<number, LevelRecord>
  adultsLevelsRecord: Record<number, LevelRecord>
  unlockedCharacters: string[]
  unlockedCosmetics: string[]
  totalStars: number
}

const ADJECTIVES = [
  'HAPPY', 'SUNNY', 'BRAVE', 'COZY', 'LUCKY', 'SMART', 'SWEET', 'SHINY',
  'JOLLY', 'SPARKY', 'SUPER', 'MAGIC', 'SWIFT', 'CHEERY', 'CALM', 'BREEZY',
]

const CREATURES = [
  'DOLPHIN', 'BUNNY', 'PANDA', 'TIGER', 'OTTER', 'PUPPY', 'KITTEN', 'ROBOT',
  'KOALA', 'DUCKLING', 'WHALE', 'BEAR', 'FOX', 'PENGUIN', 'LION', 'FROG',
]

const SYMBOLS = [
  'STAR', 'MOON', 'CLOUD', 'RAINBOW', 'FLOWER', 'PLANET', 'COMET', 'BUBBLE',
  'CRYSTAL', 'HEART', 'CLOVER', 'SUN', 'SPARKLE', 'CROWN', 'SHELL', 'ROCKET',
]

/**
 * Generate a kid-friendly Animal Passcode (e.g. HAPPY-DOLPHIN-STAR-77)
 */
export function generateAnimalCode(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = CREATURES[Math.floor(Math.random() * CREATURES.length)]
  const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  const num = Math.floor(10 + Math.random() * 90)
  return `${adj}-${animal}-${symbol}-${num}`
}

/**
 * Generate a delightful default pseudonym (e.g. "Sunny Bunny")
 */
export function generateChildPseudonym(): string {
  const adj = ['Sunny', 'Happy', 'Bouncy', 'Lucky', 'Super', 'Cozy', 'Starry', 'Sparky'][Math.floor(Math.random() * 8)]
  const noun = ['Bunny', 'Dolphin', 'Rocket', 'Star', 'Panda', 'Puppy', 'Robot', 'Otter'][Math.floor(Math.random() * 8)]
  return `${adj} ${noun}`
}

const STORAGE_KEY = 'bubble_pop_save_v2'

/**
 * Get initial default save structure
 */
export function createDefaultSave(): SavedGameData {
  const code = generateAnimalCode()
  const name = generateChildPseudonym()
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'p_' + Math.random().toString(36).slice(2, 11)

  return {
    profile: {
      id,
      recoveryCode: code,
      displayName: name,
      activeCharacter: 'rocky',
      createdAt: Date.now(),
      lastSyncAt: Date.now(),
    },
    mode: 'kids',
    kidsHighestLevel: 0,
    adultsHighestLevel: 0,
    kidsStarsTotal: 0,
    adultsStarsTotal: 0,
    kidsLevelsRecord: {
      0: { status: 'unlocked', stars: 0, highScore: 0, bossDefeated: false, clearedAt: null },
    },
    adultsLevelsRecord: {
      0: { status: 'unlocked', stars: 0, highScore: 0, bossDefeated: false, clearedAt: null },
    },
    unlockedCharacters: ['rocky'],
    unlockedCosmetics: [],
    totalStars: 0,
  }
}

/**
 * Load saved progress with zero latency from LocalStorage
 */
export function loadLocalSave(): SavedGameData {
  if (typeof window === 'undefined') return createDefaultSave()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const fresh = createDefaultSave()
      saveLocalProgress(fresh)
      return fresh
    }
    const parsed = JSON.parse(raw) as SavedGameData
    // Ensure all critical structures exist
    if (!parsed.profile || !parsed.profile.recoveryCode) {
      const fresh = createDefaultSave()
      saveLocalProgress(fresh)
      return fresh
    }
    return parsed
  } catch (err) {
    return createDefaultSave()
  }
}

/**
 * Synchronous write to local storage (sub-millisecond latency)
 */
export function saveLocalProgress(data: SavedGameData): void {
  if (typeof window === 'undefined') return
  try {
    data.profile.lastSyncAt = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    // Also dispatch background cloud sync if online
    dispatchSilentCloudSync(data)
  } catch {
    /* Safe fallback in private browsing */
  }
}

/**
 * Record a level completion into the local save
 */
export function recordLevelCompletion(
  mode: 'kids' | 'adults',
  levelIndex: number,
  stars: number,
  score: number,
  isBoss: boolean
): SavedGameData {
  const save = loadLocalSave()
  const isKids = mode === 'kids'
  const recordMap = isKids ? save.kidsLevelsRecord : save.adultsLevelsRecord

  const existing = recordMap[levelIndex]
  const prevStars = existing?.stars || 0
  const prevScore = existing?.highScore || 0

  recordMap[levelIndex] = {
    status: 'completed',
    stars: Math.max(prevStars, stars),
    highScore: Math.max(prevScore, score),
    bossDefeated: isBoss || (existing ? existing.bossDefeated : false),
    clearedAt: existing?.clearedAt || Date.now(),
  }

  // Unlock next level if available (up to level 119)
  if (levelIndex < 119) {
    const nextIdx = levelIndex + 1
    if (!recordMap[nextIdx]) {
      recordMap[nextIdx] = {
        status: 'unlocked',
        stars: 0,
        highScore: 0,
        bossDefeated: false,
        clearedAt: null,
      }
    }
    if (isKids) {
      save.kidsHighestLevel = Math.max(save.kidsHighestLevel, nextIdx)
    } else {
      save.adultsHighestLevel = Math.max(save.adultsHighestLevel, nextIdx)
    }
  }

  // Recalculate stars total
  let starsSum = 0
  for (const k in recordMap) {
    starsSum += recordMap[k].stars
  }
  if (isKids) save.kidsStarsTotal = starsSum
  else save.adultsStarsTotal = starsSum
  save.totalStars = save.kidsStarsTotal + save.adultsStarsTotal

  // Automatic character unlocks based on star milestones
  if (save.totalStars >= 30 && !save.unlockedCharacters.includes('dolly')) {
    save.unlockedCharacters.push('dolly')
  }
  if (save.totalStars >= 90 && !save.unlockedCharacters.includes('bunny')) {
    save.unlockedCharacters.push('bunny')
  }
  if (save.totalStars >= 180 && !save.unlockedCharacters.includes('zippy')) {
    save.unlockedCharacters.push('zippy')
  }

  saveLocalProgress(save)
  return save
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Silent non-blocking cloud synchronization
 */
export function dispatchSilentCloudSync(data: SavedGameData): void {
  if (typeof window === 'undefined' || !navigator.onLine) return
  if (syncTimeout) clearTimeout(syncTimeout)

  syncTimeout = setTimeout(() => {
    try {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {
        // Silently swallowed - offline resiliency guarantees zero player popups
      })
    } catch {
      // Safe fallback
    }
  }, 1200)
}

