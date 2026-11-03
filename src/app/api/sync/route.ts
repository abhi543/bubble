import { NextRequest, NextResponse } from 'next/server'

// In-memory persistent cache with LRU size limit to prevent memory bloat/DoS
const memoryStore = new Map<string, any>()
const MAX_MEMORY_KEYS = 5000

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text()
    // Enforce 100KB payload limit for player save data
    if (raw.length > 100 * 1024) {
      return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 })
    }
    const payload = JSON.parse(raw)
    if (!payload || !payload.profile || typeof payload.profile.recoveryCode !== 'string' || typeof payload.profile.id !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const code = payload.profile.recoveryCode.toUpperCase().trim().slice(0, 64)
    const id = payload.profile.id.slice(0, 64)

    // Evict oldest entries if map grows beyond limit
    if (memoryStore.size >= MAX_MEMORY_KEYS) {
      const firstKey = memoryStore.keys().next().value
      if (firstKey) memoryStore.delete(firstKey)
    }

    memoryStore.set(code, payload)
    memoryStore.set(id, payload)

    return NextResponse.json({
      success: true,
      lastSyncAt: Date.now(),
      serverAcknowledged: true,
    })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')?.toUpperCase().trim()
  const playerId = searchParams.get('playerId')

  if (code && memoryStore.has(code)) {
    return NextResponse.json({ success: true, data: memoryStore.get(code) })
  }
  if (playerId && memoryStore.has(playerId)) {
    return NextResponse.json({ success: true, data: memoryStore.get(playerId) })
  }

  return NextResponse.json({ success: false, error: 'Save profile not found' }, { status: 404 })
}

