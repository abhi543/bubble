'use client'

/* ═══════════════════════════════════════════════════════════════════════
   🫧  BUBBLE POP ADVENTURE — a happy, no-violence arcade game for kids 5–10
   ═══════════════════════════════════════════════════════════════════════

   ✨ WHAT'S INSIDE (everything lives in THIS ONE FILE!)
      • A cute rocket you steer at the bottom of the screen
      • 6 silly enemy friends & a big goofy BOSS at the end of every level!
      • 6 gift power-ups float down: 🌈 rainbow shots · 🫧 shield · 🐌 slow-mo
        · 💗 heart refill · ⭐ star magnet · 💥 GIANT POP (SETUP 2⅚ · POWER-UPS)
      • Pop them with bubbles & stars → confetti + sparkles + happy sounds!
      • 5 hearts, 3 easy levels, reward screens, cheerful music, mute button
      • Press START GAME → pick Kids or Grown-Ups → choose your pal → pop!
      • 4 cute pals: Rocky 🚀 · Dolly 🐬 · Bunny 🐰 · Zippy 🤖 — each shoots
        their own bubble & has their own pop sound (SETUP 2½ · CHARACTERS)
      • QUIT GAME appears only after a game ends (out of hearts — or champion!)

   🕹  CONTROLS
      • Keyboard:  ← →  (or A / D) to move  •  SPACE (hold it!) to shoot
      • Touch/Mouse: drag your finger to move  •  tap the screen to shoot

   🔧  EASY TWEAKING GUIDE FOR PARENTS & KIDS
      1. CHANGE SPEEDS ....... look for "SETUP 3 · LEVELS" below
      2. CHANGE COLORS ....... look for "SETUP 1 · COLORS" below
      3. CHANGE CHARACTERS ... look for "SETUP 2½ · CHARACTERS" + "drawCharacter()"
      4. CHANGE SOUNDS ....... look for the "GameAudio" class
      5. ADD NEW ENEMIES ..... look for "SETUP 2¾ · ENEMY FRIENDS" below
      6. ADD POWER-UPS ...... look for "SETUP 2⅚ · POWER-UPS" below
      Every important number has a friendly comment next to it. Have fun! 💛

   🧪 TESTING CHEAT: add "?turbo" to the URL to make friends & bosses appear
      super fast (handy for grown-ups who want to check the reward screens).
   ═══════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  DoorOpen,
  Heart,
  PartyPopper,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  HelpCircle,
  Mail,
  X,
} from 'lucide-react'
import { loadLocalSave, persistStars, recordLevelCompletion, saveLocalProgress, SavedGameData } from '@/lib/storage'
import {
  ALL_BOSSES,
  ALL_ENEMIES,
  BossConfig,
  EnemyConfig,
  EnemyType,
  generateLevels,
  getWorldForLevel,
  LevelConfig,
  MoveKind,
  WORLDS,
} from '@/lib/levels'

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
     goal          = how many friends to pop before the level BOSS arrives!
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
    blurb: 'slow & giggly · 5 hearts · 12 worlds of silly friends',
    hearts: 5,
    monsterRadius: [22, 30],
    shootCooldown: 0.32,
    fastMusic: false,
    levels: generateLevels('kids'),
  },
  adults: {
    label: 'GROWN-UPS MODE',
    emoji: '🧑‍🚀',
    blurb: 'tactical shooter · 3 hearts · 120 grand campaign levels',
    hearts: 3,
    monsterRadius: [16, 24],
    shootCooldown: 0.42,
    fastMusic: true,
    levels: generateLevels('adults'),
  },
}

/* ───────────────────────────────────────────────────────────────────────
   SETUP 2¾ · ENEMY FRIENDS 👾 — every silly pal you can pop, in ONE place!
   ───────────────────────────────────────────────────────────────────────
   HOW TO ADD YOUR OWN NEW ENEMY (grown-ups & kids together!):
     1. Add a block below — give it a fun name, a bright color & numbers.
     2. Pick a movement:  'straight' (floats down)  · 'zigzag' (wiggles)
        'bounce' (wall-to-wall)        · 'spin'   (twirls around)
        'drift'  (crosses the sky)     · 'fade'   (blinks in & out)
     3. Add a drawing for it in drawEnemy() below — search "DRAW THE ENEMIES".
     That's it! It will join the party all by itself once "fromLevel" is reached.
   ─────────────────────────────────────────────────────────────────────── */
const ENEMIES: Record<EnemyType, EnemyConfig> = ALL_ENEMIES
const BOSSES: BossConfig[] = ALL_BOSSES

export const getModeConfig = (m?: any): ModeConfig => (m && MODES[m as Mode]) ? MODES[m as Mode] : MODES.kids
const levelsOf = (m: Mode): LevelConfig[] => getModeConfig(m).levels
const FONT = '"Comic Sans MS", "Chalkboard SE", "Comic Neue", system-ui, sans-serif'

/* ───────────────────────────────────────────────────────────────────────
   SETUP 2½ · CHARACTERS 🚀🐬🐰🤖 — the four pals you can play as!
   Change a friend's colors, name, or bubble right here:
     body/trim/belly = the main paint colors (hex like '#ff8a5c')
     bubble          = the special bubble they shoot:
                       'star' | 'water' | 'heart' | 'rainbow'
     bobAmp          = how much they bob up & down while hovering (pixels)
     bobSpeed        = how fast they bob (bigger = bouncier!)
   The faces (smile / surprised / cheer) are drawn in drawCharacter() below.
   ─────────────────────────────────────────────────────────────────────── */
type CharacterId = 'rocky' | 'dolly' | 'bunny' | 'zippy' | 'panda' | 'kitty'
type FaceExpr = 'smile' | 'surprised' | 'cheer'

interface CharacterConfig {
  name: string // shown on the selection card
  emoji: string // little helper for text lines
  tagline: string // what they shoot, in kid words
  body: string // main color
  trim: string // outline / details color
  belly: string // tummy / lighter patch color
  bubble: Shot['kind'] // their signature bubble
  bobAmp: number // hover bounce height (pixels)
  bobSpeed: number // hover bounce speed
}

const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  rocky: {
    name: 'Rocky the Rocket',
    emoji: '🚀',
    tagline: 'shoots star bubbles',
    body: '#ff8a5c',
    trim: '#e26a3d',
    belly: '#ffd9c4',
    bubble: 'star',
    bobAmp: 4,
    bobSpeed: 2.2,
  },
  dolly: {
    name: 'Dolly the Dolphin',
    emoji: '🐬',
    tagline: 'shoots water bubbles',
    body: '#59c6ee',
    trim: '#2f9ec7',
    belly: '#cdefff',
    bubble: 'water',
    bobAmp: 6,
    bobSpeed: 1.7,
  },
  bunny: {
    name: 'Bunny Bubbles',
    emoji: '🐰',
    tagline: 'shoots heart bubbles',
    body: '#ffb3d4',
    trim: '#f278ab',
    belly: '#ffe1ee',
    bubble: 'heart',
    bobAmp: 8,
    bobSpeed: 3.1,
  },
  zippy: {
    name: 'Zippy the Robot',
    emoji: '🤖',
    tagline: 'shoots rainbow bubbles',
    body: '#ffd93d',
    trim: '#e8a800',
    belly: '#fff3bf',
    bubble: 'rainbow',
    bobAmp: 3,
    bobSpeed: 2.8,
  },
  panda: {
    name: 'Panda Bamboo',
    emoji: '🐼',
    tagline: 'shoots clover star bubbles',
    body: '#ffffff',
    trim: '#1e293b',
    belly: '#f1f5f9',
    bubble: 'star',
    bobAmp: 5,
    bobSpeed: 1.9,
  },
  kitty: {
    name: 'Kitty Sparkle',
    emoji: '🐱',
    tagline: 'shoots sparkly heart bubbles',
    body: '#fed7aa',
    trim: '#ea580c',
    belly: '#ffedd5',
    bubble: 'heart',
    bobAmp: 7,
    bobSpeed: 2.6,
  },
};

const CHARACTER_LIST: CharacterId[] = ['rocky', 'dolly', 'bunny', 'zippy', 'panda', 'kitty']

/* ───────────────────────────────────────────────────────────────────────────
   SETUP 2⅚ · POWER-UPS 🎁 — happy gifts that float down from the sky!
   ───────────────────────────────────────────────────────────────────────────
   HOW THEY WORK: every little while a gift bubble drifts down from the top.
   Touch it with your pal — or pop it with a bubble — to collect it. Missed
   gifts gently fade away at the bottom; they can NEVER hurt you.

   HOW TO ADD YOUR OWN NEW POWER-UP (grown-ups & kids together!):
     1. Add a block below — name, emoji, color & numbers.
     2. duration > 0 → it becomes a TIMED power with a countdown ring near
        the hearts (only ONE timed power can be on at a time).
     3. duration = 0 → it works instantly (like the Heart Refill).
     4. Add what it DOES inside collectPowerUp() — search "POWER-UP plumbing".
   ─────────────────────────────────────────────────────────────────────────── */
type PowerUpType = 'rainbow' | 'shield' | 'slow' | 'heart' | 'magnet' | 'giant'

interface PowerUpConfig {
  name: string // shown in the "you got a gift!" pop-up
  emoji: string // the friendly symbol inside the bubble
  tip: string // one friendly line: what it does
  duration: number // seconds it lasts (0 = works instantly!)
  weight: number // how often it drops (bigger = more common)
  color: string // its glow color
}

const POWERUPS: Record<PowerUpType, PowerUpConfig> = {
  rainbow: {
    name: 'Rainbow Bubbles',
    emoji: '🌈',
    tip: 'Shoot lots at once!',
    duration: 8, // 8 seconds of triple-bubble fans
    weight: 2,
    color: '#b18aff',
  },
  shield: {
    name: 'Bubble Shield',
    emoji: '🫧',
    tip: 'Blocks one boop — pop!',
    duration: 0, // stays until it saves you once, then pops away
    weight: 2,
    color: '#4fc3f7', // a shiny blue bubble!
  },
  slow: {
    name: 'Slow Motion',
    emoji: '🐌',
    tip: 'Everyone floats in slow-mo!',
    duration: 6, // 6 dreamy seconds at half speed
    weight: 1.5,
    color: '#c9a6ff',
  },
  heart: {
    name: 'Heart Refill',
    emoji: '💗',
    tip: 'Get a heart back!',
    duration: 0, // works instantly (up to the maximum!)
    weight: 1, // drops extra often when hearts are low!
    color: '#ff8fb1',
  },
  magnet: {
    name: 'Star Magnet',
    emoji: '⭐',
    tip: 'Gifts & stars fly to you!',
    duration: 8, // 8 seconds of magical pulling
    weight: 1.5,
    color: '#ffd93d',
  },
  giant: {
    name: 'Giant Pop',
    emoji: '💥',
    tip: 'Pops EVERYONE at once!',
    duration: 0, // one super-sized bubble, right away!
    weight: 1,
    color: '#7fd8be',
  },
}

/* power-up tuning knobs (all in one cozy place!) */
const PU = {
  every: [15, 25] as [number, number], // seconds between gifts (levels 2 & 3)
  everyLevel1: [10, 16] as [number, number], // level 1 gets gifts MORE often
  fallSpeed: 55, // how fast gifts float down (pixels per second)
  starChance: 0.12, // chance a popped friend leaves a bonus star ⭐
  starValue: 2, // bonus stars collected per star
  bossDamage: 3, // Giant Pop takes this many star-points off a boss
}

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



/* ════════ 🎨 BUBBLE VFX DEFINITIONS (Level 50+) ════════ */
export interface VFXDef {
  id: string
  name: string
  emoji: string
  cost: number
  reqLevel: number
  desc: string
  glowColor: string
}

export const BUBBLE_VFX: VFXDef[] = [
  { id: 'classic', name: 'Classic Pop', emoji: '🫧', cost: 0, reqLevel: 0, desc: 'Original happy bubbly projectiles.', glowColor: '#38bdf8' },
  { id: 'music', name: 'Melody Notes', emoji: '🎵', cost: 30, reqLevel: 50, desc: 'Bubbles chime musical tones as they fly!', glowColor: '#ec4899' },
  { id: 'galaxy', name: 'Galaxy Stars', emoji: '🌌', cost: 40, reqLevel: 50, desc: 'Cosmic starlight particles and dark purple glow.', glowColor: '#8b5cf6' },
  { id: 'candy', name: 'Donut Confetti', emoji: '🍩', cost: 50, reqLevel: 50, desc: 'Sprinkles burst from popped enemies!', glowColor: '#f59e0b' },
]

/* ════════ 🎰 MONSTER STICKERS (Level 30+) ════════ */
export interface StickerDef {
  id: string
  name: string
  emoji: string
  rarity: 'Common' | 'Rare' | 'Legendary'
  fact: string
}

export const STICKERS: StickerDef[] = [
  { id: 's_blobby', name: 'Blobby Green', emoji: '🟢', rarity: 'Common', fact: 'Blobby is made of pure sweet lime jelly and loves tickles.' },
  { id: 's_zoe', name: 'Zigzag Zoe', emoji: '⚡', rarity: 'Common', fact: 'Zoe wiggles because she hears invisible dance beats in the clouds.' },
  { id: 's_bob', name: 'Bouncy Bob', emoji: '🟣', rarity: 'Common', fact: 'Bob has bounced off the edges over 1,000,000 times without dizziness.' },
  { id: 's_spike', name: 'Spinny Spike', emoji: '⭐', rarity: 'Rare', fact: 'Spike is a retired shooting star who decided floating was cozier.' },
  { id: 's_cloud', name: 'Sleepy Cloud', emoji: '☁️', rarity: 'Rare', fact: 'When you boop Sleepy Cloud, it drops peppermint rain.' },
  { id: 's_ghost', name: 'Sneaky Ghosty', emoji: '👻', rarity: 'Rare', fact: "Ghosty isn't scary at all—it hides because it gets shy!" },
  { id: 's_king', name: 'King Blobby', emoji: '👑', rarity: 'Legendary', fact: 'His paper crown was folded by the sun itself!' },
  { id: 's_bunny', name: 'Big Bunny Boss', emoji: '🐰', rarity: 'Legendary', fact: 'Can jump so high it boops the clouds with its ears.' },
]

/* ════════ 🐾 SECRET HERO PALS (Level 70+) ════════ */
export interface SecretPalDef {
  id: CharacterId
  name: string
  emoji: string
  cost: number
  reqLevel: number
  desc: string
}

export const SECRET_PALS: SecretPalDef[] = [
  { id: 'panda', name: 'Panda Bamboo', emoji: '🐼', cost: 75, reqLevel: 70, desc: 'Loves green tea & shoots clover star bubbles!' },
  { id: 'kitty', name: 'Kitty Sparkle', emoji: '🐱', cost: 85, reqLevel: 70, desc: 'Purrs when booping bosses & fires heart sparkles!' },
]

/* ════════ 🏝️ BUBBLE ISLAND TOYS (Level 60+) ════════ */
export interface IslandToyDef {
  id: string
  name: string
  emoji: string
  cost: number
  reqLevel: number
  desc: string
}

export const ISLAND_TOYS: IslandToyDef[] = [
  { id: 'trampoline', name: 'Rainbow Trampoline', emoji: '🎪', cost: 20, reqLevel: 60, desc: 'Pals bounce 10 feet into the air with giggles!' },
  { id: 'slide', name: 'Candy Water Slide', emoji: '🛝', cost: 35, reqLevel: 60, desc: 'A swirling strawberry water slide into a bubble pool.' },
  { id: 'fountain', name: 'Sparkle Star Fountain', emoji: '⛲', cost: 45, reqLevel: 60, desc: 'Shoots golden star droplets into the air!' },
  { id: 'tree', name: 'Cotton Candy Tree', emoji: '🍭', cost: 60, reqLevel: 60, desc: 'A fluffy sweet tree that sheds rainbow sparkles.' },
]

/* ════════ ⭐ STAR BAZAAR DEFINITIONS ════════ */
export interface BoosterDef {
  id: string
  name: string
  emoji: string
  cost: number
  reqLevel: number // level required to unlock
  desc: string
}

export interface CosmeticDef {
  id: string
  name: string
  emoji: string
  cost: number
  reqLevel: number
  desc: string
  hatKind: 'party' | 'shades' | 'crown' | 'pirate' | 'flower'
}

export const BOOSTERS: BoosterDef[] = [
  { id: 'shield', name: 'Bubble Shield', emoji: '🫧', cost: 5, reqLevel: 10, desc: 'Start the level with a bubble shield already ready!' },
  { id: 'heart', name: 'Extra Heart', emoji: '💗', cost: 8, reqLevel: 10, desc: 'Start with +1 bonus heart above your maximum!' },
  { id: 'magnet', name: 'Star Charm', emoji: '🧲', cost: 10, reqLevel: 10, desc: 'Tumble stars drift straight to you for the first 30 seconds!' },
]

export const COSMETICS: CosmeticDef[] = [
  { id: 'hat_party', name: 'Party Cone Hat', emoji: '🥳', cost: 15, reqLevel: 20, desc: 'A festive party cone hat for all your pals!', hatKind: 'party' },
  { id: 'hat_shades', name: 'Cool Shades', emoji: '😎', cost: 20, reqLevel: 20, desc: 'Ultra-cool superstar sunglasses!', hatKind: 'shades' },
  { id: 'hat_flower', name: 'Flower Crown', emoji: '🌸', cost: 25, reqLevel: 20, desc: 'A pretty garland of blooming meadow daisies.', hatKind: 'flower' },
  { id: 'hat_pirate', name: 'Pirate Tricorne', emoji: '🏴‍☠️', cost: 35, reqLevel: 20, desc: 'Ahoy! A brave swashbuckler pirate hat.', hatKind: 'pirate' },
  { id: 'hat_crown', name: 'Golden Tiara', emoji: '👑', cost: 50, reqLevel: 20, desc: 'A royal gleaming golden crown with ruby jewels.', hatKind: 'crown' },
]

/* ───────────────────────────── game types ───────────────────────────── */
type UIState = 'menu' | 'modeSelect' | 'charSelect' | 'levelSelect' | 'playing' | 'paused' | 'levelClear' | 'over' | 'won' | 'bye' | 'bazaar'

interface Monster {
  id: number // unique monster instance id
  x: number
  y: number
  baseX: number
  r: number
  color: string
  type: EnemyType // which silly friend this is
  move: MoveKind // how it travels down the sky
  boss: number // -1 = regular friend · otherwise its index in BOSSES
  hp: number // bubbles still needed to pop it
  maxHp: number
  wob: number // wobble timer (side-to-side wiggle)
  wobSpeed: number
  drift: number
  speedMul: number // each friend is a tiny bit faster/slower than its pals
  blink: number // counts down to the next cute blink
  vx: number // side speed for 'bounce' & 'drift' movers
  alpha: number // ghosty visibility (1 = fully visible)
  hitFlash: number // >0 = just got booped (squishy reaction!)
  spin: number // 'spinny' rotation angle
  settled: boolean // boss: has it reached its comfy hover spot yet?
  targetY: number // boss: the height it hovers at
  shootT?: number // countdown to firing an enemy star
}

interface Shot {
  x: number
  y: number
  vy: number
  vx?: number // side speed (rainbow fans fly at a slight angle!)
  r: number
  kind: 'star' | 'water' | 'heart' | 'rainbow' // each pal shoots their own!
  wob: number
  giant?: boolean // 💥 the one & only GIANT POP bubble!
  pierce?: number // Rocky / Panda: passes through multiple enemies!
  bounces?: number // Zippy: bounces off left/right walls!
  hitIds?: number[] // tracks enemies already hit by this piercing shot
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

/* 🎁 a gift power-up floating down from the top of the sky */
interface PowerUpDrop {
  x: number
  baseX: number // the middle it sways around
  y: number
  vy: number // float-down speed
  r: number // bubble size
  type: PowerUpType // which gift it is
  phase: number // sway wiggle offset
  alpha: number // fades out gently at the bottom
}

/* 🌟 an enemy star projectile falling down toward the player */
interface EnemyStar {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  color: string
}

/* ⭐ a tiny bonus star that tumbles out of a popped friend */
interface StarDrop {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  alpha: number
}

/* the ONE timed power-up that is running right now */
interface ActivePower {
  type: PowerUpType
  t: number // seconds left
  max: number // seconds it started with
  startedAt: number // g.time when picked (restarts the HUD ring)
}

/* one friendly "Meet a new friend!" pop-up */
interface IntroInfo {
  name: string
  emoji: string
  hint: string
  boss?: boolean
  power?: boolean // a "you got a POWER-UP!" pop-up instead
}

interface GameData {
  state: UIState
  w: number
  h: number
  turbo: boolean // "?turbo" testing mode
  time: number // total seconds elapsed (for animations)
  character: CharacterId // the pal you picked on the selection screen
  cosmetic?: string
  vfx?: string
  player: {
    x: number
    tilt: number
    aimAngle?: number
    cool: number
    surprised: number // >0 = "uh-oh!" face after losing a heart
    cheer: number // >0 = hip-hip-hooray face when a level is done
    blink: number // counts down to the next cute blink
  }
  targetX: number | null // finger/mouse position while dragging
  targetY?: number | null
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
  bossSpawned: boolean // has this level's big boss arrived yet?
  seen: Partial<Record<EnemyType, boolean>> // for "Meet a new friend!" pop-ups
  introQueue: IntroInfo[] // friendly pop-ups waiting their turn
  introBusy: boolean // is a pop-up on screen right now?
  powerups: PowerUpDrop[] // gift bubbles floating down 🎁
  starDrops: StarDrop[] // little bonus stars tumbling from popped friends ⭐
  enemyStars: EnemyStar[] // 🌟 falling star attacks from enemies!
  active: ActivePower | null // the one timed power-up running right now
  shield: boolean // Bubble Shield ready? (blocks one hit 🫧)
  puSpawnT: number // countdown until the next power-up gift appears
  seenPower: Partial<Record<PowerUpType, boolean>> // first-time gift pop-ups
  et: number // "enemy time" — crawls at half speed during Slow Motion 🐌
  nextMonsterId: number
}

function freshGame(): GameData {
  // greet you with the pal you played last time (if we can remember them)
  let savedPal: CharacterId = 'rocky'
  try {
    const s = typeof window !== 'undefined' ? localStorage.getItem('bubblePopCharacter') : null
    if (s === 'rocky' || s === 'dolly' || s === 'bunny' || s === 'zippy') savedPal = s
  } catch {
    /* private browsing — no problem */
  }
  const save = loadLocalSave()
  let initialMode: Mode = (save.mode === 'kids' || save.mode === 'adults') ? save.mode : 'kids'
  try {
    const localMode = typeof window !== 'undefined' ? localStorage.getItem('bubblePopMode') : null
    if (localMode === 'kids' || localMode === 'adults') {
      initialMode = localMode
    } else if (localMode) {
      localStorage.setItem('bubblePopMode', initialMode)
    }
  } catch {}
  const savedLevel = initialMode === 'kids' ? save.kidsHighestLevel : save.adultsHighestLevel
  const savedScore = save.totalStars || 0

  return {
    state: 'menu',
    w: 800,
    h: 600,
    turbo: typeof window !== 'undefined' && window.location.search.includes('turbo'),
    mode: initialMode,
    character: savedPal,
    cosmetic: save.activeCosmetic || "none",
    vfx: save.activeVFX || "classic",
    time: 0,
    player: { x: 400, tilt: 0, aimAngle: 0, cool: 0, surprised: 0, cheer: 0, blink: 2 },
    targetX: null,
    targetY: null,
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
    level: clamp(savedLevel, 0, 119),
    popped: 0,
    score: savedScore,
    hearts: MODES.kids.hearts,
    spawnT: 0.8,
    bossSpawned: false,
    seen: {},
    introQueue: [],
    introBusy: false,
    powerups: [],
    starDrops: [],
    enemyStars: [],
    active: null,
    shield: false,
    puSpawnT: 7,
    seenPower: {},
    et: 0,
    nextMonsterId: 1,
  }
}

/* Effective goal for the current level (turbo mode shrinks it for testing) */
const goalOf = (g: GameData) => (g.turbo ? 2 : levelsOf(g.mode)[g.level].goal)

/* How many boops the current level's boss needs (turbo makes it quick too) */
const bossHpOf = (g: GameData, b: BossConfig) => (g.turbo ? 2 : g.mode === 'adults' ? b.hpAdults : b.hpKids)

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
    const stopTime = t + dur + 0.05
    osc.stop(stopTime)
    osc.onended = () => {
      try {
        osc.disconnect()
        gain.disconnect()
      } catch {}
    }
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

  /* Every pal has their OWN happy pop! 🎵
     rocky = bright ding · dolly = watery blub-blub
     bunny = soft boing  · zippy = arcade bleep-bloop
     Change the notes freely — sillier is better! */
  popFor(char: CharacterId) {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    if (char === 'rocky') {
      // ⭐ a bright little ding-ding!
      this.tone({ freq: 784, time: t, dur: 0.14, type: 'triangle', vol: 0.22 })
      this.tone({ freq: 1568, time: t + 0.04, dur: 0.1, vol: 0.08 })
    } else if (char === 'dolly') {
      // 💧 a watery blub-blub (slides up like a droplet)
      this.tone({ freq: 300, time: t, dur: 0.16, type: 'sine', vol: 0.22, glide: 620 })
      this.tone({ freq: 520, time: t + 0.07, dur: 0.1, type: 'sine', vol: 0.1, glide: 740 })
    } else if (char === 'bunny') {
      // 💗 a soft springy boing
      this.tone({ freq: 440, time: t, dur: 0.18, type: 'triangle', vol: 0.22, glide: 660 })
    } else {
      // 🌈 an arcade bleep-bloop
      this.tone({ freq: 660, time: t, dur: 0.08, type: 'square', vol: 0.1 })
      this.tone({ freq: 990, time: t + 0.06, dur: 0.1, type: 'square', vol: 0.08 })
    }
  }

  /* gentle "oops" when a monster slips past — friendly, never scary */
  oops() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.tone({ freq: 392, time: t, dur: 0.15, type: 'triangle', vol: 0.18 })
    this.tone({ freq: 311, time: t + 0.16, dur: 0.28, type: 'triangle', vol: 0.18 })
  }

  /* 😄 tee-hee! A friend giggling after its first boop (Sleepy Cloud) */
  giggle() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.tone({ freq: 880, time: t, dur: 0.09, type: 'triangle', vol: 0.15, glide: 1175 })
    this.tone({ freq: 1175, time: t + 0.1, dur: 0.12, type: 'triangle', vol: 0.15, glide: 1568 })
  }

  /* ✨ happy chime for the "Meet a new friend!" pop-up */
  newFriend() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((f, i) =>
      this.tone({ freq: f, time: t + i * 0.09, dur: 0.15, type: 'triangle', vol: 0.16 })
    )
  }

  /* 🎁 a bright happy "you got a gift!" arpeggio */
  powerUp() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    ;[659.25, 783.99, 1046.5].forEach((f, i) =>
      this.tone({ freq: f, time: t + i * 0.07, dur: 0.14, type: 'triangle', vol: 0.18 })
    )
    this.tone({ freq: 2093, time: t + 0.21, dur: 0.12, vol: 0.07 })
  }

  /* 🫧 happy "po-pof!" — the Bubble Shield pops away after saving you */
  shieldPop() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.tone({ freq: 520, time: t, dur: 0.1, type: 'sine', vol: 0.2, glide: 300 })
    this.tone({ freq: 880, time: t + 0.08, dur: 0.16, type: 'triangle', vol: 0.16, glide: 1320 })
  }

  /* 💥 one BIG soft boom for the Giant Pop — exciting, never scary */
  giantPop() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.tone({ freq: 180, time: t, dur: 0.4, type: 'sine', vol: 0.3, glide: 70 })
    ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.tone({ freq: f, time: t + 0.08 + i * 0.06, dur: 0.2, type: 'triangle', vol: 0.16 })
    )
  }

  /* squishy boing when a boss gets booped */
  bossHit() {
    this.init()
    if (!this.ctx) return
    this.tone({ freq: 220, time: this.ctx.currentTime, dur: 0.16, type: 'triangle', vol: 0.2, glide: 392 })
  }

  /* 🎆 happy firework pops when a boss is defeated! */
  bossDown() {
    this.init()
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((f, i) => {
      this.tone({ freq: f, time: t + i * 0.12, dur: 0.22, type: 'triangle', vol: 0.2 })
      this.tone({ freq: f * 2, time: t + i * 0.12 + 0.03, dur: 0.12, vol: 0.07 })
    })
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
    // Resynchronize nextTime if the tab was suspended, blurred, or drifted behind
    if (this.nextTime < this.ctx.currentTime - 0.5) {
      this.nextTime = this.ctx.currentTime + 0.05
    }
    let safetyCounter = 0
    while (this.nextTime < this.ctx.currentTime + 0.4 && safetyCounter < 16) {
      this.playMusicStep(this.step, this.nextTime)
      this.step = (this.step + 1) % 32
      this.nextTime += STEP
      safetyCounter++
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

/* turn '#ff8fb1' into 'rgba(255,143,177,0.35)' — for soft glows! */
function withAlpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
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

/* 🥰 THE PAL'S FACE — three moods, used by all four characters:
     smile     = happy default (with cute blinks)
     surprised = "uh-oh!" round eyes + little O mouth (after losing a heart)
     cheer     = squeezed-shut happy eyes + big open grin (level complete!)
   dx / dy move the face inside the character (like Rocky's window). */
function palFace(ctx: CanvasRenderingContext2D, r: number, expr: FaceExpr, blink: boolean, dx = 0, dy = 0) {
  ctx.save()
  ctx.translate(dx, dy)
  const ex = r * 0.36 // eye spacing
  const ey = -r * 0.12 // eye height
  const er = r * 0.22 // eye radius
  if (expr === 'cheer') {
    // ^ ^  two happy squeezed-shut eyes
    ctx.strokeStyle = COLORS.face
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.arc(side * ex, ey, er, Math.PI * 1.1, Math.PI * 1.9)
      ctx.stroke()
    }
  } else {
    // big white eyes — extra wide when surprised!
    const big = expr === 'surprised' ? 1.3 : 1
    ctx.fillStyle = '#ffffff'
    circle(ctx, -ex, ey, er * big)
    circle(ctx, ex, ey, er * big)
    // pupils — tiny and high when surprised, low and calm when smiling
    ctx.fillStyle = COLORS.face
    const pr = expr === 'surprised' ? er * 0.3 : er * 0.45
    const py = expr === 'surprised' ? ey - er * 0.15 : ey + er * 0.25
    circle(ctx, -ex, py, pr)
    circle(ctx, ex, py, pr)
  }
  // the mouth
  if (expr === 'surprised') {
    // 😮 a little round "O" mouth
    ctx.fillStyle = COLORS.face
    circle(ctx, 0, r * 0.24, r * 0.16)
  } else if (expr === 'cheer') {
    // 🥳 a big open grin
    ctx.fillStyle = COLORS.face
    ctx.beginPath()
    ctx.arc(0, r * 0.06, r * 0.3, Math.PI * 0.12, Math.PI * 0.88)
    ctx.closePath()
    ctx.fill()
  } else {
    // 🙂 the classic smile
    ctx.strokeStyle = COLORS.face
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, r * 0.12, r * 0.3, Math.PI * 0.2, Math.PI * 0.8)
    ctx.stroke()
  }
  // rosy cheeks — extra rosy when cheering!
  ctx.fillStyle = expr === 'cheer' ? 'rgba(255,110,150,0.5)' : 'rgba(255,110,150,0.35)'
  circle(ctx, -r * 0.6, r * 0.1, r * 0.14)
  circle(ctx, r * 0.6, r * 0.1, r * 0.14)
  ctx.restore()
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

/* 🌈 LEVEL-BASED PALETTE & DYNAMIC SKY/BOSS VARIATIONS
   Ensures EVERY level (1 through 120) has a distinct background atmosphere
   and distinct boss color hue! */

const LEVEL_SKY_PALETTES = [
  { top: '#a5e8ff', bottom: '#fff3c9', hillDark: '#5ec44f', hillLight: '#8ee06e', name: 'Sunny Morning' },
  { top: '#ffd1dc', bottom: '#fff0f5', hillDark: '#6b8e23', hillLight: '#98fb98', name: 'Pink Cotton Sky' },
  { top: '#d4bbfb', bottom: '#ffe4e6', hillDark: '#556b2f', hillLight: '#8fbc8f', name: 'Lilac Bloom' },
  { top: '#fed7aa', bottom: '#fef08a', hillDark: '#4d7c0f', hillLight: '#84cc16', name: 'Golden Apricot' },
  { top: '#bae6fd', bottom: '#e0f2fe', hillDark: '#047857', hillLight: '#10b981', name: 'Sky Turquoise' },
  { top: '#fbcfe8', bottom: '#fef9c3', hillDark: '#15803d', hillLight: '#22c55e', name: 'Peachy Dawn' },
  { top: '#c7d2fe', bottom: '#fbcfe8', hillDark: '#4338ca', hillLight: '#6366f1', name: 'Twilight Lavender' },
  { top: '#fecdd3', bottom: '#fed7aa', hillDark: '#b45309', hillLight: '#f59e0b', name: 'Coral Sunset' },
  { top: '#99f6e4', bottom: '#ccfbf1', hillDark: '#0f766e', hillLight: '#14b8a6', name: 'Sea Mint Lagoon' },
  { top: '#e9d5ff', bottom: '#fae8ff', hillDark: '#6d28d9', hillLight: '#a855f7', name: 'Mystic Amethyst' },
]

const BOSS_HUE_ROTATIONS = [
  '#f278ab', // Bubblegum Pink
  '#a855f7', // Royal Violet
  '#3b82f6', // Azure Blue
  '#10b981', // Emerald Mint
  '#f59e0b', // Amber Orange
  '#ef4444', // Ruby Crimson
  '#06b6d4', // Cyan Wave
  '#ec4899', // Hot Magenta
  '#84cc16', // Lime Zing
  '#8b5cf6', // Electric Purple
]

function getLevelColors(level: number) {
  const world = getWorldForLevel(level)
  const subLevel = level % 10
  const palette = LEVEL_SKY_PALETTES[subLevel % LEVEL_SKY_PALETTES.length]
  const bossColor = BOSS_HUE_ROTATIONS[subLevel % BOSS_HUE_ROTATIONS.length]

  return {
    skyTop: palette.top,
    skyBottom: palette.bottom,
    hillDark: palette.hillDark,
    hillLight: palette.hillLight,
    bossColor,
    worldName: world.name,
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, g: GameData) {
  const { w, h } = g
  const colors = getLevelColors(g.level)

  // sky gradient (reactive to current level)
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, colors.skyTop)
  grad.addColorStop(1, colors.skyBottom)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // ☀️ smiling sun with slowly spinning rays (positioned clear of top HUD buttons)
  const sx = w * 0.22
  const sy = 80
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

  // rolling hills / dynamic horizon
  ctx.fillStyle = colors.hillDark
  ctx.beginPath()
  ctx.ellipse(w * 0.22, h + 60, w * 0.55, 130, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = colors.hillLight
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

/* 💗 a chunky rounded heart (for Bunny's bubbles & Zippy's tummy panel) */
function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.9)
  ctx.bezierCurveTo(x - s * 1.2, y + s * 0.1, x - s * 0.75, y - s * 0.9, x, y - s * 0.25)
  ctx.bezierCurveTo(x + s * 0.75, y - s * 0.9, x + s * 1.2, y + s * 0.1, x, y + s * 0.9)
  ctx.closePath()
}

/* 🚀🐬🐰🤖 THE PLAYER — whichever pal you picked on the selection screen!
   Each friend bobs at their own speed (CHARACTERS.bobAmp/bobSpeed) and
   shows a different face: smile · surprised (lost a heart) · cheer (level done). */
function drawPlayer(ctx: CanvasRenderingContext2D, g: GameData) {
  const p = g.player
  const c = CHARACTERS[g.character]
  // gentle hover bob — cheering pals bounce extra high!
  const bob = Math.sin(g.time * c.bobSpeed) * c.bobAmp * (p.cheer > 0 ? 1.9 : 1)
  const py = g.h - 96 + bob
  ctx.save()
  ctx.translate(p.x, py)
  ctx.rotate(p.tilt)
  const expr: FaceExpr = p.surprised > 0 ? 'surprised' : p.cheer > 0 ? 'cheer' : 'smile'
  const blink = p.blink < 0 && p.blink > -0.15
  drawCharacter(ctx, g.character, expr, g.time, blink)
  drawPalHat(ctx, g.cosmetic || "none", g.character)
  ctx.restore()
  // 🫧 the Bubble Shield — a soft shiny bubble that blocks one hit!
  if (g.shield) {
    const pr = 50 + Math.sin(g.time * 3) * 3 // gently breathing
    ctx.save()
    ctx.translate(p.x, py)
    ctx.beginPath()
    ctx.arc(0, 0, pr, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(150,220,255,0.22)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(80,190,240,0.9)'
    ctx.lineWidth = 3
    ctx.stroke()
    // glossy shine
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, 0, pr - 7, -2.2, -1.4)
    ctx.stroke()
    ctx.restore()
  }
}

/* 🎨 THE FOUR PALS — every friend is drawn centered at (0,0), about 85px tall.
   Want to change a character? Tweak the shapes & colors right here!
   (The names & colors themselves live in CHARACTERS at the top.) */

function drawPalHat(ctx: CanvasRenderingContext2D, hatId: string, id: CharacterId) {
  if (!hatId || hatId === 'none') return
  ctx.save()
  // Adjust hat anchor per character
  let hx = 0
  let hy = -35
  if (id === 'rocky') hy = -44
  if (id === 'dolly') hy = -28
  if (id === 'bunny') hy = -38
  if (id === 'zippy') hy = -32

  ctx.translate(hx, hy)
  if (hatId === 'hat_party') {
    // Party cone hat
    ctx.beginPath()
    ctx.moveTo(0, -22)
    ctx.lineTo(8, 0)
    ctx.lineTo(-8, 0)
    ctx.closePath()
    ctx.fillStyle = '#ff8fb1'
    ctx.fill()
    ctx.strokeStyle = '#ffd93d'
    ctx.lineWidth = 2
    ctx.stroke()
    // pompom
    circle(ctx, 0, -24, 3)
    ctx.fillStyle = '#ffd93d'
    ctx.fill()
  } else if (hatId === 'hat_shades') {
    // Cool sunglasses
    ctx.fillStyle = '#1e293b'
    roundRectPath(ctx, -14, -4, 12, 8, 2)
    ctx.fill()
    roundRectPath(ctx, 2, -4, 12, 8, 2)
    ctx.fill()
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-2, 0)
    ctx.lineTo(2, 0)
    ctx.stroke()
  } else if (hatId === 'hat_flower') {
    // Flower crown
    const cols = ['#ff8fb1', '#ffd93d', '#70d6ff', '#b18aff', '#ff9f43']
    for (let i = 0; i < 5; i++) {
      const fx = (i - 2) * 6
      circle(ctx, fx, 0, 3.2)
      ctx.fillStyle = cols[i]
      ctx.fill()
    }
  } else if (hatId === 'hat_pirate') {
    // Pirate hat
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-12, 0)
    ctx.lineTo(0, -14)
    ctx.lineTo(12, 0)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#f8fafc'
    circle(ctx, 0, -6, 2) // mini skull emblem
  } else if (hatId === 'hat_crown') {
    // Golden crown
    crownPath(ctx, -11, -12, 22, 12)
    ctx.fillStyle = '#ffd93d'
    ctx.fill()
    ctx.strokeStyle = '#e8a800'
    ctx.lineWidth = 1.5
    ctx.stroke()
    circle(ctx, 0, -8, 1.8)
    ctx.fillStyle = '#ff4d6d'
    ctx.fill()
  }
  ctx.restore()
}

function drawCharacter(ctx: CanvasRenderingContext2D, id: CharacterId, expr: FaceExpr, t: number, blink = false) {
  const c = CHARACTERS[id]
  ctx.lineJoin = 'round'

  if (id === 'rocky') {
    /* 🚀 ROCKY THE ROCKET — red & white with a smiley round window */
    // 🔥 flame (behind everything) — flickers happily
    const fl = 1 + Math.sin(t * 24) * 0.18
    ctx.fillStyle = COLORS.flame
    ctx.beginPath()
    ctx.ellipse(0, 42, 9 * fl, 16 * fl, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ff9f43'
    ctx.beginPath()
    ctx.ellipse(0, 47, 5 * fl, 9 * fl, 0, 0, Math.PI * 2)
    ctx.fill()
    // fins
    ctx.fillStyle = c.trim
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
    ctx.fillStyle = c.body
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = c.trim
    ctx.stroke()
    // round window with the pal's face inside
    ctx.beginPath()
    ctx.arc(0, -4, 12.5, 0, Math.PI * 2)
    ctx.fillStyle = '#dff3ff'
    ctx.fill()
    ctx.strokeStyle = c.trim
    ctx.stroke()
    palFace(ctx, 12, expr, blink)
    // antenna with a golden ball
    ctx.strokeStyle = c.trim
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, -34)
    ctx.lineTo(0, -44)
    ctx.stroke()
    ctx.fillStyle = COLORS.flame
    circle(ctx, 0, -47, 4.5)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    circle(ctx, -1.5, -48.5, 1.4)
  } else if (id === 'dolly') {
    /* 🐬 DOLLY THE DOLPHIN — a happy dolphin jumping upward */
    // 💦 little splash droplets under the tail
    ctx.fillStyle = 'rgba(150,215,250,0.85)'
    for (let i = 0; i < 3; i++) {
      circle(ctx, (i - 1) * 8, 34 + Math.sin(t * 5 + i * 2) * 3, 3 - i * 0.5)
    }
    // tail flukes (drawn first so the body overlaps them)
    ctx.fillStyle = c.trim
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * 6, 27)
      ctx.rotate(side * 0.55)
      ctx.beginPath()
      ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    // body: a smooth teardrop, nose up!
    ctx.beginPath()
    ctx.moveTo(0, -27)
    ctx.bezierCurveTo(16, -27, 18, -8, 12, 8)
    ctx.bezierCurveTo(9, 16, 5, 22, 3, 25)
    ctx.lineTo(-3, 25)
    ctx.bezierCurveTo(-5, 22, -9, 16, -12, 8)
    ctx.bezierCurveTo(-18, -8, -16, -27, 0, -27)
    ctx.closePath()
    ctx.fillStyle = c.body
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = c.trim
    ctx.stroke()
    // lighter tummy
    ctx.beginPath()
    ctx.ellipse(0, 4, 8, 15, 0, 0, Math.PI * 2)
    ctx.fillStyle = c.belly
    ctx.fill()
    // side flippers
    ctx.fillStyle = c.trim
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * 13, 3)
      ctx.rotate(side * 0.6)
      ctx.beginPath()
      ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    // 💦 tiny spray dancing above the blowhole
    ctx.fillStyle = 'rgba(190,235,255,0.9)'
    circle(ctx, -4, -33 + Math.sin(t * 4) * 2, 2)
    circle(ctx, 3, -36 + Math.sin(t * 4 + 1) * 2, 1.6)
    // the face (up on the head)
    palFace(ctx, 14, expr, blink, 0, -12)
  } else if (id === 'bunny') {
    /* 🐰 BUNNY BUBBLES — a fluffy pink bunny inside a bubble helmet */
    // 🫧 tiny bubbles floating below
    ctx.fillStyle = 'rgba(150,215,245,0.8)'
    circle(ctx, -8, 30 + Math.sin(t * 3) * 2, 3)
    circle(ctx, 7, 34 + Math.sin(t * 3 + 1.5) * 2, 2.4)
    circle(ctx, 0, 40 + Math.sin(t * 3 + 3) * 2, 1.8)
    // long floppy ears (they sway gently!)
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * 8, -26)
      ctx.rotate(side * 0.2 + Math.sin(t * 2 + side) * 0.06)
      ctx.beginPath()
      ctx.ellipse(0, 0, 6.5, 16, 0, 0, Math.PI * 2)
      ctx.fillStyle = c.body
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = c.trim
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(0, 3, 3, 9.5, 0, 0, Math.PI * 2)
      ctx.fillStyle = c.belly
      ctx.fill()
      ctx.restore()
    }
    // little round body
    ctx.beginPath()
    ctx.ellipse(0, 20, 11, 9, 0, 0, Math.PI * 2)
    ctx.fillStyle = c.body
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = c.trim
    ctx.stroke()
    // fluffy head
    ctx.beginPath()
    ctx.arc(0, -2, 17, 0, Math.PI * 2)
    ctx.fillStyle = c.body
    ctx.fill()
    ctx.stroke()
    // the face
    palFace(ctx, 15, expr, blink, 0, -2)
    // 🫧 clear bubble helmet around it all
    ctx.beginPath()
    ctx.arc(0, -6, 27, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(215,242,255,0.18)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(120,200,235,0.95)'
    ctx.lineWidth = 2.5
    ctx.stroke()
    // helmet shine
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, -6, 22, -2.3, -1.5)
    ctx.stroke()
  } else if (id === 'panda') {
    /* 🐼 PANDA BAMBOO */
    // round ears
    ctx.fillStyle = c.trim
    circle(ctx, -16, -26, 7.5)
    circle(ctx, 16, -26, 7.5)
    // body
    roundRectPath(ctx, -19, -24, 38, 48, 16)
    ctx.fillStyle = c.body
    ctx.fill()
    ctx.strokeStyle = c.trim
    ctx.lineWidth = 3
    ctx.stroke()
    // black arms/vest
    ctx.fillStyle = c.trim
    roundRectPath(ctx, -22, -6, 44, 14, 6)
    ctx.fill()
    // tummy
    ctx.beginPath()
    ctx.ellipse(0, 10, 11, 10, 0, 0, Math.PI * 2)
    ctx.fillStyle = c.belly
    ctx.fill()
    // cute dark eye patches
    ctx.fillStyle = c.trim
    ctx.beginPath()
    ctx.ellipse(-7, -8, 5, 6, -0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(7, -8, 5, 6, 0.3, 0, Math.PI * 2)
    ctx.fill()
    palFace(ctx, 14, expr, blink, 0, -8)
  } else if (id === 'kitty') {
    /* 🐱 KITTY SPARKLE */
    // pointy cat ears
    ctx.fillStyle = c.trim
    ctx.beginPath()
    ctx.moveTo(-16, -18)
    ctx.lineTo(-9, -34)
    ctx.lineTo(-2, -18)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(2, -18)
    ctx.lineTo(9, -34)
    ctx.lineTo(16, -18)
    ctx.closePath()
    ctx.fill()
    // inner ear pink
    ctx.fillStyle = '#ff8fb1'
    circle(ctx, -9, -24, 3.5)
    circle(ctx, 9, -24, 3.5)
    // body
    roundRectPath(ctx, -18, -20, 36, 46, 15)
    ctx.fillStyle = c.body
    ctx.fill()
    ctx.strokeStyle = c.trim
    ctx.lineWidth = 3
    ctx.stroke()
    // tail
    ctx.strokeStyle = c.trim
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(14, 18)
    ctx.quadraticCurveTo(28, 12, 24, -2)
    ctx.stroke()
    // tummy
    ctx.beginPath()
    ctx.ellipse(0, 8, 9, 11, 0, 0, Math.PI * 2)
    ctx.fillStyle = c.belly
    ctx.fill()
    // whiskers
    ctx.strokeStyle = '#5b4a3f'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(-12, -4); ctx.lineTo(-22, -6)
    ctx.moveTo(-12, 0); ctx.lineTo(-22, 2)
    ctx.moveTo(12, -4); ctx.lineTo(22, -6)
    ctx.moveTo(12, 0); ctx.lineTo(22, 2)
    ctx.stroke()
    palFace(ctx, 15, expr, blink, 0, -6)
  } else {
    /* 🤖 ZIPPY THE ROBOT — a small, round, friendly yellow robot */
    // 💨 little jet puffs below
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    circle(ctx, -6, 31 + Math.sin(t * 10) * 2, 3.5)
    circle(ctx, 6, 34 + Math.sin(t * 10 + 2) * 2, 3)
    // antenna with a blinking light
    ctx.strokeStyle = c.trim
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, -24)
    ctx.lineTo(0, -32)
    ctx.stroke()
    ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ff8fb1' : COLORS.flame
    circle(ctx, 0, -35, 4)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    circle(ctx, -1.3, -36.3, 1.3)
    // round body
    roundRectPath(ctx, -20, -22, 40, 48, 14)
    ctx.fillStyle = c.body
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = c.trim
    ctx.stroke()
    // side bolts (robot ears!)
    ctx.fillStyle = c.trim
    circle(ctx, -23, 2, 4.5)
    circle(ctx, 23, 2, 4.5)
    // tummy panel with a tiny heart
    roundRectPath(ctx, -12, 2, 24, 16, 6)
    ctx.fillStyle = c.belly
    ctx.fill()
    ctx.lineWidth = 2
    ctx.stroke()
    heartPath(ctx, 0, 9, 5)
    ctx.fillStyle = '#ff8fb1'
    ctx.fill()
    // the face
    palFace(ctx, 16, expr, blink, 0, -8)
  }
}

/* 👑 a golden paper crown (for the boss of level 3!) */
function crownPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const x2 = x + w
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y + h * 0.25)
  ctx.lineTo(x + w * 0.25, y + h * 0.6) // dip
  ctx.lineTo(x + w * 0.5, y) // middle peak
  ctx.lineTo(x + w * 0.75, y + h * 0.6) // dip
  ctx.lineTo(x2, y + h * 0.25)
  ctx.lineTo(x2, y + h)
  ctx.closePath()
}

/* 👾 DRAW THE ENEMIES — one silly smiling friend per type!
   (Their names, colors, sizes & movement all live in ENEMIES at the top.)
   Every friend has big round eyes, a goofy smile & bright cartoon colors. */
function drawEnemy(ctx: CanvasRenderingContext2D, m: Monster, time: number) {
  /* 👑 bosses have their own special big drawings */
  if (m.boss >= 0) {
    ctx.save()
    ctx.translate(m.x, m.y)
    const sq = m.hitFlash > 0 ? Math.sin(m.hitFlash * 24) * 0.05 : 0 // boop squash!
    if (sq) ctx.scale(1 + sq, 1 - sq)
    drawBoss(ctx, m, time)
    ctx.restore()
    drawBossBadge(ctx, m) // name tag + little-star health bar
    return
  }

  const r = m.r
  ctx.save()
  ctx.translate(m.x, m.y)
  if (m.type === 'ghosty') ctx.globalAlpha = clamp(m.alpha, 0.12, 1) // peek-a-boo!
  const sq = m.hitFlash > 0 ? Math.sin(m.hitFlash * 21) * 0.08 : 0
  if (sq) ctx.scale(1 + sq * 0.6, 1 - sq * 0.6)
  if (m.move !== 'spin') ctx.rotate(Math.sin(m.wob) * 0.09) // gentle wobble
  const outline = 'rgba(0,0,0,0.12)'
  const blinking = m.blink < 0 && m.blink > -0.15
  const giggling = m.type === 'cloud' && m.hp < m.maxHp // booped once = giggles!

  switch (m.type) {
    case 'blobby': {
      /* 🟢 BLOBBY — a happy round blob with golden antennae */
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
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      circle(ctx, -r * 0.35, -r * 0.42, r * 0.16)
      palFace(ctx, r, giggling ? 'cheer' : 'smile', blinking)
      break
    }
    case 'zoe': {
      /* 🟠 ZIGZAG ZOE — an orange squiggle critter wiggling head-first down */
      // wiggly tail: three puffs trailing above, swinging like a ribbon
      for (let i = 3; i >= 1; i--) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,159,67,0.55)' : m.color
        circle(ctx, Math.sin(time * 7 + i * 1.3) * r * 0.35, -i * r * 0.62, r * (0.52 - i * 0.07))
      }
      // round head with a goofy grin
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      circle(ctx, -r * 0.33, -r * 0.4, r * 0.15)
      palFace(ctx, r * 0.9, 'smile', blinking)
      break
    }
    case 'bob': {
      /* 🟣 BOUNCY BOB — a shiny purple ball, always ready to bounce */
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      // a jaunty lighter stripe across its tummy
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.ellipse(0, r * 0.35, r * 0.72, r * 0.26, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      circle(ctx, -r * 0.35, -r * 0.42, r * 0.16)
      palFace(ctx, r * 0.9, 'smile', blinking)
      break
    }
    case 'spinny': {
      /* ⭐ SPINNY SPIKE — a yellow star critter twirling like a top */
      starPath(ctx, 0, 0, r * 1.3, r * 0.62, 5, m.spin)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.stroke()
      palFace(ctx, r * 0.75, 'smile', blinking) // the face stays upright — silly!
      break
    }
    case 'cloud': {
      /* ☁️ SLEEPY CLOUD — fluffy & blue-gray... until you boop it awake! */
      ctx.fillStyle = giggling ? '#d3e0ec' : m.color // lighter after boop one
      circle(ctx, -r * 0.55, r * 0.1, r * 0.55)
      circle(ctx, r * 0.55, r * 0.12, r * 0.5)
      circle(ctx, 0, -r * 0.2, r * 0.72)
      circle(ctx, 0, r * 0.15, r * 0.6)
      // dreamy little z-z-z's while it naps
      if (!giggling) {
        ctx.fillStyle = 'rgba(90,110,140,0.75)'
        ctx.font = `bold ${Math.round(r * 0.55)}px ${FONT}`
        ctx.textAlign = 'center'
        ctx.fillText('z', r * 0.95, -r * 0.75 + Math.sin(time * 2) * 3)
        ctx.fillText('z', r * 1.25, -r * 1.15 + Math.sin(time * 2 + 1) * 3)
      }
      palFace(ctx, r * 0.72, giggling ? 'cheer' : 'smile', blinking)
      break
    }
    case 'ghosty': {
      /* 👻 SNEAKY GHOSTY — a friendly ghost playing peek-a-boo */
      ctx.beginPath()
      ctx.arc(0, -r * 0.15, r * 0.85, Math.PI, 0)
      const w = r * 0.85
      for (let i = 0; i < 4; i++) {
        const x1 = w - ((i + 0.5) * (2 * w)) / 4
        const x2 = w - ((i + 1) * (2 * w)) / 4
        ctx.quadraticCurveTo(x1, r * 0.62 + Math.sin(time * 5 + i) * 3, x2, r * 0.5)
      }
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = 'rgba(120,140,170,0.45)'
      ctx.lineWidth = 2.5
      ctx.stroke()
      palFace(ctx, r * 0.78, 'smile', blinking, 0, -r * 0.1) // rosy cheeks included!
      break
    }
    case 'puffer': {
      /* 🐡 PRICKLY PUFFER — swells up with round spines when close to player */
      const distToPlayer = Math.abs(m.baseX - m.x)
      const swell = clamp(1 + (1 - Math.min(1, distToPlayer / 200)) * 0.35, 1, 1.4)
      ctx.save()
      ctx.scale(swell, swell)
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      // little friendly rubber spines
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        circle(ctx, Math.cos(a) * (r + 4), Math.sin(a) * (r + 4), 3)
      }
      palFace(ctx, r * 0.8, giggling ? 'cheer' : 'smile', blinking)
      ctx.restore()
      break
    }
    case 'gummy': {
      /* 🍯 GUMMY GLIDER — sweet dripping honey jelly with wings */
      ctx.beginPath()
      ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      circle(ctx, -r * 0.3, -r * 0.3, r * 0.2)
      palFace(ctx, r * 0.8, 'smile', blinking)
      break
    }
    case 'dragonfly': {
      /* 🛸 DARTING DRAGONFLY — cute flutter wings with hover goggles */
      for (const side of [-1, 1]) {
        ctx.save()
        ctx.translate(side * r * 0.6, -r * 0.3)
        ctx.rotate(side * Math.sin(time * 20) * 0.3)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.beginPath()
        ctx.ellipse(0, 0, r * 0.5, r * 0.2, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      palFace(ctx, r * 0.8, 'surprised', blinking)
      break
    }
    case 'armadillo': {
      /* 🛡️ ARMORED ARMADILLO — crystal carapace protects top, soft smile below */
      ctx.beginPath()
      ctx.arc(0, 0, r, Math.PI, 0)
      ctx.fillStyle = '#495057'
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      palFace(ctx, r * 0.75, 'smile', blinking, 0, r * 0.15)
      break
    }
    case 'mitosis': {
      /* 🦠 MITOSIS MITE — twin bubbly nuclei wiggling inside */
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      circle(ctx, -r * 0.35, 0, r * 0.28)
      circle(ctx, r * 0.35, 0, r * 0.28)
      palFace(ctx, r * 0.75, 'cheer', blinking)
      break
    }
    case 'cosmo': {
      /* 🌌 CHRONO COSMO — swirling deep galaxy sphere with planetary ring */
      ctx.save()
      ctx.rotate(time * 0.8)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 1.35, r * 0.45, 0, 0, Math.PI * 2)
      ctx.strokeStyle = '#ffd93d'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.restore()
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3
      ctx.stroke()
      palFace(ctx, r * 0.8, 'smile', blinking)
      break
    }
  }
  ctx.restore()
}

/* 👑 THE THREE BOSSES — one big friendly pal guards the end of every level!
   Level 1 = Giant Jelly 🍮 · Level 2 = Big Bouncy Bunny 🐰 · Level 3 = King Blobby 👑
   They glide side to side & can NEVER reach the ground — boop till they pop! */
function drawBoss(ctx: CanvasRenderingContext2D, m: Monster, time: number) {
  const r = m.r
  const b = BOSSES[Math.min(BOSSES.length - 1, m.boss)]
  const outline = 'rgba(0,0,0,0.13)'
  const blinking = m.blink < 0 && m.blink > -0.15
  const expr: FaceExpr = m.hitFlash > 0 ? 'surprised' : 'smile' // 😮 when booped!
  ctx.lineJoin = 'round'

  if (b.key === 'jelly') {
    /* 🍮 GIANT JELLY — a big wobbly pink jelly with a goofy grin */
    const wob = 1 + Math.sin(time * 3.2) * 0.04
    ctx.save()
    ctx.scale(wob, 2 - wob) // jiggly!
    ctx.beginPath()
    ctx.arc(0, r * 0.1, r, Math.PI, 0) // dome top
    const bumps = 4 // wavy jiggly bottom
    for (let i = 0; i < bumps; i++) {
      const x1 = r - ((i + 0.5) * (2 * r)) / bumps
      const x2 = r - ((i + 1) * (2 * r)) / bumps
      ctx.quadraticCurveTo(x1, r * 0.72 + Math.sin(time * 5 + i) * 4, x2, r * 0.45)
    }
    ctx.closePath()
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.4)' // glossy shine
    ctx.beginPath()
    ctx.ellipse(-r * 0.38, -r * 0.32, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    palFace(ctx, r * 0.6, expr, blinking, 0, r * 0.08)
  } else if (b.key === 'bunny') {
    /* 🐰 BIG BOUNCY BUNNY — a huge lavender puffball with floppy ears */
    for (const side of [-1, 1]) {
      ctx.save()
      ctx.translate(side * r * 0.42, -r * 0.78)
      ctx.rotate(side * 0.22 + Math.sin(time * 2.4 + side) * 0.07)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.2, r * 0.52, 0, 0, Math.PI * 2)
      ctx.fillStyle = m.color
      ctx.fill()
      ctx.strokeStyle = outline
      ctx.lineWidth = 3.5
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(0, r * 0.08, r * 0.1, r * 0.32, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#ffd9f0'
      ctx.fill()
      ctx.restore()
    }
    ctx.beginPath() // big round head
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = m.color // fluffy side puffs
    circle(ctx, -r * 0.95, r * 0.25, r * 0.22)
    circle(ctx, r * 0.95, r * 0.25, r * 0.22)
    palFace(ctx, r * 0.62, expr, blinking, 0, -r * 0.05)
    // two tiny buck teeth under the smile
    ctx.fillStyle = '#ffffff'
    roundRectPath(ctx, -r * 0.11, r * 0.32, r * 0.1, r * 0.16, 2)
    ctx.fill()
    roundRectPath(ctx, r * 0.01, r * 0.32, r * 0.1, r * 0.16, 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 1.5
    roundRectPath(ctx, -r * 0.11, r * 0.32, r * 0.22, r * 0.16, 2)
    ctx.stroke()
  } else if (b.key === 'blobby') {
    /* 👑 KING BLOBBY — the biggest green blob of all, wearing a paper crown */
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.95, 0, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.3)' // lighter royal belly
    ctx.beginPath()
    ctx.ellipse(0, r * 0.25, r * 0.55, r * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()
    // the golden paper crown
    const cw = r * 0.78
    crownPath(ctx, -cw / 2, -r * 1.08, cw, r * 0.42)
    ctx.fillStyle = '#ffd93d'
    ctx.fill()
    ctx.strokeStyle = '#e8a800'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#ffd93d'
    circle(ctx, -cw / 2, -r * 1.08 + r * 0.42 * 0.25, r * 0.06)
    circle(ctx, 0, -r * 1.08, r * 0.06)
    circle(ctx, cw / 2, -r * 1.08 + r * 0.42 * 0.25, r * 0.06)
    ctx.fillStyle = '#ff8fb1' // a tiny pink jewel
    circle(ctx, 0, -r * 1.08 + r * 0.24, r * 0.07)
    palFace(ctx, r * 0.6, expr, blinking, 0, r * 0.05)
  } else if (b.key === 'barnaby') {
    /* 🐚 BARNABY BARNACLE — pearlescent spiral seashell */
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 1.5)
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'
    ctx.lineWidth = 4
    ctx.stroke()
    palFace(ctx, r * 0.65, expr, blinking)
  } else if (b.key === 'owl') {
    /* 🦉 FROSTY SNOW-OWL — round owl face with knitted scarf */
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    circle(ctx, -r * 0.6, -r * 0.7, r * 0.25)
    circle(ctx, r * 0.6, -r * 0.7, r * 0.25)
    palFace(ctx, r * 0.65, expr, blinking)
  } else if (b.key === 'luna') {
    /* 🌟 LUNA STAR-WEAVER — crescent moon sprite with golden halo */
    starPath(ctx, 0, 0, r * 1.4, r * 0.75, 8, time)
    ctx.fillStyle = 'rgba(254, 228, 64, 0.45)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    palFace(ctx, r * 0.65, expr, blinking)
  } else if (b.key === 'seals') {
    /* 🦭 PIP & POP CIRCUS SEALS — performing circus barrel seal */
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 1.1, r * 0.9, 0, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    circle(ctx, 0, -r * 1.1, r * 0.3)
    palFace(ctx, r * 0.65, expr, blinking)
  } else if (b.key === 'octo') {
    /* 🐙 OCTO-CLAUS SQUID — big smiling octopus with waving tentacles */
    ctx.beginPath()
    ctx.arc(0, -r * 0.1, r * 0.9, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    for (let i = 0; i < 6; i++) {
      const tx = (i - 2.5) * (r * 0.35)
      circle(ctx, tx, r * 0.8 + Math.sin(time * 5 + i) * 6, r * 0.2)
    }
    palFace(ctx, r * 0.65, expr, blinking, 0, -r * 0.1)
  } else if (b.key === 'bonbon') {
    /* 🍬 BARON VON BONBON — striped peppermint candy nobleman */
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * (r * 0.35), -r, r * 0.15, r * 2)
    }
    palFace(ctx, r * 0.65, expr, blinking)
  } else if (b.key === 'drake') {
    /* 🐲 BRAMBLE FOREST-DRAKE — gentle emerald woodland dragon */
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    circle(ctx, -r * 0.5, -r * 0.8, r * 0.2)
    circle(ctx, r * 0.5, -r * 0.8, r * 0.2)
    palFace(ctx, r * 0.65, expr, blinking)
  } else if (b.key === 'golem') {
    /* 💎 KING CAELUM GEODE — floating geometric quartz golem */
    for (let i = 0; i < 4; i++) {
      const a = time * 2 + (i * Math.PI) / 2
      ctx.fillStyle = '#9d4edd'
      circle(ctx, Math.cos(a) * (r * 1.15), Math.sin(a) * (r * 1.15), r * 0.25)
    }
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    palFace(ctx, r * 0.65, expr, blinking)
  } else if (b.key === 'cogswell') {
    /* ⚙️ PROF COGSWELL TANK — clockwork steampunk brass orb */
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = m.color
    ctx.fill()
    ctx.strokeStyle = outline
    ctx.lineWidth = 4
    ctx.stroke()
    for (let i = 0; i < 8; i++) {
      const a = time * 1.5 + (i * Math.PI) / 4
      circle(ctx, Math.cos(a) * (r + 5), Math.sin(a) * (r + 5), 4)
    }
    palFace(ctx, r * 0.65, expr, blinking)
  } else if (b.key === 'stella') {
    /* 👑 SUPERNOVA STELLA — grand rainbow celestial empress */
    starPath(ctx, 0, 0, r * 1.6, r * 0.8, 12, time * 0.5)
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    const rainbowGrad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r)
    rainbowGrad.addColorStop(0, '#ffffff')
    rainbowGrad.addColorStop(0.4, '#ffd93d')
    rainbowGrad.addColorStop(0.8, '#ff8fb1')
    rainbowGrad.addColorStop(1, '#9d4edd')
    ctx.fillStyle = rainbowGrad
    ctx.fill()
    ctx.strokeStyle = '#ffd93d'
    ctx.lineWidth = 4.5
    ctx.stroke()
    palFace(ctx, r * 0.7, expr, blinking)
  }
}

/* the boss's name tag + a row of little stars = its health bar! ⭐ */
function drawBossBadge(ctx: CanvasRenderingContext2D, m: Monster) {
  const b = BOSSES[Math.min(BOSSES.length - 1, m.boss)]
  const nameY = m.y + m.r + 20
  const starsY = m.y + m.r + 40
  ctx.save()
  ctx.font = `bold 15px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 4
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.strokeText(b.name, m.x, nameY)
  ctx.fillStyle = m.color || '#f278ab'
  ctx.fillText(b.name, m.x, nameY)
  const gap = 16
  const startX = m.x - ((m.maxHp - 1) * gap) / 2
  for (let i = 0; i < m.maxHp; i++) {
    const alive = i < m.hp
    starPath(ctx, startX + i * gap, starsY, alive ? 6.5 : 5, alive ? 2.8 : 2.2, 5, -Math.PI / 2)
    ctx.fillStyle = alive ? '#ffd93d' : 'rgba(0,0,0,0.13)'
    ctx.fill()
    if (alive) {
      ctx.strokeStyle = '#e8a800'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }
  ctx.restore()
}

/* 🫧 THE FOUR BUBBLES — each pal fires their own!
   star ⭐ (Rocky) · water 💧 (Dolly) · heart 💗 (Bunny) · rainbow 🌈 (Zippy) */
function drawShot(ctx: CanvasRenderingContext2D, s: Shot, time: number) {
  /* 💥 the GIANT POP — a huge sparkly bubble with stars spinning around it! */
  if (s.giant) {
    const rr = s.r + Math.sin(time * 9) * 3
    const hue = (time * 300) % 360
    ctx.beginPath()
    ctx.arc(s.x, s.y, rr, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 90%, 88%, 0.55)`
    ctx.fill()
    ctx.strokeStyle = `hsl(${hue}, 85%, 58%)`
    ctx.lineWidth = 4
    ctx.stroke()
    for (let i = 0; i < 3; i++) {
      const a = time * 3 + i * 2.1
      starPath(ctx, s.x + Math.cos(a) * (rr + 11), s.y + Math.sin(a) * (rr + 11), 6.5, 2.7, 5, a)
      ctx.fillStyle = '#ffd93d'
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    circle(ctx, s.x - rr * 0.35, s.y - rr * 0.35, 4.5)
    return
  }
  if (s.kind === 'star') {
    // ⭐ Rocky's golden star bubble
    starPath(ctx, s.x, s.y, s.r + 2, (s.r + 2) * 0.45, 5, s.wob * 2 - Math.PI / 2)
    ctx.fillStyle = COLORS.sun
    ctx.fill()
    ctx.strokeStyle = '#e8a800'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()
  } else if (s.kind === 'water') {
    // 💧 Dolly's splashy water bubble
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(190,235,255,0.92)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(80,180,225,0.95)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    circle(ctx, s.x - 3.5, s.y - 3.5, 2.8)
  } else if (s.kind === 'heart') {
    // 💗 Bunny's wobbly love bubble
    heartPath(ctx, s.x, s.y, s.r + 2)
    ctx.fillStyle = '#ff9ec4'
    ctx.fill()
    ctx.strokeStyle = '#f278ab'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    circle(ctx, s.x - s.r * 0.35, s.y - s.r * 0.5, 2.2)
  } else {
    // 🌈 Zippy's rainbow bubble — it cycles colors as it flies!
    const hue = (time * 220 + s.wob * 57) % 360
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${hue}, 90%, 88%, 0.92)`
    ctx.fill()
    ctx.strokeStyle = `hsl(${hue}, 85%, 58%)`
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    circle(ctx, s.x - 3.5, s.y - 3.5, 2.8)
  }
}

/* 🎁 draw a gift power-up: a big glowing bubble with a friendly symbol
   inside — bright, bubbly & impossible to find scary! */
function drawPowerUp(ctx: CanvasRenderingContext2D, u: PowerUpDrop, time: number) {
  const cfg = POWERUPS[u.type]
  ctx.save()
  ctx.globalAlpha = clamp(u.alpha, 0, 1)
  // soft glow halo that breathes gently
  ctx.beginPath()
  ctx.arc(u.x, u.y, u.r + 9 + Math.sin(time * 3 + u.phase) * 3, 0, Math.PI * 2)
  ctx.fillStyle = withAlpha(cfg.color, 0.22)
  ctx.fill()
  // the shiny bubble
  ctx.beginPath()
  ctx.arc(u.x, u.y, u.r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fill()
  ctx.strokeStyle = cfg.color
  ctx.lineWidth = 3
  ctx.stroke()
  // the friendly symbol inside (emoji = the same everywhere!)
  ctx.font = `${Math.round(u.r * 1.15)}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(cfg.emoji, u.x, u.y + 2)
  // a little golden sparkle orbiting the gift
  const a = time * 2 + u.phase
  starPath(ctx, u.x + Math.cos(a) * (u.r + 8), u.y + Math.sin(a) * (u.r + 8), 6, 2.4, 5, a)
  ctx.fillStyle = '#ffd93d'
  ctx.fill()
  ctx.restore()
}

/* ⭐ a tiny bonus star tumbling down — catch it for extra stars! */
/* 🌟 an enemy star projectile - red/crimson glowing hazard! */
function drawEnemyStar(ctx: CanvasRenderingContext2D, es: EnemyStar) {
  ctx.save()
  starPath(ctx, es.x, es.y, 12, 5, 5, es.rot)
  ctx.fillStyle = es.color || '#ef4444'
  ctx.fill()
  ctx.restore()
}

function drawStarDrop(ctx: CanvasRenderingContext2D, st: StarDrop) {
  ctx.save()
  ctx.globalAlpha = clamp(st.alpha, 0, 1)
  ctx.fillStyle = 'rgba(255,217,61,0.3)'
  circle(ctx, st.x, st.y, 13)
  starPath(ctx, st.x, st.y, 11, 4.7, 5, st.rot)
  ctx.fillStyle = '#ffd93d'
  ctx.fill()
  ctx.strokeStyle = '#e8a800'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()
}

/* ═══════════════════════════════════════════════════════════════════════
   🎉 PARTICLES — confetti, sparkles, pop-rings & floating text
   ═══════════════════════════════════════════════════════════════════════ */
function addText(g: GameData, x: number, y: number, text: string, color: string, size = 22) {
  g.parts.push({
    x, y, vx: 0, vy: -48, life: 1, maxLife: 1, color, size, rot: 0, vr: 0, kind: 'text', text,
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
  addText(g, x, y - 6, pick(['Pop!', 'Wow!', 'Yay!']), pick(['#ff8fb1', '#7fd8be', '#b18aff']))
  addText(g, x + 16, y - 30, '+1⭐', '#e8a800', 15)
  // keep the particle list short & sweet
  if (g.parts.length > 90) g.parts.splice(0, g.parts.length - 90)
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

/* 🎆 happy fireworks for big celebrations (boss defeats!) */
function fireworks(g: GameData) {
  for (let k = 0; k < 4; k++) {
    const fx = rand(g.w * 0.2, g.w * 0.8)
    const fy = rand(g.h * 0.15, g.h * 0.5)
    // one bright expanding ring per firework
    g.parts.push({ x: fx, y: fy, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, color: pick(COLORS.confetti), size: 10, rot: 0, vr: 0, kind: 'ring' })
    // confetti spraying out in every direction
    for (let i = 0; i < 14; i++) {
      g.parts.push({
        x: fx, y: fy,
        vx: rand(-220, 220), vy: rand(-220, 220),
        life: rand(0.6, 1.1), maxLife: 1.1,
        color: pick(COLORS.confetti),
        size: rand(5, 9),
        rot: rand(0, 6), vr: rand(-10, 10),
        kind: 'confetti',
      })
    }
  }
  // keep the particle list short & sweet
  if (g.parts.length > 90) g.parts.splice(0, g.parts.length - 90)
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
      ctx.font = `bold ${p.size || 22}px ${FONT}`
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

/* 🏹 AIMING TRAJECTORY ARROW
   Draws a bouncy dotted arc with an arrow head showing the shot angle! */
function drawAimArrow(ctx: CanvasRenderingContext2D, g: GameData) {
  // 🎯 Aiming trajectory arrow is exclusive to Grown-Ups mode! (Kids mode keeps clean, simple straight shooting)
  if (g.state !== 'playing' || g.mode !== 'adults') return
  const p = g.player
  const py = g.h - 96 - 44
  const angle = p.aimAngle ?? 0 // controls rotate the arrow directly!
  const len = 175
  const endX = p.x + Math.sin(angle) * len
  const endY = py - Math.cos(angle) * len

  ctx.save()
  // 1. Dotted trajectory path with animated sparkle dots
  ctx.strokeStyle = 'rgba(255, 217, 61, 0.75)'
  ctx.lineWidth = 3
  ctx.setLineDash([6, 6])
  ctx.lineDashOffset = -g.time * 28 // animated flow upwards
  ctx.beginPath()
  ctx.moveTo(p.x, py)
  ctx.lineTo(endX, endY)
  ctx.stroke()
  ctx.setLineDash([])

  // 2. Glowing Golden Arrow Head
  ctx.save()
  ctx.translate(endX, endY)
  ctx.rotate(angle)
  // Arrow head triangle
  ctx.fillStyle = '#ffd93d'
  ctx.beginPath()
  ctx.moveTo(0, -14)
  ctx.lineTo(8, 2)
  ctx.lineTo(3, 0)
  ctx.lineTo(3, 7)
  ctx.lineTo(-3, 7)
  ctx.lineTo(-3, 0)
  ctx.lineTo(-8, 2)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#e8a800'
  ctx.lineWidth = 1.5
  ctx.stroke()
  // Little sparkling jewel at the tip of the arrow
  circle(ctx, 0, -14, 2.5)
  ctx.fillStyle = '#ff8fb1'
  ctx.fill()
  ctx.restore()

  ctx.restore()
}

function render(ctx: CanvasRenderingContext2D, g: GameData) {
  drawBackground(ctx, g)
  for (const st of g.starDrops) drawStarDrop(ctx, st)
  for (const es of g.enemyStars) drawEnemyStar(ctx, es)
  for (const m of g.monsters) drawEnemy(ctx, m, g.time)
  for (const u of g.powerups) drawPowerUp(ctx, u, g.time)
  for (const s of g.shots) drawShot(ctx, s, g.time)
  drawPlayer(ctx, g)
  // drawAimArrow(ctx, g) - arrow completely removed
  drawParticles(ctx, g)
  // 🐌 Slow Motion dreamy glow — a soft sleepy ring around the edges
  if (g.active?.type === 'slow') {
    const grad = ctx.createRadialGradient(g.w / 2, g.h / 2, g.h * 0.18, g.w / 2, g.h / 2, g.h * 0.72)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(1, 'rgba(205,190,255,0.30)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, g.w, g.h)
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   🕹 THE GAME COMPONENT — wires everything together
   ═══════════════════════════════════════════════════════════════════════ */
/* 🖼 A tiny canvas that draws any pal — used on the selection cards and
   next to the hearts. Same art as the game, so everyone matches! */
function CharacterPortrait({ id, size, expr = 'smile' }: { id: CharacterId; size: number; expr?: FaceExpr }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const dpr = 2 // draw double-size so faces stay crisp
    cv.width = size * dpr
    cv.height = size * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.translate(size / 2, size / 2 + size * 0.05)
    const scale = size / 110 // pals are drawn about 110px tall at full size
    ctx.scale(scale, scale)
    drawCharacter(ctx, id, expr, 0.4) // a fixed moment = a lively pose
    ctx.restore()
  }, [id, size, expr])
  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden />
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const gRef = useRef<GameData | null>(null)
  const audioRef = useRef<GameAudio | null>(null)
  const controlsRef = useRef<{
    startGame: (chosenLevel?: number) => void
    startLevel: (levelIndex: number) => void
    openLevelSelect: () => void
    openBazaar: () => void
    closeBazaar: () => void
    buyBooster: (bId: string, cost: number) => void
    toggleCosmetic: (cId: string, cost: number) => void
    pullGachapon: () => void
    toggleVFX: (vId: string, cost: number) => void
    buySecretPal: (pId: CharacterId, cost: number) => void
    buyIslandToy: (tId: string, cost: number) => void
    unlockZenMode: () => void
    showModes: () => void
    pickMode: (mode: Mode) => void
    backToModes: () => void
    selectCharacter: (c: CharacterId) => void
    next: () => void
    togglePause: () => void
    resumeGame: () => void
    restartLevel: () => void
    toggleMute: () => void
    toMenu: () => void
    bye: () => void
  } | null>(null)

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
    character: 'rocky' as CharacterId,
    bossActive: false,
    shield: false,
    powerType: null as PowerUpType | null,
    powerStamp: 0,
  })
  const [stars, setStars] = useState(3)
  const [muted, setMuted] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [hurtKey, setHurtKey] = useState(0) // changing this re-plays the heart-shake
  const [friend, setFriend] = useState<IntroInfo | null>(null) // "Meet a new friend!" pop-up
  const [lastMode, setLastMode] = useState<Mode | null>(null) // ⭐ chip on the mode you played last time
  const [pal, setPal] = useState<CharacterId>('rocky') // pal highlighted on the selection screen
  const [selectedWorld, setSelectedWorld] = useState<number>(1) // active world on the 120-level select map
  const [saveData, setSaveData] = useState<SavedGameData | null>(null)
  const [mounted, setMounted] = useState<boolean>(false)

  // remember which mode & pal you chose last visit and hydrate save data
  useEffect(() => {
    setMounted(true)
    try {
      const save = loadLocalSave()
      setSaveData(save)
      const currentMode = save.mode || 'kids'
      const highestLvl = currentMode === 'kids' ? save.kidsHighestLevel : save.adultsHighestLevel
      setSelectedWorld(Math.floor(highestLvl / 10) + 1)
      const saved = localStorage.getItem('bubblePopMode')
      if (saved === 'kids' || saved === 'adults') setLastMode(saved)
      const savedPal = localStorage.getItem('bubblePopCharacter')
      if (savedPal === 'rocky' || savedPal === 'dolly' || savedPal === 'bunny' || savedPal === 'zippy') setPal(savedPal)
    } catch {
      /* private browsing — no problem */
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const g = freshGame()
    gRef.current = g
    // Immediate hydration sync so HUD matches stored progress right away
    setTimeout(() => {
      try {
        const s = loadLocalSave()
        setSaveData(s)
        syncHud()
      } catch {}
    }, 0)
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
        const maxHearts = getModeConfig(g.mode).hearts
        const bossActive = g.monsters.some((m) => m.boss >= 0)
        const powerType = g.active?.type ?? null
        const powerStamp = g.active?.startedAt ?? 0
        if (prev.level === g.level && prev.popped === g.popped && prev.hearts === g.hearts && prev.score === g.score && prev.goal === goal && prev.mode === g.mode && prev.character === g.character && prev.bossActive === bossActive && prev.shield === g.shield && prev.powerType === powerType && prev.powerStamp === powerStamp)
          return prev
        return { level: g.level, popped: g.popped, goal, hearts: g.hearts, maxHearts, score: g.score, mode: g.mode, character: g.character, bossActive, shield: g.shield, powerType, powerStamp }
      })
    }

    /* 🫧 fire your pal's special bubble! (star / water / heart / rainbow)
       🌈 with the Rainbow Bubbles power, every shot is a fan of THREE! */
    const shootNow = () => {
      if (g.state !== 'playing' || g.player.cool > 0) return
      const kind = CHARACTERS[g.character].bubble
      const py = g.h - 96

      if (g.mode === 'adults') {
        // 🎯 GROWN-UPS MODE: Character perks (firing straight upward)
        const fan = g.active?.type === 'rainbow' ? [-0.24, 0, 0.24] : [0]

        if (g.character === 'rocky') {
          // 🚀 Rocky: Heavy Piercing Star Shot (pierces 2 enemies!)
          g.player.cool = 0.52
          for (const offset of fan) {
            g.shots.push({
              x: g.player.x,
              y: py - 44,
              vy: -PLAYER.shotSpeed * 1.15 * Math.cos(offset),
              vx: PLAYER.shotSpeed * 1.15 * Math.sin(offset),
              r: 15,
              kind: 'star',
              wob: rand(0, 6),
              pierce: 2,
            })
          }
        } else if (g.character === 'dolly') {
          // 🐬 Dolly: Twin Hydro-Volley (fires 2 parallel bubbles side by side)
          g.player.cool = 0.44
          for (const sign of [-1, 1]) {
            for (const offset of fan) {
              g.shots.push({
                x: g.player.x + 14 * sign,
                y: py - 44,
                vy: -PLAYER.shotSpeed * Math.cos(offset),
                vx: PLAYER.shotSpeed * Math.sin(offset),
                r: 9,
                kind: 'water',
                wob: rand(0, 6),
              })
            }
          }
        } else if (g.character === 'bunny') {
          // 🐰 Bunny: Rapid-Fire Love Blaster (super fast fire rate!)
          g.player.cool = 0.22
          for (const offset of fan) {
            g.shots.push({
              x: g.player.x,
              y: py - 44,
              vy: -PLAYER.shotSpeed * 1.1 * Math.cos(offset),
              vx: PLAYER.shotSpeed * 1.1 * Math.sin(offset),
              r: 10,
              kind: 'heart',
              wob: rand(0, 6),
            })
          }
        } else if (g.character === 'zippy') {
          // 🤖 Zippy: Rainbow Pop
          g.player.cool = 0.40
          for (const offset of fan) {
            g.shots.push({
              x: g.player.x,
              y: py - 44,
              vy: -PLAYER.shotSpeed * Math.cos(offset),
              vx: PLAYER.shotSpeed * Math.sin(offset),
              r: 12,
              kind: 'rainbow',
              wob: rand(0, 6),
            })
          }
        } else if (g.character === 'panda') {
          // 🐼 Panda: Giant Clover Piercer (pierces 3 enemies!)
          g.player.cool = 0.58
          for (const offset of fan) {
            g.shots.push({
              x: g.player.x,
              y: py - 44,
              vy: -PLAYER.shotSpeed * Math.cos(offset),
              vx: PLAYER.shotSpeed * Math.sin(offset),
              r: 16,
              kind: 'star',
              wob: rand(0, 6),
              pierce: 3,
            })
          }
        } else {
          // 🐱 Kitty: Sparkle Spread (fires 3 mini heart pellets)
          g.player.cool = 0.38
          const pelletOffsets = [-0.18, 0, 0.18]
          for (const pOff of pelletOffsets) {
            for (const offset of fan) {
              const ang = offset + pOff
              g.shots.push({
                x: g.player.x,
                y: py - 44,
                vy: -PLAYER.shotSpeed * 0.95 * Math.cos(ang),
                vx: PLAYER.shotSpeed * 0.95 * Math.sin(ang),
                r: 8,
                kind: 'heart',
                wob: rand(0, 6),
              })
            }
          }
        }
      } else {
        // 🧒 KIDS MODE: Unchanged! Simple, friendly, straight shots
        g.player.cool = getModeConfig(g.mode).shootCooldown
        const fan = g.active?.type === 'rainbow' ? [-0.24, 0, 0.24] : [0]
        for (const offset of fan) {
          g.shots.push({
            x: g.player.x,
            y: py - 44,
            vy: -PLAYER.shotSpeed * Math.cos(offset),
            vx: PLAYER.shotSpeed * Math.sin(offset),
            r: kind === 'star' ? 12 : kind === 'heart' ? 11 : 10,
            kind,
            wob: rand(0, 6),
          })
        }
      }
      audio.shoot()
    }

    /* start a (new) level with a cheerful GO! banner */
    const beginLevel = () => {
      g.popped = 0
      g.monsters.length = 0
      g.shots.length = 0
      g.spawnT = 0.6
      g.bossSpawned = false // every level gets its own big pal at the end!
      g.powerups.length = 0 // fresh sky, fresh gifts!
      g.starDrops.length = 0
      g.enemyStars.length = 0
      g.puSpawnT = g.level === 0 ? rand(5, 9) : rand(8, 13) // first gift comes soon
      g.introQueue.length = 0 // drop any pop-ups that are still waiting
      g.player.x = g.w / 2
      g.player.cool = 0
      g.player.surprised = 0 // fresh face, fresh level!
      g.player.cheer = 0
      g.dragging = false
      g.targetX = null
      g.targetY = null
      // Apply pre-level booster if bought
      const activeSave = loadLocalSave()
      if (activeSave.activeBooster === 'shield') {
        g.shield = true
        addText(g, g.w / 2, g.h * 0.45, '🫧 BOOSTER: SHIELD READY!', '#38bdf8', 22)
      } else if (activeSave.activeBooster === 'heart') {
        g.hearts = getModeConfig(g.mode).hearts + 1
        addText(g, g.w / 2, g.h * 0.45, '💗 BOOSTER: +1 EXTRA HEART!', '#f43f5e', 22)
      } else if (activeSave.activeBooster === 'magnet') {
        g.active = { type: 'magnet', t: 25, max: 25, startedAt: g.time }
        addText(g, g.w / 2, g.h * 0.45, '🧲 BOOSTER: STAR MAGNET!', '#fbbf24', 22)
      }
      // Consume booster after starting
      if (activeSave.activeBooster) {
        activeSave.activeBooster = null
        saveLocalProgress(activeSave)
        setSaveData(activeSave)
      }
      g.cosmetic = activeSave.activeCosmetic || 'none'
      g.vfx = activeSave.activeVFX || 'classic'
      g.state = 'playing'
      setUi('playing')
      addText(g, g.w / 2, g.h * 0.35, `${levelsOf(g.mode)[g.level].name} — GO!`, '#ff8fb1')
      audio.startMusic(getModeConfig(g.mode).fastMusic)
      syncHud()
    }

    /* mode picked! now off to choose your pal 🚀🐬🐰🤖 */
    const pickMode = (m: Mode) => {
      audio.init()
      audio.click()
      g.mode = m
      try {
        localStorage.setItem('bubblePopMode', m) // remember it for next visit
        const save = loadLocalSave()
        save.mode = m
        const resumeL = m === 'kids' ? save.kidsHighestLevel : save.adultsHighestLevel
        g.level = clamp(resumeL, 0, 119)
        saveLocalProgress(save)
        setSaveData(save)
        setSelectedWorld(Math.floor(g.level / 10) + 1)
      } catch {
        /* private browsing — no problem */
      }
      g.state = 'charSelect'
      setUi('charSelect')
      syncHud()
    }

    /* change your mind — back to the mode screen */
    const backToModes = () => {
      audio.click()
      g.state = 'modeSelect'
      setUi('modeSelect')
    }

    /* tap a pal card — hear their happy pop & see them glow! */
    const selectCharacter = (c: CharacterId) => {
      audio.init()
      g.character = c
      audio.popFor(c) // preview this pal's pop sound!
      setPal(c)
      try {
        localStorage.setItem('bubblePopCharacter', c) // remember your pal
      } catch {
        /* private browsing — no problem */
      }
    }

    /* LET'S GO! → Resume at your highest unlocked level (or chosen level) with your pal! */
    const startGame = (chosenLevel?: number) => {
      audio.init()
      audio.click()
      const save = loadLocalSave()
      setSaveData(save)
      const highest = g.mode === 'kids' ? save.kidsHighestLevel : save.adultsHighestLevel
      const targetLvl = chosenLevel !== undefined ? chosenLevel : highest
      g.level = clamp(targetLvl, 0, 119)
      g.score = save.totalStars || 0
      g.hearts = getModeConfig(g.mode).hearts
      g.seen = {} // every new playthrough re-introduces the friends 👋
      g.seenPower = {} // ...and the power-up how-to pop-ups too! 🎁
      g.active = null
      g.shield = false
      beginLevel()
    }

    /* Start any specific level directly from the 120-level select map */
    const startLevel = (levelIndex: number) => {
      startGame(levelIndex)
    }

    /* Open the interactive 12-World / 120-Level selection map */
    const openLevelSelect = () => {
      audio.init()
      audio.click()
      const save = loadLocalSave()
      setSaveData(save)
      const currentHighest = g.mode === 'kids' ? save.kidsHighestLevel : save.adultsHighestLevel
      setSelectedWorld(Math.floor(currentHighest / 10) + 1)
      g.state = 'levelSelect'
      setUi('levelSelect')
    }

    /* ⏸️ Pause the action anytime in the middle of gameplay */
    const togglePause = () => {
      audio.click()
      if (g.state === 'playing') {
        g.state = 'paused'
        setUi('paused')
      } else if (g.state === 'paused') {
        g.state = 'playing'
        setUi('playing')
      }
    }

    const resumeGame = () => {
      audio.click()
      if (g.state === 'paused') {
        g.state = 'playing'
        setUi('playing')
      }
    }

    const restartLevel = () => {
      audio.click()
      g.score = loadLocalSave().totalStars || 0
      g.hearts = getModeConfig(g.mode).hearts
      g.active = null
      g.shield = false
      beginLevel()
    }

    const next = () => {
      audio.click()
      g.level++
      g.hearts = getModeConfig(g.mode).hearts // fresh hearts every level — kind & easy!
      beginLevel()
    }

    /* go back to the menu (lets you switch between kids & grown-ups mode) */
    const toMenu = () => {
      audio.click()
      persistStars(g.score)
      g.state = 'menu'
      g.monsters.length = 0
      g.shots.length = 0
      g.powerups.length = 0
      g.starDrops.length = 0
      g.enemyStars.length = 0
      g.active = null
      g.shield = false
      audio.stopMusic()
      setUi('menu')
      syncHud()
    }

    /* menu: the big START button was pressed — now show "who's flying today?" */
    const showModes = () => {
      audio.init()
      audio.click()
      g.state = 'modeSelect'
      setUi('modeSelect')
    }

    /* 👋 quit (lives only on the end screens) → a friendly goodbye screen */
    const bye = () => {
      audio.click()
      g.monsters.length = 0
      g.shots.length = 0
      g.powerups.length = 0
      g.starDrops.length = 0
      g.enemyStars.length = 0
      g.active = null
      g.shield = false
      g.state = 'bye'
      setUi('bye')
    }

    /* level finished! pop the leftovers into confetti and show the reward */
    const completeLevel = () => {
      for (const m of g.monsters) {
        burst(g, m.x, m.y, m.color)
        g.score++
      }
      persistStars(g.score)
      g.monsters.length = 0
      g.shots.length = 0
      // hush any "new friend" pop-ups — the reward screen takes the stage!
      g.introQueue.length = 0
      if (introTimer.id) clearTimeout(introTimer.id)
      g.introBusy = false
      setFriend(null)
      g.player.cheer = 3 // 🥳 your pal cheers behind the reward screen!
      const maxHearts = getModeConfig(g.mode).hearts
      const earned = g.hearts >= maxHearts ? 3 : g.hearts >= Math.ceil(maxHearts / 2) ? 2 : 1
      setStars(earned)
      try {
        const updatedSave = recordLevelCompletion(g.mode, g.level, earned, g.score, g.monsters.some((mm) => mm.boss >= 0))
        setSaveData(updatedSave)
      } catch {}
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
      g.player.surprised = 1.2 // 😮 "uh-oh!" face for a moment
      setHurtKey((k) => k + 1)
      audio.oops()
      addText(g, clamp(m.x, 60, g.w - 60), g.h - 150, 'Oops!', '#ff8fb1')

      // 🧒 KIDS MODE SAFETY NET: The "No Game Over" Bubble Rescue
      if (g.hearts <= 0) {
        if (g.mode === 'kids') {
          g.hearts = MODES.kids.hearts
          audio.giantPop()
          addText(g, g.w / 2, g.h * 0.5, '🫧 BUBBLE RESCUE! 🌟', '#ffd93d', 26)
          // shower stars and push active low hazards back
          for (let k = 0; k < 12; k++) {
            g.parts.push({
              x: g.player.x + rand(-30, 30),
              y: g.h - 120,
              vx: rand(-120, 120),
              vy: rand(-160, -40),
              life: rand(0.5, 0.9),
              maxLife: 0.9,
              color: pick(['#ffd93d', '#ff8fb1', '#70d6ff']),
              size: rand(4, 7),
              rot: 0,
              vr: rand(-5, 5),
              kind: 'confetti',
            })
          }
          for (const mm of g.monsters) {
            if (mm.boss < 0 && mm.y > g.h * 0.5) mm.y -= 160
          }
        } else {
          g.state = 'over'
          setUi('over')
          audio.stopMusic()
          audio.gameOverJingle()
        }
      }
      syncHud()
    }

    /* 👋 "Meet a new friend!" pop-up plumbing — each pop-up gets the stage
       for ~2.6 seconds, with a happy chime, then the next one takes over. */
    const introTimer = { id: null as ReturnType<typeof setTimeout> | null }
    const showNextIntro = () => {
      if (g.introBusy || g.introQueue.length === 0) return
      const info = g.introQueue.shift()
      if (!info) return
      g.introBusy = true
      setFriend(info)
      audio.newFriend()
      if (introTimer.id) clearTimeout(introTimer.id)
      introTimer.id = setTimeout(() => {
        setFriend(null)
        g.introBusy = false
        showNextIntro() // is another friend waiting in line?
      }, 2600)
    }

    /* ════════ 🎁 POWER-UP plumbing — gifts, bonus stars & the GIANT POP ════════
       Everything a collected gift DOES lives right here, in one cozy spot. */

    /* 👑 the big pal is popped — fireworks & a big star bonus!
       (used by bubble boops AND by the Giant Pop) */
    const defeatBoss = (j: number) => {
      const m = g.monsters[j]
      const b = BOSSES[Math.min(BOSSES.length - 1, m.boss)]
      g.monsters.splice(j, 1)
      burst(g, m.x, m.y, m.color)
      fireworks(g)
      g.score += b.bonus
      persistStars(g.score)
      addText(g, m.x, m.y - 46, `+${b.bonus} ⭐ BONUS!`, '#e8a800', 24)
      audio.bossDown()
      completeLevel()
    }

    /* ⭐ a bonus star was caught — sparkle & score! */
    const collectStar = (st: StarDrop) => {
      g.score += PU.starValue
      persistStars(g.score)
      audio.pop()
      addText(g, st.x, st.y - 8, `+${PU.starValue}⭐`, '#e8a800', 17)
      for (let k = 0; k < 6; k++) {
        g.parts.push({
          x: st.x, y: st.y,
          vx: rand(-90, 90), vy: rand(-130, -20),
          life: rand(0.3, 0.6), maxLife: 0.6,
          color: pick(['#fff8c9', '#ffd93d', '#ffffff']),
          size: rand(2, 4), rot: 0, vr: rand(-5, 5), kind: 'sparkle',
        })
      }
    }

    /* hearts are low? the Heart Refill drops much more often 💗
       hearts are full? it almost never drops (no wasted gifts!) */
    const heartWeight = () => (g.hearts <= 2 ? 3 : g.hearts >= getModeConfig(g.mode).hearts ? 0.25 : 1)

    /* which gift floats down next? a friendly weighted pick */
    const pickPowerType = (): PowerUpType => {
      const keys = Object.keys(POWERUPS) as PowerUpType[]
      const wOf = (k: PowerUpType) => POWERUPS[k].weight * (k === 'heart' ? heartWeight() : 1)
      let total = 0
      for (const k of keys) total += wOf(k)
      let roll = Math.random() * total
      for (const k of keys) {
        roll -= wOf(k)
        if (roll <= 0) return k
      }
      return 'shield'
    }

    /* a gift bubble appears at the top & drifts down ever so gently */
    const spawnPowerUp = () => {
      const type = pickPowerType()
      const x = rand(70, g.w - 70)
      g.powerups.push({
        x,
        baseX: x,
        y: -34,
        vy: PU.fallSpeed * rand(0.9, 1.1),
        r: 24,
        type,
        phase: rand(0, Math.PI * 2),
        alpha: 1,
      })
    }

    /* COLLECTED! happy sound · sparkles · your pal does a little cheer 🥳 */
    const collectPowerUp = (type: PowerUpType, x: number, y: number) => {
      const cfg = POWERUPS[type]
      audio.powerUp()
      for (let i = 0; i < 10; i++) {
        g.parts.push({
          x, y,
          vx: rand(-120, 120), vy: rand(-170, -20),
          life: rand(0.4, 0.85), maxLife: 0.85,
          color: pick(['#fff8c9', '#ffd93d', '#ffffff', cfg.color]),
          size: rand(2.5, 5),
          rot: rand(0, 6), vr: rand(-6, 6),
          kind: 'sparkle',
        })
      }
      g.player.cheer = 1.1 // a little hip-hip-hooray bounce!
      addText(g, clamp(x, 80, g.w - 80), y - 26, `${cfg.emoji} ${cfg.name}!`, cfg.color, 20)
      if (type === 'heart') {
        const maxHearts = getModeConfig(g.mode).hearts
        if (g.hearts < maxHearts) {
          g.hearts++ // one heart back — up to the maximum!
          addText(g, g.player.x, g.h - 170, '+1 💗', '#ff8fb1', 22)
        } else {
          addText(g, g.player.x, g.h - 170, 'Hearts full!', '#ff8fb1', 18)
        }
      } else if (type === 'shield') {
        g.shield = true // a soft bubble that blocks one hit
      } else if (type === 'giant') {
        launchGiant()
      } else {
        // timed powers: only ONE at a time — a new gift replaces the old one!
        g.active = { type, t: cfg.duration, max: cfg.duration, startedAt: g.time }
      }
      // first time ever getting this gift? show the friendly how-to pop-up!
      if (!g.seenPower[type]) {
        g.seenPower[type] = true
        g.introQueue.push({ name: cfg.name, emoji: cfg.emoji, hint: cfg.tip, power: true })
        showNextIntro()
      }
      syncHud()
    }

    /* 💥 the Giant Pop: one super-sized bubble rises from your pal… */
    const launchGiant = () => {
      g.shots.push({
        x: g.player.x,
        y: g.h - 150,
        vy: -PLAYER.shotSpeed * 0.62,
        r: 27,
        kind: 'rainbow',
        wob: 0,
        giant: true,
      })
    }

    /* …and BURSTS into a giant confetti party that pops EVERY friend on
       screen at once! (Big bosses only lose a few star points — no shortcuts
       past the level's big pal!) */
    const giantBurst = (gx: number, gy: number) => {
      audio.giantPop()
      fireworks(g)
      addText(g, gx, gy, 'GIANT POP!', '#b18aff', 30)
      for (let j = g.monsters.length - 1; j >= 0; j--) {
        const m = g.monsters[j]
        if (m.boss >= 0) {
          m.hp -= PU.bossDamage // bosses only lose a few star points!
          m.hitFlash = 0.35
          addText(g, m.x + rand(-20, 20), m.y - m.r * 0.5, pick(['Boing!', 'Oof!', 'Wow!']), '#f278ab', 22)
          if (m.hp <= 0) {
            defeatBoss(j)
            return // completeLevel handled the whole celebration!
          }
          continue
        }
        burst(g, m.x, m.y, m.color)
        g.popped++
        g.score++
        persistStars(g.score)
        g.monsters.splice(j, 1)
      }
      // did the giant pop finish the goal? then here comes the boss!
      const goal = goalOf(g)
      const hasBoss = g.monsters.some((mm) => mm.boss >= 0)
      if (g.popped >= goal && !g.bossSpawned && !hasBoss) spawnBoss()
      syncHud()
    }

    /* 👾 make a new silly friend at the top of the sky!
       Which friend? A weighted pick from every enemy whose "fromLevel"
       has arrived — so new pals join the party gradually, level by level. */
    const spawnMonster = (L: LevelConfig) => {
      const [rMin, rMax] = getModeConfig(g.mode).monsterRadius // grown-ups get tinier targets!
      const types = (Object.keys(ENEMIES) as EnemyType[]).filter((k) => g.level >= ENEMIES[k].fromLevel)
      let total = 0
      for (const k of types) total += ENEMIES[k].weight
      let roll = Math.random() * total
      let type: EnemyType = types[0]
      for (const k of types) {
        roll -= ENEMIES[k].weight
        if (roll <= 0) {
          type = k
          break
        }
      }
      const cfg = ENEMIES[type]
      const r = rand(rMin, rMax) * cfg.sizeMul
      // never appear right on top of the player — keep a friendly gap!
      let baseX = g.w / 2
      for (let tries = 0; tries < 8; tries++) {
        baseX = rand(r + 12, g.w - r - 12)
        if (Math.abs(baseX - g.player.x) > 130) break
      }
      g.monsters.push({
        id: g.nextMonsterId++,
        x: cfg.move === 'drift' ? (Math.random() < 0.5 ? -r : g.w + r) : baseX,
        baseX,
        y: -r - 12,
        r,
        color: cfg.color,
        type,
        move: cfg.move,
        boss: -1,
        hp: cfg.hp,
        maxHp: cfg.hp,
        wob: rand(0, Math.PI * 2),
        wobSpeed: rand(1.5, 3),
        drift: L.drift * rand(0.6, 1.2),
        speedMul: cfg.speedMul * rand(0.9, 1.1),
        blink: rand(1, 3),
        vx:
          cfg.move === 'bounce'
            ? rand(70, 120) * (Math.random() < 0.5 ? -1 : 1) // bounces off the walls!
            : rand(45, 75) * (Math.random() < 0.5 ? -1 : 1), // gentle cloud drift
        alpha: 1,
        hitFlash: 0,
        spin: rand(0, Math.PI * 2),
        settled: false,
        targetY: 0,
        shootT: rand(2.5, 6.0),
      })
      // first time this friend ever appears? roll out the welcome banner!
      if (!g.seen[type]) {
        g.seen[type] = true
        g.introQueue.push({ name: cfg.name, emoji: cfg.emoji, hint: cfg.hint })
        showNextIntro()
      }
    }

    /* 👑 HERE COMES THE BOSS! One big friendly pal guards the end of every
       level (Giant Jelly → Big Bouncy Bunny → King Blobby). It glides side
       to side, can never reach the ground, and pops into fireworks when
       all of its little health stars are booped away! */
    const spawnBoss = () => {
      const b = BOSSES[Math.min(BOSSES.length - 1, Math.floor(g.level / 10))]
      const r = clamp(g.w * 0.075, 38, 56) * (g.mode === 'adults' ? 0.85 : 1)
      const hp = bossHpOf(g, b)
      const lvlColors = getLevelColors(g.level)
      g.monsters.push({
        id: g.nextMonsterId++,
        x: g.w / 2,
        y: -r - 20,
        baseX: g.w / 2,
        r,
        color: lvlColors.bossColor || b.color,
        type: 'blobby', // bosses are drawn by drawBoss(), type is unused
        move: 'straight',
        boss: Math.floor(g.level / 10),
        hp,
        maxHp: hp,
        wob: 0,
        wobSpeed: 1.5,
        drift: 0,
        speedMul: 0,
        blink: rand(1, 3),
        vx: 0,
        alpha: 1,
        hitFlash: 0,
        spin: 0,
        settled: false,
        targetY: clamp(g.h * 0.24, 105, 175),
      })
      g.bossSpawned = true
      g.introQueue.push({ name: b.name, emoji: b.emoji, hint: 'boop it until every star is gone!', boss: true })
      showNextIntro()
      addText(g, g.w / 2, g.h * 0.38, 'BOSS TIME!', '#f278ab', 30)
      syncHud()
    }

    /* ════════ THE HEARTBEAT: runs ~60 times per second ════════ */
    const update = (dt: number) => {
      g.time += dt
      // 🐌 Slow Motion: enemy-time crawls at half speed while the glow is on!
      g.et += dt * (g.active?.type === 'slow' ? 0.5 : 1)
      // pal mood timers tick even behind menus (so the cheer keeps dancing!)
      if (g.player.surprised > 0) g.player.surprised -= dt
      if (g.player.cheer > 0) g.player.cheer -= dt
      g.player.blink -= dt
      if (g.player.blink < -0.15) g.player.blink = rand(2, 4.5)
      // clouds drift in every state (even behind the menus — so cozy)
      for (const c of g.clouds) {
        c.x -= c.v * dt
        if (c.x < -120) {
          c.x = g.w + 120
          c.y = rand(30, g.h * 0.35)
        }
      }
      updateParticles(g, g.state === 'paused' ? 0 : dt)
      if (g.state !== 'playing') return
      showNextIntro() // any "Meet a new friend!" pop-ups waiting their turn?

      /* ── player movement & grown-ups fixed turret aiming ── */
      const p = g.player
      if (p.aimAngle === undefined) p.aimAngle = 0

      // 🚀 Standard responsive movement for all modes (arrows completely removed)
      let vx = 0
      if (keys.left) vx -= PLAYER.speed * (g.mode === 'adults' ? 1.15 : 1)
      if (keys.right) vx += PLAYER.speed * (g.mode === 'adults' ? 1.15 : 1)
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
      // once the goal is reached the boss arrives — regular friends take a break
      if (g.spawnT <= 0 && g.monsters.length < L.maxOnScreen && g.popped < goal) {
        spawnMonster(L)
        const gap = lerp(L.spawnEvery, L.spawnEveryMin, progress) * (g.turbo ? 0.12 : 1) * rand(0.75, 1.25)
        g.spawnT = gap
      }

      /* ── 🎁 gift power-ups drift down every little while ──
         Level 1 gets them MORE often, so little kids feel helped! */
      g.puSpawnT -= dt
      // 🧒 Kids Mode Dynamic Pity Spawner: drops assistance if hearts <= 2
      const pityTrigger = g.mode === 'kids' && g.hearts <= 2 && g.powerups.length === 0
      if ((g.puSpawnT <= 0 || pityTrigger) && g.powerups.length < 2) {
        spawnPowerUp()
        const range = g.level === 0 ? PU.everyLevel1 : PU.every
        g.puSpawnT = rand(range[0], range[1]) * (g.turbo ? 0.25 : 1)
      }

      /* ── enemy friends floating down — each with their own silly move! ──
         🐌 during Slow Motion everything in here runs at HALF speed! */
      const slowF = g.active?.type === 'slow' ? 0.5 : 1
      const fall = lerp(L.fallSpeed, L.fallSpeedMax, progress)
      for (let i = g.monsters.length - 1; i >= 0; i--) {
        const m = g.monsters[i]
        m.wob += m.wobSpeed * dt * slowF
        m.blink -= dt
        if (m.blink < -0.15) m.blink = rand(2, 4)
        if (m.hitFlash > 0) m.hitFlash -= dt

        /* 👑 bosses glide side to side near the top & can NEVER reach the
           ground — so they can never scare you. Just boop their stars away! */
        if (m.boss >= 0) {
          if (!m.settled) {
            m.y += 90 * dt // floats down to its comfy hover spot first
            if (m.y >= m.targetY) {
              m.y = m.targetY
              m.settled = true
            }
          } else {
            const b = BOSSES[Math.min(BOSSES.length - 1, m.boss)]
            m.y = m.targetY + Math.sin(g.et * b.swingSpeed * 1.4) * 12 // gentle bob
            m.x = g.w / 2 + Math.sin(g.et * b.swingSpeed) * g.w * b.swingAmp // side to side
          }
          continue
        }

        switch (m.move) {
          case 'straight': // Blobby: floats slowly straight down
            m.y += fall * m.speedMul * slowF * dt
            break
          case 'zigzag': // Zigzag Zoe: gentle side-to-side wiggles
            m.y += fall * m.speedMul * slowF * dt
            m.x = clamp(m.baseX + Math.sin(m.wob) * m.drift, m.r, g.w - m.r)
            break
          case 'bounce': {
            // Bouncy Bob: bounces off the screen edges while slowly sinking
            m.y += fall * m.speedMul * slowF * dt
            m.x += m.vx * dt * slowF
            if (m.x < m.r) {
              m.x = m.r
              m.vx = Math.abs(m.vx)
            }
            if (m.x > g.w - m.r) {
              m.x = g.w - m.r
              m.vx = -Math.abs(m.vx)
            }
            break
          }
          case 'spin': // Spinny Spike: twirls & drifts down a bit faster
            m.y += fall * m.speedMul * slowF * dt
            m.x = clamp(m.baseX + Math.sin(m.wob) * m.drift * 0.5, m.r, g.w - m.r)
            m.spin += dt * 4.5 * slowF
            break
          case 'drift': // Sleepy Cloud: drifts across the whole sky (wraps around)
            m.y += fall * m.speedMul * slowF * dt
            m.x += m.vx * dt * slowF
            if (m.x < -m.r) m.x = g.w + m.r
            if (m.x > g.w + m.r) m.x = -m.r
            break
          case 'fade': // Sneaky Ghosty: peek-a-boo! fades in & out
            m.y += fall * m.speedMul * slowF * dt
            m.x = clamp(m.baseX + Math.sin(m.wob) * m.drift * 0.6, m.r, g.w - m.r)
            m.alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(g.et * 1.7 + m.wob))
            break
          case 'puffer': // Prickly Puffer: slows down as it gets closer
            m.y += fall * m.speedMul * slowF * dt
            m.x = clamp(m.baseX + Math.sin(m.wob) * m.drift * 0.4, m.r, g.w - m.r)
            break
          case 'trail': // Gummy Glider: descends leaving honey drifts
            m.y += fall * m.speedMul * slowF * dt
            m.x = clamp(m.baseX + Math.sin(m.wob * 0.8) * m.drift * 0.7, m.r, g.w - m.r)
            break
          case 'dive': // Darting Dragonfly: hovers then dives
            m.y += fall * m.speedMul * slowF * dt * (1 + Math.sin(g.et * 4) * 0.4)
            m.x = clamp(m.baseX + Math.cos(m.wob) * m.drift, m.r, g.w - m.r)
            break
          case 'armored': // Armored Armadillo: heavy downward roll
            m.y += fall * m.speedMul * slowF * dt
            m.x = clamp(m.baseX + Math.sin(m.wob * 0.5) * m.drift * 0.3, m.r, g.w - m.r)
            break
          case 'mitosis': // Mitosis Mite: quick jittery drift
            m.y += fall * m.speedMul * slowF * dt
            m.x = clamp(m.baseX + Math.sin(m.wob * 1.5) * m.drift * 0.9, m.r, g.w - m.r)
            break
          case 'teleport': // Chrono Cosmo: quantum hops sideways
            m.y += fall * m.speedMul * slowF * dt
            m.x = clamp(m.baseX + Math.sin(Math.floor(g.et * 1.2)) * (g.w * 0.25), m.r, g.w - m.r)
            break
        }

        if (m.y - m.r > g.h - 14) {
          g.monsters.splice(i, 1)
          if (g.shield) {
            // 🫧 the Bubble Shield pops with a happy sound & saves the heart!
            g.shield = false
            audio.shieldPop()
            addText(g, clamp(m.x, 60, g.w - 60), g.h - 140, 'Shield saved you!', '#3fa8d8', 20)
            for (let k = 0; k < 10; k++) {
              g.parts.push({
                x: g.player.x, y: g.h - 120,
                vx: rand(-150, 150), vy: rand(-180, -20),
                life: rand(0.4, 0.8), maxLife: 0.8,
                color: pick(['#bfe9ff', '#ffffff', '#8fd8ff']),
                size: rand(3, 5), rot: 0, vr: rand(-5, 5), kind: 'sparkle',
              })
            }
            syncHud()
          } else {
            loseHeart(m)
          }
          if (g.state !== 'playing') return
        }
      }

      /* 🌟 ENEMY STAR ATTACKS: Controlled, capped & smooth */
      const maxStarsAllowed = g.mode === 'kids' ? 2 : 4
      if (g.enemyStars.length < maxStarsAllowed) {
        for (const m of g.monsters) {
          if (m.y < 40 || m.y > g.h - 160) continue
          if (m.shootT === undefined) m.shootT = rand(3.0, 7.0)
          m.shootT -= dt * slowF
          if (m.shootT <= 0 && g.enemyStars.length < maxStarsAllowed) {
            const isBoss = m.boss >= 0
            m.shootT = isBoss
              ? rand(2.4, 4.0)
              : g.mode === 'adults'
              ? rand(4.0, 7.5)
              : rand(6.5, 11.0)

            const dxToPlayer = p.x - m.x
            const aimFactor = clamp(dxToPlayer * 0.35, -60, 60)
            const starVy = rand(140, 200)

            g.enemyStars.push({
              x: m.x,
              y: m.y + m.r + 4,
              vx: aimFactor,
              vy: starVy,
              rot: rand(0, Math.PI * 2),
              vr: rand(2.5, 5.0) * (Math.random() < 0.5 ? -1 : 1),
              color: isBoss ? '#f43f5e' : '#fb7185',
            })
          }
        }
      }

      /* 🌟 ENEMY STARS MOVEMENT & PLAYER DAMAGE */
      const palY = g.h - 96 // the player pal hover height
      for (let i = g.enemyStars.length - 1; i >= 0; i--) {
        const es = g.enemyStars[i]
        es.y += es.vy * slowF * dt
        es.x += es.vx * slowF * dt
        es.rot += es.vr * dt

        // Check collision with player character
        const dx = p.x - es.x
        const dy = (palY - 14) - es.y
        if (dx * dx + dy * dy < 36 * 36) {
          g.enemyStars.splice(i, 1)
          if (g.shield) {
            g.shield = false
            audio.shieldPop()
            addText(g, p.x, g.h - 140, 'Shield saved you!', '#38bdf8', 20)
          } else {
            g.hearts--
            g.player.surprised = 1.0
            setHurtKey((k) => (k + 1) % 1000)
            audio.oops()
            addText(g, p.x, g.h - 150, 'Ouch! 💔', '#f43f5e', 22)
            if (g.hearts <= 0) {
              if (g.mode === 'kids') {
                g.hearts = MODES.kids.hearts
                audio.giantPop()
                addText(g, g.w / 2, g.h * 0.5, '🫧 BUBBLE RESCUE! 🌟', '#ffd93d', 26)
              } else {
                g.state = 'over'
                setUi('over')
                audio.stopMusic()
                audio.gameOverJingle()
              }
            }
          }
          syncHud()
          continue
        }

        // Clean removal
        if (es.y > g.h + 20 || es.x < -30 || es.x > g.w + 30) {
          g.enemyStars.splice(i, 1)
        }
      }

      /* ── bubbles flying up & popping monsters ── */
      for (let i = g.shots.length - 1; i >= 0; i--) {
        const s = g.shots[i]
        s.y += s.vy * dt
        s.x += (s.vx ?? 0) * dt

        // 🤖 Zippy Wall Bounce: reflects off left and right canvas edges
        if (s.bounces && s.bounces > 0) {
          if (s.x < s.r && (s.vx ?? 0) < 0) {
            s.x = s.r
            s.vx = -s.vx!
            s.bounces--
            g.parts.push({
              x: s.x, y: s.y, vx: rand(20, 60), vy: rand(-30, 30),
              life: 0.3, maxLife: 0.3, color: '#ffd93d', size: 6, rot: 0, vr: 0, kind: 'sparkle'
            })
          } else if (s.x > g.w - s.r && (s.vx ?? 0) > 0) {
            s.x = g.w - s.r
            s.vx = -s.vx!
            s.bounces--
            g.parts.push({
              x: s.x, y: s.y, vx: rand(-60, -20), vy: rand(-30, 30),
              life: 0.3, maxLife: 0.3, color: '#ffd93d', size: 6, rot: 0, vr: 0, kind: 'sparkle'
            })
          }
        }

        // Custom Star Bazaar VFX handling
        if (g.vfx === 'music' && Math.random() < 0.25) {
          g.parts.push({
            x: s.x, y: s.y, vx: rand(-20, 20), vy: rand(10, 40),
            life: 0.4, maxLife: 0.4, color: '#ec4899', size: 14, rot: 0, vr: 0,
            kind: 'text', text: '♪'
          })
        } else if (g.vfx === 'galaxy' && Math.random() < 0.3) {
          g.parts.push({
            x: s.x, y: s.y, vx: rand(-15, 15), vy: rand(15, 35),
            life: 0.35, maxLife: 0.35, color: '#c084fc', size: 3, rot: 0, vr: 0,
            kind: 'sparkle'
          })
        }
 // rainbow fans fly at a slight angle!
        s.wob += dt * 6
        s.x += Math.sin(s.wob) * 9 * dt

        // 🧒 KIDS MODE ASSIST: Soft magnetic homing toward nearest enemy within 180px
        if (g.mode === 'kids' && !s.giant && g.monsters.length > 0) {
          let nearestM: Monster | null = null
          let minDistSq = 180 * 180
          for (const m of g.monsters) {
            if (m.y < s.y && m.y > 40) {
              const ddx = m.x - s.x
              const ddy = m.y - s.y
              const dsq = ddx * ddx + ddy * ddy
              if (dsq < minDistSq) {
                minDistSq = dsq
                nearestM = m
              }
            }
          }
          if (nearestM) {
            const pull = (nearestM.x - s.x) * 4.5 * dt
            s.x += pull
          }
        }
        if (s.y < -50 || s.y > g.h + 80 || s.x < -80 || s.x > g.w + 80) {
          g.shots.splice(i, 1)
          continue
        }

        /* 💥 the GIANT POP bubble — it bursts when it bumps into anything
              (or drifts near the top) and pops EVERY friend on screen! */
        if (s.giant) {
          let bump = s.y < g.h * 0.3
          for (const m of g.monsters) {
            const dx = s.x - m.x
            const dy = s.y - m.y
            const rr = m.r + s.r
            if (dx * dx + dy * dy < rr * rr) {
              bump = true
              break
            }
          }
          if (bump) {
            g.shots.splice(i, 1)
            giantBurst(s.x, s.y)
            if (g.state !== 'playing') return
          }
          continue
        }

        /* 🎁 bubbles can also pop gifts open… */
        let got = false
        for (let j = g.powerups.length - 1; j >= 0; j--) {
          const u = g.powerups[j]
          const dx = s.x - u.x
          const dy = s.y - u.y
          const rr = u.r + s.r
          if (dx * dx + dy * dy < rr * rr) {
            g.powerups.splice(j, 1)
            collectPowerUp(u.type, u.x, u.y)
            got = true
            break
          }
        }
        /* …and catch bonus stars! ⭐ */
        if (!got) {
          for (let j = g.starDrops.length - 1; j >= 0; j--) {
            const st = g.starDrops[j]
            const dx = s.x - st.x
            const dy = s.y - st.y
            const rr = 20 + s.r
            if (dx * dx + dy * dy < rr * rr) {
              g.starDrops.splice(j, 1)
              collectStar(st)
              got = true
              break
            }
          }
        }
        if (got) {
          g.shots.splice(i, 1)
          continue
        }
        for (let j = g.monsters.length - 1; j >= 0; j--) {
          const m = g.monsters[j]
          // Sneaky Ghosty plays peek-a-boo — bubbles fly right through when hidden!
          if (m.type === 'ghosty' && m.alpha < 0.55) continue
          const dx = s.x - m.x
          const dy = s.y - m.y
          // Kids Mode: +35% projectile forgiveness & wider hit zone
          const radiusTolerance = g.mode === 'kids' ? 1.35 : 1.05
          const rr = (m.r + s.r) * radiusTolerance
          if (dx * dx + dy * dy < rr * rr) {
            // Pierce check for Rocky / Panda (tracked by monster instance ID)
            if (s.pierce && s.pierce > 1) {
              if (!s.hitIds) s.hitIds = []
              if (s.hitIds.includes(m.id)) continue
              s.hitIds.push(m.id)
              s.pierce--
            } else {
              g.shots.splice(i, 1)
            }
            m.hp--
            m.hitFlash = 0.25 // squishy boop reaction!
            if (m.boss >= 0) {
              /* 👑 booping the big boss! */
              audio.bossHit()
              g.score++
              persistStars(g.score)
              addText(g, m.x + rand(-20, 20), m.y - m.r * 0.4, pick(['Boing!', 'Boop!', 'Pop!']), '#f278ab', 20)
              addText(g, m.x + 28, m.y - m.r * 0.4 - 24, '+1⭐', '#e8a800', 14)
              if (m.hp <= 0) defeatBoss(j) // 🎆 fireworks & a big star bonus!
            } else if (m.hp <= 0) {
              // popped! confetti party! 🎉
              g.monsters.splice(j, 1)
              burst(g, m.x, m.y, m.color) // confetti + sparkles!
              g.popped++
              g.score++
              persistStars(g.score)
              audio.popFor(g.character) // your pal's own happy pop!
              // sometimes a happy little bonus star tumbles out! ⭐
              if (Math.random() < PU.starChance) {
                g.starDrops.push({ x: m.x, y: m.y, vx: rand(-50, 50), vy: -90, rot: rand(0, 6), vr: rand(-5, 5), alpha: 1 })
              }
              // goal reached? time for the level's big friendly boss!
              if (g.popped >= goal && !g.bossSpawned) spawnBoss()
            } else {
              // "tee-hee!" — Sleepy Cloud giggles & turns lighter after boop one
              audio.giggle()
              addText(g, m.x, m.y - m.r - 8, 'Tee-hee!', '#5f7d9c', 18)
            }
            break
          }
        }
        if (g.state !== 'playing') return
      }

      /* ── ⏳ the timed power-up counts down ── */
      if (g.active) {
        g.active.t -= dt
        if (g.active.t <= 0) {
          // the power gently says goodbye with a few sleepy sparkles
          for (let k = 0; k < 6; k++) {
            g.parts.push({
              x: g.player.x + rand(-30, 30), y: g.h - 110 + rand(-24, 24),
              vx: rand(-40, 40), vy: rand(-80, -20),
              life: rand(0.3, 0.6), maxLife: 0.6,
              color: '#fff8c9', size: rand(2, 4), rot: 0, vr: rand(-4, 4), kind: 'sparkle',
            })
          }
          g.active = null
          syncHud()
        }
      }

      /* ── 🎁⭐ gifts & bonus stars drift down — catch them! ── */
      const magnet = g.active?.type === 'magnet'
      const palY = g.h - 96 // the pal's hover height
      for (let i = g.powerups.length - 1; i >= 0; i--) {
        const u = g.powerups[i]
        if (magnet) {
          // ⭐ Star Magnet: gifts fly to you like happy little homing birds!
          const dx = p.x - u.x
          const dy = palY - 20 - u.y
          const d = Math.hypot(dx, dy) || 1
          u.x += (dx / d) * 300 * dt
          u.y += (dy / d) * 300 * dt
        } else {
          u.y += u.vy * dt
          u.x = u.baseX + Math.sin(g.time * 1.4 + u.phase) * 16
        }
        // touched by your pal? collect! (bubbles can pop gifts too — see above!)
        const dxp = p.x - u.x
        const dyp = palY - 10 - u.y
        if (dxp * dxp + dyp * dyp < 58 * 58) {
          g.powerups.splice(i, 1)
          collectPowerUp(u.type, u.x, u.y)
          continue
        }
        // missed? gifts fade away gently at the bottom — no penalty, ever 💛
        if (u.y > g.h - 46) {
          u.alpha -= dt * 1.6
          if (u.alpha <= 0) g.powerups.splice(i, 1)
        }
      }
      for (let i = g.starDrops.length - 1; i >= 0; i--) {
        const st = g.starDrops[i]
        if (magnet) {
          const dx = p.x - st.x
          const dy = palY - 10 - st.y
          const d = Math.hypot(dx, dy) || 1
          st.x += (dx / d) * 300 * dt
          st.y += (dy / d) * 300 * dt
        } else {
          st.vy += 240 * dt // stars tumble down with a tiny bit of gravity
          st.x += st.vx * dt
          st.y += st.vy * dt
          st.rot += st.vr * dt
        }
        const dxp = p.x - st.x
        const dyp = palY - 10 - st.y
        if (dxp * dxp + dyp * dyp < 46 * 46) {
          g.starDrops.splice(i, 1)
          collectStar(st)
          continue
        }
        if (st.y > g.h - 30) {
          st.alpha -= dt * 2
          if (st.alpha <= 0) g.starDrops.splice(i, 1)
        }
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
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (g.state === 'playing' || g.state === 'paused') {
          togglePause()
        }
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
    const rectPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onPointerDown = (e: PointerEvent) => {
      audio.init()
      if (drag.active) return
      drag.active = true
      drag.id = e.pointerId
      const pos = rectPos(e)
      drag.startX = pos.x
      drag.t0 = performance.now()
      drag.moved = false
      canvas.setPointerCapture(e.pointerId)
      if (g.state === 'playing') {
        g.dragging = true
        g.targetX = pos.x
        g.targetY = pos.y
      }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!drag.active || e.pointerId !== drag.id) return
      const pos = rectPos(e)
      if (Math.abs(pos.x - drag.startX) > 12) drag.moved = true
      if (g.state === 'playing' && g.dragging) {
        g.targetX = pos.x
        g.targetY = pos.y
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      if (!drag.active || e.pointerId !== drag.id) return
      drag.active = false
      g.dragging = false
      const quick = performance.now() - drag.t0 < 350
      if (g.state === 'playing' && !drag.moved && quick) {
        shootNow() // tap to shoot!
      }
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
    
    const openBazaar = () => {
      audio.init()
      audio.click()
      const save = loadLocalSave()
      setSaveData(save)
      g.state = 'bazaar'
      setUi('bazaar')
    }

    const closeBazaar = () => {
      audio.click()
      g.state = 'menu'
      setUi('menu')
    }

    const buyBooster = (bId: string, cost: number) => {
      audio.init()
      const save = loadLocalSave()
      if ((save.totalStars || 0) < cost) {
        audio.oops()
        return
      }
      if (save.activeBooster === bId) {
        // Toggle off / cancel booster
        save.activeBooster = null
        save.totalStars += cost
        audio.pop()
      } else {
        // Refund previous booster if active
        if (save.activeBooster) {
          const prevB = BOOSTERS.find(b => b.id === save.activeBooster)
          if (prevB) save.totalStars += prevB.cost
        }
        save.totalStars -= cost
        save.activeBooster = bId
        audio.powerUp()
      }
      saveLocalProgress(save)
      setSaveData({ ...save })
      g.score = save.totalStars
      syncHud()
    }

    const toggleCosmetic = (cId: string, cost: number) => {
      audio.init()
      const save = loadLocalSave()
      if (!save.unlockedCosmetics) save.unlockedCosmetics = []

      if (save.unlockedCosmetics.includes(cId)) {
        // Already owned: equip or unequip
        audio.click()
        save.activeCosmetic = save.activeCosmetic === cId ? 'none' : cId
        g.cosmetic = save.activeCosmetic
      } else {
        // Needs purchase
        if ((save.totalStars || 0) < cost) {
          audio.oops()
          return
        }
        save.totalStars -= cost
        save.unlockedCosmetics.push(cId)
        save.activeCosmetic = cId
        g.cosmetic = cId
        audio.levelUp()
      }
      saveLocalProgress(save)
      setSaveData({ ...save })
      g.score = save.totalStars
      syncHud()
    }

    
    const pullGachapon = () => {
      audio.init()
      const save = loadLocalSave()
      const cost = 20
      if ((save.totalStars || 0) < cost) {
        audio.oops()
        return
      }
      save.totalStars -= cost
      if (!save.unlockedStickers) save.unlockedStickers = []
      // Roll a sticker (biased towards uncollected)
      const uncollected = STICKERS.filter(st => !save.unlockedStickers!.includes(st.id))
      const won = uncollected.length > 0 ? pick(uncollected) : pick(STICKERS)
      if (!save.unlockedStickers.includes(won.id)) {
        save.unlockedStickers.push(won.id)
      }
      audio.giantPop()
      audio.win()
      saveLocalProgress(save)
      setSaveData({ ...save })
      g.score = save.totalStars
      syncHud()
    }

    const toggleVFX = (vId: string, cost: number) => {
      audio.init()
      const save = loadLocalSave()
      if (!save.unlockedVFX) save.unlockedVFX = ['classic']
      if (save.unlockedVFX.includes(vId)) {
        audio.click()
        save.activeVFX = vId
      } else {
        if ((save.totalStars || 0) < cost) {
          audio.oops()
          return
        }
        save.totalStars -= cost
        save.unlockedVFX.push(vId)
        save.activeVFX = vId
        audio.levelUp()
      }
      saveLocalProgress(save)
      setSaveData({ ...save })
      g.score = save.totalStars
      syncHud()
    }

    const buySecretPal = (pId: CharacterId, cost: number) => {
      audio.init()
      const save = loadLocalSave()
      if (!save.unlockedCharacters) save.unlockedCharacters = ['rocky']
      if (save.unlockedCharacters.includes(pId)) {
        audio.click()
        selectCharacter(pId)
        return
      }
      if ((save.totalStars || 0) < cost) {
        audio.oops()
        return
      }
      save.totalStars -= cost
      save.unlockedCharacters.push(pId)
      saveLocalProgress(save)
      setSaveData({ ...save })
      selectCharacter(pId)
      audio.levelUp()
      g.score = save.totalStars
      syncHud()
    }

    const buyIslandToy = (tId: string, cost: number) => {
      audio.init()
      const save = loadLocalSave()
      if (!save.islandItems) save.islandItems = ['trampoline']
      if (save.islandItems.includes(tId)) {
        audio.click()
        return
      }
      if ((save.totalStars || 0) < cost) {
        audio.oops()
        return
      }
      save.totalStars -= cost
      save.islandItems.push(tId)
      audio.powerUp()
      saveLocalProgress(save)
      setSaveData({ ...save })
      g.score = save.totalStars
      syncHud()
    }

    const unlockZenMode = () => {
      audio.init()
      const save = loadLocalSave()
      const cost = 100
      if ((save.totalStars || 0) < cost || save.zenUnlocked) {
        if (!save.zenUnlocked) audio.oops()
        return
      }
      save.totalStars -= cost
      save.zenUnlocked = true
      audio.win()
      saveLocalProgress(save)
      setSaveData({ ...save })
      g.score = save.totalStars
      syncHud()
    }

    controlsRef.current = { startGame, startLevel, openLevelSelect, openBazaar, closeBazaar, buyBooster, toggleCosmetic, pullGachapon, toggleVFX, buySecretPal, buyIslandToy, unlockZenMode, showModes, pickMode, backToModes, selectCharacter, next, togglePause, resumeGame, restartLevel, toggleMute, toMenu, bye }

    /* ── go! ── */
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const rawDt = (now - last) / 1000
      last = now
      // Ignore huge delta spikes (e.g. background tab or system pause)
      const dt = Math.min(0.05, Math.max(0.001, rawDt))
      try {
        if (g.state === 'paused') {
          render(ctx, g)
        } else {
          update(dt)
          render(ctx, g)
        }
      } catch (err) {
        console.error('Frame update error caught:', err)
      }
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
  const powerCfg = hud.powerType ? POWERUPS[hud.powerType] : null

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
        @keyframes ring-drain-kf { from { stroke-dashoffset: 0 } to { stroke-dashoffset: 163.4 } }
      `}</style>

      {/* ════════ THE GAME WORLD ════════ */}
      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 select-none overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-label="Bubble Pop Adventure game" role="img" />

        {/* ── HUD: pal face + hearts, shield badge & power-up ring (top-left) ── */}
        <div className="pointer-events-none absolute left-3 top-3 z-30 flex flex-col items-start gap-2">
          <div key={hurtKey} className={`flex items-center gap-1.5 rounded-full bg-white/85 py-2 pl-3 pr-4 shadow-md ${hud.hearts < hud.maxHearts ? 'heart-shake' : ''}`}>
            <CharacterPortrait id={hud.character} size={34} />
            {Array.from({ length: getModeConfig(hud.mode).hearts }, (_, i) => (
              <Heart
                key={i}
                size={26}
                aria-hidden
                className={i < hud.hearts ? 'fill-rose-500 text-rose-500' : 'fill-gray-200 text-gray-300'}
              />
            ))}
            <span className="sr-only">{hud.hearts} of {getModeConfig(hud.mode).hearts} hearts left</span>
          </div>

          {/* 🫧 the Bubble Shield is ready — it will block one hit! */}
          {hud.shield && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/85 py-1.5 pl-3 pr-4 shadow-md">
              <span className="text-xl" aria-hidden>🫧</span>
              <span className="hidden text-xs font-extrabold text-sky-600 sm:inline">shield ready!</span>
              <span className="sr-only">Bubble shield will block one hit</span>
            </div>
          )}

          {/* ⏳ countdown ring for the timed power-up that is running */}
          {powerCfg && (
            <div
              key={`${hud.powerType}-${hud.powerStamp}`}
              className="flex items-center gap-1.5 rounded-full bg-white/85 py-1.5 pl-1.5 pr-4 shadow-md"
            >
              <svg width="36" height="36" viewBox="0 0 60 60" role="img" aria-label={`${powerCfg.name}: time left`}>
                <circle cx="30" cy="30" r="26" fill="none" stroke="#f1e7d7" strokeWidth="7" />
                <circle
                  cx="30"
                  cy="30"
                  r="26"
                  fill="none"
                  stroke={powerCfg.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="163.4"
                  strokeDashoffset="0"
                  transform="rotate(-90 30 30)"
                  style={{ animation: `ring-drain-kf ${powerCfg.duration}s linear forwards` }}
                />
              </svg>
              <span className="text-xl" aria-hidden>{powerCfg.emoji}</span>
              <span className="hidden text-xs font-extrabold leading-tight text-gray-600 sm:inline">{powerCfg.name}</span>
            </div>
          )}
        </div>

        {/* ── HUD: level & progress (top-center; below hearts on phones) ── */}
        <div className="pointer-events-none absolute left-1/2 top-[68px] z-10 w-32 -translate-x-1/2 rounded-2xl bg-white/85 px-3 py-2 text-center shadow-md sm:top-3 sm:w-44 sm:px-4">
          <div className="text-sm font-extrabold text-amber-600 sm:text-base">{getModeConfig(hud.mode).levels[hud.level]?.name || `Level ${hud.level + 1}`}</div>
          <div className="text-[10px] font-bold text-amber-500">World {Math.floor(hud.level / 10) + 1} of 12</div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-amber-400 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {hud.bossActive ? (
            <div className="mt-0.5 text-xs font-extrabold text-pink-500">⭐ boss time!</div>
          ) : (
            <div className="mt-0.5 text-xs font-bold text-gray-500">
              {Math.min(hud.popped, goal)} / {goal} popped
            </div>
          )}
        </div>

        {/* ── HUD: score + mute + pause buttons (top-right, always tappable) ── */}
        <div className="absolute right-3 top-3 z-30 flex flex-col items-end gap-2">
          <div className="pointer-events-none flex items-center gap-1.5 rounded-full bg-white/85 px-4 py-2 shadow-md">
            <Star size={24} aria-hidden className="fill-amber-400 text-amber-400" />
            <span key={hud.score} className="score-pop text-xl font-extrabold text-amber-600">
              {hud.score}
            </span>
            <span className="sr-only">stars collected</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause / Resume Button (visible while playing or paused) */}
            {(ui === 'playing' || ui === 'paused') && (
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.togglePause()
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition active:scale-90 ${
                  ui === 'paused'
                    ? 'bg-amber-400 text-white ring-4 ring-amber-200'
                    : 'bg-white/90 text-amber-600 hover:bg-white'
                }`}
                aria-label={ui === 'paused' ? 'Continue game' : 'Pause game'}
                title={ui === 'paused' ? 'Continue (Esc / P)' : 'Pause (Esc / P)'}
              >
                {ui === 'paused' ? <Play size={24} className="fill-white" /> : <Pause size={24} className="fill-amber-600" />}
              </button>
            )}

            {/* Help / Support Button */}
            <button
              onClick={(e) => {
                e.currentTarget.blur()
                setShowHelp(true)
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-amber-600 shadow-md transition hover:bg-white hover:text-amber-700 active:scale-90"
              aria-label="Help and Contact Support"
              title="Help & Contact"
            >
              <HelpCircle size={24} />
            </button>

            {/* Mute Button */}
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
        </div>

        {/* 👋 "MEET A NEW FRIEND!" pop-up (also for the big bosses 👑) */}
        {friend && (
          <div className="pointer-events-none absolute left-1/2 top-[136px] z-30 w-[86%] max-w-xs -translate-x-1/2 sm:top-[84px]">
            <div className="pop-in rounded-3xl border-4 border-amber-200 bg-white/95 px-4 py-3 text-center shadow-xl">
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-amber-500">
                {friend.boss ? '👑 Here comes a BIG friend!' : friend.power ? '🎁 POWER-UP GET!' : '✨ Meet a new friend!'}
              </div>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className={`${friend.boss ? 'wiggle' : 'floaty'} text-3xl`} aria-hidden>
                  {friend.emoji}
                </span>
                <span className="text-lg font-extrabold text-pink-500">{friend.name}</span>
              </div>
              <div className="mt-0.5 text-xs font-bold text-gray-500">{friend.hint}</div>
            </div>
          </div>
        )}

        {/* tiny desktop hint */}
        <div className="pointer-events-none absolute bottom-2 left-3 z-10 hidden text-xs font-bold text-slate-600/70 sm:block">
          ← → move · space = pop!
        </div>

                
        {/* ════════ OVERLAY: ⭐ STAR BAZAAR & TOY SHOP ════════ */}
        {ui === 'bazaar' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="pop-in my-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border-4 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-5 shadow-2xl sm:p-7">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-amber-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-2xl shadow-sm">⭐</div>
                  <div>
                    <h2 className="text-xl font-black text-amber-700 sm:text-2xl">Star Bazaar & Toy Shop</h2>
                    <p className="text-xs font-bold text-amber-600/80">Spend your stars on boosters & cute hats!</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1.5 font-black text-white shadow-md">
                  <Star size={18} className="fill-white" />
                  <span className="text-base">{saveData?.totalStars ?? hud.score}</span>
                </div>
              </div>

              {/* Player level milestone status */}
              {(() => {
                const s = saveData || loadLocalSave()
                const curMode = s.mode || 'kids'
                const highestLvl = curMode === 'kids' ? s.kidsHighestLevel : s.adultsHighestLevel
                const currentStars = s.totalStars || 0

                return (
                  <div className="mt-4 space-y-5">
                    {/* ── SECTION 1: PRE-LEVEL BOOSTERS (Unlocks Level 10) ── */}
                    {highestLvl >= 9 && (
                    <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/70 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🚀</span>
                          <h3 className="text-sm font-black text-sky-900 sm:text-base">Pre-Level Boosters</h3>
                        </div>
                        {highestLvl < 9 ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
                            🔒 Clears at Level 10
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            ✓ UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-sky-700">Equip one booster before starting your next level!</p>

                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {BOOSTERS.map((b) => {
                          const isLocked = highestLvl < (b.reqLevel - 1)
                          const isActive = s.activeBooster === b.id
                          const canAfford = currentStars >= b.cost

                          return (
                            <button
                              key={b.id}
                              disabled={isLocked || (!isActive && !canAfford)}
                              onClick={() => controlsRef.current?.buyBooster(b.id, b.cost)}
                              className={`flex flex-col items-center justify-between rounded-xl border-2 p-2.5 text-center transition ${
                                isLocked
                                  ? 'border-dashed border-slate-300 bg-slate-100/60 opacity-60 cursor-not-allowed'
                                  : isActive
                                  ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-300'
                                  : canAfford
                                  ? 'border-sky-200 bg-white hover:border-sky-400 active:scale-95'
                                  : 'border-slate-200 bg-white/70 opacity-60'
                              }`}
                            >
                              <span className="text-2xl">{b.emoji}</span>
                              <span className="mt-1 text-xs font-black text-slate-800">{b.name}</span>
                              <span className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{b.desc}</span>
                              <div className="mt-2 w-full">
                                {isLocked ? (
                                  <span className="text-[10px] font-bold text-slate-400">Lvl 10</span>
                                ) : isActive ? (
                                  <span className="block w-full rounded-full bg-emerald-500 py-1 text-[11px] font-black text-white">
                                    READY! ✓
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-1 rounded-full bg-amber-400 py-0.5 text-xs font-black text-white shadow-sm">
                                    <Star size={12} className="fill-white" /> {b.cost} ⭐
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* ── SECTION 2: PAL DRESSING ROOM / HATS (Unlocks Level 20) ── */}
                    {highestLvl >= 19 && (
                    <div className="rounded-2xl border-2 border-purple-100 bg-purple-50/70 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🎩</span>
                          <h3 className="text-sm font-black text-purple-900 sm:text-base">Pal Dressing Room (Hats)</h3>
                        </div>
                        {highestLvl < 19 ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
                            🔒 Clears at Level 20
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            ✓ UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-purple-700">Give your pal stylish headwear to wear in every level!</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {COSMETICS.map((c) => {
                          const isLocked = highestLvl < (c.reqLevel - 1)
                          const isOwned = (s.unlockedCosmetics || []).includes(c.id)
                          const isEquipped = s.activeCosmetic === c.id
                          const canAfford = currentStars >= c.cost

                          return (
                            <button
                              key={c.id}
                              disabled={isLocked || (!isOwned && !canAfford)}
                              onClick={() => controlsRef.current?.toggleCosmetic(c.id, c.cost)}
                              className={`flex flex-col items-center justify-between rounded-xl border-2 p-2.5 text-center transition ${
                                isLocked
                                  ? 'border-dashed border-slate-300 bg-slate-100/60 opacity-60 cursor-not-allowed'
                                  : isEquipped
                                  ? 'border-purple-500 bg-purple-100 shadow-md ring-2 ring-purple-300'
                                  : isOwned
                                  ? 'border-emerald-300 bg-white hover:border-emerald-500'
                                  : canAfford
                                  ? 'border-purple-200 bg-white hover:border-purple-400 active:scale-95'
                                  : 'border-slate-200 bg-white/70 opacity-60'
                              }`}
                            >
                              <span className="text-3xl">{c.emoji}</span>
                              <span className="mt-1 text-xs font-black text-slate-800">{c.name}</span>
                              <span className="mt-0.5 text-[10px] text-slate-500">{c.desc}</span>
                              <div className="mt-2 w-full">
                                {isLocked ? (
                                  <span className="text-[10px] font-bold text-slate-400">Lvl 20</span>
                                ) : isEquipped ? (
                                  <span className="block w-full rounded-full bg-purple-600 py-1 text-[11px] font-black text-white">
                                    EQUIPPED 👑
                                  </span>
                                ) : isOwned ? (
                                  <span className="block w-full rounded-full border border-purple-300 bg-purple-50 py-1 text-[11px] font-bold text-purple-700">
                                    WEAR HAT
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-1 rounded-full bg-amber-400 py-0.5 text-xs font-black text-white shadow-sm">
                                    <Star size={12} className="fill-white" /> {c.cost} ⭐
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* ── SECTION 3: MYSTERY MONSTER CLAW MACHINE & STICKERS (Unlocks Level 30) ── */}
                    {highestLvl >= 29 && (
                    <div className="rounded-2xl border-2 border-pink-100 bg-pink-50/70 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🎰</span>
                          <h3 className="text-sm font-black text-pink-900 sm:text-base">Monster Claw Machine & Stickers</h3>
                        </div>
                        {highestLvl < 29 ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
                            🔒 Clears at Level 30
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            ✓ UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-pink-700">Pull the claw for 20 ⭐ to win collectible stickers with fun monster lore!</p>

                      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm">
                          <span className="text-3xl">🪀</span>
                          <div className="text-xs">
                            <span className="font-bold text-slate-700">Album Collection: </span>
                            <span className="font-black text-pink-600">{(s.unlockedStickers || []).length} / {STICKERS.length} Stickers</span>
                          </div>
                        </div>

                        <button
                          disabled={highestLvl < 29 || currentStars < 20}
                          onClick={() => controlsRef.current?.pullGachapon()}
                          className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-black shadow-md transition ${
                            highestLvl < 29
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : currentStars >= 20
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 active:scale-95'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>PULL CLAW</span>
                          <span className="flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                            <Star size={11} className="fill-white" /> 20 ⭐
                          </span>
                        </button>
                      </div>

                      {/* Sticker scrapbook display */}
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {STICKERS.map((st) => {
                          const hasIt = (s.unlockedStickers || []).includes(st.id)
                          return (
                            <div
                              key={st.id}
                              className={`flex flex-col items-center rounded-xl border p-2 text-center transition ${
                                hasIt
                                  ? 'border-pink-200 bg-white shadow-sm'
                                  : 'border-dashed border-slate-200 bg-slate-100/50 opacity-40'
                              }`}
                            >
                              <span className="text-2xl">{hasIt ? st.emoji : '❓'}</span>
                              <span className="mt-1 text-[11px] font-black text-slate-800">{hasIt ? st.name : 'Unknown'}</span>
                              <span className="mt-0.5 text-[9px] font-bold text-pink-500">{hasIt ? st.rarity : '???'}</span>
                              {hasIt && <p className="mt-1 line-clamp-2 text-[9px] text-slate-500">{st.fact}</p>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* ── SECTION 4: BUBBLE VFX & POP EFFECTS (Unlocks Level 50) ── */}
                    {highestLvl >= 49 && (
                    <div className="rounded-2xl border-2 border-amber-100 bg-amber-50/70 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">✨</span>
                          <h3 className="text-sm font-black text-amber-900 sm:text-base">Bubble VFX & Pop Effects</h3>
                        </div>
                        {highestLvl < 49 ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
                            🔒 Clears at Level 50
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            ✓ UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-amber-700">Equip custom bubble trails and confetti explosions!</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {BUBBLE_VFX.map((v) => {
                          const isLocked = highestLvl < (v.reqLevel - 1)
                          const isOwned = (s.unlockedVFX || ['classic']).includes(v.id)
                          const isEquipped = (s.activeVFX || 'classic') === v.id
                          const canAfford = currentStars >= v.cost

                          return (
                            <button
                              key={v.id}
                              disabled={isLocked || (!isOwned && !canAfford)}
                              onClick={() => controlsRef.current?.toggleVFX(v.id, v.cost)}
                              className={`flex flex-col items-center justify-between rounded-xl border-2 p-2.5 text-center transition ${
                                isLocked
                                  ? 'border-dashed border-slate-300 bg-slate-100/60 opacity-60 cursor-not-allowed'
                                  : isEquipped
                                  ? 'border-amber-500 bg-amber-100 shadow-md ring-2 ring-amber-300'
                                  : isOwned
                                  ? 'border-emerald-300 bg-white hover:border-emerald-500'
                                  : canAfford
                                  ? 'border-amber-200 bg-white hover:border-amber-400 active:scale-95'
                                  : 'border-slate-200 bg-white/70 opacity-60'
                              }`}
                            >
                              <span className="text-2xl">{v.emoji}</span>
                              <span className="mt-1 text-xs font-black text-slate-800">{v.name}</span>
                              <span className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{v.desc}</span>
                              <div className="mt-2 w-full">
                                {isLocked ? (
                                  <span className="text-[10px] font-bold text-slate-400">Lvl 50</span>
                                ) : isEquipped ? (
                                  <span className="block w-full rounded-full bg-amber-600 py-0.5 text-[10px] font-black text-white">
                                    ACTIVE ✨
                                  </span>
                                ) : isOwned ? (
                                  <span className="block w-full rounded-full border border-amber-300 bg-amber-50 py-0.5 text-[10px] font-bold text-amber-700">
                                    SELECT
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-1 rounded-full bg-amber-400 py-0.5 text-xs font-black text-white shadow-sm">
                                    <Star size={11} className="fill-white" /> {v.cost} ⭐
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* ── SECTION 5: BUBBLE ISLAND PLAYGROUND (Unlocks Level 60) ── */}
                    {highestLvl >= 59 && (
                    <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/70 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🏝️</span>
                          <h3 className="text-sm font-black text-emerald-900 sm:text-base">Bubble Island Playground</h3>
                        </div>
                        {highestLvl < 59 ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
                            🔒 Clears at Level 60
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            ✓ UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-emerald-700">Build attractions on your sanctuary island for your pals!</p>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {ISLAND_TOYS.map((t) => {
                          const isLocked = highestLvl < (t.reqLevel - 1)
                          const isOwned = (s.islandItems || ['trampoline']).includes(t.id)
                          const canAfford = currentStars >= t.cost

                          return (
                            <button
                              key={t.id}
                              disabled={isLocked || isOwned || !canAfford}
                              onClick={() => controlsRef.current?.buyIslandToy(t.id, t.cost)}
                              className={`flex flex-col items-center justify-between rounded-xl border-2 p-2.5 text-center transition ${
                                isLocked
                                  ? 'border-dashed border-slate-300 bg-slate-100/60 opacity-60 cursor-not-allowed'
                                  : isOwned
                                  ? 'border-emerald-400 bg-emerald-100/60 shadow-sm'
                                  : canAfford
                                  ? 'border-emerald-200 bg-white hover:border-emerald-400 active:scale-95'
                                  : 'border-slate-200 bg-white/70 opacity-60'
                              }`}
                            >
                              <span className="text-3xl">{t.emoji}</span>
                              <span className="mt-1 text-xs font-black text-slate-800">{t.name}</span>
                              <span className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">{t.desc}</span>
                              <div className="mt-2 w-full">
                                {isLocked ? (
                                  <span className="text-[10px] font-bold text-slate-400">Lvl 60</span>
                                ) : isOwned ? (
                                  <span className="block w-full rounded-full bg-emerald-600 py-0.5 text-[10px] font-black text-white">
                                    BUILT 🎪
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-1 rounded-full bg-amber-400 py-0.5 text-xs font-black text-white shadow-sm">
                                    <Star size={11} className="fill-white" /> {t.cost} ⭐
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* ── SECTION 6: SECRET HERO PALS (Unlocks Level 70) ── */}
                    {highestLvl >= 69 && (
                    <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/70 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🐾</span>
                          <h3 className="text-sm font-black text-indigo-900 sm:text-base">Secret Hero Pals</h3>
                        </div>
                        {highestLvl < 69 ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
                            🔒 Clears at Level 70
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            ✓ UNLOCKED
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-indigo-700">Adopt brand-new playable pals with their own cheerful bubbles!</p>

                      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {SECRET_PALS.map((p) => {
                          const isLocked = highestLvl < (p.reqLevel - 1)
                          const isUnlocked = (s.unlockedCharacters || []).includes(p.id)
                          const isSelected = hud.character === p.id
                          const canAfford = currentStars >= p.cost

                          return (
                            <button
                              key={p.id}
                              disabled={isLocked || (!isUnlocked && !canAfford)}
                              onClick={() => controlsRef.current?.buySecretPal(p.id, p.cost)}
                              className={`flex items-center justify-between rounded-xl border-2 p-3 text-left transition ${
                                isLocked
                                  ? 'border-dashed border-slate-300 bg-slate-100/60 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'border-indigo-500 bg-indigo-100 shadow-md ring-2 ring-indigo-300'
                                  : isUnlocked
                                  ? 'border-emerald-300 bg-white hover:border-emerald-500'
                                  : canAfford
                                  ? 'border-indigo-200 bg-white hover:border-indigo-400 active:scale-95'
                                  : 'border-slate-200 bg-white/70 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-4xl">{p.emoji}</span>
                                <div>
                                  <div className="text-sm font-black text-slate-800">{p.name}</div>
                                  <div className="text-xs text-slate-500">{p.desc}</div>
                                </div>
                              </div>
                              <div>
                                {isLocked ? (
                                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500">Lvl 70</span>
                                ) : isSelected ? (
                                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-black text-white">PLAYING</span>
                                ) : isUnlocked ? (
                                  <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white">CHOOSE</span>
                                ) : (
                                  <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                                    <Star size={12} className="fill-white" /> {p.cost} ⭐
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* ── SECTION 7: SECRET RAINBOW ZEN VAULT (Unlocks Level 100+) ── */}
                    {highestLvl >= 99 && (
                    <div className="rounded-2xl border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50 p-3.5 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🌈</span>
                          <h3 className="text-sm font-black text-rose-900 sm:text-base">Zen Pop Mode & Rainbow Vault</h3>
                        </div>
                        {highestLvl < 99 ? (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-black text-slate-600">
                            🔒 Clears at Level 100
                          </span>
                        ) : s.zenUnlocked ? (
                          <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black text-white">
                            ✓ UNLOCKED
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-white">
                            READY TO UNLOCK
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-rose-700">Infinite gentle bubble popping with zero penalties, soothing chimes, and rainbow fireworks.</p>

                      <div className="mt-3 flex items-center justify-between rounded-xl bg-white/80 p-3">
                        <div className="text-xs font-bold text-slate-700">
                          {s.zenUnlocked ? '🌟 Master Vault Unlocked: Zen Mode Active!' : 'Unlock Endless Zen Mode (100 ⭐)'}
                        </div>
                        {!s.zenUnlocked && (
                          <button
                            disabled={highestLvl < 99 || currentStars < 100}
                            onClick={() => controlsRef.current?.unlockZenMode()}
                            className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-black shadow-md transition ${
                              highestLvl >= 99 && currentStars >= 100
                                ? 'bg-gradient-to-r from-amber-400 to-rose-400 text-white active:scale-95'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Star size={12} className="fill-white" /> UNLOCK 100 ⭐
                          </button>
                        )}
                      </div>
                    </div>
                    )}
                  </div>
                )
              })()}


              {/* Close Button */}
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.closeBazaar()
                }}
                className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-3 text-base font-black text-white shadow-lg shadow-amber-200 transition hover:bg-amber-500 active:scale-95"
              >
                <span>BACK TO MENU</span>
              </button>
            </div>
          </div>
        )}

{/* ════════ OVERLAY: GAME PAUSED ════════ */}
        {ui === 'paused' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="pop-in my-auto w-full max-w-sm rounded-3xl border-4 border-amber-300 bg-white p-6 text-center shadow-2xl sm:p-7">
              <div className="floaty text-5xl" aria-hidden>⏸️</div>
              <h2 className="mt-2 text-2xl font-black text-amber-600 sm:text-3xl">Game Paused</h2>
              <p className="mt-1 text-sm font-bold text-gray-500">
                {getModeConfig(hud.mode).levels[hud.level]?.name || `Level ${hud.level + 1}`} · World {Math.floor(hud.level / 10) + 1}
              </p>

              {/* Status summary */}
              <div className="my-4 flex items-center justify-center gap-4 rounded-2xl bg-amber-50 py-3 text-xs font-black text-amber-800">
                <div className="flex items-center gap-1">
                  <Heart size={16} className="fill-rose-500 text-rose-500" />
                  <span>{hud.hearts} / {getModeConfig(hud.mode).hearts} Hearts</span>
                </div>
                <span className="text-amber-200">|</span>
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  <span>{hud.score} Stars</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={(e) => {
                    e.currentTarget.blur()
                    controlsRef.current?.resumeGame()
                  }}
                  className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-emerald-500 text-xl font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 active:scale-95"
                >
                  <Play size={24} className="fill-white" aria-hidden /> CONTINUE
                </button>

                <button
                  onClick={(e) => {
                    e.currentTarget.blur()
                    controlsRef.current?.restartLevel()
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-amber-200 bg-amber-50 text-sm font-black text-amber-700 shadow-sm transition hover:bg-amber-100 active:scale-95"
                >
                  <RotateCcw size={18} aria-hidden /> Restart Level
                </button>

                <button
                  onClick={(e) => {
                    e.currentTarget.blur()
                    controlsRef.current?.openLevelSelect()
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-pink-200 bg-pink-50 text-sm font-black text-pink-700 shadow-sm transition hover:bg-pink-100 active:scale-95"
                >
                  <span>🗺️ Level Select Map</span>
                </button>

                <button
                  onClick={(e) => {
                    e.currentTarget.blur()
                    controlsRef.current?.toMenu()
                  }}
                  className="mt-1 w-full rounded-full py-2 text-xs font-bold text-gray-400 underline underline-offset-2 transition hover:text-pink-500"
                >
                  Back to Main Menu
                </button>
              </div>

              <div className="mt-3 text-[11px] font-bold text-gray-400">
                Press <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] text-gray-600">Esc</kbd> or <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] text-gray-600">P</kbd> to resume
              </div>
            </div>
          </div>
        )}

        {/* ════════ OVERLAY: START MENU ════════ */}
        {ui === 'menu' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in my-auto w-full max-w-md rounded-3xl border-4 border-amber-200 bg-white p-6 text-center shadow-2xl sm:p-8">
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

              {/* ── RESUME LEVEL / PLAY BUTTONS ── */}
              <div className="mt-6 flex flex-col gap-2.5">
                {/* Primary RESUME button if saved level or progress exists */}
                {hud.level > 0 ? (
                  <button
                    onClick={(e) => {
                      e.currentTarget.blur()
                      controlsRef.current?.startGame()
                    }}
                    className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-emerald-500 text-xl font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 active:scale-95"
                  >
                    <Play size={26} aria-hidden />
                    <span className="flex flex-col items-start leading-tight">
                      <span>RESUME LEVEL {hud.level + 1}</span>
                      <span className="text-xs font-semibold text-emerald-100">
                        {getModeConfig(hud.mode).levels[hud.level]?.name || `World ${Math.floor(hud.level / 10) + 1}`} · {hud.mode === 'kids' ? 'Kids' : 'Grown-Ups'}
                      </span>
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.currentTarget.blur()
                      controlsRef.current?.showModes()
                    }}
                    className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-amber-400 text-2xl font-extrabold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-500 active:scale-95"
                  >
                    <Play size={30} aria-hidden /> START GAME
                  </button>
                )}

                {/* Level Select button */}
                <button
                  onClick={(e) => {
                    e.currentTarget.blur()
                    controlsRef.current?.openLevelSelect()
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-amber-300 bg-amber-50 text-base font-extrabold text-amber-800 shadow-sm transition hover:bg-amber-100 active:scale-95"
                >
                  <span className="text-lg" aria-hidden>🗺️</span>
                  <span>SELECT LEVEL (1–120)</span>
                </button>
                {/* 🛍️ Star Bazaar Shop Button - only appears once player clears World 1 (Level 10+) */}
                {(() => {
                  const s = saveData || (mounted ? loadLocalSave() : null)
                  const curMode = s?.mode || 'kids'
                  const highestLvl = s ? (curMode === 'kids' ? s.kidsHighestLevel : s.adultsHighestLevel) : 0
                  if (highestLvl < 9) return null

                  return (
                    <button
                      onClick={(e) => {
                        e.currentTarget.blur()
                        controlsRef.current?.openBazaar()
                      }}
                      className="flex h-13 w-full items-center justify-center gap-2 rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-100 to-amber-200/80 px-4 py-3 text-base font-black text-amber-900 shadow-sm transition hover:from-amber-200 hover:to-amber-300 active:scale-95"
                    >
                      <span className="text-xl" aria-hidden>⭐</span>
                      <span>STAR BAZAAR & TOY SHOP</span>
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs text-white">✨ SHOP</span>
                    </button>
                  )
                })()}


                {/* Switch Mode / Pal / New Adventure button */}
                {hud.level > 0 && (
                  <button
                    onClick={(e) => {
                      e.currentTarget.blur()
                      controlsRef.current?.showModes()
                    }}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95"
                  >
                    <span>🧒 / 🧑‍🚀 Switch Mode or Character</span>
                  </button>
                )}
              </div>
              <p className="mt-3 text-xs font-bold text-gray-400">12 Magical Worlds · 120 Bubbly Levels · Auto-Saved 🫧</p>
            </div>
          </div>
        )}

        
        {/* ════════ OVERLAY: 120-LEVEL & 12-WORLD SELECT MAP ════════ */}
        {ui === 'levelSelect' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/60 p-3 backdrop-blur-[2px]">
            <div className="pop-in my-auto flex max-h-[95vh] w-full max-w-lg flex-col rounded-3xl border-4 border-amber-200 bg-white p-4 shadow-2xl sm:p-6">
              {/* Header with Mode indicator */}
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <button
                  onClick={() => controlsRef.current?.toMenu()}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200 active:scale-95"
                >
                  ← Menu
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-extrabold text-pink-500 sm:text-2xl">World Map</h2>
                  <div className="text-xs font-bold text-gray-400">
                    Mode: <span className="font-extrabold text-amber-600">{hud.mode === 'kids' ? 'Kids 🧒' : 'Grown-Ups 🧑‍🚀'}</span> · ⭐ {hud.score} stars
                  </div>
                </div>
                <button
                  onClick={() => controlsRef.current?.showModes()}
                  className="rounded-full bg-pink-100 px-3 py-1.5 text-xs font-extrabold text-pink-700 transition hover:bg-pink-200 active:scale-95"
                >
                  Change Mode
                </button>
              </div>

              {/* World Carousel Navigation */}
              {(() => {
                const wId = (selectedWorld as 1|2|3|4|5|6|7|8|9|10|11|12)
                const wCfg = WORLDS[wId] || WORLDS[1]
                const curSave = saveData || (mounted ? loadLocalSave() : null)
                const highestLevel = curSave ? (hud.mode === 'kids' ? curSave.kidsHighestLevel : curSave.adultsHighestLevel) : 0
                const recordMap = curSave ? (hud.mode === 'kids' ? curSave.kidsLevelsRecord : curSave.adultsLevelsRecord) : {}
                const worldUnlocked = (wId - 1) * 10 <= highestLevel

                return (
                  <div className="flex flex-1 flex-col overflow-y-auto pt-3">
                    {/* World Banner Card */}
                    <div
                      className="relative flex items-center justify-between rounded-2xl p-3.5 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${wCfg.skyTop}, ${wCfg.skyBottom})`,
                      }}
                    >
                      <button
                        onClick={() => setSelectedWorld((prev) => (prev > 1 ? prev - 1 : 12))}
                        aria-label="Previous World"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-xl font-black text-slate-700 shadow transition hover:bg-white active:scale-90"
                      >
                        ‹
                      </button>

                      <div className="flex flex-col items-center text-center">
                        <span className="text-3xl floaty" aria-hidden>{wCfg.emoji}</span>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                          World {wCfg.id} of 12
                        </span>
                        <h3 className="text-lg font-black text-slate-800 sm:text-xl">
                          {wCfg.name}
                        </h3>
                        <span className="text-[11px] font-bold text-slate-600">
                          {wCfg.subtitle}
                        </span>
                        <span className="mt-1 inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700 shadow-sm">
                          ✨ {wCfg.gimmickName}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedWorld((prev) => (prev < 12 ? prev + 1 : 1))}
                        aria-label="Next World"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-xl font-black text-slate-700 shadow transition hover:bg-white active:scale-90"
                      >
                        ›
                      </button>
                    </div>

                    {/* 10-Level Grid for the selected world */}
                    <div className="mt-4 grid grid-cols-5 gap-2.5 sm:gap-3">
                      {Array.from({ length: 10 }, (_, i) => {
                        const levelIndex = (wId - 1) * 10 + i
                        const levelNumber = levelIndex + 1
                        const isUnlocked = levelIndex <= highestLevel
                        const isCurrent = levelIndex === hud.level
                        const isBoss = i === 9
                        const rec = recordMap[levelIndex]
                        const earnedStars = rec?.stars || 0
                        const lvlName = getModeConfig(hud.mode).levels[levelIndex]?.name || `Level ${levelNumber}`

                        return (
                          <button
                            key={levelIndex}
                            disabled={!isUnlocked}
                            onClick={() => {
                              if (isUnlocked) {
                                controlsRef.current?.startLevel(levelIndex)
                              }
                            }}
                            className={`relative flex flex-col items-center justify-center rounded-2xl p-2 transition ${
                              isUnlocked
                                ? isCurrent
                                  ? 'border-3 border-emerald-400 bg-emerald-50 shadow-md ring-2 ring-emerald-300 active:scale-95'
                                  : 'border-2 border-amber-200 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-100/60 shadow-sm active:scale-95'
                                : 'cursor-not-allowed border-2 border-gray-200 bg-gray-100 opacity-50'
                            }`}
                          >
                            {/* Level Number or Lock Icon */}
                            <span className="text-base font-black text-slate-700">
                              {isUnlocked ? levelNumber : '🔒'}
                            </span>

                            {/* Boss Crown or Target indicator */}
                            {isBoss ? (
                              <span className="text-xs" title="Boss Level">👑</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">
                                {isUnlocked ? (isCurrent ? 'Play' : 'Go') : 'Lock'}
                              </span>
                            )}

                            {/* Star rating dots */}
                            {isUnlocked && (
                              <div className="mt-1 flex items-center gap-0.5">
                                {[1, 2, 3].map((s) => (
                                  <span
                                    key={s}
                                    className={`text-[9px] ${
                                      s <= earnedStars ? 'text-amber-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}

                            {isCurrent && (
                              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white shadow">
                                ✓
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Quick jump to Highest Unlocked Level */}
                    <div className="mt-5 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          controlsRef.current?.startLevel(highestLevel)
                        }}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 text-base font-black text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-600 active:scale-95"
                      >
                        <Play size={20} aria-hidden /> JUMP TO LEVEL {highestLevel + 1}
                      </button>

                      <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                        <span>Recovery Code:</span>
                        <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {mounted && curSave ? curSave.profile.recoveryCode : 'LOADING...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* ════════ OVERLAY: WHO'S FLYING TODAY? (only after pressing START) ════════ */}
        {ui === 'modeSelect' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in my-auto w-full max-w-md rounded-3xl border-4 border-pink-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <div className="floaty text-6xl" aria-hidden>🚀</div>
              <h2 className="mt-2 text-3xl font-extrabold text-pink-500 sm:text-4xl">Who&rsquo;s flying today?</h2>
              <p className="mt-1 text-base font-bold text-gray-500">Pick your adventure and go!</p>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.pickMode('kids')
                }}
                className="relative mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-emerald-400 text-xl font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500 active:scale-95"
              >
                <span className="text-3xl" aria-hidden>🧒</span>
                <span className="flex flex-col items-start leading-tight">
                  <span>{MODES.kids.label}</span>
                  <span className="text-[11px] font-bold text-white/90">{MODES.kids.blurb}</span>
                </span>
                {lastMode === 'kids' && (
                  <span className="absolute -top-2 right-3 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-emerald-500 shadow" aria-hidden>⭐ last time</span>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.pickMode('adults')
                }}
                className="relative mt-2 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-pink-400 text-xl font-extrabold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-500 active:scale-95"
              >
                <span className="text-3xl" aria-hidden>🧑‍🚀</span>
                <span className="flex flex-col items-start leading-tight">
                  <span>{MODES.adults.label}</span>
                  <span className="text-[11px] font-bold text-white/90">{MODES.adults.blurb}</span>
                </span>
                {lastMode === 'adults' && (
                  <span className="absolute -top-2 right-3 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-pink-500 shadow" aria-hidden>⭐ last time</span>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.toMenu()
                }}
                className="mt-4 w-full rounded-full py-2 text-sm font-bold text-gray-400 underline underline-offset-2 transition hover:text-pink-500"
              >
                go back
              </button>
            </div>
          </div>
        )}

        {/* ════════ OVERLAY: PICK YOUR PAL! (after choosing a mode) ════════ */}
        {ui === 'charSelect' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in my-auto w-full max-w-md rounded-3xl border-4 border-amber-200 bg-white p-5 text-center shadow-2xl sm:p-6">
              <h2 className="text-2xl font-extrabold text-pink-500 sm:text-3xl">Pick your pal! 🎉</h2>
              <p className="mt-1 text-sm font-bold text-gray-500">
                Level {hud.level + 1} of 120 · ⭐ {hud.score} stars collected!
              </p>
              <div className="mx-auto mt-2 flex items-center justify-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-extrabold text-amber-800">
                <span>Passcode:</span>
                <span className="font-mono tracking-wider">{mounted && saveData ? saveData.profile.recoveryCode : 'LOADING...'}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {CHARACTER_LIST.map((id) => {
                  const c = CHARACTERS[id]
                  const sel = pal === id
                  return (
                    <button
                      key={id}
                      onClick={(e) => {
                        e.currentTarget.blur()
                        controlsRef.current?.selectCharacter(id)
                      }}
                      aria-pressed={sel}
                      className={`relative flex flex-col items-center rounded-3xl border-4 px-2 pb-3 pt-2 transition active:scale-95 ${sel ? 'scale-[1.03] border-amber-300 bg-amber-50 shadow-xl shadow-amber-100' : 'border-amber-100 bg-white shadow-md hover:border-amber-200'}`}
                    >
                      <div className={sel ? 'wiggle' : 'floaty'}>
                        <CharacterPortrait id={id} size={86} />
                      </div>
                      <span className="mt-1 text-sm font-extrabold leading-tight text-gray-700">{c.name}</span>
                      <span className="mt-0.5 text-[11px] font-bold text-gray-400">{c.tagline}</span>
                      {sel && (
                        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-amber-300 bg-white shadow" aria-hidden>
                          <Check size={15} strokeWidth={3.5} className="text-amber-500" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.startGame()
                }}
                className="mt-4 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-amber-400 text-2xl font-extrabold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-500 active:scale-95"
              >
                <Play size={30} aria-hidden /> LET&rsquo;S GO!
              </button>
              <div className="mt-2 flex items-center justify-center gap-4">
                <button
                  onClick={(e) => {
                    e.currentTarget.blur()
                    controlsRef.current?.openLevelSelect()
                  }}
                  className="rounded-full py-2 text-sm font-extrabold text-amber-700 underline underline-offset-2 transition hover:text-amber-800"
                >
                  🗺️ Choose Level
                </button>
                <span className="text-gray-300">·</span>
                <button
                  onClick={(e) => {
                    e.currentTarget.blur()
                    controlsRef.current?.backToModes()
                  }}
                  className="rounded-full py-2 text-sm font-bold text-gray-400 underline underline-offset-2 transition hover:text-pink-500"
                >
                  go back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════ OVERLAY: LEVEL COMPLETE (reward screen) ════════ */}
        {ui === 'levelClear' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in my-auto w-full max-w-md rounded-3xl border-4 border-pink-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <PartyPopper size={52} className="mx-auto text-pink-500" aria-hidden />
              <h2 className="mt-2 text-3xl font-extrabold text-pink-500 sm:text-4xl">
                {getModeConfig(hud.mode).levels[hud.level]?.name || `Level ${hud.level + 1}`} Complete!
              </h2>
              <p className="mt-1 text-base font-bold text-gray-500">
                You popped {goal} silly friends — and booped the boss! 🎉
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
                <Heart size={16} className="fill-rose-400 text-rose-400" aria-hidden /> +{getModeConfig(hud.mode).hearts} fresh hearts for the next level!
              </p>
              <p className="mt-1 text-sm font-bold text-amber-500">
                {CHARACTERS[hud.character].emoji} {CHARACTERS[hud.character].name} is so proud of you!
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
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in my-auto w-full max-w-md rounded-3xl border-4 border-pink-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <div className="text-6xl" aria-hidden>🌈</div>
              <h2 className="mt-2 text-3xl font-extrabold text-pink-500 sm:text-4xl">Great try! Play again?</h2>
              <p className="mt-2 text-base font-bold text-gray-500">
                The silly monsters say “good game!” 👾
              </p>
              <p className="mt-1 text-sm font-bold text-amber-500">
                {CHARACTERS[hud.character].emoji} {CHARACTERS[hud.character].name} says “Great try, friend!”
              </p>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-lg font-extrabold text-amber-500">
                <Star size={22} className="fill-amber-400 text-amber-400" aria-hidden /> You collected {hud.score} stars!
              </p>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.startGame()
                }}
                className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-pink-400 text-2xl font-extrabold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-500 active:scale-95"
              >
                <RotateCcw size={28} aria-hidden /> PLAY AGAIN
              </button>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.bye()
                }}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-rose-200 bg-white text-base font-extrabold text-rose-400 shadow-sm transition hover:bg-rose-50 active:scale-95"
              >
                <DoorOpen size={20} aria-hidden /> QUIT GAME
              </button>
            </div>
          </div>
        )}

        {/* ════════ OVERLAY: CHAMPION (all 3 levels finished!) ════════ */}
        {ui === 'won' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in my-auto w-full max-w-md rounded-3xl border-4 border-amber-300 bg-white p-6 text-center shadow-2xl sm:p-8">
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
              <p className="mt-1 text-sm font-bold text-amber-500">
                {CHARACTERS[hud.character].emoji} {CHARACTERS[hud.character].name} cheered the whole way!
              </p>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.startGame()
                }}
                className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-emerald-400 text-2xl font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500 active:scale-95"
              >
                <RotateCcw size={28} aria-hidden /> PLAY AGAIN
              </button>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.bye()
                }}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-rose-200 bg-white text-base font-extrabold text-rose-400 shadow-sm transition hover:bg-rose-50 active:scale-95"
              >
                <DoorOpen size={20} aria-hidden /> QUIT GAME
              </button>
            </div>
          </div>
        )}
        {/* ════════ OVERLAY: GOODBYE 👋 (after quitting from an end screen) ════════ */}
        {ui === 'bye' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-white/55 p-4 backdrop-blur-[2px]">
            <div className="pop-in my-auto w-full max-w-md rounded-3xl border-4 border-amber-200 bg-white p-6 text-center shadow-2xl sm:p-8">
              <div className="floaty text-6xl" aria-hidden>👋</div>
              <h2 className="mt-2 text-3xl font-extrabold text-pink-500 sm:text-4xl">Thanks for playing!</h2>
              <p className="mt-2 text-base font-bold text-gray-500">
                The silly monsters will miss you! 👾
              </p>
              <button
                onClick={(e) => {
                  e.currentTarget.blur()
                  controlsRef.current?.toMenu()
                }}
                className="mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full bg-emerald-400 text-2xl font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-500 active:scale-95"
              >
                <Play size={30} aria-hidden /> COME BACK &amp; PLAY
              </button>
              <p className="mt-3 text-xs font-bold text-gray-400">You can close this tab now — or stay and pop a few more! 💛</p>
            </div>
          </div>
        )}
      </div>

      {/* ════════ FOOTER (sticks to the bottom, always) ════════ */}
      <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t-2 border-amber-100 bg-amber-50 px-4 py-1.5 text-center text-[11px] font-bold text-amber-700 sm:text-xs">
        <span>Made with 💛 for little heroes · Parents: tweak speeds, colors &amp; sounds at the top of the game file</span>
        <button
          onClick={() => setShowHelp(true)}
          className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-amber-900 transition hover:bg-amber-300 hover:text-black"
        >
          <HelpCircle size={13} />
          <span>Need Help? Contact Support</span>
        </button>
      </footer>
      {/* 💌 HELP & CONTACT SUPPORT MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="pop-in relative w-full max-w-md rounded-3xl border-4 border-amber-300 bg-amber-50 p-6 shadow-2xl">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 text-amber-800 transition hover:bg-amber-300"
              aria-label="Close help modal"
            >
              <X size={20} />
            </button>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-3xl shadow-md">
                💬
              </div>
              <h2 className="text-2xl font-black text-amber-950">Need Help or Found a Bug?</h2>
              <p className="mt-1 text-sm font-semibold text-amber-800">
                We are here to help! If a level is stuck, stars did not save, or you have a suggestion:
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {/* Email direct link */}
              <a
                href="mailto:ak0787777@gmail.com?subject=Bubble%20Pop%20Adventure%20Feedback%20%2F%20Issue&body=Hi%20Abhi%2C%0A%0AI%20noticed%20an%20issue%20while%20playing%20Bubble%20Pop%20Adventure%3A%0A%0ADetails%3A%20%0A%0AThank%20you!"
                className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200 bg-white p-3.5 shadow-sm transition hover:border-amber-400 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Mail size={22} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold text-amber-950">Email Developer</div>
                  <div className="text-xs font-semibold text-amber-700">ak0787777@gmail.com</div>
                </div>
              </a>

            </div>

            <div className="mt-4 rounded-xl bg-amber-100/80 p-3 text-center text-xs font-bold text-amber-900">
              💡 Quick tip: Press <kbd className="rounded bg-white px-1.5 py-0.5 shadow-sm">Esc</kbd> or <kbd className="rounded bg-white px-1.5 py-0.5 shadow-sm">P</kbd> anytime to pause or resume your game!
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-base font-black text-white shadow-md transition active:scale-95 hover:from-amber-600 hover:to-amber-700"
            >
              Back to Game
            </button>
          </div>
        </div>
      )}

    </main>
  )
}
