// Bubble Pop Adventure - 12 Worlds & 120 Levels Game Architecture Specifications

export type WorldId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type EnemyType =
  | 'blobby'
  | 'zoe'
  | 'bob'
  | 'spinny'
  | 'cloud'
  | 'ghosty'
  | 'puffer'
  | 'gummy'
  | 'dragonfly'
  | 'armadillo'
  | 'mitosis'
  | 'cosmo'

export type MoveKind =
  | 'straight'
  | 'zigzag'
  | 'bounce'
  | 'spin'
  | 'drift'
  | 'fade'
  | 'puffer'
  | 'trail'
  | 'dive'
  | 'armored'
  | 'mitosis'
  | 'teleport'

export interface EnemyConfig {
  name: string
  emoji: string
  hint: string
  hp: number
  sizeMul: number
  speedMul: number
  fromLevel: number // Level index (0 to 119)
  fromWorld: WorldId
  weight: number
  color: string
  move: MoveKind
}

export interface BossConfig {
  worldId: WorldId
  key: string
  name: string
  emoji: string
  color: string
  hpKids: number
  hpAdults: number
  bonus: number
  swingAmp: number
  swingSpeed: number
  silhouette: string
  specialAttack: string
}

export interface WorldConfig {
  id: WorldId
  name: string
  subtitle: string
  emoji: string
  skyTop: string
  skyBottom: string
  hillLight: string
  hillDark: string
  accent: string
  gimmickName: string
  gimmickDesc: string
  gimmickType:
    | 'updraft'
    | 'buoyancy'
    | 'crosswind'
    | 'ice_bounce'
    | 'low_gravity'
    | 'trampoline'
    | 'geysers'
    | 'cotton_candy'
    | 'glow_stream'
    | 'crystal_refract'
    | 'conveyor'
    | 'gravity_well'
  audioTempoBpm: number
}

export interface LevelConfig {
  levelIndex: number // 0 to 119
  levelNumber: number // 1 to 120
  worldId: WorldId
  name: string
  goal: number
  spawnEvery: number
  spawnEveryMin: number
  fallSpeed: number
  fallSpeedMax: number
  drift: number
  maxOnScreen: number
  isBossLevel: boolean
  bossIndex: number // 0 to 11 if boss level, else -1
}

/* ═══════════════════════════════════════════════════════════════════════
   12 THEMATIC WORLDS
   ═══════════════════════════════════════════════════════════════════════ */
export const WORLDS: Record<WorldId, WorldConfig> = {
  1: {
    id: 1,
    name: 'Sunny Meadow',
    subtitle: 'Floral hills and gentle breezes',
    emoji: '🌻',
    skyTop: '#a5e8ff',
    skyBottom: '#fff3c9',
    hillLight: '#8ee06e',
    hillDark: '#5ec44f',
    accent: '#ffd93d',
    gimmickName: 'Gentle Updrafts',
    gimmickDesc: 'Floral breezes boost bubble lift',
    gimmickType: 'updraft',
    audioTempoBpm: 102,
  },
  2: {
    id: 2,
    name: 'Bubble Bay',
    subtitle: 'Sun-drenched tropical shores',
    emoji: '🏖️',
    skyTop: '#70d6ff',
    skyBottom: '#c2f9bb',
    hillLight: '#48cae4',
    hillDark: '#0077b6',
    accent: '#ff6b6b',
    gimmickName: 'Ocean Buoyancy',
    gimmickDesc: 'Bubbles curve on rolling waves',
    gimmickType: 'buoyancy',
    audioTempoBpm: 108,
  },
  3: {
    id: 3,
    name: 'Whispering Woods',
    subtitle: 'Mossy oaks and autumn foliage',
    emoji: '🌲',
    skyTop: '#52b788',
    skyBottom: '#d8f3dc',
    hillLight: '#40916c',
    hillDark: '#2d6a4f',
    accent: '#f77f00',
    gimmickName: 'Gusting Crosswinds',
    gimmickDesc: 'Gentle winds drift bubbles sideways',
    gimmickType: 'crosswind',
    audioTempoBpm: 104,
  },
  4: {
    id: 4,
    name: 'Chilly Peak',
    subtitle: 'Glacial crags and dancing auroras',
    emoji: '❄️',
    skyTop: '#cce3de',
    skyBottom: '#eaf4f4',
    hillLight: '#a4c3b2',
    hillDark: '#6b9080',
    accent: '#7209b7',
    gimmickName: 'Slippery Ice Drafts',
    gimmickDesc: 'Bubbles bounce crisply off side borders',
    gimmickType: 'ice_bounce',
    audioTempoBpm: 112,
  },
  5: {
    id: 5,
    name: 'Starlight Meadow',
    subtitle: 'Cosmic twilight with glowing fireflies',
    emoji: '🌟',
    skyTop: '#0b132b',
    skyBottom: '#1c2541',
    hillLight: '#3a506b',
    hillDark: '#1c2541',
    accent: '#fee440',
    gimmickName: 'Low Gravity Drift',
    gimmickDesc: 'Microgravity creates floaty, supersized bubbles',
    gimmickType: 'low_gravity',
    audioTempoBpm: 96,
  },
  6: {
    id: 6,
    name: 'Sky Circus',
    subtitle: 'Carnival balloons and festive pennants',
    emoji: '🎪',
    skyTop: '#ffcad4',
    skyBottom: '#fde2e4',
    hillLight: '#ffb703',
    hillDark: '#e63946',
    accent: '#e63946',
    gimmickName: 'Trampoline Corners',
    gimmickDesc: 'Safety nets bounce low hazards back up',
    gimmickType: 'trampoline',
    audioTempoBpm: 122,
  },
  7: {
    id: 7,
    name: 'Coral Reef',
    subtitle: 'Glowing sea anemones and kelp forests',
    emoji: '🪸',
    skyTop: '#0077b6',
    skyBottom: '#03045e',
    hillLight: '#f28482',
    hillDark: '#8338ec',
    accent: '#06d6a0',
    gimmickName: 'Hydro Geysers',
    gimmickDesc: 'Thermal vents empower bubbles into mega-orbs',
    gimmickType: 'geysers',
    audioTempoBpm: 106,
  },
  8: {
    id: 8,
    name: 'Candy Cloudland',
    subtitle: 'Cotton-candy skies and lollipop mills',
    emoji: '🍭',
    skyTop: '#ffc6ff',
    skyBottom: '#bdb2ff',
    hillLight: '#fdffb6',
    hillDark: '#caffbf',
    accent: '#ff0054',
    gimmickName: 'Cotton Candy Pockets',
    gimmickDesc: 'Spun sugar creates sparkling rainbow trails',
    gimmickType: 'cotton_candy',
    audioTempoBpm: 116,
  },
  9: {
    id: 9,
    name: 'Twilight Treetops',
    subtitle: 'Sunset sequoias and dancing embers',
    emoji: '🦉',
    skyTop: '#240046',
    skyBottom: '#ff9e00',
    hillLight: '#5a189a',
    hillDark: '#10002b',
    accent: '#00f5d4',
    gimmickName: 'Bioluminescent Glow',
    gimmickDesc: 'Luminescent waves reveal sneaky cloaked foes',
    gimmickType: 'glow_stream',
    audioTempoBpm: 100,
  },
  10: {
    id: 10,
    name: 'Crystal Cavern',
    subtitle: 'Subterranean geode halls and amethyst spires',
    emoji: '💎',
    skyTop: '#101820',
    skyBottom: '#2c3e50',
    hillLight: '#9d4edd',
    hillDark: '#48cae4',
    accent: '#f4a261',
    gimmickName: 'Prismatic Bouncers',
    gimmickDesc: 'Floating crystals refract bubbles into twin shots',
    gimmickType: 'crystal_refract',
    audioTempoBpm: 110,
  },
  11: {
    id: 11,
    name: 'Clockwork Cloud',
    subtitle: 'Steampunk cogs and ticking brass pendulums',
    emoji: '⚙️',
    skyTop: '#7f5539',
    skyBottom: '#ddb892',
    hillLight: '#b08968',
    hillDark: '#4a3525',
    accent: '#06d6a0',
    gimmickName: 'Conveyor Currents',
    gimmickDesc: 'Exhaust turbines gently sweep bubbles along',
    gimmickType: 'conveyor',
    audioTempoBpm: 128,
  },
  12: {
    id: 12,
    name: 'Rainbow Galaxy',
    subtitle: 'Stardust ribbons and celestial supernovas',
    emoji: '🌌',
    skyTop: '#03071e',
    skyBottom: '#370617',
    hillLight: '#9d4edd',
    hillDark: '#03071e',
    accent: '#ffffff',
    gimmickName: 'Prismatic Gravity Well',
    gimmickDesc: 'Cosmic core slingshots bubbles in grand orbits',
    gimmickType: 'gravity_well',
    audioTempoBpm: 132,
  },
}

/* ═══════════════════════════════════════════════════════════════════════
   12 ENEMY ROSTER PROFILES
   ═══════════════════════════════════════════════════════════════════════ */
export const ALL_ENEMIES: Record<EnemyType, EnemyConfig> = {
  blobby: {
    name: 'Blobby the Blob',
    emoji: '🟢',
    hint: 'floats down slow & happy',
    hp: 1,
    sizeMul: 1,
    speedMul: 0.85,
    fromLevel: 0,
    fromWorld: 1,
    weight: 3.5,
    color: '#7ec850',
    move: 'straight',
  },
  zoe: {
    name: 'Zigzag Zoe',
    emoji: '🟠',
    hint: 'wiggles in a gentle zigzag',
    hp: 1,
    sizeMul: 0.95,
    speedMul: 0.9,
    fromLevel: 5,
    fromWorld: 1,
    weight: 3.0,
    color: '#ff9f43',
    move: 'zigzag',
  },
  bob: {
    name: 'Bouncy Bob',
    emoji: '🟣',
    hint: 'bounces off the walls!',
    hp: 1,
    sizeMul: 0.92,
    speedMul: 0.65,
    fromLevel: 10,
    fromWorld: 2,
    weight: 2.8,
    color: '#b18aff',
    move: 'bounce',
  },
  spinny: {
    name: 'Spinny Spike',
    emoji: '⭐',
    hint: 'spins like a happy top!',
    hp: 1,
    sizeMul: 0.85,
    speedMul: 1.25,
    fromLevel: 30,
    fromWorld: 4,
    weight: 2.5,
    color: '#ffd93d',
    move: 'spin',
  },
  cloud: {
    name: 'Sleepy Cloud',
    emoji: '☁️',
    hint: 'needs 2 bubbles — tee-hee!',
    hp: 2,
    sizeMul: 1.15,
    speedMul: 0.55,
    fromLevel: 40,
    fromWorld: 5,
    weight: 2.0,
    color: '#aebfd4',
    move: 'drift',
  },
  ghosty: {
    name: 'Sneaky Ghosty',
    emoji: '👻',
    hint: 'pop it when you can see it!',
    hp: 1,
    sizeMul: 1.0,
    speedMul: 0.75,
    fromLevel: 50,
    fromWorld: 6,
    weight: 1.8,
    color: '#ffffff',
    move: 'fade',
  },
  puffer: {
    name: 'Prickly Puffer',
    emoji: '🐡',
    hint: 'swells up big when close!',
    hp: 2,
    sizeMul: 1.05,
    speedMul: 0.65,
    fromLevel: 60,
    fromWorld: 7,
    weight: 1.8,
    color: '#f28482',
    move: 'puffer',
  },
  gummy: {
    name: 'Gummy Glider',
    emoji: '🍯',
    hint: 'leaves sweet slowing trails',
    hp: 2,
    sizeMul: 1.0,
    speedMul: 0.6,
    fromLevel: 70,
    fromWorld: 8,
    weight: 1.6,
    color: '#f4a261',
    move: 'trail',
  },
  dragonfly: {
    name: 'Darting Dragonfly',
    emoji: '🛸',
    hint: 'hovers, then dive-bombs!',
    hp: 1,
    sizeMul: 0.85,
    speedMul: 1.1,
    fromLevel: 80,
    fromWorld: 9,
    weight: 1.5,
    color: '#06d6a0',
    move: 'dive',
  },
  armadillo: {
    name: 'Armored Armadillo',
    emoji: '🛡️',
    hint: 'hit its belly from below!',
    hp: 3,
    sizeMul: 1.1,
    speedMul: 0.55,
    fromLevel: 90,
    fromWorld: 10,
    weight: 1.4,
    color: '#6c757d',
    move: 'armored',
  },
  mitosis: {
    name: 'Mitosis Mite',
    emoji: '🦠',
    hint: 'pops into 2 mini mites!',
    hp: 1,
    sizeMul: 0.95,
    speedMul: 0.75,
    fromLevel: 100,
    fromWorld: 11,
    weight: 1.4,
    color: '#4cc9f0',
    move: 'mitosis',
  },
  cosmo: {
    name: 'Chrono Cosmo',
    emoji: '🌌',
    hint: 'teleports across the sky!',
    hp: 2,
    sizeMul: 1.05,
    speedMul: 0.7,
    fromLevel: 110,
    fromWorld: 12,
    weight: 1.2,
    color: '#9d4edd',
    move: 'teleport',
  },
}

/* ═══════════════════════════════════════════════════════════════════════
   12 WORLD CLIMACTIC BOSSES (Levels 10, 20, 30 ... 120)
   ═══════════════════════════════════════════════════════════════════════ */
export const ALL_BOSSES: BossConfig[] = [
  {
    worldId: 1,
    key: 'jelly',
    name: 'Giant Jelly',
    emoji: '🍮',
    color: '#ff8fb1',
    hpKids: 14,
    hpAdults: 20,
    bonus: 3,
    swingAmp: 0.28,
    swingSpeed: 1.0,
    silhouette: 'Shimmering strawberry gelatin mound with a daisy crown',
    specialAttack: 'Jelly Wobble: releases twin Blobbys',
  },
  {
    worldId: 2,
    key: 'barnaby',
    name: 'Barnaby Barnacle',
    emoji: '🐚',
    color: '#48cae4',
    hpKids: 18,
    hpAdults: 26,
    bonus: 4,
    swingAmp: 0.32,
    swingSpeed: 1.1,
    silhouette: 'Pearlescent sea-snail shell with waving eyestalks',
    specialAttack: 'Pearl Volley: launches twin floating pearls',
  },
  {
    worldId: 3,
    key: 'bunny',
    name: 'Big Bouncy Bunny',
    emoji: '🐰',
    color: '#b28dff',
    hpKids: 22,
    hpAdults: 32,
    bonus: 4,
    swingAmp: 0.3,
    swingSpeed: 1.6,
    silhouette: 'Floppy-eared lilac rabbit with clover collar',
    specialAttack: 'Ground Thump: drops leafy acorns across the stage',
  },
  {
    worldId: 4,
    key: 'owl',
    name: 'Frosty Snow-Owl',
    emoji: '🦉',
    color: '#90e0ef',
    hpKids: 26,
    hpAdults: 38,
    bonus: 5,
    swingAmp: 0.34,
    swingSpeed: 1.2,
    silhouette: 'Spherical snowy owl with cyan eyes and knitted scarf',
    specialAttack: 'Blizzard Flap: drops trio of sharp icicles',
  },
  {
    worldId: 5,
    key: 'luna',
    name: 'Luna Star-Weaver',
    emoji: '🌟',
    color: '#fee440',
    hpKids: 30,
    hpAdults: 44,
    bonus: 5,
    swingAmp: 0.36,
    swingSpeed: 0.85,
    silhouette: 'Crescent-moon celestial sprite holding a star spindle',
    specialAttack: 'Constellation Beam: drops glowing stardust ribbons',
  },
  {
    worldId: 6,
    key: 'seals',
    name: 'Pip & Pop Circus Seals',
    emoji: '🦭',
    color: '#ffb703',
    hpKids: 35,
    hpAdults: 50,
    bonus: 6,
    swingAmp: 0.38,
    swingSpeed: 1.3,
    silhouette: 'Twin performing seals balancing on spinning barrels',
    specialAttack: 'Juggled Balls: launches dual bouncing beach balls',
  },
  {
    worldId: 7,
    key: 'octo',
    name: 'Octo-Claus Squid',
    emoji: '🐙',
    color: '#f28482',
    hpKids: 40,
    hpAdults: 58,
    bonus: 6,
    swingAmp: 0.4,
    swingSpeed: 0.75,
    silhouette: 'Friendly magenta octopus sporting a sailor cap',
    specialAttack: 'Ink Bubble: releases cartoon ink cover clouds',
  },
  {
    worldId: 8,
    key: 'bonbon',
    name: 'Baron von Bonbon',
    emoji: '🍬',
    color: '#ff0054',
    hpKids: 45,
    hpAdults: 66,
    bonus: 7,
    swingAmp: 0.34,
    swingSpeed: 1.2,
    silhouette: 'Hard-candy nobleman with spun-sugar mustache',
    specialAttack: 'Gumball Spray: fires 3 bouncing peppermint drops',
  },
  {
    worldId: 9,
    key: 'drake',
    name: 'Bramble Forest-Drake',
    emoji: '🐲',
    color: '#06d6a0',
    hpKids: 50,
    hpAdults: 74,
    bonus: 7,
    swingAmp: 0.42,
    swingSpeed: 0.9,
    silhouette: 'Round emerald dragon with dragonfly wings',
    specialAttack: 'Spore Breath: exhales soft cloud of 4 floral spores',
  },
  {
    worldId: 10,
    key: 'golem',
    name: 'King Caelum Geode',
    emoji: '💎',
    color: '#9d4edd',
    hpKids: 56,
    hpAdults: 82,
    bonus: 8,
    swingAmp: 0.35,
    swingSpeed: 0.8,
    silhouette: 'Floating geometric quartz blocks orbiting a heart gem',
    specialAttack: 'Shield Form: orbits crystal blocks into a front shield',
  },
  {
    worldId: 11,
    key: 'cogswell',
    name: 'Prof. Cogswell Tank',
    emoji: '⚙️',
    color: '#ddb892',
    hpKids: 62,
    hpAdults: 92,
    bonus: 8,
    swingAmp: 0.36,
    swingSpeed: 1.1,
    silhouette: 'Brass-riveted spherical clockwork tank with winding key',
    specialAttack: 'Spring Cogs: fires 2 ticking brass clockwork gears',
  },
  {
    worldId: 12,
    key: 'stella',
    name: 'Supernova Stella',
    emoji: '👑',
    color: '#ffffff',
    hpKids: 75,
    hpAdults: 110,
    bonus: 10,
    swingAmp: 0.44,
    swingSpeed: 1.2,
    silhouette: 'Celestial queen sprite wearing a prismatic rainbow crown',
    specialAttack: 'Supernova Beam & 3-Phase Cosmic Hazard Finale',
  },
]

/* ═══════════════════════════════════════════════════════════════════════
   MATHEMATICAL LEVEL CURVES (Levels 1 to 120)
   ═══════════════════════════════════════════════════════════════════════ */
export function generateLevels(mode: 'kids' | 'adults' | 'advanced'): LevelConfig[] {
  const levels: LevelConfig[] = []
  const isAdults = mode === 'adults'
  const isAdv = mode === 'advanced'

  for (let idx = 0; idx < 120; idx++) {
    const levelNumber = idx + 1
    const worldId = (Math.floor(idx / 10) + 1) as WorldId
    const isBossLevel = levelNumber % 10 === 0
    const bossIndex = isBossLevel ? Math.floor(idx / 10) : -1

    // 1. Goal calculation formula: N(L) = min(85, round(12 + 0.62 * L + 8 * ln(1 + 0.08 * L)))
    const rawGoal = Math.min(85, Math.round(12 + 0.62 * levelNumber + 8 * Math.log(1 + 0.08 * levelNumber)))
    const goal = isBossLevel
      ? Math.round(rawGoal * (isAdv ? 1.25 : isAdults ? 1.0 : 0.8))
      : Math.round(rawGoal * (isAdv ? 1.35 : isAdults ? 1.15 : 0.9))

    // 2. Fall speed progression (sigmoidal scaling)
    const baseFall = isAdv ? 75 : isAdults ? 55 : 38
    const maxFallCeil = isAdv ? 210 : isAdults ? 160 : 110
    const vMult = 1.0 + 1.4 / (1 + Math.exp(-0.045 * (levelNumber - 55)))
    const fallSpeed = Math.round(baseFall * vMult)
    const fallSpeedMax = Math.min(maxFallCeil, Math.round(fallSpeed * 1.55))

    // 3. Spawn cadence: S_delay(L, 0) scaling down
    const spawnEvery = Math.max(0.75, Number(( (isAdv ? 1.8 : isAdults ? 2.4 : 2.8) - 0.0095 * levelNumber ).toFixed(2)))
    const spawnEveryMin = Math.max(0.48, Number(( spawnEvery * 0.65 ).toFixed(2)))

    // 4. Drift wiggle & on-screen enemy counts
    const drift = Math.round((isAdv ? 26 : 20) + 0.45 * levelNumber)
    const maxOnScreen = Math.min(isAdv ? 8 : isAdults ? 6 : 5, Math.round((isAdv ? 4 : 3) + levelNumber * 0.04))

    const world = WORLDS[worldId]
    const name = isBossLevel
      ? `W${worldId}-10 BOSS: ${ALL_BOSSES[bossIndex].name}`
      : `W${worldId}-${(idx % 10) + 1} ${world.name}`

    levels.push({
      levelIndex: idx,
      levelNumber,
      worldId,
      name,
      goal,
      spawnEvery,
      spawnEveryMin,
      fallSpeed,
      fallSpeedMax,
      drift,
      maxOnScreen,
      isBossLevel,
      bossIndex,
    })
  }

  return levels
}

export function getWorldForLevel(levelIndex: number): WorldConfig {
  const worldId = (Math.min(12, Math.max(1, Math.floor(levelIndex / 10) + 1))) as WorldId
  return WORLDS[worldId]
}
