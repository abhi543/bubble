import { NextRequest, NextResponse } from 'next/server'

// In-memory persistent cache for quick zero-friction guest sessions across devices
const memoryStore = new Map<string, any>()

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    if (!payload || !payload.profile || !payload.profile.recoveryCode) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const code = payload.profile.recoveryCode.toUpperCase().trim()
    memoryStore.set(code, payload)
    memoryStore.set(payload.profile.id, payload)

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

