'use client'

/* ═══════════════════════════════════════════════════════════════════════
   🫧  BUBBLE POP ADVENTURE — a happy, no-violence arcade game for kids 5–10
   ═══════════════════════════════════════════════════════════════════════

   ✨ WHAT'S INSIDE (everything lives in THIS ONE FILE!)
      • A cute rocket you steer at the bottom of the screen
      • Silly smiling monsters that drift down from the sky
      • Pop them with bubbles & stars → confetti + sparkles + happy sounds!
      • 5 hearts, 3 easy levels, reward screens, cheerful music, mute button

   🕹  CONTROLS
      • Keyboard:  ← →  (or A / D) to move  •  SPACE (hold it!) to shoot
      • Touch/Mouse: drag your finger to move  •  tap the screen to shoot

   🔧  EASY TWEAKING GUIDE FOR PARENTS & KIDS
      1. CHANGE SPEEDS ....... look for "SETUP 3 · LEVELS" below
      2. CHANGE COLORS ....... look for "SETUP 1 · COLORS" below
      3. CHANGE CHARACTERS ... look for "drawRocket()" and "drawMonster()"
      4. CHANGE SOUNDS ....... look for the "GameAudio" class
      Every important number has a friendly comment next to it. Have fun! 💛

   🧪 TESTING CHEAT: add "?turbo" to the URL to make monsters appear super
      fast (handy for grown-ups who want to check the reward screens).
   ═══════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Heart,
  PartyPopper,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react'

/* ───────────────────────────────────────────────────────────────────────
   SETUP 1 · COLORS 🎨  —  change these to re-paint the whole game!
   ─────────────────────────────────────────────────────────────────────── */
const COLORS = {
  skyTop: '#a5e8ff', // top of the sky
  skyBottom: '#fff3c9', // bottom of the sky (warm glow)
  sun: '#ffd93d', // the smiling sun
  hillLight: '#8ee06e', // front grassy hill
  hillDark: '#5ec44f', // back grassy hill
  playerBody: '#ff8a5c', // rocket body (coral)
  playerTrim: '#e26a3d', // rocket outline / fins
  playerWindow: '#dff3ff', // rocket window
  flame: '#ffd93d', // rocket flame
  monsters: ['#ff8fb1', '#b18aff', '#7fd8be', '#ffb35c', '#4ecdc4'], // silly monster outfits
  confetti: ['#ff8fb1', '#ffd93d', '#7fd8be', '#b18aff', '#ff9f43', '#4ecdc4', '#ff6b6b'],
  face: '#5b4a3f', // eyes & smiles on every character
}

/* ───────────────────────────────────────────────────────────────────────
   SETUP 2 · GAME MODES 🧒🧑‍🚀  —  Kids vs Grown-Ups. Tune each one here!
     hearts         = how many hearts you get in this mode
     monsterRadius  = smallest & biggest monster size (smaller = trickier)
     shootCooldown  = seconds between bubbles (smaller = faster shooting)
     fastMusic      = true = the music loops a little quicker (extra pep!)
   ─────────────────────────────────────────────────────────────────────── */
type Mode = 'kids' | 'adults'

interface LevelConfig {
  name: string
  goal: number
  spawnEvery: number
  spawnEveryMin: number
  fallSpeed: number
  fallSpeedMax: number
  drift: number
  maxOnScreen: number
}

interface ModeConfig {
  label: string
  emoji: string
  blurb: string
  hearts: number
  monsterRadius: [number, number]
  shootCooldown: number
  fastMusic: boolean
  levels: LevelConfig[]
}

/* ── per-level settings (same meaning in both modes):
     goal          = how many monsters to pop to finish the level
     spawnEvery    = seconds between new monsters at the START of a level
     spawnEveryMin = the fastest the level ever gets at spawning
     fallSpeed     = how fast monsters fall at the start (pixels/second)
     fallSpeedMax  = how fast they fall once you're almost done
     drift         = how much they wiggle side to side
     maxOnScreen   = never more than this many monsters at once             */
const MODES: Record<Mode, ModeConfig> = {
  kids: {
    label: 'KIDS MODE',
    emoji: '🧒',
    blurb: 'slow & giggly · 5 hearts · big silly monsters',
    hearts: 5,
    monsterRadius: [22, 30],
    shootCooldown: 0.32,
    fastMusic: false,
    levels: [
      { name: 'Level 1', goal: 10, spawnEvery: 2.2, spawnEveryMin: 1.5, fallSpeed: 45, fallSpeedMax: 80, drift: 22, maxOnScreen: 4 },
      { name: 'Level 2', goal: 15, spawnEvery: 1.8, spawnEveryMin: 1.1, fallSpeed: 60, fallSpeedMax: 105, drift: 30, maxOnScreen: 5 },
      { name: 'Level 3', goal: 20, spawnEvery: 1.5, spawnEveryMin: 0.9, fallSpeed: 75, fallSpeedMax: 130, drift: 38, maxOnScreen: 6 },
    ],
  },
  adults: {
    label: 'GROWN-UPS MODE',
    emoji: '🧑‍🚀',
    blurb: 'fast & tricky · 3 hearts · tiny sneaky monsters',
    hearts: 3,
    monsterRadius: [15, 22],
    shootCooldown: 0.26,
    fastMusic: true,
    levels: [
      { name: 'Level 1', goal: 15, spawnEvery: 1.5, spawnEveryMin: 0.9, fallSpeed: 95, fallSpeedMax: 170, drift: 45, maxOnScreen: 6 },
      { name: 'Level 2', goal: 22, spawnEvery: 1.2, spawnEveryMin: 0.7, fallSpeed: 115, fallSpeedMax: 210, drift: 60, maxOnScreen: 8 },
      { name: 'Level 3', goal: 30, spawnEvery: 1.0, spawnEveryMin: 0.55, fallSpeed: 135, fallSpeedMax: 250, drift: 75, maxOnScreen: 10 },
    ],
  },
}

const levelsOf = (m: Mode): LevelConfig[] => MODES[m].levels
const FONT = '"Comic Sans MS", "Chalkboard SE", "Comic Neue", system-ui, sans-serif'

/* Testing cheat: add "?turbo" to the URL and monsters appear crazy fast
   and each level only needs 2 pops (handy for grown-ups checking rewards).
   It is detected inside the game (client-side only) to keep SSR happy. */

const PLAYER = {
  speed: 340, // how fast the rocket slides left/right (pixels per second)
  shotSpeed: 460, // how fast bubbles fly upward
}

/* ───────────────────────────── tiny helpers ─────────────────────────── */
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/* ───────────────────────────── game types ───────────────────────────── */
type UIState = 'menu' | 'playing' | 'levelClear' | 'over' | 'won'

interface Monster {
  x: number
  y: number
  baseX: number
  r: number
  color: string
  kind: number // 0 = blob · 1 = balloon · 2 = star critter
  wob: number // wobble timer (side-to-side wiggle)
  wobSpeed: number
  drift: number
  speedMul: number // each monster is a tiny bit faster/slower than its friends
  blink: number // counts down to the next cute blink
}

interface Shot {
  x: number
  y: number
  vy: number
  r: number
  kind: 'bubble' | 'star'
  wob: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  rot: number
  vr: number
  kind: 'confetti' | 'sparkle' | 'ring' | 'text'
  text?: string
}

interface Cloud {
  x: number
  y: number
  s: number
  v: number
}

interface GameData {
  state: UIState
  w: number
  h: number
  turbo: boolean // "?turbo" testing mode
  time: number // total seconds elapsed (for animations)
  player: { x: number; tilt: number; cool: number }
  targetX: number | null // finger/mouse position while dragging
  dragging: boolean
  monsters: Monster[]
  shots: Shot[]
  parts: Particle[]
  clouds: Cloud[]
  mode: Mode // 'kids' = gentle · 'adults' = tricky
  level: number // index into the level list of the current mode
  popped: number // monsters popped this level
  score: number // total stars collected (across all levels)
  hearts: number
  spawnT: number // countdown until the next monster appears
  shotIndex: number // alternates bubble / star
}

function freshGame(): GameData {
  return {
    state: 'menu',
    w: 800,
    h: 600,
    turbo: typeof window !== 'undefined' && window.location.search.includes('turbo'),
    mode: 'kids',
    time: 0,
    player: { x: 400, tilt: 0, cool: 0 },
    targetX: null,
    dragging: false,
    monsters: [],
    shots: [],
    parts: [],
    clouds: Array.from({ length: 4 }, (_, i) => ({
      x: rand(0, 900),
      y: 40 + i * 55 + rand(0, 30),
      s: rand(0.7, 1.3),
      v: rand(8, 20), // cloud drift speed
    })),
    level: 0,
    popped: 0,
    score: 0,
    hearts: MODES.kids.hearts,
    spawnT: 0.8,
    shotIndex: 0,
  }
}

/* Effective goal for the current level (turbo mode shrinks it for testing) */
const goalOf = (g: GameData) => (g.turbo ? 2 : levelsOf(g.mode)[g.level].goal)

/* ═══════════════════════════════════════════════════════════════════════
   🔊 SOUND ENGINE — every beep is generated with the Web Audio API,
   so there are no sound files to download. Tweak the numbers freely!
   ═══════════════════════════════════════════════════════════════════════ */
class GameAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private musicTimer: ReturnType<typeof setInterval> | null = null
  private step = 0
  private nextTime = 0
  private stepDur = 0.25 // one 8th-note; grown-ups mode gets a pepzier tempo
  muted = false

  /* Create the audio context lazily (browsers require a user gesture first) */
  init() {
    if (typeof window === 'undefined') return
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.ctx = new AC()
        this.master = this.ctx.createGain()
        this.master.gain.value = this.muted ? 0 : 0.9
        this.master.connect(this.ctx.destination)
        this.musicGain = this.ctx.createGain()
        this.musicGain.gain.value = 0.5 // music a bit quieter than effects
        this.musicGain.connect(this.master)
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
    } catch {
      /* no audio available — the game still works silently */
    }
  }

  setMuted(m: boolean) {
    this.muted = m
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02)
  }

  private f(midi: number) {
    return 440 * Math.pow(2, (midi - 69) / 12)
  }

  /* One little note with a soft envelope */
  private tone(o: {
    freq: number
    time: number
    dur: number
    type?: OscillatorType
    vol?: number
    glide?: number
    dest?: GainNode | null
  }) {
    if (!this.ctx || !this.master) return
    const { freq, time, dur, type = 'sine', vol = 0.2, glide, dest = this.master } = o
    const t = Math.max(time, this.ctx.currentTime)
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (glide) osc.frequency.exponentialRampToValueAtTime(glide, t + dur)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(dest)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  /* ── SOUND EFFECTS ────────────────────────────────────────────────── */
  click() {
    this.init()
    if (!this.ctx) return
    this.tone({ freq: 750, time: this.ctx.currentTime, dur: 0.07, vol: 0.12, glide: 980 })
  }

  /* soft bubbly "pew" when shooting */
  shoot() {
    this.init()
    if (!this.ctx) return
    this.tone({ freq: 340, time: this.ctx.currentTime, dur: 0.11, vol: 0.14, glide: 640 })
  }

  /* happy musical "pop!" — each pop chimes a different happy note */
  pop() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const base = pick([523.25, 587.33, 659.25, 783.99, 880])
    this.tone({ freq: base, time: t, dur: 0.18, type: 'triangle', vol: 0.22 })
    this.tone({ freq: base * 2, time: t + 0.04, dur: 0.12, vol: 0.09 })
  }

  /* gentle "oops" when a monster slips past — friendly, never scary */
  oops() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.tone({ freq: 392, time: t, dur: 0.15, type: 'triangle', vol: 0.18 })
    this.tone({ freq: 311, time: t + 0.16, dur: 0.28, type: 'triangle', vol: 0.18 })
  }

  /* little fanfare when a level is complete */
  levelUp() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const notes = [72, 76, 79, 84] // C5 E5 G5 C6
    notes.forEach((n, i) =>
      this.tone({ freq: this.f(n), time: t + i * 0.1, dur: i === 3 ? 0.45 : 0.18, type: 'triangle', vol: 0.2 })
    )
  }

  /* BIG happy fanfare for finishing all three levels */
  win() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const seq: Array<[number, number, number]> = [
      [72, 0, 0.14],
      [76, 0.12, 0.14],
      [79, 0.24, 0.14],
      [84, 0.36, 0.3],
      [79, 0.6, 0.12],
      [84, 0.72, 0.14],
      [88, 0.9, 0.6],
    ]
    seq.forEach(([n, dt, dur]) =>
      this.tone({ freq: this.f(n), time: t + dt, dur, type: 'triangle', vol: 0.2 })
    )
  }

  /* soft, encouraging jingle for "Great try!" — no sad trombones here */
  gameOverJingle() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.tone({ freq: this.f(64), time: t, dur: 0.22, type: 'triangle', vol: 0.16 })
    this.tone({ freq: this.f(60), time: t + 0.2, dur: 0.22, type: 'triangle', vol: 0.16 })
    this.tone({ freq: this.f(57), time: t + 0.42, dur: 0.5, type: 'triangle', vol: 0.16 })
  }

  /* ── MUSIC LOOP 🎵 — a bouncy 8-bar tune that repeats forever ────────
     32 steps of 8th-notes at 120 BPM. Chords: C → Am → F → G.          */
  startMusic(fast = false) {
    this.init()
    if (!this.ctx || this.musicTimer) return
    this.stepDur = fast ? 0.227 : 0.25 // 132 BPM vs 120 BPM
    this.step = 0
    this.nextTime = this.ctx.currentTime + 0.1
    this.musicTimer = setInterval(() => this.scheduleMusic(), 100)
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer)
      this.musicTimer = null
    }
  }

  private scheduleMusic() {
    if (!this.ctx) return
    const STEP = this.stepDur // one 8th-note at the current tempo
    while (this.nextTime < this.ctx.currentTime + 0.4) {
      this.playMusicStep(this.step, this.nextTime)
      this.step = (this.step + 1) % 32
      this.nextTime += STEP
    }
  }

  private playMusicStep(s: number, t: number) {
    if (!this.musicGain) return
    // melody (midi notes, 0 = rest) — 4 bars of pure pentatonic happiness
    const MEL = [72, 0, 76, 0, 79, 0, 76, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, 0, 76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, 0]
    // bass roots: C  A  F  G (one per bar)
    const BASS = [48, 45, 41, 43]
    if (MEL[s]) this.tone({ freq: this.f(MEL[s]), time: t, dur: 0.22, type: 'triangle', vol: 0.15, dest: this.musicGain })
    if (s % 8 === 0) this.tone({ freq: this.f(BASS[(s / 8) | 0]), time: t, dur: 0.5, type: 'sine', vol: 0.2, dest: this.musicGain })
    if (s % 8 === 4) this.tone({ freq: this.f(BASS[(s / 8) | 0]) + 12, time: t, dur: 0.3, type: 'sine', vol: 0.1, dest: this.musicGain })
    if (s % 2 === 1) this.tone({ freq: 2100, time: t, dur: 0.03, vol: 0.025, dest: this.musicGain }) // tiny bounce tick
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   🎨 DRAWING HELPERS — change these to redesign the characters!
   ═══════════════════════════════════════════════════════════════════════ */
function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/* A five-pointed (or any-pointed!) star path */
function starPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
  points: number,
  rot: number
) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? outer : inner
    const a = rot + (i * Math.PI) / points
    const px = x + Math.cos(a) * rr
    const py = y + Math.sin(a) * rr
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

/* Every character shares this happy face 🙂 */
function happyFace(ctx: CanvasRenderingContext2D, r: number, blinking: boolean, scale = 1, dy = 0) {
  const ex = r * 0.34 * scale
  const ey = -r * 0.1 + dy
  const er = r * 0.2 * scale
  if (blinking) {
    // eyes closed = two happy little arcs
    ctx.strokeStyle = COLORS.face
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(-ex, ey, er * 0.9, Math.PI * 1.1, Math.PI * 1.9)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(ex, ey, er * 0.9, Math.PI * 1.1, Math.PI * 1.9)
    ctx.stroke()
  } else {
    ctx.fillStyle = '#ffffff'
    circle(ctx, -ex, ey, er)
    circle(ctx, ex, ey, er)
    ctx.fillStyle = COLORS.face
    circle(ctx, -ex, ey + er * 0.25, er * 0.45)
    circle(ctx, ex, ey + er * 0.25, er * 0.45)
  }
  // the smile 🙂
  ctx.strokeStyle = COLORS.face
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(0, dy + r * 0.12, r * 0.3, Math.PI * 0.2, Math.PI * 0.8)
  ctx.stroke()
  // rosy cheeks
  ctx.fillStyle = 'rgba(255,110,150,0.35)'
  circle(ctx, -r * 0.55, dy + r * 0.1, r * 0.14)
  circle(ctx, r * 0.55, dy + r * 0.1, r * 0.14)
}

/* ☁️ one puffy cloud */
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  circle(ctx, 0, 0, 22 * s)
  circle(ctx, 20 * s, 5 * s, 16 * s)
  circle(ctx, -20 * s, 6 * s, 15 * s)
  circle(ctx, 4 * s, -10 * s, 15 * s)
  ctx.restore()
}

/* 🌄 the whole cheerful background: sky, smiling sun, clouds, hills, flowers */
function drawBackground(ctx: CanvasRenderingContext2D, g: GameData) {
  const { w, h } = g
  // sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, COLORS.skyTop)
  grad.addColorStop(1, COLORS.skyBottom)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // ☀️ smiling sun with slowly spinning rays
  const sx = w - 90
  const sy = 92
  ctx.save()
  ctx.translate(sx, sy)
  ctx.rotate(g.time * 0.15)
  ctx.fillStyle = 'rgba(255,217,61,0.55)'
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4)
    ctx.beginPath()
    ctx.moveTo(0, -42)
    ctx.lineTo(7, -60)
    ctx.lineTo(-7, -60)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
  ctx.fillStyle = COLORS.sun
  circle(ctx, sx, sy, 34)
  ctx.fillStyle = COLORS.face
  circle(ctx, sx - 11, sy - 5, 3)
  circle(ctx, sx + 11, sy - 5, 3)
  ctx.strokeStyle = COLORS.face
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(sx, sy + 2, 10, Math.PI * 0.15, Math.PI * 0.85)
  ctx.stroke()

  // ☁️ drifting clouds
  for (const c of g.clouds) drawCloud(ctx, c.x, c.y, c.s)

  // rolling hills
  ctx.fillStyle = COLORS.hillDark
  ctx.beginPath()
  ctx.ellipse(w * 0.22, h + 60, w * 0.55, 130, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = COLORS.hillLight
  ctx.beginPath()
  ctx.ellipse(w * 0.82, h + 70, w * 0.55, 120, 0, 0, Math.PI * 2)
  ctx.fill()

  // tiny flowers on the hills 🌸
  for (let i = 0; i < 5; i++) {
    const fx = w * ((i + 0.5) / 5)
    const fy = h - 26 + (i % 2) * 7
    ctx.fillStyle = i % 2 === 0 ? '#ff9ec4' : '#ffffff'
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 + i
      circle(ctx, fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 4.5)
    }
    ctx.fillStyle = COLORS.sun
    circle(ctx, fx, fy, 4)
  }
}

/* 🚀 THE PLAYER — a friendly rocket with a smiley pilot.
   Want a different character? Redraw the shapes in this function! */
function drawPlayer(ctx: CanvasRenderingContext2D, g: GameData) {
  const p = g.player
  const py = g.h - 96 + Math.sin(g.time * 2.2) * 4 // gentle hover bob
  ctx.save()
  ctx.translate(p.x, py)
  ctx.rotate(p.tilt)

  // 🔥 flame (drawn first so it sits behind the rocket) — flickers happily
  const fl = 1 + Math.sin(g.time * 24) * 0.18
  ctx.fillStyle = COLORS.flame
  ctx.beginPath()
  ctx.ellipse(0, 42, 9 * fl, 16 * fl, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ff9f43'
  ctx.beginPath()
  ctx.ellipse(0, 47, 5 * fl, 9 * fl, 0, 0, Math.PI * 2)
  ctx.fill()

  // fins
  ctx.fillStyle = COLORS.playerTrim
  ctx.beginPath()
  ctx.moveTo(-14, 12)
  ctx.quadraticCurveTo(-30, 26, -26, 38)
  ctx.quadraticCurveTo(-18, 30, -10, 28)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(14, 12)
  ctx.quadraticCurveTo(30, 26, 26, 38)
  ctx.quadraticCurveTo(18, 30, 10, 28)
  ctx.closePath()
  ctx.fill()

  // body
  roundRectPath(ctx, -18, -34, 36, 68, 18)
  ctx.fillStyle = COLORS.playerBody
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = COLORS.playerTrim
  ctx.stroke()

  // round window with the pilot's happy face
  ctx.beginPath()
  ctx.arc(0, -4, 12, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.playerWindow
  ctx.fill()
  ctx.strokeStyle = COLORS.playerTrim
  ctx.stroke()
  ctx.fillStyle = COLORS.face
  circle(ctx, -4, -8, 1.9)
  circle(ctx, 4, -8, 1.9)
  ctx.strokeStyle = COLORS.face
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, -6, 5.5, Math.PI * 0.2, Math.PI * 0.8)
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,110,150,0.4)'
  circle(ctx, -8.5, -2, 2.2)
  circle(ctx, 8.5, -2, 2.2)

  // antenna with a golden ball
  ctx.strokeStyle = COLORS.playerTrim
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, -34)
  ctx.lineTo(0, -44)
  ctx.stroke()
  ctx.fillStyle = COLORS.flame
  circle(ctx, 0, -47, 4.5)
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  circle(ctx, -1.5, -48.5, 1.4)

  ctx.restore()
}

/* 👾 THE MONSTERS — three silly, smiling kinds (never scary!).
   kind 0 = round blob with antennae · kind 1 = balloon · kind 2 = star critter */
function drawMonster(ctx: CanvasRenderingContext2D, m: Monster, time: number) {
  const r = m.r
  ctx.save()
  ctx.translate(m.x, m.y)
  ctx.rotate(Math.sin(m.wob) * 0.09) // gentle wobble
  const outline = 'rgba(0,0,0,0.12)'

  if (m.kind === 0) {
    /* round blob */
    // antennae with golden balls
    ctx.strokeStyle = outline
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(side * r * 0.4, -r * 0.75)
      ctx.lineTo(side * r * 0.55, -r * 1.25)
      ctx.stroke()
      ctx.fillStyle = COLORS.sun
      circle(ctx, side * r * 0.58, -r * 1.32, r * 0.16)
    }
    // body
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 3
    ctx.stroke()
    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    circle(ctx, -r * 0.35, -r * 0.42, r * 0.16)
    happyFace(ctx, r, m.blink < 0 && m.blink > -0.15)
  } else if (m.kind === 1) {
    /* balloon on a string */
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, r)
    ctx.quadraticCurveTo(Math.sin(time * 3 + m.wob) * 8, r * 1.5, 0, r * 1.9)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.82, r, 0, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 3
    ctx.stroke()
    // knot
    ctx.fillStyle = m.color
    ctx.beginPath()
    ctx.moveTo(-5, r)
    ctx.lineTo(5, r)
    ctx.lineTo(0, r - 8)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    circle(ctx, -r * 0.3, -r * 0.4, r * 0.14)
    happyFace(ctx, r * 0.95, m.blink < 0 && m.blink > -0.15)
  } else {
    /* star critter ⭐ */
    starPath(ctx, 0, 0, r * 1.3, r * 0.62, 5, -Math.PI / 2 + Math.sin(m.wob) * 0.15)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.stroke()
    happyFace(ctx, r * 0.75, m.blink < 0 && m.blink > -0.15)
  }
  ctx.restore()
}

/* 🫧 the bubbles & stars you shoot */
function drawShot(ctx: CanvasRenderingContext2D, s: Shot) {
  if (s.kind === 'bubble') {
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(205,242,255,0.85)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(110,190,235,0.95)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    circle(ctx, s.x - 3.5, s.y - 3.5, 3)
  } else {
    starPath(ctx, s.x, s.y, s.r + 2, (s.r + 2) * 0.45, 5, s.wob * 2 - Math.PI / 2)
    ctx.fillStyle = COLORS.sun
    ctx.fill()
    ctx.strokeStyle = '#e8a800'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   🎉 PARTICLES — confetti, sparkles, pop-rings & floating text
   ═══════════════════════════════════════════════════════════════════════ */
function addText(g: GameData, x: number, y: number, text: string, color: string) {
  g.parts.push({
    x, y, vx: 0, vy: -48, life: 1, maxLife: 1, color, size: 0, rot: 0, vr: 0, kind: 'text', text,
  })
}

/* the big happy burst when a monster pops! */
function burst(g: GameData, x: number, y: number, color: string) {
  // expanding ring
  g.parts.push({ x, y, vx: 0, vy: 0, life: 0.35, maxLife: 0.35, color: '#ffd93d', size: 12, rot: 0, vr: 0, kind: 'ring' })
  // confetti pieces
  for (let i = 0; i < 13; i++) {
    g.parts.push({
      x, y,
      vx: rand(-170, 170), vy: rand(-280, -60),
      life: rand(0.7, 1.15), maxLife: 1.15,
      color: pick(COLORS.confetti),
      size: rand(5, 9),
      rot: rand(0, 6), vr: rand(-10, 10),
      kind: 'confetti',
    })
  }
  // golden sparkles
  for (let i = 0; i < 6; i++) {
    g.parts.push({
      x, y,
      vx: rand(-90, 90), vy: rand(-140, -10),
      life: rand(0.4, 0.8), maxLife: 0.8,
      color: pick(['#fff8c9', '#ffd93d', '#ffffff']),
      size: rand(2.5, 4.5),
      rot: rand(0, 6), vr: rand(-6, 6),
      kind: 'sparkle',
    })
  }
  addText(g, x, y - 6, '+1 ⭐', '#ff8fb1')
  // keep the particle list short & sweet
  if (g.parts.length > 260) g.parts.splice(0, g.parts.length - 260)
}

/* giant confetti storm for the final victory screen */
function bigCelebration(g: GameData) {
  for (let i = 0; i < 50; i++) {
    g.parts.push({
      x: rand(0, g.w), y: rand(-g.h * 0.4, -10),
      vx: rand(-60, 60), vy: rand(60, 170),
      life: rand(1.6, 2.8), maxLife: 2.8,
      color: pick(COLORS.confetti),
      size: rand(6, 11),
      rot: rand(0, 6), vr: rand(-8, 8),
      kind: 'confetti',
    })
  }
}

function updateParticles(g: GameData, dt: number) {
  for (let i = g.parts.length - 1; i >= 0; i--) {
    const p = g.parts[i]
    p.life -= dt
    if (p.life <= 0) {
      g.parts.splice(i, 1)
      continue
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rot += p.vr * dt
    if (p.kind === 'confetti') {
      p.vy += 420 * dt // confetti tumbles down
      p.vx *= 1 - 1.2 * dt
    } else if (p.kind === 'sparkle') {
      p.vy += 140 * dt
    } else if (p.kind === 'ring') {
      p.size += 190 * dt // ring grows outward
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, g: GameData) {
  for (const p of g.parts) {
    const a = clamp(p.life / p.maxLife, 0, 1)
    ctx.globalAlpha = a
    if (p.kind === 'confetti') {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62)
      ctx.restore()
    } else if (p.kind === 'sparkle') {
      ctx.fillStyle = p.color
      starPath(ctx, p.x, p.y, p.size + 2, (p.size + 2) * 0.4, 4, p.rot)
      ctx.fill()
    } else if (p.kind === 'ring') {
      ctx.strokeStyle = p.color
      ctx.lineWidth = 3.5 * a
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.stroke()
    } else if (p.kind === 'text' && p.text) {
      ctx.font = `bold 22px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.strokeText(p.text, p.x, p.y)
      ctx.fillStyle = p.color
      ctx.fillText(p.text, p.x, p.y)
    }
    ctx.globalAlpha = 1
  }
}

/* everything currently on screen, painted in the right order */
function render(ctx: CanvasRenderingContext2D, g: GameData) {
  drawBackground(ctx, g)
  for (const m of g.monsters) drawMonster(ctx, m, g.time)
  for (const s of g.shots) drawShot(ctx, s)
  drawPlayer(ctx, g)
  drawParticles(ctx, g)
}

/* ═══════════════════════════════════════════════════════════════════════
   🕹 THE GAME COMPONENT — wires everything together
   ═══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const gRef = useRef<GameData | null>(null)
  const audioRef = useRef<GameAudio | null>(null)
  const controlsRef = useRef<{ start: (mode: Mode) => void; next: () => void; toggleMute: () => void; toMenu: () => void } | null>(null)

  // React state = only the pretty HUD & overlay screens (the game itself
  // runs at 60fps inside refs so React never slows it down)
  const [ui, setUi] = useState<UIState>('menu')
  // NOTE: the first render must match the server exactly, so the goal/hearts
  // here are always the kids values — the loop corrects them right after mounting.
  const [hud, setHud] = useState({
    level: 0,
    popped: 0,
    goal: MODES.kids.levels[0].goal,
    hearts: MODES.kids.hearts,
    maxHearts: MODES.kids.hearts,
    score: 0,
    mode: 'kids' as Mode,
  })
  const [stars, setStars] = useState(3)
  const [muted, setMuted] = useState(false)
  const [hurtKey, setHurtKey] = useState(0) // changing this re-plays the heart-shake
  const [lastMode, setLastMode] = useState<Mode | null>(null) // ring the mode you played last time

  // remember which mode was played last visit (purely cosmetic highlight)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const saved = localStorage.getItem('bubblePopMode')
        if (saved === 'kids' || saved === 'adults') setLastMode(saved)
      } catch {
        /* private browsing — no problem */
      }
    }, 0)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const g = freshGame()
    gRef.current = g
    // Debug handle for curious grown-ups: open the browser console and type
    // __bubbleGame to peek at (or tweak!) the live game state.
    if (typeof window !== 'undefined') (window as unknown as { __bubbleGame: GameData }).__bubbleGame = g
    const audio = new GameAudio()
    audioRef.current = audio
    const keys = { left: false, right: false, shoot: false }
    const drag = { active: false, id: -1, startX: 0, t0: 0, moved: false }

    /* keep the canvas crisp on every screen size */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      g.w = wrap.clientWidth
      g.h = wrap.clientHeight
      canvas.width = Math.round(g.w * dpr)
      canvas.height = Math.round(g.h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.player.x = clamp(g.player.x, 40, g.w - 40)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    /* copy game values into React state — but only when they actually change */
    const syncHud = () => {
      setHud((prev) => {
        const goal = goalOf(g)
        const maxHearts = MODES[g.mode].hearts
        if (prev.level === g.level && prev.popped === g.popped && prev.hearts === g.hearts && prev.score === g.score && prev.goal === goal && prev.mode === g.mode)
          return prev
        return { level: g.level, popped: g.popped, goal, hearts: g.hearts, maxHearts, score: g.score, mode: g.mode }
      })
    }

    /* 🫧 fire a bubble (or a star!) */
    const shootNow = () => {
      if (g.state !== 'playing' || g.player.cool > 0) return
      g.player.cool = MODES[g.mode].shootCooldown
      g.shotIndex++
      const kind: 'bubble' | 'star' = g.shotIndex % 2 === 1 ? 'bubble' : 'star'
      const py = g.h - 96
      g.shots.push({ x: g.player.x, y: py - 40, vy: -PLAYER.shotSpeed, r: kind === 'star' ? 12 : 10, kind, wob: rand(0, 6) })
      audio.shoot()
    }

    /* start a (new) level with a cheerful GO! banner */
    const beginLevel = () => {
      g.popped = 0
      g.monsters.length = 0
      g.shots.length = 0
      g.spawnT = 0.6
      g.player.x = g.w / 2
      g.player.cool = 0
      g.dragging = false
      g.targetX = null
      g.state = 'playing'
      setUi('playing')
      addText(g, g.w / 2, g.h * 0.35, `${levelsOf(g.mode)[g.level].name} — GO!`, '#ff8fb1')
      audio.startMusic(MODES[g.mode].fastMusic)
      syncHud()
    }

    const start = (mode: Mode) => {
      audio.init()
      audio.click()
      g.mode = mode
      g.level = 0
      g.score = 0
      g.hearts = MODES[mode].hearts
      try {
        localStorage.setItem('bubblePopMode', mode) // remember it for next visit
      } catch {
        /* private browsing — no problem */
      }
      beginLevel()
    }

    const next = () => {
      audio.click()
      g.level++
      g.hearts = MODES[g.mode].hearts // fresh hearts every level — kind & easy!
      beginLevel()
    }

    /* go back to the menu (lets you switch between kids & grown-ups mode) */
    const toMenu = () => {
      audio.click()
      g.state = 'menu'
      g.monsters.length = 0
      g.shots.length = 0
      audio.stopMusic()
      setUi('menu')
      syncHud()
    }

    /* level finished! pop the leftovers into confetti and show the reward */
    const completeLevel = () => {
      for (const m of g.monsters) {
        burst(g, m.x, m.y, m.color)
        g.score++
      }
      g.monsters.length = 0
      g.shots.length = 0
      const maxHearts = MODES[g.mode].hearts
      const earned = g.hearts >= maxHearts ? 3 : g.hearts >= Math.ceil(maxHearts / 2) ? 2 : 1
      setStars(earned)
      if (g.level >= levelsOf(g.mode).length - 1) {
        bigCelebration(g)
        g.state = 'won'
        setUi('won')
        audio.stopMusic()
        audio.win()
      } else {
        g.state = 'levelClear'
        setUi('levelClear')
        audio.levelUp()
      }
      syncHud()
    }

    /* a monster reached the ground — lose one heart, stay cheerful */
    const loseHeart = (m: Monster) => {
      g.hearts--
      setHurtKey((k) => k + 1)
      audio.oops()
      addText(g, clamp(m.x, 60, g.w - 60), g.h - 150, 'Oops!', '#ff8fb1')
      if (g.hearts <= 0) {
        g.state = 'over'
        setUi('over')
        audio.stopMusic()
        audio.gameOverJingle()
      }
      syncHud()
    }

    /* 👾 make a new silly monster at the top of the sky */
    const spawnMonster = (L: LevelConfig) => {
      const [rMin, rMax] = MODES[g.mode].monsterRadius // grown-ups get tinier targets!
      const r = rand(rMin, rMax)
      const baseX = rand(r + 12, g.w - r - 12)
      g.monsters.push({
        x: baseX,
        baseX,
        y: -r - 12,
        r,
        color: pick(COLORS.monsters),
        kind: Math.floor(rand(0, 3)),
        wob: rand(0, Math.PI * 2),
        wobSpeed: rand(1.5, 3),
        drift: L.drift * rand(0.6, 1.2),
        speedMul: rand(0.85, 1.15),
        blink: rand(1, 3),
      })
    }

    /* ════════ THE HEARTBEAT: runs ~60 times per second ════════ */
    const update = (dt: number) => {
      g.time += dt
      // clouds drift in every state (even behind the menus — so cozy)
      for (const c of g.clouds) {
        c.x -= c.v * dt
        if (c.x < -120) {
          c.x = g.w + 120
          c.y = rand(30, g.h * 0.35)
        }
      }
      updateParticles(g, dt)
      if (g.state !== 'playing') return

      /* ── player movement ── */
      const p = g.player
      let vx = 0
      if (keys.left) vx -= PLAYER.speed
      if (keys.right) vx += PLAYER.speed
      if (g.dragging && g.targetX !== null) {
        vx = clamp((g.targetX - p.x) * 10, -PLAYER.speed * 1.4, PLAYER.speed * 1.4)
      }
      p.x = clamp(p.x + vx * dt, 40, g.w - 40)
      const lean = clamp(vx / PLAYER.speed, -1, 1) * 0.22
      p.tilt += (lean - p.tilt) * Math.min(1, dt * 10)
      p.cool -= dt
      if (keys.shoot) shootNow()

      /* ── spawning: slow at first, gently speeding up ── */
      const L = levelsOf(g.mode)[g.level]
      const goal = goalOf(g)
      const progress = Math.min(1, g.popped / goal)
      g.spawnT -= dt
      if (g.spawnT <= 0 && g.monsters.length < L.maxOnScreen) {
        spawnMonster(L)
        const gap = lerp(L.spawnEvery, L.spawnEveryMin, progress) * (g.turbo ? 0.12 : 1) * rand(0.75, 1.25)
        g.spawnT = gap
      }

      /* ── monsters wobbling down ── */
      const fall = lerp(L.fallSpeed, L.fallSpeedMax, progress)
      for (let i = g.monsters.length - 1; i >= 0; i--) {
        const m = g.monsters[i]
        m.y += fall * m.speedMul * dt
        m.wob += m.wobSpeed * dt
        m.x = clamp(m.baseX + Math.sin(m.wob) * m.drift, m.r, g.w - m.r)
        m.blink -= dt
        if (m.blink < -0.15) m.blink = rand(2, 4)
        if (m.y - m.r > g.h - 14) {
          g.monsters.splice(i, 1)
          loseHeart(m)
          if (g.state !== 'playing') return
        }
      }

      /* ── bubbles flying up & popping monsters ── */
      for (let i = g.shots.length - 1; i >= 0; i--) {
        const s = g.shots[i]
        s.y += s.vy * dt
        s.wob += dt * 6
        s.x += Math.sin(s.wob) * 9 * dt
        if (s.y < -30) {
          g.shots.splice(i, 1)
          continue
        }
        for (let j = g.monsters.length - 1; j >= 0; j--) {
          const m = g.monsters[j]
          const dx = s.x - m.x
          const dy = s.y - m.y
          const rr = m.r + s.r // generous hitboxes = happy kids
          if (dx * dx + dy * dy < rr * rr) {
            g.shots.splice(i, 1)
            g.monsters.splice(j, 1)
            burst(g, m.x, m.y, m.color) // confetti + sparkles! 🎉
            g.popped++
            g.score++
            audio.pop()
            if (g.popped >= goal) completeLevel()
            break
          }
        }
        if (g.state !== 'playing') return
      }
      syncHud()
    }

    /* ── keyboard controls ── */
    const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Spacebar']
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameKeys.includes(e.key)) e.preventDefault() // stop the page from scrolling
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        keys.shoot = true
        audio.init()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.shoot = false
    }
    const onBlur = () => {
      keys.left = keys.right = keys.shoot = false // no stuck keys when tab loses focus
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    /* ── touch & mouse controls (pointer events cover both) ──
       drag = move the rocket · quick tap = shoot 🫧                */
    const rectX = (e: PointerEvent) => e.clientX - canvas.getBoundingClientRect().left
    const onPointerDown = (e: PointerEvent) => {
      audio.init()
      if (drag.active) return
      drag.active = true
      drag.id = e.pointerId
      drag.startX = rectX(e)
      drag.t0 = performance.now()
      drag.moved = false
      canvas.setPointerCapture(e.pointerId)
      if (g.state === 'playing') {
        g.dragging = true
        g.targetX = drag.startX
      }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active || e.pointerId !== drag.id) return
      const x = rectX(e)
      if (Math.abs(x - drag.startX) > 12) drag.moved = true
      if (g.state === 'playing' && g.dragging) g.targetX = x
    }
    const onPointerUp = (e: PointerEvent) => {
      if (!drag.active || e.pointerId !== drag.id) return
      drag.active = false
      g.dragging = false
      const quick = performance.now() - drag.t0 < 300
      if (g.state === 'playing' && !drag.moved && quick) shootNow() // it was a tap!
    }
    const onPointerCancel = () => {
      drag.active = false
      g.dragging = false
    }
    const onContextMenu = (e: Event) => e.preventDefault()
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerCancel)
    canvas.addEventListener('contextmenu', onContextMenu)

    /* buttons in the overlays call these through the ref */
    const toggleMute = () => {
      audio.init()
      audio.setMuted(!audio.muted)
      setMuted(audio.muted)
      audio.click()
    }
    controlsRef.current = { start, next, toggleMute, toMenu }

    /* ── go! ── */
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) // clamp dt so pauses never cause jumps
      last = now
      update(dt)
      render(ctx, g)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerCancel)
      canvas.removeEventListener('contextmenu', onContextMenu)
      audio.stopMusic()
      controlsRef.current = null
    }
  }, [])

  const goal = hud.goal
  const pct = Math.min(100, Math.round((hud.popped / goal) * 100))

  return (
    <main
      className="flex min-h-[100dvh] flex-col bg-amber-50"
      style={{ fontFamily: FONT, WebkitTapHighlightColor: 'transparent' }}
    >
      {/* little CSS animations used by the overlays & HUD */}
      <style>{`
        @keyframes pop-in-kf { 0% { transform: scale(.55); opacity: 0 } 65% { transform: scale(1.07) } 100% { transform: scale(1); opacity: 1 } }
        .pop-in { animation: pop-in-kf .38s cubic-bezier(.34,1.56,.64,1) both }
        @keyframes star-pop-kf { 0% { transform: scale(0) rotate(-40deg); opacity: 0 } 70% { transform: scale(1.3) rotate(10deg); opacity: 1 } 100% { transform: scale(1) rotate(0deg) } }
        .star-pop { animation: star-pop-kf .55s cubic-bezier(.34,1.56,.64,1) both }
        @keyframes heart-shake-kf { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-7px) } 40% { transform: translateX(7px) } 60% { transform: translateX(-5px) } 80% { transform: translateX(5px) } }
        .heart-shake { animation: heart-shake-kf .5s ease }
        @keyframes score-pop-kf { 0% { transform: scale(1.7) } 100% { transform: scale(1) } }
        .score-pop { display:inline-block; animation: score-pop-kf .3s ease }
        @keyframes floaty-kf { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        .floaty { animation: floaty-kf 2.4s ease-in-out infinite }
        @keyframes wiggle-kf { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
        .wiggle { animation: wiggle-kf 1.2s ease-in-out infinite }
      `}</style>

      {/* ════════ THE GAME WORLD ════════ */}
      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 select-none overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-label="Bubble Pop Adventure game" role="img" />

        {/* ── HUD: hearts (top-left) ── */}
        <div className="pointer-events-none absolute left-3 top-3 z-30">
          <div key={hurtKey} className={`flex gap-1 rounded-full bg-white/85 px-4 py-2 shadow-md ${hud.hearts < hud.maxHearts ? 'heart-shake' : ''}`}>
            {Array.from({ length: MODES[hud.mode].hearts }, (_, i) => (
              <Heart
                key={i}
                size={26}
                aria-hidden
                className={i < hud.hearts ? 'fill-rose-500 text-rose-500' : 'fill-gray-200 text-gray-300'}
              />
            ))}
            <span className="sr-only">{hud.hearts} of {MODES[hud.mode].hearts} hearts left</span>
          </div>
        </div>

        {/* ── HUD: level & progress (top-center; below hearts on phones) ── */}
        <div className="pointer-events-none absolute left-1/2 top-[68px] z-10 w-32 -translate-x-1/2 rounded-2xl bg-white/85 px-3 py-2 text-center shadow-md sm:top-3 sm:w-44 sm:px-4">
          <div className="text-sm font-extrabold text-amber-600 sm:text-base">{MODES[hud.mode].levels[hud.level].name}</div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-amber-400 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-0.5 text-xs font-bold text-gray-500">
            {hud.popped} / {goal} popped
          </div>
        </div>

        {/* ── HUD: score + mute button (top-right, always tappable) ── */}
        <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
          <div className="pointer-events-none flex items-center gap-1.5 rounded-full bg-white/85 px-4 py-2 shadow-md">
            <Star size={24} aria-hidden className="fill-amber-400 text-amber-400" />
            <span key={hud.score} className="score-pop text-xl font-extrabold text-amber-600">
              {hud.score}
            </span>
            <span className="sr-only">stars collected</span>
          </div>
          <button
            onClick={(e) => {
              e.currentTarget.blur()
              controlsRef.current?.toggleMute()
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-md transition active:scale-90"
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {muted ? <VolumeX size={24} className="text-gray-500" /> : <Volume2 size={24} className="text-emerald-600" />}
          </button>
        </div>

        {/* tiny desktop hint */}
        <div className="pointer-events-none absolute bottom-2 left-3 z-10 hidden text-xs font-bold text-slate-600/70 sm:block">
          ← → move · space = pop!
        </div>

        {/* ════════ OVERLAY: START MENU ════════ */}
        {ui === 'menu' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in w-full max-w-md rounded-3xl border-4 border-amber-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <div className="floaty text-6xl" aria-hidden>🚀</div>
              <h1 className="mt-2 text-3xl font-extrabold text-pink-500 sm:text-4xl">Bubble Pop Adventure!</h1>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-base font-bold text-gray-500">
                <Sparkles size={18} className="text-amber-400" aria-hidden />
                Pop the silly monsters with bubbles &amp; stars!
                <Sparkles size={18} className="text-amber-400" aria-hidden />
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold text-gray-600">
                <div className="rounded-2xl bg-amber-50 px-2 py-3">
                  <span className="text-lg" aria-hidden>⬅️➡️</span>
                  <div>move</div>
                </div>
                <div className="rounded-2xl bg-pink-50 px-2 py-3">
                  <span className="text-lg" aria-hidden>🫧</span>
                  <div>space = shoot</div>
                </div>
              </div>
              <p className="mt-2 text-xs font-bold text-gray-400">On a tablet? Drag to move, tap to pop!</p>

              {/* ── pick your mode! ── */}
              <p className="mt-5 text-xs font-extrabold uppercase tracking-widest text-gray-400">Pick your mode</p>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.start('kids')
                }}
                className={`mt-2 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-emerald-400 text-xl font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500 active:scale-95 ${lastMode === 'kids' ? 'ring-4 ring-emerald-200' : ''}`}
              >
                <span className="text-3xl" aria-hidden>🧒</span>
                <span className="flex flex-col items-start leading-tight">
                  <span>{MODES.kids.label}</span>
                  <span className="text-[11px] font-bold text-white/90">{MODES.kids.blurb}</span>
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.start('adults')
                }}
                className={`mt-2 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-pink-400 text-xl font-extrabold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-500 active:scale-95 ${lastMode === 'adults' ? 'ring-4 ring-pink-200' : ''}`}
              >
                <span className="text-3xl" aria-hidden>🧑‍🚀</span>
                <span className="flex flex-col items-start leading-tight">
                  <span>{MODES.adults.label}</span>
                  <span className="text-[11px] font-bold text-white/90">{MODES.adults.blurb}</span>
                </span>
              </button>
              <p className="mt-3 text-sm font-bold text-gray-400">3 bubbly levels in every mode! 🫧</p>
            </div>
          </div>
        )}

        {/* ════════ OVERLAY: LEVEL COMPLETE (reward screen) ════════ */}
        {ui === 'levelClear' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in w-full max-w-md rounded-3xl border-4 border-pink-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <PartyPopper size={52} className="mx-auto text-pink-500" aria-hidden />
              <h2 className="mt-2 text-3xl font-extrabold text-pink-500 sm:text-4xl">
                {MODES[hud.mode].levels[hud.level].name} Complete!
              </h2>
              <p className="mt-1 text-base font-bold text-gray-500">
                You popped {goal} silly monsters!
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <Star
                    key={i}
                    size={56}
                    aria-hidden
                    className={`star-pop ${i < stars ? 'fill-amber-400 text-amber-400 drop-shadow-md' : 'fill-gray-100 text-gray-200'}`}
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-lg font-extrabold text-amber-500">
                {stars === 3 ? 'PERFECT! All hearts safe!' : stars === 2 ? 'Amazing flying!' : 'You did it — hooray!'}
              </p>
              <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-rose-400">
                <Heart size={16} className="fill-rose-400 text-rose-400" aria-hidden /> +{MODES[hud.mode].hearts} fresh hearts for the next level!
              </p>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.next()
                }}
                className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-amber-400 text-2xl font-extrabold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-500 active:scale-95"
              >
                NEXT LEVEL <ArrowRight size={28} aria-hidden />
              </button>
            </div>
          </div>
        )}

        {/* ════════ OVERLAY: GREAT TRY (out of hearts — always encouraging!) ════════ */}
        {ui === 'over' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in w-full max-w-md rounded-3xl border-4 border-pink-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <div className="text-6xl" aria-hidden>🌈</div>
              <h2 className="mt-2 text-3xl font-extrabold text-pink-500 sm:text-4xl">Great try! Play again?</h2>
              <p className="mt-2 text-base font-bold text-gray-500">
                The silly monsters say “good game!” 👾
              </p>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-lg font-extrabold text-amber-500">
                <Star size={22} className="fill-amber-400 text-amber-400" aria-hidden /> You collected {hud.score} stars!
              </p>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.start(hud.mode)
                }}
                className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-pink-400 text-2xl font-extrabold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-500 active:scale-95"
              >
                <RotateCcw size={28} aria-hidden /> PLAY AGAIN
              </button>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.toMenu()
                }}
                className="mt-3 w-full rounded-full py-2 text-sm font-bold text-gray-400 underline underline-offset-2 transition hover:text-pink-500"
              >
                switch mode
              </button>
            </div>
          </div>
        )}

        {/* ════════ OVERLAY: CHAMPION (all 3 levels finished!) ════════ */}
        {ui === 'won' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in w-full max-w-md rounded-3xl border-4 border-amber-300 bg-white p-6 text-center shadow-2xl sm:p-8">
              <Trophy size={56} className="mx-auto wiggle text-amber-400" aria-hidden />
              <h2 className="mt-2 text-3xl font-extrabold text-amber-500 sm:text-4xl">
                {hud.mode === 'adults' ? 'GROWN-UP LEGEND!' : 'YOU DID IT!'}
              </h2>
              <p className="mt-1 text-base font-bold text-gray-500">
                {hud.mode === 'adults' ? 'You conquered Grown-Ups Mode — a Bubble Pop Legend! 🏆' : 'You’re an official Bubble Pop Champion! 🏆'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <Star key={i} size={52} aria-hidden className="star-pop fill-amber-400 text-amber-400 drop-shadow-md" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xl font-extrabold text-pink-500">
                <Star size={24} className="fill-amber-400 text-amber-400" aria-hidden /> {hud.score} stars collected!
              </p>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.start(hud.mode)
                }}
                className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-emerald-400 text-2xl font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500 active:scale-95"
              >
                <RotateCcw size={28} aria-hidden /> PLAY AGAIN
              </button>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.toMenu()
                }}
                className="mt-3 w-full rounded-full py-2 text-sm font-bold text-gray-400 underline underline-offset-2 transition hover:text-pink-500"
              >
                switch mode
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════════ FOOTER (sticks to the bottom, always) ════════ */}
      <footer className="mt-auto border-t-2 border-amber-100 bg-amber-50 px-4 py-1.5 text-center text-[11px] font-bold text-amber-700 sm:text-xs">
        Made with 💛 for little heroes · Parents: tweak speeds, colors &amp; sounds at the top of the game file
      </footer>
    </main>
  )
}
