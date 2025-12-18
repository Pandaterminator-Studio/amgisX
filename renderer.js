const TILES_PER_ROW = 8;
const AMBIENT_TRACK_PATH = 'GameData/Audio/Background/439_Goodhaven.mp3';
const AMBIENT_SCENE_VOLUMES = {
  loading: 0.18,
  home: 0.26,
  character: 0.24,
  combat: 0.34,
  game: 0.36,
  saves: 0.22,
  settings: 0.22
};
const AUDIO_STORAGE_KEY = 'amgis.audioMuted';
const ZOOM_DEFAULT = 1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.25;
const CHARACTER_FRAME_WIDTH = 32;
const CHARACTER_FRAME_HEIGHT = 32;
const CHARACTER_ANIM_FRAMES = 3;
const CHARACTER_IDLE_FRAME = 1;
const CHARACTER_PREVIEW_SCALE = 4;
const CHARACTER_DIRECTION_ROWS = {
  down: 0,
  left: 1,
  right: 2,
  up: 3
};
const CHARACTER_ANIM_SPEED_MOVING = 0.12;
const CHARACTER_ANIM_SPEED_IDLE = 0.38;
const COMBAT_STATES = Object.freeze({
  idle: 'idle',
  playerTurn: 'player-turn',
  enemyTurn: 'enemy-turn',
  victory: 'victory',
  defeat: 'defeat'
});
const BASE_PLAYER_COMBAT_STATS = Object.freeze({
  maxHp: 90,
  attack: 12,
  defense: 4,
  speed: 12
});
const PLAYER_GUARD_BONUS = 6;
const COMBAT_LOG_LIMIT = 8;
const BASE_PLAYER_MOVEMENT_SPEED = 160;
const PLAYER_SPRINT_MULTIPLIER = 1.5;
const PLAYER_MAX_STAMINA = 100;
const PLAYER_STAMINA_DRAIN_PER_SECOND = 38;
const PLAYER_STAMINA_REGEN_PER_SECOND = 24;
const PLAYER_STAMINA_REGEN_MOVING_SCALE = 0.55;
const PLAYER_STAMINA_REST_MULTIPLIER = 2.6;
const PLAYER_STAMINA_SPRINT_THRESHOLD = 12;
const INVENTORY_SLOTS = Object.freeze(['weapon', 'armor', 'accessory']);
const NPC_INTERACT_RADIUS = 96;
const NPC_MARKER_RADIUS = 12;
const QUEST_STATUSES = Object.freeze({
  notStarted: 'not-started',
  inProgress: 'in-progress',
  completed: 'completed'
});
const SAVE_SLOT_DEFS = Object.freeze([
  { id: 'slot-1', label: 'Slot I' },
  { id: 'slot-2', label: 'Slot II' },
  { id: 'slot-3', label: 'Slot III' }
]);
const BLOCKING_LAYER_HINTS = Object.freeze(['collision', 'collisions', 'blocked', 'block', 'wall', 'walls', 'water', 'lava', 'void', 'cliff', 'obstacle']);

const audioState = {
  element: null,
  ready: false,
  muted: false,
  targetVolume: 0,
  fadeFrame: null,
  scene: 'loading',
  buttonEl: null
};

const engine = {
  canvas: null,
  ctx: null,
  map: null,
  collision: null,
  spriteImg: null,
  tilesetImages: new Map(),
  camera: { x: 0, y: 0, width: 0, height: 0 },
  viewport: { width: 0, height: 0 },
  zoom: ZOOM_DEFAULT,
  player: {
    x: 0,
    y: 0,
    radius: 8,
    speed: BASE_PLAYER_MOVEMENT_SPEED,
    sprinting: false,
    resting: false,
    maxStamina: PLAYER_MAX_STAMINA,
    stamina: PLAYER_MAX_STAMINA,
    spawned: false,
    direction: 'down',
    moving: false,
    animFrame: CHARACTER_IDLE_FRAME,
    animTime: 0
  },
  character: null,
  keys: new Set(),
  running: false,
  lastTime: 0,
  statusEl: null
};

const ui = {
  selectWorld: null,
  selectMap: null,
  btnLoadMap: null,
  selectorsReady: false,
  selectCharacterGender: null,
  selectCharacterVariant: null,
  btnCharacterConfirm: null,
  btnCharacterBack: null,
  btnChangeOperative: null,
  btnEngageCombat: null,
  btnCombatAttack: null,
  btnCombatDefend: null,
  btnCombatRetreat: null,
  btnCombatContinue: null
};

const characterImageCache = new Map();

const characterState = {
  initialized: false,
  genders: [],
  charactersByGender: {},
  selectedGender: null,
  lastSelectionPath: null,
  currentSelection: null,
  preview: {
    canvas: null,
    ctx: null,
    raf: null,
    frame: CHARACTER_IDLE_FRAME,
    animTime: 0,
    direction: 'down',
    image: null,
    pendingPath: null,
    lastTick: 0,
    directionButtons: []
  }
};

const combatState = {
  active: false,
  state: COMBAT_STATES.idle,
  player: null,
  enemy: null,
  log: [],
  guardActive: false
};

const combatUi = {
  root: null,
  playerName: null,
  playerRank: null,
  playerHp: null,
  playerSpeed: null,
  enemyName: null,
  enemyRank: null,
  enemyHp: null,
  enemySpeed: null,
  enemyThreat: null,
  stateLabel: null,
  logList: null
};

const npcState = {
  active: [],
  nearbyNpc: null
};

const dialogueState = {
  active: false,
  npc: null,
  node: null
};

const dialogueUi = {
  overlay: null,
  speaker: null,
  role: null,
  text: null,
  choices: null,
  closeBtn: null,
  interactHint: null,
  interactName: null,
  interactButton: null
};

const inventoryState = {
  catalog: [],
  itemsById: new Map(),
  items: [],
  equipment: {
    weapon: null,
    armor: null,
    accessory: null
  },
  selectedItemId: null,
  open: false
};

const inventoryUi = {
  openBtn: null,
  overlay: null,
  closeBtn: null,
  list: null,
  equipmentSlots: {},
  detailName: null,
  detailMeta: null,
  detailDescription: null,
  detailStats: null,
  detailActions: null
};

const questState = {
  catalog: [],
  progress: new Map(),
  selectedQuestId: null,
  trackedQuestId: null,
  open: false
};

const questUi = {
  openBtn: null,
  overlay: null,
  closeBtn: null,
  list: null,
  detailTitle: null,
  detailSummary: null,
  detailMeta: null,
  detailObjectives: null,
  detailActions: null,
  hudTitle: null,
  hudObjective: null,
  toast: null,
  toastTimer: null
};

const staminaUi = {
  card: null,
  bar: null,
  fill: null,
  readout: null
};

const saveState = {
  slots: SAVE_SLOT_DEFS.map(def => ({ slotId: def.id, savedAt: null, data: null })),
  busySlotId: null,
  refreshing: false
};

const saveUi = {
  list: null,
  refreshBtn: null,
  backBtn: null,
  subtitle: null
};

/** @type {any | null} */
let bootData = null;

function setActiveScreen(name) {
  const screens = ['loading', 'home', 'character', 'combat', 'game', 'saves', 'settings'];
  for (const screenName of screens) {
    const el = document.getElementById(`screen-${screenName}`);
    if (el) {
      el.classList.toggle('active', screenName === name);
    }
  }
  if (document.body) {
    document.body.setAttribute('data-screen', name);
  }
  if (name !== 'character') {
    stopCharacterPreview();
  }
  if (name !== 'game') {
    closeDialogueOverlay({ silent: true });
    hideNpcHint();
    closeInventoryOverlay({ silent: true });
    closeQuestOverlay({ force: true });
  }
  setAmbientScene(name);
}

function setLoading(text, ratio) {
  const loadingText = document.getElementById('loading-text');
  const loadingBar = document.getElementById('loading-bar');
  loadingText.textContent = text;
  const clamped = Math.max(0, Math.min(1, ratio));
  loadingBar.style.width = `${Math.round(clamped * 100)}%`;
}

function waitForImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function setSelectOptions(selectEl, options, getValue, getLabel) {
  if (!selectEl) {
    return;
  }
  selectEl.innerHTML = '';
  for (const option of options) {
    const el = document.createElement('option');
    el.value = getValue(option);
    el.textContent = getLabel(option);
    selectEl.appendChild(el);
  }
}

function getSelectedValue(selectEl) {
  if (!selectEl) {
    return '';
  }
  return String(selectEl.value || '');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

async function persistSettingsPatch(patch = {}) {
  if (!window.amgis || typeof window.amgis.saveSettings !== 'function') {
    return null;
  }
  try {
    const response = await window.amgis.saveSettings(patch);
    if (response?.ok && response.data) {
      if (bootData) {
        bootData.settings = response.data;
      }
      return response.data;
    }
    if (response?.error) {
      throw new Error(response.error);
    }
  } catch (error) {
    console.warn('Unable to persist settings:', error.message || error);
  }
  return null;
}

function drawCharacterFrame(ctx, image, frameIndex, direction, dx, dy, dw, dh) {
  if (!ctx || !image) {
    return;
  }
  const rowIndex = CHARACTER_DIRECTION_ROWS[direction] ?? CHARACTER_DIRECTION_ROWS.down;
  const columnIndex = Math.max(0, Math.min(CHARACTER_ANIM_FRAMES - 1, frameIndex));
  ctx.drawImage(
    image,
    columnIndex * CHARACTER_FRAME_WIDTH,
    rowIndex * CHARACTER_FRAME_HEIGHT,
    CHARACTER_FRAME_WIDTH,
    CHARACTER_FRAME_HEIGHT,
    dx,
    dy,
    dw,
    dh
  );
}

async function loadCharacterImage(path) {
  if (!path) {
    return null;
  }
  if (characterImageCache.has(path)) {
    return characterImageCache.get(path);
  }
  const image = await waitForImage(path);
  characterImageCache.set(path, image);
  return image;
}

async function setPlayerCharacter(selection, options = {}) {
  if (!selection || !selection.file) {
    throw new Error('No character sprite selected.');
  }
  const image = await loadCharacterImage(selection.file);
  engine.character = {
    ...selection,
    image
  };
  characterState.lastSelectionPath = selection.file;
  if (options.persist !== false) {
    await persistSettingsPatch({ lastCharacterPath: selection.file });
  }
}

function getFirstPlayableCharacter() {
  if (!bootData?.characters) {
    return null;
  }
  const priorityGenders = ['Female', 'Male'];
  for (const gender of priorityGenders) {
    const list = bootData.characters[gender];
    if (Array.isArray(list) && list.length) {
      return { ...list[0], gender };
    }
  }
  const genders = Object.keys(bootData.characters);
  for (const gender of genders) {
    const list = bootData.characters[gender];
    if (Array.isArray(list) && list.length) {
      return { ...list[0], gender };
    }
  }
  return null;
}

function findCharacterByPath(path) {
  if (!path || !bootData?.characters) {
    return null;
  }
  for (const [gender, entries] of Object.entries(bootData.characters)) {
    if (!Array.isArray(entries)) {
      continue;
    }
    const match = entries.find(entry => entry.file === path);
    if (match) {
      return { ...match, gender };
    }
  }
  return null;
}

async function ensurePlayerCharacterSelected() {
  if (engine.character?.image) {
    return;
  }
  const savedPath = bootData?.settings?.lastCharacterPath;
  const savedSelection = findCharacterByPath(savedPath);
  if (savedSelection) {
    await setPlayerCharacter(savedSelection, { persist: false });
    return;
  }
  const fallback = getFirstPlayableCharacter();
  if (fallback) {
    await setPlayerCharacter(fallback);
  }
}

function clampZoom(value) {
  if (!Number.isFinite(value)) {
    return ZOOM_DEFAULT;
  }
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

async function persistZoomSetting() {
  await persistSettingsPatch({ zoom: engine.zoom });
}

function applyZoom(options = {}) {
  if (!engine.map) {
    return;
  }
  resizeCanvasToViewport(engine.map);
  updateCamera();
  renderScene();
  if (options.persist) {
    persistZoomSetting();
  }
}

function changeZoom(delta, options = {}) {
  const nextZoom = clampZoom(engine.zoom + delta);
  if (nextZoom === engine.zoom) {
    return;
  }
  engine.zoom = nextZoom;
  if (engine.map) {
    applyZoom({ persist: options.persist !== false });
  } else if (options.persist !== false) {
    persistZoomSetting();
  }
}

function setZoom(level, options = {}) {
  const nextZoom = clampZoom(level);
  if (nextZoom === engine.zoom) {
    return;
  }
  engine.zoom = nextZoom;
  if (engine.map) {
    applyZoom({ persist: options.persist !== false });
  } else if (options.persist !== false) {
    persistZoomSetting();
  }
}

function initAudioState() {
  if (audioState.element) {
    return;
  }
  try {
    audioState.muted = window.localStorage?.getItem(AUDIO_STORAGE_KEY) === 'true';
  } catch (error) {
    console.warn('Unable to read audio preference:', error);
  }
  try {
    const audio = new Audio();
    audio.src = AMBIENT_TRACK_PATH;
    audio.loop = true;
    audio.volume = 0;
    audio.muted = audioState.muted;
    audioState.element = audio;
  } catch (error) {
    console.warn('Ambient audio init failed:', error.message);
  }
}

async function ensureAudioPlayback() {
  initAudioState();
  if (!audioState.element || audioState.ready) {
    return;
  }
  try {
    await audioState.element.play();
    audioState.ready = true;
  } catch (error) {
    console.warn('Ambient audio playback blocked:', error.message);
  }
}

function scheduleVolumeFade() {
  if (!audioState.element) {
    return;
  }
  if (audioState.fadeFrame) {
    cancelAnimationFrame(audioState.fadeFrame);
    audioState.fadeFrame = null;
  }
  const step = () => {
    if (!audioState.element) {
      return;
    }
    const diff = audioState.targetVolume - audioState.element.volume;
    if (Math.abs(diff) < 0.01) {
      audioState.element.volume = audioState.targetVolume;
      audioState.fadeFrame = null;
      return;
    }
    audioState.element.volume += diff * 0.15;
    audioState.fadeFrame = requestAnimationFrame(step);
  };
  audioState.fadeFrame = requestAnimationFrame(step);
}

function setAmbientScene(sceneName) {
  audioState.scene = sceneName;
  initAudioState();
  if (!audioState.element) {
    return;
  }
  const target = AMBIENT_SCENE_VOLUMES[sceneName] ?? 0.2;
  audioState.targetVolume = audioState.muted ? 0 : target;
  scheduleVolumeFade();
  ensureAudioPlayback();
}

function updateAudioButton() {
  if (!audioState.buttonEl) {
    return;
  }
  audioState.buttonEl.textContent = audioState.muted ? 'Audio: Off' : 'Audio: On';
  audioState.buttonEl.setAttribute('aria-pressed', String(!audioState.muted));
}

function toggleAudioMute() {
  initAudioState();
  if (!audioState.element) {
    return;
  }
  audioState.muted = !audioState.muted;
  audioState.element.muted = audioState.muted;
  try {
    window.localStorage?.setItem(AUDIO_STORAGE_KEY, audioState.muted ? 'true' : 'false');
  } catch (error) {
    console.warn('Unable to persist audio preference:', error);
  }
  updateAudioButton();
  setAmbientScene(audioState.scene);
}

function armAudioGesture() {
  const handler = () => {
    ensureAudioPlayback();
  };
  window.addEventListener('pointerdown', handler, { once: true, capture: true });
}

function updateHomeIntel() {
  if (!bootData) {
    return;
  }
  const world = bootData.selectedWorld || {};
  const map = bootData.currentMap || {};
  setText('home-world-name', world.name || 'Unknown Realm');
  setText('home-world-difficulty', world.difficulty || 'Uncharted');
  setText('home-world-biome', world.biome || 'Unknown biome');
  setText('home-world-summary', world.summary || 'Awaiting guild intel.');
  setText('home-map-name', map.name || 'Uncharted Sector');
  setText('home-map-difficulty', map.difficulty || 'Unknown difficulty');
  setText('home-map-threat', map.threat || 'Uncatalogued threat');
  setText('home-map-summary', map.summary || 'Awaiting recon packet.');
  setText('home-map-weather', map.weather || 'Weather data unavailable.');
  setText('home-map-terrain', world.biome || 'Unknown biome.');
  setText('home-map-recommendation', map.recommendation || 'Standard expedition kit.');
}

function getPlayableGenders() {
  if (!bootData?.characters) {
    return [];
  }
  return Object.keys(bootData.characters)
    .filter(gender => Array.isArray(bootData.characters[gender]) && bootData.characters[gender].length > 0)
    .sort((a, b) => a.localeCompare(b));
}

function getCharacterEntriesForGender(gender) {
  if (!gender || !bootData?.characters) {
    return [];
  }
  return bootData.characters[gender] || [];
}

function syncCharacterVariantOptions(preferredPath = characterState.lastSelectionPath) {
  const variants = getCharacterEntriesForGender(characterState.selectedGender);
  setSelectOptions(ui.selectCharacterVariant, variants, entry => entry.file, entry => entry.name);
  if (!variants.length) {
    if (ui.selectCharacterVariant) {
      ui.selectCharacterVariant.value = '';
    }
    characterState.currentSelection = null;
    updateCharacterConfirmState();
    return null;
  }
  let targetPath = preferredPath;
  if (!targetPath || !variants.some(entry => entry.file === targetPath)) {
    targetPath = variants[0].file;
  }
  if (ui.selectCharacterVariant) {
    ui.selectCharacterVariant.value = targetPath;
  }
  const match = variants.find(entry => entry.file === targetPath) || variants[0];
  characterState.currentSelection = match ? { ...match, gender: characterState.selectedGender } : null;
  updateCharacterConfirmState();
  return characterState.currentSelection;
}

function updateCharacterConfirmState() {
  if (ui.btnCharacterConfirm) {
    ui.btnCharacterConfirm.disabled = !characterState.currentSelection;
  }
}

async function prepareCharacterSelectionScene() {
  const genders = getPlayableGenders();
  if (!genders.length) {
    return false;
  }
  characterState.charactersByGender = bootData.characters;
  characterState.genders = genders;
  const preferredGender = characterState.selectedGender && genders.includes(characterState.selectedGender)
    ? characterState.selectedGender
    : (genders.includes('Female') ? 'Female' : genders[0]);
  characterState.selectedGender = preferredGender;
  setSelectOptions(ui.selectCharacterGender, genders, gender => gender, gender => gender);
  if (ui.selectCharacterGender) {
    ui.selectCharacterGender.value = characterState.selectedGender;
  }
  const selection = syncCharacterVariantOptions();
  if (!selection) {
    return false;
  }
  await updateCharacterPreview(selection);
  characterState.initialized = true;
  return true;
}

async function openCharacterSelectionScreen() {
  const prepared = await prepareCharacterSelectionScene();
  if (!prepared) {
    alert('No character sprites found in GameData/Characters/Female or Male.');
    return false;
  }
  setActiveScreen('character');
  startCharacterPreview();
  return true;
}

function getCurrentCharacterSelection() {
  if (characterState.currentSelection) {
    return characterState.currentSelection;
  }
  return getFirstPlayableCharacter();
}

function getSelectionFromVariantControl() {
  const gender = characterState.selectedGender;
  if (!gender) {
    return null;
  }
  const variants = getCharacterEntriesForGender(gender);
  if (!variants.length) {
    return null;
  }
  const selectedPath = getSelectedValue(ui.selectCharacterVariant);
  const entry = variants.find(item => item.file === selectedPath) || variants[0];
  return entry ? { ...entry, gender } : null;
}

function updateDirectionButtonState() {
  const buttons = characterState.preview.directionButtons || [];
  if (!buttons.length) {
    return;
  }
  for (const button of buttons) {
    const dir = button.dataset.characterDirection;
    button.classList.toggle('active', dir === characterState.preview.direction);
  }
}

function setCharacterPreviewDirection(direction) {
  if (!Object.prototype.hasOwnProperty.call(CHARACTER_DIRECTION_ROWS, direction)) {
    return;
  }
  characterState.preview.direction = direction;
  updateDirectionButtonState();
  updateCharacterPreviewCanvas();
}

function updateCharacterPreviewCanvas() {
  const preview = characterState.preview;
  if (!preview.ctx || !preview.canvas) {
    return;
  }
  updateDirectionButtonState();
  const ctx = preview.ctx;
  const canvas = preview.canvas;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  if (!preview.image) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.font = '14px "DM Sans", sans-serif';
    ctx.fillText('No sprite available', canvas.width / 2, canvas.height / 2);
    ctx.restore();
    return;
  }
  const destWidth = CHARACTER_FRAME_WIDTH * CHARACTER_PREVIEW_SCALE;
  const destHeight = CHARACTER_FRAME_HEIGHT * CHARACTER_PREVIEW_SCALE;
  const dx = Math.round((canvas.width - destWidth) / 2);
  const dy = Math.round((canvas.height - destHeight) / 2);
  drawCharacterFrame(ctx, preview.image, preview.frame, preview.direction, dx, dy, destWidth, destHeight);
  ctx.restore();
}

async function updateCharacterPreview(selection) {
  const preview = characterState.preview;
  if (!preview.canvas) {
    return;
  }
  if (!selection?.file) {
    preview.image = null;
    updateCharacterPreviewCanvas();
    return;
  }
  preview.pendingPath = selection.file;
  try {
    const image = await loadCharacterImage(selection.file);
    if (preview.pendingPath !== selection.file) {
      return;
    }
    preview.image = image;
    preview.frame = CHARACTER_IDLE_FRAME;
    preview.animTime = 0;
    updateCharacterPreviewCanvas();
  } catch (error) {
    console.warn('Character preview failed:', error.message || error);
  }
}

function characterPreviewStep(timestamp) {
  const preview = characterState.preview;
  if (!preview.canvas) {
    return;
  }
  if (!preview.lastTick) {
    preview.lastTick = timestamp;
  }
  const dt = Math.min((timestamp - preview.lastTick) / 1000, 0.25);
  preview.lastTick = timestamp;
  preview.animTime += dt;
  if (preview.animTime >= CHARACTER_ANIM_SPEED_MOVING) {
    preview.animTime = 0;
    preview.frame = (preview.frame + 1) % CHARACTER_ANIM_FRAMES;
  }
  updateCharacterPreviewCanvas();
  preview.raf = requestAnimationFrame(characterPreviewStep);
}

function startCharacterPreview() {
  const preview = characterState.preview;
  if (!preview.canvas || preview.raf) {
    return;
  }
  preview.lastTick = 0;
  preview.animTime = 0;
  updateCharacterPreviewCanvas();
  preview.raf = requestAnimationFrame(characterPreviewStep);
}

function stopCharacterPreview() {
  const preview = characterState.preview;
  if (preview.raf) {
    cancelAnimationFrame(preview.raf);
    preview.raf = null;
  }
}

async function handleCharacterConfirmClick() {
  if (!ui.btnCharacterConfirm) {
    return;
  }
  const selection = getCurrentCharacterSelection();
  if (!selection) {
    alert('No character sprite is available.');
    return;
  }
  ui.btnCharacterConfirm.disabled = true;
  try {
    setLoading('Deploying expedition crew...', 0.3);
    setActiveScreen('loading');
    await setPlayerCharacter(selection);
    await startGameFromBootData();
  } catch (error) {
    alert(error.message);
    setActiveScreen('character');
    startCharacterPreview();
  } finally {
    ui.btnCharacterConfirm.disabled = false;
  }
}

async function handleCharacterVariantChange() {
  const selection = getSelectionFromVariantControl();
  characterState.currentSelection = selection;
  if (selection?.file) {
    characterState.lastSelectionPath = selection.file;
  }
  updateCharacterConfirmState();
  await updateCharacterPreview(selection);
}

async function handleCharacterGenderChange() {
  if (!ui.selectCharacterGender) {
    return;
  }
  characterState.selectedGender = getSelectedValue(ui.selectCharacterGender) || characterState.selectedGender;
  const selection = syncCharacterVariantOptions();
  await updateCharacterPreview(selection);
}

function getEnemyCatalog() {
  if (!bootData || !Array.isArray(bootData.enemies)) {
    return [];
  }
  return bootData.enemies;
}

function buildPlayerCombatant() {
  const name = engine.character?.name || 'Operative';
  const rank = engine.character?.gender || 'Guild Agent';
  const stats = getPlayerCombatStats();
  return {
    id: 'player',
    name,
    rank,
    maxHp: stats.maxHp,
    hp: stats.maxHp,
    attack: stats.attack,
    defense: stats.defense,
    speed: stats.speed
  };
}

function cloneEnemy(template) {
  if (!template) {
    return null;
  }
  const maxHp = Number(template.hp) || 1;
  return {
    id: template.id || template.name,
    name: template.name || 'Unknown Foe',
    rank: template.rank || 'Unknown',
    threat: template.threat || '???',
    rewardExp: template.rewardExp || 0,
    rewardLoot: Array.isArray(template.rewardLoot) ? template.rewardLoot : [],
    maxHp,
    hp: maxHp,
    attack: Number(template.attack) || 1,
    defense: Number(template.defense) || 0,
    speed: Number(template.speed) || 1
  };
}

function pickRandomEnemy() {
  const catalog = getEnemyCatalog();
  if (!catalog.length) {
    return null;
  }
  const index = Math.floor(Math.random() * catalog.length);
  return catalog[index];
}

function formatHp(entity) {
  if (!entity) {
    return '--';
  }
  const current = Math.max(0, Math.floor(entity.hp));
  const total = Math.max(1, Math.floor(entity.maxHp));
  return `${current} / ${total}`;
}

function appendCombatLog(message) {
  if (!message) {
    return;
  }
  combatState.log.unshift({ id: Date.now() + Math.random(), message });
  if (combatState.log.length > COMBAT_LOG_LIMIT) {
    combatState.log.length = COMBAT_LOG_LIMIT;
  }
  renderCombatLog();
}

function renderCombatLog() {
  if (!combatUi.logList) {
    return;
  }
  combatUi.logList.innerHTML = '';
  for (const entry of combatState.log) {
    const li = document.createElement('li');
    li.textContent = entry.message;
    combatUi.logList.appendChild(li);
  }
}

function updateCombatActionStates() {
  const playersTurn = combatState.state === COMBAT_STATES.playerTurn;
  if (ui.btnCombatAttack) {
    ui.btnCombatAttack.disabled = !playersTurn;
  }
  if (ui.btnCombatDefend) {
    ui.btnCombatDefend.disabled = !playersTurn;
  }
  if (ui.btnCombatRetreat) {
    ui.btnCombatRetreat.disabled = !playersTurn;
  }
  if (ui.btnCombatContinue) {
    const finished = combatState.state === COMBAT_STATES.victory || combatState.state === COMBAT_STATES.defeat;
    ui.btnCombatContinue.style.display = finished ? 'inline-flex' : 'none';
  }
}

function updateCombatHud() {
  if (combatUi.playerName) {
    combatUi.playerName.textContent = combatState.player?.name || 'Operative';
  }
  if (combatUi.playerRank) {
    combatUi.playerRank.textContent = combatState.player?.rank || 'Guild Agent';
  }
  if (combatUi.playerHp) {
    combatUi.playerHp.textContent = formatHp(combatState.player);
  }
  if (combatUi.playerSpeed) {
    combatUi.playerSpeed.textContent = `${combatState.player?.speed ?? '--'}`;
  }
  if (combatUi.enemyName) {
    combatUi.enemyName.textContent = combatState.enemy?.name || 'Unknown';
  }
  if (combatUi.enemyRank) {
    combatUi.enemyRank.textContent = combatState.enemy?.rank || '??';
  }
  if (combatUi.enemyHp) {
    combatUi.enemyHp.textContent = formatHp(combatState.enemy);
  }
  if (combatUi.enemySpeed) {
    combatUi.enemySpeed.textContent = `${combatState.enemy?.speed ?? '--'}`;
  }
  if (combatUi.enemyThreat) {
    combatUi.enemyThreat.textContent = combatState.enemy?.threat || 'Threat data unavailable.';
  }
  if (combatUi.stateLabel) {
    let label = 'Awaiting orders';
    if (combatState.state === COMBAT_STATES.enemyTurn) {
      label = 'Enemy is acting...';
    } else if (combatState.state === COMBAT_STATES.playerTurn) {
      label = 'Select an action';
    } else if (combatState.state === COMBAT_STATES.victory) {
      label = 'Victory!';
    } else if (combatState.state === COMBAT_STATES.defeat) {
      label = 'Defeat';
    }
    combatUi.stateLabel.textContent = label;
  }
  updateCombatActionStates();
}

function computeDamage(attacker, defender, options = {}) {
  if (!attacker || !defender) {
    return 0;
  }
  const variance = Math.floor(Math.random() * 4);
  let dmg = Math.max(1, attacker.attack + variance - defender.defense);
  if (options.defenderGuard) {
    dmg = Math.max(1, dmg - PLAYER_GUARD_BONUS);
  }
  return dmg;
}

function checkBattleResolution() {
  if (combatState.enemy && combatState.enemy.hp <= 0) {
    combatState.enemy.hp = 0;
    combatState.state = COMBAT_STATES.victory;
    appendCombatLog(`You defeated the ${combatState.enemy.name}!`);
    updateCombatHud();
    return true;
  }
  if (combatState.player && combatState.player.hp <= 0) {
    combatState.player.hp = 0;
    combatState.state = COMBAT_STATES.defeat;
    appendCombatLog('You were overwhelmed. Retreat to regroup.');
    updateCombatHud();
    return true;
  }
  return false;
}

function enemyTurn() {
  if (combatState.state !== COMBAT_STATES.enemyTurn) {
    return;
  }
  const damage = computeDamage(combatState.enemy, combatState.player, { defenderGuard: combatState.guardActive });
  combatState.guardActive = false;
  combatState.player.hp -= damage;
  appendCombatLog(`${combatState.enemy.name} strikes for ${damage} dmg.`);
  if (checkBattleResolution()) {
    updateCombatHud();
    return;
  }
  combatState.state = COMBAT_STATES.playerTurn;
  updateCombatHud();
}

function queueEnemyTurn() {
  combatState.state = COMBAT_STATES.enemyTurn;
  updateCombatHud();
  setTimeout(enemyTurn, 600);
}

function handleCombatAttack() {
  if (combatState.state !== COMBAT_STATES.playerTurn) {
    return;
  }
  const damage = computeDamage(combatState.player, combatState.enemy);
  combatState.enemy.hp -= damage;
  appendCombatLog(`You slash ${combatState.enemy.name} for ${damage} dmg.`);
  if (checkBattleResolution()) {
    updateCombatHud();
    return;
  }
  queueEnemyTurn();
}

function handleCombatDefend() {
  if (combatState.state !== COMBAT_STATES.playerTurn) {
    return;
  }
  combatState.guardActive = true;
  appendCombatLog('You brace for impact, raising aether shield.');
  queueEnemyTurn();
}

function handleCombatRetreat() {
  if (combatState.state !== COMBAT_STATES.playerTurn) {
    return;
  }
  appendCombatLog('You disengage and fall back to the map.');
  combatState.state = COMBAT_STATES.idle;
  updateCombatHud();
  returnToExploration();
}

function handleCombatContinue() {
  if (combatState.state === COMBAT_STATES.enemyTurn) {
    return;
  }
  returnToExploration();
}

function resetCombatEncounter(enemyInstance) {
  combatState.player = buildPlayerCombatant();
  combatState.enemy = enemyInstance;
  combatState.state = COMBAT_STATES.playerTurn;
  combatState.log = [];
  combatState.guardActive = false;
  combatState.active = true;
  appendCombatLog(`A ${combatState.enemy.name} approaches!`);
  updateCombatHud();
}

function startCombatEncounter(explicitEnemy) {
  if (combatState.active && combatState.state !== COMBAT_STATES.idle) {
    return;
  }
  const availableEnemies = getEnemyCatalog();
  if (!availableEnemies.length) {
    alert('No enemy data found. Add entries under GameData/Enemies/enemies.json');
    return;
  }
  const template = explicitEnemy || pickRandomEnemy();
  const enemyInstance = cloneEnemy(template);
  if (!enemyInstance) {
    alert('Unable to start encounter: invalid enemy data.');
    return;
  }
  closeDialogueOverlay({ silent: true });
  hideNpcHint();
  closeInventoryOverlay({ silent: true });
  stopRenderLoop();
  resetCombatEncounter(enemyInstance);
  renderCombatLog();
  setActiveScreen('combat');
}

function returnToExploration() {
  combatState.active = false;
  combatState.state = COMBAT_STATES.idle;
  updateCombatHud();
  setActiveScreen('game');
  updateStatus(bootData?.selectedWorld, bootData?.currentMap);
  startRenderLoop();
  updateNpcProximity();
}

function syncNpcsForCurrentMap() {
  if (!bootData?.npcs) {
    npcState.active = [];
    return;
  }
  const worldName = bootData.selectedWorld?.name;
  const mapFileName = bootData.currentMap?.fileName;
  if (!worldName || !mapFileName) {
    npcState.active = [];
    return;
  }
  npcState.active = bootData.npcs.filter(npc => npc.world === worldName && npc.map === mapFileName);
}

function drawNpcs(ctx) {
  if (!npcState.active.length) {
    return;
  }
  const cameraX = engine.camera.x || 0;
  const cameraY = engine.camera.y || 0;
  const viewportWidth = engine.camera.width || 0;
  const viewportHeight = engine.camera.height || 0;
  const zoom = engine.zoom || 1;
  for (const npc of npcState.active) {
    const x = Number(npc?.position?.x);
    const y = Number(npc?.position?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    const dx = x - cameraX;
    const dy = y - cameraY;
    if (dx < -NPC_INTERACT_RADIUS || dy < -NPC_INTERACT_RADIUS || dx > viewportWidth + NPC_INTERACT_RADIUS || dy > viewportHeight + NPC_INTERACT_RADIUS) {
      continue;
    }
    const screenX = Math.round(dx * zoom);
    const screenY = Math.round(dy * zoom);
    const markerRadius = Math.max(4, Math.round((npc.markerRadius ?? NPC_MARKER_RADIUS) * zoom));
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = npc.markerColor || 'rgba(142, 240, 255, 0.9)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(screenX, screenY, markerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `${Math.max(10, Math.round(12 * zoom))}px "DM Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(npc.name || 'NPC', screenX, screenY - markerRadius - 6);
    ctx.restore();
  }
}

function distanceBetweenPoints(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
}

function hideNpcHint() {
  if (dialogueUi.interactHint) {
    dialogueUi.interactHint.classList.remove('visible');
    dialogueUi.interactHint.setAttribute('aria-hidden', 'true');
  }
  if (dialogueUi.interactButton) {
    dialogueUi.interactButton.disabled = true;
  }
}

function refreshNpcHint() {
  const npc = npcState.nearbyNpc;
  const shouldShow = Boolean(npc && !dialogueState.active && document.body?.getAttribute('data-screen') === 'game');
  if (!shouldShow) {
    hideNpcHint();
    return;
  }
  if (dialogueUi.interactHint) {
    dialogueUi.interactHint.classList.add('visible');
    dialogueUi.interactHint.setAttribute('aria-hidden', 'false');
  }
  if (dialogueUi.interactName) {
    dialogueUi.interactName.textContent = npc.name || 'Guild Ally';
  }
  if (dialogueUi.interactButton) {
    dialogueUi.interactButton.disabled = false;
  }
}

function setNearbyNpc(npc) {
  if (npcState.nearbyNpc === npc) {
    return;
  }
  npcState.nearbyNpc = npc;
  refreshNpcHint();
}

function updateNpcProximity() {
  if (!engine.map || !engine.player.spawned) {
    setNearbyNpc(null);
    return;
  }
  if (document.body?.getAttribute('data-screen') !== 'game') {
    setNearbyNpc(null);
    return;
  }
  if (!npcState.active.length) {
    setNearbyNpc(null);
    return;
  }
  const playerX = engine.player.x;
  const playerY = engine.player.y;
  let closest = null;
  let bestDistance = Infinity;
  for (const npc of npcState.active) {
    const x = Number(npc?.position?.x);
    const y = Number(npc?.position?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    const radius = Number(npc.radius) || NPC_INTERACT_RADIUS;
    const distance = distanceBetweenPoints(playerX, playerY, x, y);
    if (distance <= radius && distance < bestDistance) {
      closest = npc;
      bestDistance = distance;
    }
  }
  setNearbyNpc(closest);
}

function attemptNpcInteraction() {
  if (dialogueState.active) {
    return;
  }
  if (!npcState.nearbyNpc) {
    return;
  }
  const npc = npcState.nearbyNpc;
  if (!Array.isArray(npc.dialogue) || !npc.dialogue.length) {
    console.warn(`NPC ${npc.name || npc.id} has no dialogue nodes.`);
    return;
  }
  openDialogueWithNpc(npc);
}

function findDialogueNode(npc, nodeId) {
  if (!npc || !Array.isArray(npc.dialogue)) {
    return null;
  }
  if (nodeId) {
    const match = npc.dialogue.find(node => node.id === nodeId);
    if (match) {
      return match;
    }
  }
  return npc.dialogue[0] || null;
}

function openDialogueWithNpc(npc) {
  const preferred = findDialogueNode(npc, 'root');
  const node = preferred || findDialogueNode(npc);
  if (!node) {
    console.warn(`NPC ${npc.name || npc.id} has no valid dialogue nodes.`);
    return;
  }
  dialogueState.active = true;
  dialogueState.npc = npc;
  dialogueState.node = node;
  engine.keys.clear();
  updateDialogueOverlayVisibility();
  renderDialogueNode(node);
  hideNpcHint();
}

function renderDialogueNode(node) {
  dialogueState.node = node;
  processQuestDialogueNode(node);
  if (dialogueUi.speaker) {
    dialogueUi.speaker.textContent = node?.speaker || dialogueState.npc?.name || 'Unknown NPC';
  }
  if (dialogueUi.role) {
    dialogueUi.role.textContent = dialogueState.npc?.role || '';
  }
  if (dialogueUi.text) {
    dialogueUi.text.textContent = node?.text || '';
  }
  if (dialogueUi.choices) {
    dialogueUi.choices.innerHTML = '';
    const choices = Array.isArray(node?.choices) && node.choices.length
      ? node.choices
      : [{ label: 'End dialogue', next: 'end' }];
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = choice.next === 'end' ? 'btn-ghost' : 'btn-secondary';
      button.textContent = choice.label || 'Continue';
      button.addEventListener('click', () => handleDialogueChoice(choice));
      dialogueUi.choices.appendChild(button);
    }
  }
}

function handleDialogueChoice(choice) {
  if (!dialogueState.active) {
    return;
  }
  const nextId = choice?.next;
  if (!nextId || nextId === 'end') {
    closeDialogueOverlay();
    return;
  }
  const nextNode = findDialogueNode(dialogueState.npc, nextId);
  if (!nextNode) {
    closeDialogueOverlay();
    return;
  }
  renderDialogueNode(nextNode);
}

function closeDialogueOverlay(options = {}) {
  const wasActive = dialogueState.active;
  dialogueState.active = false;
  dialogueState.npc = null;
  dialogueState.node = null;
  if (dialogueUi.choices) {
    dialogueUi.choices.innerHTML = '';
  }
  updateDialogueOverlayVisibility();
  if (!options.silent && wasActive) {
    updateNpcProximity();
  }
}

function updateDialogueOverlayVisibility() {
  if (dialogueUi.overlay) {
    dialogueUi.overlay.classList.toggle('visible', dialogueState.active);
    dialogueUi.overlay.setAttribute('aria-hidden', String(!dialogueState.active));
  }
  if (document.body) {
    document.body.classList.toggle('dialogue-open', dialogueState.active);
  }
}

function getItemDefinition(itemId) {
  if (!itemId) {
    return null;
  }
  return inventoryState.itemsById.get(itemId) || null;
}

function normalizeInventoryEntries(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const output = [];
  for (const entry of entries) {
    const id = entry?.id;
    const qty = Number(entry?.quantity) || 0;
    if (!id || qty <= 0 || !getItemDefinition(id)) {
      continue;
    }
    const existing = output.find(item => item.id === id);
    if (existing) {
      existing.quantity += qty;
    } else {
      output.push({ id, quantity: qty });
    }
  }
  return output;
}

function normalizeEquipment(equipment = {}) {
  const normalized = {};
  for (const slot of INVENTORY_SLOTS) {
    const candidate = equipment?.[slot] || null;
    const def = getItemDefinition(candidate);
    normalized[slot] = def && def.slot === slot ? def.id : null;
  }
  return normalized;
}

function buildStarterInventory() {
  const starters = [];
  for (const item of inventoryState.catalog) {
    const qty = Number(item?.starterQuantity) || 0;
    if (qty > 0) {
      starters.push({ id: item.id, quantity: qty });
    }
  }
  return starters;
}

function ensureEquippedItemsAvailable() {
  for (const slot of INVENTORY_SLOTS) {
    const equippedId = inventoryState.equipment[slot];
    if (!equippedId) {
      continue;
    }
    const def = getItemDefinition(equippedId);
    const hasStack = inventoryState.items.some(entry => entry.id === equippedId);
    if (!def || def.slot !== slot || !hasStack) {
      inventoryState.equipment[slot] = null;
    }
  }
}

function hydrateInventoryStateFromBootData() {
  inventoryState.catalog = Array.isArray(bootData?.items) ? bootData.items : [];
  inventoryState.itemsById = new Map(inventoryState.catalog.map(item => [item.id, item]));
  const savedInventory = bootData?.settings?.inventory || {};
  const starterItems = buildStarterInventory();
  const savedItems = normalizeInventoryEntries(savedInventory.items);
  const usingStarterLoadout = !savedItems.length && starterItems.length > 0;
  inventoryState.items = savedItems.length ? savedItems : starterItems;
  inventoryState.equipment = normalizeEquipment(savedInventory.equipment);
  ensureEquippedItemsAvailable();
  if (!inventoryState.selectedItemId && inventoryState.items[0]) {
    inventoryState.selectedItemId = inventoryState.items[0].id;
  }
  recomputePlayerDerivedStats();
  renderEquipmentSlots();
  renderInventoryList();
  renderInventoryDetail();
  if (usingStarterLoadout) {
    persistInventoryState();
  }
}

function persistInventoryState() {
  const payload = {
    inventory: {
      items: inventoryState.items.map(entry => ({ id: entry.id, quantity: entry.quantity })),
      equipment: { ...inventoryState.equipment }
    }
  };
  return persistSettingsPatch(payload).catch(error => console.warn('Failed to persist inventory:', error));
}

function toggleInventoryOverlay() {
  if (inventoryState.open) {
    closeInventoryOverlay();
  } else {
    openInventoryOverlay();
  }
}

function openInventoryOverlay() {
  if (inventoryState.open) {
    return;
  }
  inventoryState.open = true;
  updateInventoryOverlayVisibility();
}

function closeInventoryOverlay(options = {}) {
  if (!inventoryState.open && !options.force) {
    return;
  }
  inventoryState.open = false;
  updateInventoryOverlayVisibility();
}

function updateInventoryOverlayVisibility() {
  if (inventoryUi.overlay) {
    inventoryUi.overlay.classList.toggle('visible', inventoryState.open);
    inventoryUi.overlay.setAttribute('aria-hidden', String(!inventoryState.open));
  }
  if (document.body) {
    document.body.classList.toggle('inventory-open', inventoryState.open);
  }
}

function getEquipmentBonuses() {
  const totals = {
    maxHp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    movement: 0
  };
  for (const slot of INVENTORY_SLOTS) {
    const equippedId = inventoryState.equipment[slot];
    const def = getItemDefinition(equippedId);
    if (!def) {
      continue;
    }
    totals.maxHp += Number(def.maxHpBonus) || 0;
    totals.attack += Number(def.attackBonus) || 0;
    totals.defense += Number(def.defenseBonus) || 0;
    totals.speed += Number(def.speedBonus) || 0;
    totals.movement += Number(def.movementBonus) || 0;
  }
  return totals;
}

function getPlayerCombatStats() {
  const bonuses = getEquipmentBonuses();
  return {
    maxHp: BASE_PLAYER_COMBAT_STATS.maxHp + bonuses.maxHp,
    attack: BASE_PLAYER_COMBAT_STATS.attack + bonuses.attack,
    defense: BASE_PLAYER_COMBAT_STATS.defense + bonuses.defense,
    speed: BASE_PLAYER_COMBAT_STATS.speed + bonuses.speed
  };
}

function recomputePlayerDerivedStats() {
  const bonuses = getEquipmentBonuses();
  engine.player.speed = BASE_PLAYER_MOVEMENT_SPEED + bonuses.movement;
  engine.player.maxStamina = PLAYER_MAX_STAMINA;
  engine.player.stamina = Math.min(engine.player.maxStamina, engine.player.stamina ?? engine.player.maxStamina);
  updateStaminaHud();
  if (combatState.player) {
    const ratio = combatState.player.maxHp > 0 ? combatState.player.hp / combatState.player.maxHp : 1;
    const freshStats = getPlayerCombatStats();
    combatState.player.maxHp = Math.max(1, freshStats.maxHp);
    combatState.player.attack = Math.max(1, freshStats.attack);
    combatState.player.defense = Math.max(0, freshStats.defense);
    combatState.player.speed = Math.max(1, freshStats.speed);
    combatState.player.hp = Math.min(combatState.player.maxHp, Math.round(combatState.player.maxHp * ratio));
    updateCombatHud();
  }
}

function selectInventoryItem(itemId) {
  if (!itemId) {
    inventoryState.selectedItemId = null;
    renderInventoryDetail();
    renderInventoryList();
    return;
  }
  const def = getItemDefinition(itemId);
  if (!def) {
    inventoryState.selectedItemId = null;
  } else {
    inventoryState.selectedItemId = def.id;
  }
  renderInventoryDetail();
  renderInventoryList();
}

function renderInventoryList() {
  if (!inventoryUi.list) {
    return;
  }
  inventoryUi.list.innerHTML = '';
  if (!inventoryState.items.length) {
    const empty = document.createElement('p');
    empty.className = 'inventory-empty';
    empty.textContent = 'Your pack is empty.';
    inventoryUi.list.appendChild(empty);
    return;
  }
  for (const entry of inventoryState.items) {
    const def = getItemDefinition(entry.id);
    if (!def) {
      continue;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inventory-item';
    if (entry.id === inventoryState.selectedItemId) {
      button.classList.add('selected');
    }
    const label = document.createElement('span');
    label.textContent = def.name || def.id;
    const qty = document.createElement('span');
    qty.className = 'inventory-qty';
    qty.textContent = `×${entry.quantity}`;
    button.appendChild(label);
    button.appendChild(qty);
    button.addEventListener('click', () => selectInventoryItem(entry.id));
    inventoryUi.list.appendChild(button);
  }
  if (!inventoryState.selectedItemId && inventoryState.items[0]) {
    inventoryState.selectedItemId = inventoryState.items[0].id;
    renderInventoryDetail();
  }
}

function updateEquipmentSlotLabel(slot, itemId) {
  const el = inventoryUi.equipmentSlots?.[slot];
  if (!el) {
    return;
  }
  const def = getItemDefinition(itemId);
  el.textContent = def?.name || 'None equipped';
}

function renderEquipmentSlots() {
  for (const slot of INVENTORY_SLOTS) {
    updateEquipmentSlotLabel(slot, inventoryState.equipment[slot]);
  }
}

function formatItemBonus(def) {
  const parts = [];
  if (def.attackBonus) {
    parts.push(`+${def.attackBonus} ATK`);
  }
  if (def.defenseBonus) {
    parts.push(`+${def.defenseBonus} DEF`);
  }
  if (def.speedBonus) {
    parts.push(`+${def.speedBonus} SPD`);
  }
  if (def.maxHpBonus) {
    parts.push(`+${def.maxHpBonus} HP`);
  }
  if (def.movementBonus) {
    const prefix = def.movementBonus > 0 ? '+' : '';
    parts.push(`${prefix}${def.movementBonus} MOVE`);
  }
  if (def.healAmount) {
    parts.push(`Heals ${def.healAmount} HP`);
  }
  return parts.length ? parts.join(' • ') : 'No bonuses';
}

function renderInventoryDetail() {
  const def = getItemDefinition(inventoryState.selectedItemId);
  if (inventoryUi.detailName) {
    inventoryUi.detailName.textContent = def?.name || 'Select an item';
  }
  if (inventoryUi.detailDescription) {
    inventoryUi.detailDescription.textContent = def?.description || 'Choose an item to inspect its properties.';
  }
  if (inventoryUi.detailMeta) {
    if (!def) {
      inventoryUi.detailMeta.textContent = '';
    } else {
      const parts = [def.type ? def.type.charAt(0).toUpperCase() + def.type.slice(1) : 'Item'];
      if (def.rarity) {
        parts.push(def.rarity);
      }
      if (def.slot) {
        parts.push(`Slot: ${def.slot}`);
      }
      if (def.slot && inventoryState.equipment[def.slot] === def.id) {
        parts.push('Equipped');
      }
      inventoryUi.detailMeta.textContent = parts.join(' • ');
    }
  }
  if (inventoryUi.detailStats) {
    inventoryUi.detailStats.textContent = def ? formatItemBonus(def) : '';
  }
  if (inventoryUi.detailActions) {
    inventoryUi.detailActions.innerHTML = '';
    if (!def) {
      return;
    }
    if (def.slot) {
      const equipped = inventoryState.equipment[def.slot] === def.id;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = equipped ? 'btn-ghost' : 'btn-secondary';
      button.textContent = equipped ? 'Unequip' : 'Equip';
      button.addEventListener('click', () => {
        if (equipped) {
          unequipSlot(def.slot);
        } else {
          equipSelectedItem();
        }
      });
      inventoryUi.detailActions.appendChild(button);
    } else if (def.type === 'consumable') {
      const useButton = document.createElement('button');
      useButton.type = 'button';
      useButton.className = 'btn-primary';
      useButton.textContent = 'Use';
      useButton.addEventListener('click', () => useSelectedConsumable());
      const stack = inventoryState.items.find(entry => entry.id === def.id);
      useButton.disabled = !stack;
      inventoryUi.detailActions.appendChild(useButton);
    }
  }
}

function ensureInventoryEntry(itemId) {
  let entry = inventoryState.items.find(item => item.id === itemId);
  if (!entry) {
    entry = { id: itemId, quantity: 0 };
    inventoryState.items.push(entry);
  }
  return entry;
}

function adjustInventoryQuantity(itemId, delta) {
  const entry = ensureInventoryEntry(itemId);
  entry.quantity += delta;
  if (entry.quantity <= 0) {
    const index = inventoryState.items.indexOf(entry);
    if (index >= 0) {
      inventoryState.items.splice(index, 1);
    }
    if (inventoryState.selectedItemId === itemId) {
      inventoryState.selectedItemId = inventoryState.items[0]?.id || null;
    }
  }
}

function equipSelectedItem() {
  const def = getItemDefinition(inventoryState.selectedItemId);
  if (!def?.slot) {
    return;
  }
  inventoryState.equipment[def.slot] = def.id;
  renderEquipmentSlots();
  renderInventoryDetail();
  recomputePlayerDerivedStats();
  persistInventoryState();
}

function unequipSlot(slot) {
  if (!INVENTORY_SLOTS.includes(slot)) {
    return;
  }
  if (!inventoryState.equipment[slot]) {
    return;
  }
  inventoryState.equipment[slot] = null;
  renderEquipmentSlots();
  renderInventoryDetail();
  recomputePlayerDerivedStats();
  persistInventoryState();
}

function useSelectedConsumable() {
  const def = getItemDefinition(inventoryState.selectedItemId);
  if (!def || def.type !== 'consumable') {
    return;
  }
  const stack = inventoryState.items.find(entry => entry.id === def.id);
  if (!stack || stack.quantity <= 0) {
    return;
  }
  applyConsumableEffect(def);
  adjustInventoryQuantity(def.id, -1);
  renderInventoryList();
  renderInventoryDetail();
  persistInventoryState();
}

function applyConsumableEffect(itemDef) {
  if (itemDef.healAmount && combatState.player && combatState.state !== COMBAT_STATES.defeat) {
    const before = combatState.player.hp;
    combatState.player.hp = Math.min(combatState.player.maxHp, combatState.player.hp + itemDef.healAmount);
    const healed = combatState.player.hp - before;
    if (healed > 0) {
      appendCombatLog(`${itemDef.name || 'Consumable'} restores ${healed} HP.`);
      updateCombatHud();
    }
    return;
  }
  console.info('Consumable used outside combat:', itemDef.name || itemDef.id);
}

function getQuestDefinition(questId) {
  if (!questId) {
    return null;
  }
  return questState.catalog.find(entry => entry.id === questId) || null;
}

function getQuestProgress(questId) {
  if (!questId) {
    return null;
  }
  if (!questState.progress.has(questId)) {
    questState.progress.set(questId, {
      status: QUEST_STATUSES.notStarted,
      completedObjectives: new Set()
    });
  }
  return questState.progress.get(questId);
}

function hydrateQuestStateFromBootData() {
  questState.catalog = Array.isArray(bootData?.quests) ? bootData.quests : [];
  questState.progress = new Map();
  const saved = bootData?.settings?.quests || {};
  const savedProgress = saved.progress || {};
  for (const quest of questState.catalog) {
    const entry = savedProgress[quest.id] || {};
    const completed = new Set(Array.isArray(entry.completedObjectives) ? entry.completedObjectives : []);
    let status = entry.status;
    const objectiveList = Array.isArray(quest.objectives) ? quest.objectives : [];
    if (!status) {
      if (completed.size && objectiveList.length && objectiveList.every(obj => completed.has(obj.id))) {
        status = QUEST_STATUSES.completed;
      } else if (completed.size) {
        status = QUEST_STATUSES.inProgress;
      } else {
        status = QUEST_STATUSES.notStarted;
      }
    }
    questState.progress.set(quest.id, {
      status,
      completedObjectives: completed
    });
  }
  const hasQuest = questId => questState.catalog.some(entry => entry.id === questId);
  const savedTracked = saved.trackedQuestId && hasQuest(saved.trackedQuestId) ? saved.trackedQuestId : null;
  const firstAvailable = questState.catalog.find(quest => {
    const state = questState.progress.get(quest.id);
    return state?.status !== QUEST_STATUSES.completed;
  });
  const autoTracked = questState.catalog.find(quest => quest.autoTrack && questState.progress.get(quest.id)?.status !== QUEST_STATUSES.completed);
  questState.trackedQuestId = savedTracked
    || autoTracked?.id
    || firstAvailable?.id
    || questState.catalog[0]?.id
    || null;
  questState.selectedQuestId = questState.trackedQuestId || firstAvailable?.id || questState.catalog[0]?.id || null;
  renderQuestLog();
  renderQuestDetail();
  updateQuestHud();
}

function buildQuestSettingsPayload() {
  const progressPayload = {};
  for (const [questId, entry] of questState.progress.entries()) {
    progressPayload[questId] = {
      status: entry.status,
      completedObjectives: Array.from(entry.completedObjectives)
    };
  }
  return {
    progress: progressPayload,
    trackedQuestId: questState.trackedQuestId
  };
}

function persistQuestState() {
  const questsPayload = buildQuestSettingsPayload();
  return persistSettingsPatch({
    quests: questsPayload
  }).catch(error => console.warn('Failed to persist quest state:', error));
}

function getQuestNextObjective(quest) {
  if (!quest) {
    return null;
  }
  const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
  const progress = getQuestProgress(quest.id);
  if (!progress) {
    return null;
  }
  return objectives.find(obj => !progress.completedObjectives.has(obj.id)) || null;
}

function updateQuestHud() {
  if (!questUi.hudTitle || !questUi.hudObjective) {
    return;
  }
  const trackedQuest = getQuestDefinition(questState.trackedQuestId);
  if (!trackedQuest) {
    questUi.hudTitle.textContent = 'No quest tracked';
    questUi.hudObjective.textContent = 'Select a quest from the log to track progress.';
    updateStatus();
    return;
  }
  const progress = getQuestProgress(trackedQuest.id);
  questUi.hudTitle.textContent = trackedQuest.name || 'Tracked Quest';
  if (progress?.status === QUEST_STATUSES.completed) {
    questUi.hudObjective.textContent = 'Completed — return to the guild for debrief.';
    updateStatus();
    return;
  }
  const nextObjective = getQuestNextObjective(trackedQuest);
  questUi.hudObjective.textContent = nextObjective?.description || trackedQuest.summary || 'Advance the objective to proceed.';
  updateStatus();
}

function updateStaminaHud() {
  const player = engine.player;
  if (!player) {
    return;
  }
  const max = Math.max(1, player.maxStamina || PLAYER_MAX_STAMINA);
  const value = Math.max(0, Math.min(max, player.stamina ?? max));
  const ratio = value / max;
  if (staminaUi.fill) {
    staminaUi.fill.style.width = `${Math.round(ratio * 100)}%`;
    staminaUi.fill.classList.toggle('low', ratio < 0.25);
  }
  if (staminaUi.readout) {
    const descriptor = player.resting ? ' (Resting)' : ratio < 0.1 ? ' (Exhausted)' : '';
    staminaUi.readout.textContent = `Stamina ${Math.round(value)} / ${Math.round(max)}${descriptor}`;
  }
  if (staminaUi.bar) {
    staminaUi.bar.setAttribute('aria-valuenow', String(Math.round(value)));
    staminaUi.bar.setAttribute('aria-valuemax', String(Math.round(max)));
    if (player.resting) {
      staminaUi.bar.setAttribute('aria-valuetext', 'Resting to recover stamina');
    } else if (ratio < 0.1) {
      staminaUi.bar.setAttribute('aria-valuetext', 'Exhausted');
    } else {
      staminaUi.bar.removeAttribute('aria-valuetext');
    }
  }
  if (staminaUi.card) {
    staminaUi.card.classList.toggle('depleted', ratio < 0.1);
    staminaUi.card.classList.toggle('resting', player.resting && ratio < 0.99);
  }
}

function buildQuestStatusLabel(status) {
  switch (status) {
    case QUEST_STATUSES.completed:
      return 'Completed';
    case QUEST_STATUSES.inProgress:
      return 'In Progress';
    default:
      return 'Not Started';
  }
}

function renderQuestLog() {
  if (!questUi.list) {
    return;
  }
  questUi.list.innerHTML = '';
  if (!questState.catalog.length) {
    const empty = document.createElement('p');
    empty.className = 'quest-empty';
    empty.textContent = 'No quests available.';
    questUi.list.appendChild(empty);
    return;
  }
  const trackedQuestId = questState.trackedQuestId;
  for (const quest of questState.catalog) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quest-item';
    if (quest.id === questState.selectedQuestId) {
      button.classList.add('selected');
    }
     const isTracked = quest.id === trackedQuestId;
     if (isTracked) {
       button.classList.add('tracked');
     }
    const title = document.createElement('span');
    title.textContent = quest.name || quest.id;
    const status = document.createElement('span');
    status.className = 'quest-status';
    const questProgress = getQuestProgress(quest.id);
    const baseStatus = buildQuestStatusLabel(questProgress?.status);
    status.textContent = isTracked ? `Tracked • ${baseStatus}` : baseStatus;
    button.appendChild(title);
    button.appendChild(status);
    button.addEventListener('click', () => selectQuest(quest.id));
    questUi.list.appendChild(button);
  }
}

function renderQuestDetail() {
  if (!questUi.detailTitle || !questUi.detailSummary || !questUi.detailMeta || !questUi.detailObjectives || !questUi.detailActions) {
    return;
  }
  const quest = getQuestDefinition(questState.selectedQuestId);
  if (!quest) {
    questUi.detailTitle.textContent = 'Select a quest';
    questUi.detailSummary.textContent = 'Choose a quest from the list to view objectives and status.';
    questUi.detailMeta.textContent = '';
    questUi.detailObjectives.innerHTML = '';
    questUi.detailActions.innerHTML = '';
    return;
  }
  const progress = getQuestProgress(quest.id);
  questUi.detailTitle.textContent = quest.name || quest.id;
  questUi.detailSummary.textContent = quest.summary || 'Advance this quest to progress the storyline.';
  const metaBits = [];
  if (quest.giver) {
    metaBits.push(`Giver: ${quest.giver}`);
  }
  if (quest.world) {
    metaBits.push(`World: ${quest.world}`);
  }
  if (quest.map) {
    metaBits.push(`Map: ${quest.map}`);
  }
  questUi.detailMeta.textContent = metaBits.join(' • ');
  questUi.detailObjectives.innerHTML = '';
  const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
  for (const objective of objectives) {
    const li = document.createElement('li');
    li.className = 'quest-objective';
    const completed = progress?.completedObjectives?.has(objective.id);
    li.classList.toggle('completed', Boolean(completed));
    const bullet = document.createElement('span');
    bullet.className = 'quest-objective-status';
    bullet.textContent = completed ? '✓' : '•';
    const text = document.createElement('p');
    text.textContent = objective.description || objective.id;
    li.appendChild(bullet);
    li.appendChild(text);
    questUi.detailObjectives.appendChild(li);
  }
  questUi.detailActions.innerHTML = '';
  if (progress?.status !== QUEST_STATUSES.completed) {
    if (questState.trackedQuestId !== quest.id) {
      const trackButton = document.createElement('button');
      trackButton.type = 'button';
      trackButton.className = 'btn-secondary';
      trackButton.textContent = 'Track Quest';
      trackButton.addEventListener('click', () => setTrackedQuest(quest.id));
      questUi.detailActions.appendChild(trackButton);
    } else {
      const trackedTag = document.createElement('span');
      trackedTag.className = 'quest-tracking-tag';
      trackedTag.textContent = 'Currently Tracked';
      questUi.detailActions.appendChild(trackedTag);
    }
  } else {
    const completeTag = document.createElement('span');
    completeTag.className = 'quest-tracking-tag';
    completeTag.textContent = 'Quest Completed';
    questUi.detailActions.appendChild(completeTag);
  }
}

function selectQuest(questId) {
  questState.selectedQuestId = questId;
  renderQuestLog();
  renderQuestDetail();
}

function setTrackedQuest(questId) {
  if (!questId) {
    return;
  }
  questState.trackedQuestId = questId;
  if (!questState.selectedQuestId) {
    questState.selectedQuestId = questId;
  }
  renderQuestLog();
  updateQuestHud();
  renderQuestDetail();
  persistQuestState();
}

function showQuestToast(message) {
  if (!questUi.toast) {
    return;
  }
  questUi.toast.textContent = message;
  questUi.toast.classList.add('visible');
  if (questUi.toastTimer) {
    clearTimeout(questUi.toastTimer);
  }
  questUi.toastTimer = setTimeout(() => {
    questUi.toast?.classList.remove('visible');
    questUi.toastTimer = null;
  }, 3200);
}

function grantQuestRewards(quest) {
  const rewards = quest?.rewards;
  if (!rewards) {
    return;
  }
  const items = Array.isArray(rewards.items) ? rewards.items : [];
  let granted = false;
  for (const reward of items) {
    const def = getItemDefinition(reward.id);
    if (!def) {
      continue;
    }
    const qty = Number(reward.quantity) || 1;
    adjustInventoryQuantity(def.id, qty);
    granted = true;
  }
  if (granted) {
    renderInventoryList();
    renderInventoryDetail();
    persistInventoryState();
  }
}

function handleQuestCompletion(quest) {
  if (!quest) {
    return;
  }
  showQuestToast(`Quest complete: ${quest.name || quest.id}`);
  grantQuestRewards(quest);
}

function markQuestObjectiveComplete(questId, objectiveId, options = {}) {
  const quest = getQuestDefinition(questId);
  if (!quest || !objectiveId) {
    return false;
  }
  const objective = Array.isArray(quest.objectives) ? quest.objectives.find(obj => obj.id === objectiveId) : null;
  if (!objective) {
    return false;
  }
  const progress = getQuestProgress(questId);
  if (!progress || progress.completedObjectives.has(objectiveId)) {
    return false;
  }
  progress.completedObjectives.add(objectiveId);
  if (progress.status === QUEST_STATUSES.notStarted) {
    progress.status = QUEST_STATUSES.inProgress;
  }
  const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
  const allComplete = objectives.length > 0 && objectives.every(obj => progress.completedObjectives.has(obj.id));
  questState.progress.set(questId, progress);
  if (!questState.trackedQuestId) {
    questState.trackedQuestId = questId;
  }
  if (allComplete) {
    progress.status = QUEST_STATUSES.completed;
    handleQuestCompletion(quest);
  } else if (options.announce !== false && objective.description) {
    showQuestToast(`Objective complete: ${objective.description}`);
  }
  renderQuestLog();
  renderQuestDetail();
  updateQuestHud();
  persistQuestState();
  return true;
}

function processQuestDialogueNode(node) {
  if (!node || !dialogueState.npc?.id || !questState.catalog.length) {
    return;
  }
  for (const quest of questState.catalog) {
    const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
    for (const objective of objectives) {
      if (objective.type !== 'dialogue') {
        continue;
      }
      if (objective.npcId === dialogueState.npc.id && (!objective.nodeId || objective.nodeId === node.id)) {
        markQuestObjectiveComplete(quest.id, objective.id);
      }
    }
  }
}

function processQuestLocationObjectives() {
  if (!questState.catalog.length || document.body?.getAttribute('data-screen') !== 'game' || !engine.player?.spawned) {
    return;
  }
  const worldName = bootData?.selectedWorld?.name;
  const mapFile = bootData?.currentMap?.fileName;
  if (!worldName || !mapFile) {
    return;
  }
  for (const quest of questState.catalog) {
    const progress = getQuestProgress(quest.id);
    if (progress?.status === QUEST_STATUSES.completed) {
      continue;
    }
    const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
    for (const objective of objectives) {
      if (objective.type !== 'location') {
        continue;
      }
      if (progress.completedObjectives.has(objective.id)) {
        continue;
      }
      if (objective.world && objective.world !== worldName) {
        continue;
      }
      if (objective.map && objective.map !== mapFile) {
        continue;
      }
      const targetX = Number(objective.x);
      const targetY = Number(objective.y);
      if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
        continue;
      }
      const radius = Math.max(10, Number(objective.radius) || 90);
      const distance = distanceBetweenPoints(engine.player.x, engine.player.y, targetX, targetY);
      if (distance <= radius) {
        markQuestObjectiveComplete(quest.id, objective.id);
      }
    }
  }
}

function toggleQuestOverlay() {
  if (questState.open) {
    closeQuestOverlay();
  } else {
    openQuestOverlay();
  }
}

function openQuestOverlay() {
  if (questState.open) {
    return;
  }
  questState.open = true;
  if (!questState.selectedQuestId) {
    questState.selectedQuestId = questState.trackedQuestId || questState.catalog[0]?.id || null;
  }
  renderQuestLog();
  renderQuestDetail();
  updateQuestOverlayVisibility();
}

function closeQuestOverlay(options = {}) {
  if (!questState.open && !options.force) {
    return;
  }
  questState.open = false;
  updateQuestOverlayVisibility();
}

function updateQuestOverlayVisibility() {
  if (questUi.overlay) {
    questUi.overlay.classList.toggle('visible', questState.open);
    questUi.overlay.setAttribute('aria-hidden', String(!questState.open));
  }
  if (document.body) {
    document.body.classList.toggle('quest-open', questState.open);
  }
}

function formatTimestamp(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return 'Never';
  }
  const date = new Date(timestamp);
  try {
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (error) {
    return date.toISOString();
  }
}

function getSaveSlotDefinition(slotId) {
  return SAVE_SLOT_DEFS.find(def => def.id === slotId) || null;
}

function getSaveSlotEntry(slotId) {
  return saveState.slots.find(entry => entry.slotId === slotId) || { slotId, savedAt: null, data: null };
}

function canSaveCurrentSession() {
  return Boolean(
    engine.player?.spawned
    && bootData?.selectedWorld?.name
    && bootData?.currentMap?.fileName
    && engine.character?.file
  );
}

function buildSaveSnapshot() {
  if (!canSaveCurrentSession()) {
    throw new Error('You must be on the expedition map before saving.');
  }
  const playerPayload = {
    x: Math.round(engine.player.x),
    y: Math.round(engine.player.y),
    direction: engine.player.direction || 'down',
    stamina: Math.round(engine.player.stamina ?? engine.player.maxStamina ?? PLAYER_MAX_STAMINA)
  };
  return {
    version: 1,
    savedAt: Date.now(),
    worldName: bootData.selectedWorld.name,
    worldDifficulty: bootData.selectedWorld.difficulty,
    mapFileName: bootData.currentMap.fileName,
    mapName: bootData.currentMap.name,
    mapDifficulty: bootData.currentMap.difficulty,
    mapThreat: bootData.currentMap.threat,
    characterPath: engine.character.file,
    characterName: engine.character.name,
    inventory: {
      items: inventoryState.items.map(entry => ({ id: entry.id, quantity: entry.quantity })),
      equipment: { ...inventoryState.equipment }
    },
    quests: buildQuestSettingsPayload(),
    player: playerPayload,
    zoom: engine.zoom
  };
}

function updateSavesSubtitle() {
  if (!saveUi.subtitle) {
    return;
  }
  const latest = getLatestSaveSlot();
  if (latest?.savedAt) {
    saveUi.subtitle.textContent = `Last save: ${formatTimestamp(latest.savedAt)}`;
  } else {
    saveUi.subtitle.textContent = 'No expedition saves recorded yet.';
  }
}

function renderSaveSlots() {
  if (!saveUi.list) {
    return;
  }
  saveUi.list.innerHTML = '';
  for (const def of SAVE_SLOT_DEFS) {
    const slot = getSaveSlotEntry(def.id);
    const card = document.createElement('article');
    card.className = 'save-slot-card';
    if (saveState.busySlotId === def.id || saveState.refreshing) {
      card.classList.add('busy');
    }
    const title = document.createElement('h3');
    title.className = 'save-slot-title';
    title.textContent = def.label;
    card.appendChild(title);

    if (slot.data) {
      const meta = document.createElement('div');
      meta.className = 'save-slot-meta';
      const operative = document.createElement('strong');
      operative.textContent = slot.data.characterName || 'Operative';
      const location = document.createElement('span');
      const worldLabel = slot.data.worldName || 'Unknown world';
      const mapLabel = slot.data.mapName || slot.data.mapFileName || 'Unknown map';
      location.textContent = `${worldLabel} — ${mapLabel}`;
      const difficulty = document.createElement('span');
      difficulty.textContent = slot.data.mapDifficulty || slot.data.worldDifficulty || '';
      const timestamp = document.createElement('span');
      timestamp.className = 'save-slot-timestamp';
      timestamp.textContent = formatTimestamp(slot.savedAt);
      meta.appendChild(operative);
      meta.appendChild(location);
      if (difficulty.textContent) {
        meta.appendChild(difficulty);
      }
      meta.appendChild(timestamp);
      card.appendChild(meta);
    } else {
      const empty = document.createElement('p');
      empty.className = 'save-slot-empty';
      empty.textContent = 'No data stored in this slot.';
      card.appendChild(empty);
    }

    const actions = document.createElement('div');
    actions.className = 'save-slot-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'btn-primary';
    saveBtn.textContent = slot.data ? 'Overwrite with current run' : 'Save current run';
    saveBtn.disabled = !canSaveCurrentSession();
    saveBtn.addEventListener('click', () => handleSaveSlot(def.id));
    actions.appendChild(saveBtn);

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.className = 'btn-secondary';
    loadBtn.textContent = 'Load';
    loadBtn.disabled = !slot.data;
    loadBtn.addEventListener('click', () => handleLoadSlot(def.id));
    actions.appendChild(loadBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-ghost';
    deleteBtn.textContent = 'Delete';
    deleteBtn.disabled = !slot.data;
    deleteBtn.addEventListener('click', () => handleDeleteSlot(def.id));
    actions.appendChild(deleteBtn);

    card.appendChild(actions);
    saveUi.list.appendChild(card);
  }
  if (saveUi.refreshBtn) {
    saveUi.refreshBtn.disabled = saveState.refreshing;
  }
}

async function refreshSaveSlots(options = {}) {
  if (!window.amgis || typeof window.amgis.listSaves !== 'function') {
    return;
  }
  try {
    saveState.refreshing = true;
    if (!options.silent) {
      renderSaveSlots();
    }
    const response = await window.amgis.listSaves();
    if (!response.ok) {
      throw new Error(response.error || 'Unable to list saves.');
    }
    const incoming = Array.isArray(response.data) ? response.data : [];
    saveState.slots = SAVE_SLOT_DEFS.map(def => incoming.find(slot => slot.slotId === def.id) || { slotId: def.id, savedAt: null, data: null });
    updateSavesSubtitle();
    renderSaveSlots();
  } catch (error) {
    if (!options.silent) {
      alert(error.message);
    } else {
      console.warn('Save refresh failed:', error.message);
    }
  } finally {
    saveState.refreshing = false;
    renderSaveSlots();
  }
}

async function handleSaveSlot(slotId) {
  if (!window.amgis || typeof window.amgis.saveSlot !== 'function') {
    alert('Save API unavailable.');
    return;
  }
  try {
    saveState.busySlotId = slotId;
    renderSaveSlots();
    const snapshot = buildSaveSnapshot();
    const response = await window.amgis.saveSlot(slotId, snapshot);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to write save.');
    }
    await refreshSaveSlots({ silent: true });
  } catch (error) {
    alert(error.message);
  } finally {
    saveState.busySlotId = null;
    renderSaveSlots();
  }
}

async function handleLoadSlot(slotId) {
  const slot = getSaveSlotEntry(slotId);
  if (!slot?.data) {
    alert('This slot does not contain a save yet.');
    return;
  }
  try {
    saveState.busySlotId = slotId;
    renderSaveSlots();
    await loadSaveSnapshot(slot.data);
  } catch (error) {
    alert(error.message);
  } finally {
    saveState.busySlotId = null;
    renderSaveSlots();
  }
}

async function handleDeleteSlot(slotId) {
  const slot = getSaveSlotEntry(slotId);
  if (!slot?.data) {
    return;
  }
  if (!window.confirm('Delete this save? This action cannot be undone.')) {
    return;
  }
  if (!window.amgis || typeof window.amgis.deleteSave !== 'function') {
    alert('Delete API unavailable.');
    return;
  }
  try {
    saveState.busySlotId = slotId;
    renderSaveSlots();
    const response = await window.amgis.deleteSave(slotId);
    if (!response.ok) {
      throw new Error(response.error || 'Failed to delete save.');
    }
    await refreshSaveSlots({ silent: true });
  } catch (error) {
    alert(error.message);
  } finally {
    saveState.busySlotId = null;
    renderSaveSlots();
  }
}

function getLatestSaveSlot() {
  let latest = null;
  for (const slot of saveState.slots) {
    if (!slot?.data || !Number.isFinite(slot.savedAt)) {
      continue;
    }
    if (!latest || slot.savedAt > latest.savedAt) {
      latest = slot;
    }
  }
  return latest;
}

async function continueFromLatestSave() {
  let latest = getLatestSaveSlot();
  if (!latest?.data) {
    await refreshSaveSlots({ silent: true });
    latest = getLatestSaveSlot();
  }
  if (!latest?.data) {
    throw new Error('No saves available yet. Create a save from the expedition screen.');
  }
  await loadSaveSnapshot(latest.data);
}

async function loadSaveSnapshot(snapshot) {
  if (!snapshot) {
    throw new Error('Save data missing.');
  }
  const worldName = snapshot.worldName;
  const mapFileName = snapshot.mapFileName;
  if (!worldName || !mapFileName) {
    throw new Error('Save is missing world or map data.');
  }
  const worldMeta = (bootData.worlds || []).find(world => world.name === worldName);
  if (!worldMeta) {
    throw new Error(`World "${worldName}" is not available in this build.`);
  }
  await populateMapsForWorld(worldName, mapFileName);
  const maps = bootData.mapsByWorld?.[worldName] || [];
  const mapMeta = maps.find(map => map.fileName === mapFileName);
  if (!mapMeta) {
    throw new Error(`Map "${mapFileName}" could not be found.`);
  }
  if (!window.amgis || typeof window.amgis.loadMap !== 'function') {
    throw new Error('Map loading API unavailable.');
  }
  const mapResponse = await window.amgis.loadMap(worldName, mapFileName);
  if (!mapResponse.ok) {
    throw new Error(mapResponse.error || 'Failed to load map for save.');
  }
  bootData.selectedWorld = worldMeta;
  bootData.currentMap = { ...mapMeta, ...mapResponse.data };
  bootData.settings = bootData.settings || {};
  bootData.settings.inventory = snapshot.inventory || { items: [], equipment: {} };
  bootData.settings.quests = snapshot.quests || { progress: {}, trackedQuestId: null };
  if (snapshot.characterPath) {
    bootData.settings.lastCharacterPath = snapshot.characterPath;
  }
  hydrateInventoryStateFromBootData();
  hydrateQuestStateFromBootData();
  if (snapshot.characterPath) {
    const selection = findCharacterByPath(snapshot.characterPath);
    if (selection) {
      await setPlayerCharacter(selection, { persist: false });
    }
  } else {
    await ensurePlayerCharacterSelected();
  }
  await loadMapIntoEngine(bootData.currentMap, { resetPlayer: false });
  if (Number.isFinite(snapshot.zoom)) {
    setZoom(snapshot.zoom, { persist: false });
  }
  if (snapshot.player) {
    if (Number.isFinite(snapshot.player.x)) {
      engine.player.x = snapshot.player.x;
    }
    if (Number.isFinite(snapshot.player.y)) {
      engine.player.y = snapshot.player.y;
    }
    if (snapshot.player.direction && Object.prototype.hasOwnProperty.call(CHARACTER_DIRECTION_ROWS, snapshot.player.direction)) {
      engine.player.direction = snapshot.player.direction;
    }
    if (Number.isFinite(snapshot.player.stamina)) {
      const max = engine.player.maxStamina || PLAYER_MAX_STAMINA;
      engine.player.stamina = Math.max(0, Math.min(max, snapshot.player.stamina));
    }
  }
  const { width, height } = getMapPixelDimensions(bootData.currentMap);
  const radius = engine.player.radius || 0;
  engine.player.x = Math.min(Math.max(engine.player.x, radius), Math.max(radius, width - radius));
  engine.player.y = Math.min(Math.max(engine.player.y, radius), Math.max(radius, height - radius));
  engine.player.spawned = true;
  recomputePlayerDerivedStats();
  updateCamera();
  renderScene();
  syncNpcsForCurrentMap();
  updateNpcProximity();
  updateStatus(bootData.selectedWorld, bootData.currentMap);
  updateQuestHud();
  setActiveScreen('game');
  startRenderLoop();
}

async function openSavesScreen() {
  setActiveScreen('saves');
  await refreshSaveSlots();
}

function initializeEngine() {
  if (engine.canvas) {
    return;
  }
  engine.canvas = document.getElementById('map');
  engine.ctx = engine.canvas.getContext('2d');
  engine.ctx.imageSmoothingEnabled = false;
  engine.statusEl = document.getElementById('game-status');
  window.addEventListener('keydown', event => handleKey(event, true));
  window.addEventListener('keyup', event => handleKey(event, false));
  window.addEventListener('resize', handleWindowResize);
}

function getMapPixelDimensions(mapData) {
  if (!mapData) {
    return { width: 0, height: 0 };
  }
  return {
    width: mapData.gridWidth * mapData.tileWidth,
    height: mapData.gridHeight * mapData.tileHeight
  };
}

function resizeCanvasToViewport(mapData) {
  if (!engine.canvas || !engine.ctx || !mapData) {
    return;
  }
  const { width: mapWidth, height: mapHeight } = getMapPixelDimensions(mapData);
  if (!mapWidth || !mapHeight) {
    return;
  }
  const availableWidth = Math.max(320, window.innerWidth || mapWidth);
  const availableHeight = Math.max(240, window.innerHeight || mapHeight);
  const screenWidth = Math.min(mapWidth, availableWidth);
  const screenHeight = Math.min(mapHeight, availableHeight);
  engine.canvas.style.width = `${screenWidth}px`;
  engine.canvas.style.height = `${screenHeight}px`;
  engine.canvas.width = screenWidth;
  engine.canvas.height = screenHeight;
  engine.ctx.imageSmoothingEnabled = false;
  engine.viewport.width = screenWidth;
  engine.viewport.height = screenHeight;
  const worldWidth = Math.max(1, Math.min(mapWidth, Math.round(screenWidth / engine.zoom)));
  const worldHeight = Math.max(1, Math.min(mapHeight, Math.round(screenHeight / engine.zoom)));
  engine.camera.width = worldWidth;
  engine.camera.height = worldHeight;
}

function updateCamera() {
  if (!engine.map) {
    engine.camera.x = 0;
    engine.camera.y = 0;
    return;
  }
  const { width: mapWidth, height: mapHeight } = getMapPixelDimensions(engine.map);
  const viewportWidth = engine.camera.width || engine.canvas?.width || mapWidth;
  const viewportHeight = engine.camera.height || engine.canvas?.height || mapHeight;
  const halfWidth = viewportWidth / 2;
  const halfHeight = viewportHeight / 2;
  const maxX = Math.max(0, mapWidth - viewportWidth);
  const maxY = Math.max(0, mapHeight - viewportHeight);
  let camX = engine.player.x - halfWidth;
  let camY = engine.player.y - halfHeight;
  if (!engine.player.spawned) {
    camX = 0;
    camY = 0;
  }
  engine.camera.x = Math.min(Math.max(camX, 0), maxX);
  engine.camera.y = Math.min(Math.max(camY, 0), maxY);
}

function handleWindowResize() {
  if (!engine.map) {
    return;
  }
  resizeCanvasToViewport(engine.map);
  updateCamera();
  renderScene();
}

function shouldLayerBlock(layer) {
  if (!layer) {
    return false;
  }
  const props = layer.properties || {};
  if (props.collides === true || props.block === true || props.nonwalkable === true) {
    return true;
  }
  if (props.walkable === false) {
    return true;
  }
  const name = (layer.name || '').toLowerCase();
  return BLOCKING_LAYER_HINTS.some(keyword => name.includes(keyword));
}

function buildCollisionGrid(mapData) {
  const gridWidth = mapData?.gridWidth ?? mapData?.layers?.[0]?.gridWidth ?? 0;
  const gridHeight = mapData?.gridHeight ?? mapData?.layers?.[0]?.gridHeight ?? 0;
  const tileWidth = mapData?.tileWidth ?? mapData?.layers?.[0]?.tileWidth ?? 0;
  const tileHeight = mapData?.tileHeight ?? mapData?.layers?.[0]?.tileHeight ?? 0;
  if (!gridWidth || !gridHeight || !tileWidth || !tileHeight) {
    return { blocked: null, gridWidth: 0, gridHeight: 0, tileWidth: 0, tileHeight: 0 };
  }
  const size = gridWidth * gridHeight;
  const blocked = new Uint8Array(size);
  const layers = Array.isArray(mapData?.layers) ? mapData.layers : [];
  for (const layer of layers) {
    if (!shouldLayerBlock(layer)) {
      continue;
    }
    const tiles = Array.isArray(layer.tiles) ? layer.tiles : [];
    const limit = Math.min(tiles.length, size);
    for (let index = 0; index < limit; index++) {
      if (tiles[index] > 0) {
        blocked[index] = 1;
      }
    }
  }
  return {
    blocked,
    gridWidth,
    gridHeight,
    tileWidth,
    tileHeight
  };
}

function isTileBlockedAt(col, row) {
  const collision = engine.collision;
  if (!collision?.blocked) {
    return false;
  }
  if (col < 0 || row < 0 || col >= collision.gridWidth || row >= collision.gridHeight) {
    return true;
  }
  const index = row * collision.gridWidth + col;
  return collision.blocked[index] === 1;
}

function collidesAt(worldX, worldY, radius = engine.player?.radius || 0) {
  const collision = engine.collision;
  if (!collision?.blocked || !collision.tileWidth || !collision.tileHeight) {
    return false;
  }
  const sampleRadius = Math.max(0, radius - 1);
  const samples = sampleRadius > 0
    ? [
        [worldX, worldY],
        [worldX - sampleRadius, worldY],
        [worldX + sampleRadius, worldY],
        [worldX, worldY - sampleRadius],
        [worldX, worldY + sampleRadius],
        [worldX - sampleRadius, worldY - sampleRadius],
        [worldX + sampleRadius, worldY - sampleRadius],
        [worldX - sampleRadius, worldY + sampleRadius],
        [worldX + sampleRadius, worldY + sampleRadius]
      ]
    : [[worldX, worldY]];
  for (const [sampleX, sampleY] of samples) {
    const col = Math.floor(sampleX / collision.tileWidth);
    const row = Math.floor(sampleY / collision.tileHeight);
    if (isTileBlockedAt(col, row)) {
      return true;
    }
  }
  return false;
}

const KEY_BINDINGS = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right'
};

function handleKey(event, pressed) {
  const key = event.key.toLowerCase();
  if (key === 'escape' && pressed) {
    if (dialogueState.active) {
      event.preventDefault();
      closeDialogueOverlay();
      return;
    }
    if (inventoryState.open) {
      event.preventDefault();
      closeInventoryOverlay();
      return;
    }
    if (questState.open) {
      event.preventDefault();
      closeQuestOverlay();
      return;
    }
  }
  if (key === 'e' && pressed) {
    event.preventDefault();
    if (!dialogueState.active && document.body?.getAttribute('data-screen') === 'game') {
      attemptNpcInteraction();
    }
    return;
  }
  if (key === 'i' && pressed) {
    event.preventDefault();
    toggleInventoryOverlay();
    return;
  }
  if (key === 'q' && pressed) {
    event.preventDefault();
    toggleQuestOverlay();
    return;
  }
  if (pressed) {
    if (key === '=' || key === '+') {
      event.preventDefault();
      changeZoom(ZOOM_STEP);
      return;
    }
    if (key === '-' || key === '_') {
      event.preventDefault();
      changeZoom(-ZOOM_STEP);
      return;
    }
    if (key === '0') {
      event.preventDefault();
      setZoom(ZOOM_DEFAULT);
      return;
    }
  }
  if (key === 'shift') {
    event.preventDefault();
    if (pressed) {
      engine.keys.add('sprint');
    } else {
      engine.keys.delete('sprint');
    }
    return;
  }

  if (key === 'r') {
    event.preventDefault();
    if (pressed) {
      engine.keys.add('rest');
    } else {
      engine.keys.delete('rest');
    }
    return;
  }

  const action = KEY_BINDINGS[key];
  if ((dialogueState.active || inventoryState.open || questState.open) && action) {
    event.preventDefault();
    if (!pressed) {
      engine.keys.delete(action);
    }
    return;
  }
  if (!action) {
    return;
  }
  event.preventDefault();
  if (pressed) {
    engine.keys.add(action);
  } else {
    engine.keys.delete(action);
  }
}

function startRenderLoop() {
  if (engine.running) {
    return;
  }
  engine.running = true;
  engine.lastTime = performance.now();
  requestAnimationFrame(renderLoop);
}

function stopRenderLoop() {
  engine.running = false;
  engine.keys.clear();
}

function renderLoop(timestamp) {
  if (!engine.running) {
    return;
  }
  const dt = Math.min((timestamp - engine.lastTime) / 1000, 0.1);
  engine.lastTime = timestamp;
  updatePlayer(dt);
  updateCamera();
  renderScene();
  updateNpcProximity();
  requestAnimationFrame(renderLoop);
}

function updatePlayer(dt) {
  if (!engine.map) {
    return;
  }
  const player = engine.player;
  const maxStamina = Math.max(1, player.maxStamina || PLAYER_MAX_STAMINA);
  let stamina = Math.max(0, Math.min(maxStamina, player.stamina ?? maxStamina));
  if (dialogueState.active || inventoryState.open || questState.open) {
    player.moving = false;
    player.animFrame = CHARACTER_IDLE_FRAME;
    player.animTime = 0;
    player.sprinting = false;
    player.resting = false;
    stamina = Math.min(maxStamina, stamina + PLAYER_STAMINA_REGEN_PER_SECOND * dt);
    player.stamina = stamina;
    updateStaminaHud();
    return;
  }
  const wasMoving = player.moving;
  let moveX = 0;
  let moveY = 0;
  if (engine.keys.has('left')) {
    moveX -= 1;
  }
  if (engine.keys.has('right')) {
    moveX += 1;
  }
  if (engine.keys.has('up')) {
    moveY -= 1;
  }
  if (engine.keys.has('down')) {
    moveY += 1;
  }
  const inputX = moveX;
  const inputY = moveY;
  let movedThisFrame = false;
  const sprintIntent = engine.keys.has('sprint');
  const sprintEligible = sprintIntent && stamina > PLAYER_STAMINA_SPRINT_THRESHOLD;
  const restIntent = engine.keys.has('rest');
  const resting = restIntent && !moveX && !moveY;

  if (resting) {
    moveX = 0;
    moveY = 0;
  }

  if (inputX || inputY) {
    const length = Math.hypot(inputX, inputY) || 1;
    const normX = inputX / length;
    const normY = inputY / length;
    const appliedSpeed = player.speed * (sprintEligible ? PLAYER_SPRINT_MULTIPLIER : 1);
    const deltaX = normX * appliedSpeed * dt;
    const deltaY = normY * appliedSpeed * dt;
    const width = engine.map.gridWidth * engine.map.tileWidth;
    const height = engine.map.gridHeight * engine.map.tileHeight;
    const radius = player.radius;
    const minX = radius;
    const maxX = Math.max(radius, width - radius);
    const minY = radius;
    const maxY = Math.max(radius, height - radius);
    const clampX = value => Math.min(Math.max(value, minX), maxX);
    const clampY = value => Math.min(Math.max(value, minY), maxY);

    if (deltaX) {
      const nextX = clampX(player.x + deltaX);
      if (!collidesAt(nextX, player.y) && Math.abs(nextX - player.x) > 0.001) {
        player.x = nextX;
        movedThisFrame = true;
      }
    }
    if (deltaY) {
      const nextY = clampY(player.y + deltaY);
      if (!collidesAt(player.x, nextY) && Math.abs(nextY - player.y) > 0.001) {
        player.y = nextY;
        movedThisFrame = true;
      }
    }

    if (Math.abs(normX) > Math.abs(normY)) {
      player.direction = normX > 0 ? 'right' : 'left';
    } else if (normY !== 0) {
      player.direction = normY > 0 ? 'down' : 'up';
    }
  }
  player.moving = movedThisFrame;
  player.sprinting = sprintEligible && player.moving;
  player.resting = resting && !player.moving;
  if (player.moving && !wasMoving) {
    player.animFrame = 0;
    player.animTime = 0;
  }
  if ((!player.moving && wasMoving) || player.resting) {
    player.animFrame = CHARACTER_IDLE_FRAME;
    player.animTime = 0;
  }
  if (player.sprinting) {
    stamina = Math.max(0, stamina - PLAYER_STAMINA_DRAIN_PER_SECOND * dt);
  } else {
    let regenScale = player.moving ? PLAYER_STAMINA_REGEN_MOVING_SCALE : 1;
    if (player.resting) {
      regenScale = PLAYER_STAMINA_REST_MULTIPLIER;
    }
    stamina = Math.min(maxStamina, stamina + PLAYER_STAMINA_REGEN_PER_SECOND * regenScale * dt);
  }
  player.stamina = stamina;
  if (stamina <= 0 && sprintIntent) {
    engine.keys.delete('sprint');
  }
  updatePlayerAnimation(dt);
  updateStaminaHud();
  processQuestLocationObjectives();
}

function updatePlayerAnimation(dt) {
  const player = engine.player;
  if (!player) {
    return;
  }
  let speed = player.moving ? CHARACTER_ANIM_SPEED_MOVING : CHARACTER_ANIM_SPEED_IDLE;
  if (player.moving && player.sprinting) {
    speed = Math.max(0.05, speed / PLAYER_SPRINT_MULTIPLIER);
  }
  player.animTime += dt;
  if (!player.moving) {
    if (player.animFrame !== CHARACTER_IDLE_FRAME) {
      player.animFrame = CHARACTER_IDLE_FRAME;
    }
    if (player.animTime >= speed) {
      player.animTime = 0;
    }
    return;
  }
  if (player.animTime >= speed) {
    player.animTime = 0;
    player.animFrame = (player.animFrame + 1) % CHARACTER_ANIM_FRAMES;
  }
}

function renderScene() {
  if (!engine.map || !engine.ctx) {
    return;
  }
  const usingTilesets = Array.isArray(engine.map.tilesets) && engine.map.tilesets.length > 0;
  if (usingTilesets && (!engine.tilesetImages || engine.tilesetImages.size === 0)) {
    return;
  }
  if (!usingTilesets && !engine.spriteImg) {
    return;
  }
  const ctx = engine.ctx;
  ctx.clearRect(0, 0, engine.canvas.width, engine.canvas.height);
  drawLayers(ctx, engine.map);
  drawNpcs(ctx);
  drawPlayer(ctx);
}

function resolveTilesetForGid(gid, tilesets) {
  let match = null;
  for (const tileset of tilesets) {
    if (gid >= tileset.firstgid) {
      const maxGid = tileset.tilecount ? tileset.firstgid + tileset.tilecount : Infinity;
      if (gid < maxGid && (!match || tileset.firstgid >= match.firstgid)) {
        match = tileset;
      }
    }
  }
  return match;
}

function drawLayers(ctx, mapData) {
  const layers = Array.isArray(mapData.layers) && mapData.layers.length
    ? mapData.layers
    : [{
        tileWidth: mapData.tileWidth,
        tileHeight: mapData.tileHeight,
        gridWidth: mapData.gridWidth,
        gridHeight: mapData.gridHeight,
        tiles: mapData.tiles
      }];
  const usingTilesets = Array.isArray(mapData.tilesets) && mapData.tilesets.length > 0;
  const cameraX = engine.camera.x || 0;
  const cameraY = engine.camera.y || 0;
  const viewportWidth = engine.camera.width || 0;
  const viewportHeight = engine.camera.height || 0;
  if (!viewportWidth || !viewportHeight) {
    return;
  }
  const zoom = engine.zoom || 1;

  for (const layer of layers) {
    const tileWidth = layer.tileWidth;
    const tileHeight = layer.tileHeight;
    if (!tileWidth || !tileHeight) {
      continue;
    }
    const startCol = Math.max(0, Math.floor(cameraX / tileWidth));
    const endCol = Math.min(layer.gridWidth, Math.ceil((cameraX + viewportWidth) / tileWidth));
    const startRow = Math.max(0, Math.floor(cameraY / tileHeight));
    const endRow = Math.min(layer.gridHeight, Math.ceil((cameraY + viewportHeight) / tileHeight));

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const index = row * layer.gridWidth + col;
        const tile = layer.tiles[index];
        const isEmptyTile = tile === undefined || tile === null || tile < 0 || (usingTilesets && tile === 0);
        if (isEmptyTile) {
          continue;
        }
        const worldX = col * tileWidth;
        const worldY = row * tileHeight;
        const dx = Math.round((worldX - cameraX) * zoom);
        const dy = Math.round((worldY - cameraY) * zoom);
        const destWidth = Math.ceil(tileWidth * zoom);
        const destHeight = Math.ceil(tileHeight * zoom);

        if (usingTilesets) {
          const tileset = resolveTilesetForGid(tile, mapData.tilesets);
          if (!tileset) {
            continue;
          }
          const image = engine.tilesetImages?.get(tileset.image);
          if (!image) {
            continue;
          }
          const sourceTileWidth = tileset.tileWidth || tileWidth;
          const sourceTileHeight = tileset.tileHeight || tileHeight;
          const columns = tileset.columns || Math.max(1, Math.floor((tileset.imageWidth || sourceTileWidth) / sourceTileWidth));
          const localId = tile - tileset.firstgid;
          const sx = (localId % columns) * sourceTileWidth;
          const sy = Math.floor(localId / columns) * sourceTileHeight;
          ctx.drawImage(
            image,
            sx,
            sy,
            sourceTileWidth,
            sourceTileHeight,
            dx,
            dy,
            destWidth,
            destHeight
          );
        } else {
          if (tile < 0 || !engine.spriteImg) {
            continue;
          }
          const sx = (tile % TILES_PER_ROW) * tileWidth;
          const sy = Math.floor(tile / TILES_PER_ROW) * tileHeight;
          ctx.drawImage(
            engine.spriteImg,
            sx,
            sy,
            tileWidth,
            tileHeight,
            dx,
            dy,
            destWidth,
            destHeight
          );
        }
      }
    }
  }
}

function drawPlayer(ctx) {
  const cameraX = engine.camera.x || 0;
  const cameraY = engine.camera.y || 0;
  const viewportWidth = engine.camera.width || 0;
  const viewportHeight = engine.camera.height || 0;
  const zoom = engine.zoom || 1;
  const px = (engine.player.x - cameraX);
  const py = (engine.player.y - cameraY);
  if (px + engine.player.radius < 0 || py + engine.player.radius < 0 || px - engine.player.radius > viewportWidth || py - engine.player.radius > viewportHeight) {
    return;
  }
  const screenX = Math.round(px * zoom);
  const screenY = Math.round(py * zoom);
  const sprite = engine.character?.image;
  if (sprite) {
    const destWidth = Math.ceil(CHARACTER_FRAME_WIDTH * zoom);
    const destHeight = Math.ceil(CHARACTER_FRAME_HEIGHT * zoom);
    const drawX = Math.round(screenX - destWidth / 2);
    const drawY = Math.round(screenY - destHeight / 2);
    const frameIndex = engine.player.moving ? engine.player.animFrame : CHARACTER_IDLE_FRAME;
    drawCharacterFrame(ctx, sprite, frameIndex, engine.player.direction, drawX, drawY, destWidth, destHeight);
    return;
  }
  const radius = Math.max(2, Math.round(engine.player.radius * zoom));
  ctx.save();
  ctx.fillStyle = '#ff3b30';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

async function loadMapIntoEngine(mapData, options = {}) {
  initializeEngine();
  const tilesets = Array.isArray(mapData.tilesets) ? mapData.tilesets.filter(ts => ts && ts.image) : [];
  const uniqueSources = [...new Set(tilesets.map(ts => ts.image))];
  engine.tilesetImages = new Map();
  let spriteImg = null;
  if (uniqueSources.length) {
    const loaded = await Promise.all(uniqueSources.map(async source => [source, await waitForImage(source)]));
    for (const [source, image] of loaded) {
      engine.tilesetImages.set(source, image);
    }
    spriteImg = loaded[0]?.[1] || null;
  } else if (mapData.spriteSheet) {
    spriteImg = await waitForImage(mapData.spriteSheet);
  }
  engine.map = mapData;
  engine.spriteImg = spriteImg;
  engine.collision = buildCollisionGrid(mapData);
  const { width, height } = getMapPixelDimensions(mapData);
  resizeCanvasToViewport(mapData);
  const resetPlayer = options.resetPlayer ?? true;
  if (resetPlayer || !engine.player.spawned) {
    const spawn = mapData.spawn;
    if (spawn && Number.isFinite(spawn.x) && Number.isFinite(spawn.y)) {
      engine.player.x = spawn.x;
      engine.player.y = spawn.y;
    } else {
      engine.player.x = width / 2;
      engine.player.y = height / 2;
    }
    engine.player.spawned = true;
  }
  engine.player.radius = Math.max(4, Math.min(mapData.tileWidth, mapData.tileHeight) / 2 - 2);
  engine.player.stamina = engine.player.maxStamina || PLAYER_MAX_STAMINA;
  engine.player.resting = false;
  updateCamera();
  renderScene();
  updateStaminaHud();
}

function updateStatus(world, map) {
  if (!engine.statusEl) {
    return;
  }
  const activeWorld = world ?? bootData?.selectedWorld;
  const activeMap = map ?? bootData?.currentMap;
  const sections = [];
  if (activeWorld?.name) {
    const worldBits = [`World: ${activeWorld.name}`];
    if (activeWorld.difficulty) {
      worldBits.push(`Difficulty: ${activeWorld.difficulty}`);
    }
    if (activeWorld.biome) {
      worldBits.push(activeWorld.biome);
    }
    sections.push(worldBits.join(' • '));
  }
  if (activeMap?.name) {
    const mapBits = [`Map: ${activeMap.name}`];
    if (activeMap.difficulty) {
      mapBits.push(`Tier: ${activeMap.difficulty}`);
    }
    if (activeMap.threat) {
      mapBits.push(`Threat: ${activeMap.threat}`);
    }
    sections.push(mapBits.join(' • '));
  }
  const trackedQuestId = questState?.trackedQuestId;
  if (trackedQuestId) {
    const trackedQuest = getQuestDefinition(trackedQuestId);
    if (trackedQuest) {
      const progress = getQuestProgress(trackedQuest.id);
      let descriptor = '';
      if (progress?.status === QUEST_STATUSES.completed) {
        descriptor = 'Completed — report back to the guild';
      } else {
        const nextObjective = getQuestNextObjective(trackedQuest);
        descriptor = nextObjective?.description || trackedQuest.summary || 'Advance the objective to proceed';
      }
      const questBits = [`Tracked Quest: ${trackedQuest.name || trackedQuest.id}`];
      if (descriptor) {
        questBits.push(descriptor);
      }
      sections.push(questBits.join(' — '));
    }
  }
  sections.push('Arrow keys / WASD to move • Hold Shift to sprint • Hold R to rest');
  engine.statusEl.textContent = sections.filter(Boolean).join(' | ');
}

async function populateMapsForWorld(worldName, preferredMapFileName) {
  if (!window.amgis || typeof window.amgis.listMaps !== 'function') {
    throw new Error('listMaps API unavailable');
  }
  const result = await window.amgis.listMaps(worldName);
  if (!result.ok) {
    throw new Error(result.error);
  }
  const maps = result.data;
  if (!bootData.mapsByWorld) {
    bootData.mapsByWorld = {};
  }
  bootData.mapsByWorld[worldName] = maps;
  setSelectOptions(ui.selectMap, maps, map => map.fileName, map => map.name);
  if (ui.selectMap) {
    if (preferredMapFileName) {
      ui.selectMap.value = preferredMapFileName;
    } else if (maps[0]) {
      ui.selectMap.value = maps[0].fileName;
    }
  }
  return maps;
}

async function handleLoadMapClick() {
  try {
    const worldName = getSelectedValue(ui.selectWorld);
    const mapFileName = getSelectedValue(ui.selectMap);
    if (!worldName || !mapFileName) {
      return;
    }
    if (!window.amgis || typeof window.amgis.loadMap !== 'function') {
      throw new Error('loadMap API unavailable');
    }
    const result = await window.amgis.loadMap(worldName, mapFileName);
    if (!result.ok) {
      throw new Error(result.error);
    }
    const worldMaps = bootData.mapsByWorld?.[worldName] || [];
    const meta = worldMaps.find(map => map.fileName === mapFileName);
    const selectedWorldMeta = (bootData.worlds || []).find(world => world.name === worldName);
    bootData.selectedWorld = selectedWorldMeta || { name: worldName };
    bootData.currentMap = {
      ...(meta || { fileName: mapFileName, name: mapFileName.replace(/\.map$/i, '') }),
      ...result.data
    };
    await loadMapIntoEngine(bootData.currentMap, { resetPlayer: true });
    updateStatus(bootData.selectedWorld, bootData.currentMap);
    updateHomeIntel();
    syncNpcsForCurrentMap();
    updateNpcProximity();
  } catch (error) {
    alert(error.message);
  }
}

async function hydrateSelectors() {
  const worlds = bootData.worlds || [];
  setSelectOptions(ui.selectWorld, worlds, w => w.name, w => w.name);
  if (ui.selectWorld && bootData.selectedWorld?.name) {
    ui.selectWorld.value = bootData.selectedWorld.name;
  }
  await populateMapsForWorld(bootData.selectedWorld.name, bootData.currentMap?.fileName);

  if (!ui.selectorsReady) {
    ui.selectWorld?.addEventListener('change', async () => {
      try {
        const worldName = getSelectedValue(ui.selectWorld);
        if (!worldName) {
          return;
        }
        const worldMeta = (bootData.worlds || []).find(world => world.name === worldName);
        if (worldMeta) {
          bootData.selectedWorld = worldMeta;
          updateHomeIntel();
        }
        await populateMapsForWorld(worldName);
      } catch (error) {
        alert(error.message);
      }
    });
    ui.btnLoadMap?.addEventListener('click', handleLoadMapClick);
    ui.selectorsReady = true;
  }
}

async function startGameFromBootData() {
  if (!bootData) {
    throw new Error('Boot data not available.');
  }
  stopRenderLoop();
  await ensurePlayerCharacterSelected();
  await hydrateSelectors();
  await loadMapIntoEngine(bootData.currentMap, { resetPlayer: true });
  updateStatus(bootData.selectedWorld, bootData.currentMap);
  syncNpcsForCurrentMap();
  updateNpcProximity();
  updateQuestHud();
  setActiveScreen('game');
  startRenderLoop();
}

async function runBootSequence() {
  const retryBtn = document.getElementById('loading-retry');
  retryBtn.style.display = 'none';

  if (!window.amgis || typeof window.amgis.loadInitialData !== 'function') {
    throw new Error('Data layer unavailable (window.amgis.loadInitialData missing).');
  }

  setLoading('Loading world data...', 0.1);
  const result = await window.amgis.loadInitialData();
  if (!result.ok) {
    throw new Error(result.error);
  }

  bootData = result.data;
  characterState.lastSelectionPath = bootData.settings?.lastCharacterPath || null;
  hydrateInventoryStateFromBootData();
  hydrateQuestStateFromBootData();
  engine.zoom = clampZoom(bootData.settings?.zoom ?? ZOOM_DEFAULT);
  const { currentMap, selectedWorld } = bootData;
  setLoading(`Loading sprites (${selectedWorld.name})...`, 0.6);
  await waitForImage(currentMap.spriteSheet);
  updateHomeIntel();

  setLoading('Finalizing...', 0.95);
  await new Promise(r => setTimeout(r, 120));

  setLoading('Done', 1);
  setActiveScreen('home');
}

async function launchExpeditionFlow() {
  try {
    await ensureAudioPlayback();
    const savedSelection = findCharacterByPath(bootData?.settings?.lastCharacterPath);
    if (savedSelection) {
      await setPlayerCharacter(savedSelection, { persist: false });
      await startGameFromBootData();
      return;
    }
    const opened = await openCharacterSelectionScreen();
    if (!opened) {
      await ensurePlayerCharacterSelected();
      await startGameFromBootData();
    }
  } catch (error) {
    stopRenderLoop();
    setActiveScreen('home');
    alert(error.message);
  }
}

async function bootstrap() {
  setActiveScreen('loading');
  initializeEngine();
  ui.selectWorld = document.getElementById('select-world');
  ui.selectMap = document.getElementById('select-map');
  ui.btnLoadMap = document.getElementById('btn-load-map');
  ui.btnChangeOperative = document.getElementById('btn-change-operative');
  ui.btnEngageCombat = document.getElementById('btn-engage-combat');
  ui.selectCharacterGender = document.getElementById('select-character-gender');
  ui.selectCharacterVariant = document.getElementById('select-character-variant');
  ui.btnCharacterConfirm = document.getElementById('btn-character-confirm');
  ui.btnCharacterBack = document.getElementById('btn-character-back');
  ui.btnCombatAttack = document.getElementById('btn-combat-attack');
  ui.btnCombatDefend = document.getElementById('btn-combat-defend');
  ui.btnCombatRetreat = document.getElementById('btn-combat-retreat');
  ui.btnCombatContinue = document.getElementById('btn-combat-continue');
  inventoryUi.openBtn = document.getElementById('btn-open-inventory');
  inventoryUi.overlay = document.getElementById('inventory-overlay');
  inventoryUi.closeBtn = document.getElementById('btn-inventory-close');
  inventoryUi.list = document.getElementById('inventory-items');
  inventoryUi.detailName = document.getElementById('inventory-detail-name');
  inventoryUi.detailMeta = document.getElementById('inventory-detail-meta');
  inventoryUi.detailDescription = document.getElementById('inventory-detail-description');
  inventoryUi.detailStats = document.getElementById('inventory-detail-stats');
  inventoryUi.detailActions = document.getElementById('inventory-detail-actions');
  inventoryUi.equipmentSlots = {
    weapon: document.getElementById('equipment-slot-weapon'),
    armor: document.getElementById('equipment-slot-armor'),
    accessory: document.getElementById('equipment-slot-accessory')
  };
  questUi.openBtn = document.getElementById('btn-open-quests');
  questUi.overlay = document.getElementById('quest-overlay');
  questUi.closeBtn = document.getElementById('btn-quest-close');
  questUi.list = document.getElementById('quest-list');
  questUi.detailTitle = document.getElementById('quest-detail-title');
  questUi.detailSummary = document.getElementById('quest-detail-summary');
  questUi.detailMeta = document.getElementById('quest-detail-meta');
  questUi.detailObjectives = document.getElementById('quest-detail-objectives');
  questUi.detailActions = document.getElementById('quest-detail-actions');
  questUi.hudTitle = document.getElementById('quest-hud-title');
  questUi.hudObjective = document.getElementById('quest-hud-objective');
  questUi.toast = document.getElementById('quest-toast');
  staminaUi.card = document.getElementById('stamina-hud-card');
  staminaUi.bar = document.getElementById('stamina-bar');
  staminaUi.fill = document.getElementById('stamina-bar-fill');
  staminaUi.readout = document.getElementById('stamina-hud-readout');
  updateSavesSubtitle();
  renderSaveSlots();
  saveUi.list = document.getElementById('save-slot-list');
  saveUi.refreshBtn = document.getElementById('btn-saves-refresh');
  saveUi.backBtn = document.getElementById('btn-saves-back');
  saveUi.subtitle = document.getElementById('saves-subtitle');
  characterState.preview.canvas = document.getElementById('character-preview');
  if (characterState.preview.canvas) {
    characterState.preview.ctx = characterState.preview.canvas.getContext('2d');
    if (characterState.preview.ctx) {
      characterState.preview.ctx.imageSmoothingEnabled = false;
    }
  }
  combatUi.root = document.getElementById('screen-combat');
  combatUi.playerName = document.getElementById('combat-player-name');
  combatUi.playerRank = document.getElementById('combat-player-rank');
  combatUi.playerHp = document.getElementById('combat-player-hp');
  combatUi.playerSpeed = document.getElementById('combat-player-speed');
  combatUi.enemyName = document.getElementById('combat-enemy-name');
  combatUi.enemyRank = document.getElementById('combat-enemy-rank');
  combatUi.enemyHp = document.getElementById('combat-enemy-hp');
  combatUi.enemySpeed = document.getElementById('combat-enemy-speed');
  combatUi.enemyThreat = document.getElementById('combat-enemy-threat');
  combatUi.stateLabel = document.getElementById('combat-state-label');
  combatUi.logList = document.getElementById('combat-log');
  dialogueUi.interactHint = document.getElementById('npc-interaction-hint');
  dialogueUi.interactName = document.getElementById('npc-interaction-name');
  dialogueUi.interactButton = document.getElementById('btn-npc-interact');
  dialogueUi.overlay = document.getElementById('dialogue-overlay');
  dialogueUi.speaker = document.getElementById('dialogue-speaker');
  dialogueUi.role = document.getElementById('dialogue-role');
  dialogueUi.text = document.getElementById('dialogue-text');
  dialogueUi.choices = document.getElementById('dialogue-choices');
  dialogueUi.closeBtn = document.getElementById('btn-dialogue-close');
  updateCombatHud();
  updateStaminaHud();
  renderCombatLog();
  characterState.preview.directionButtons = Array.from(document.querySelectorAll('[data-character-direction]'));
  for (const button of characterState.preview.directionButtons) {
    button.addEventListener('click', () => {
      const direction = button.dataset.characterDirection || 'down';
      setCharacterPreviewDirection(direction);
    });
  }
  updateDirectionButtonState();
  const retryBtn = document.getElementById('loading-retry');
  audioState.buttonEl = document.getElementById('btn-audio-toggle');
  updateAudioButton();
  audioState.buttonEl?.addEventListener('click', () => {
    toggleAudioMute();
    ensureAudioPlayback();
  });
  armAudioGesture();

  const btnNew = document.getElementById('btn-new');
  const btnContinue = document.getElementById('btn-continue');
  const btnSaves = document.getElementById('btn-saves');
  const btnSettings = document.getElementById('btn-settings');
  const btnQuit = document.getElementById('btn-quit');
  const btnGameBack = document.getElementById('btn-game-back');
  const btnSettingsBack = document.getElementById('btn-settings-back');

  btnNew?.addEventListener('click', () => {
    launchExpeditionFlow();
  });

  btnContinue?.addEventListener('click', () => {
    continueFromLatestSave().catch(error => alert(error.message));
  });

  btnSaves?.addEventListener('click', () => {
    openSavesScreen().catch(error => alert(error.message));
  });
  btnSettings?.addEventListener('click', () => setActiveScreen('settings'));
  ui.btnChangeOperative?.addEventListener('click', () => {
    openCharacterSelectionScreen().catch(error => alert(error.message));
  });
  ui.btnEngageCombat?.addEventListener('click', () => {
    startCombatEncounter();
  });

  btnQuit?.addEventListener('click', () => {
    stopRenderLoop();
    if (window.amgis && typeof window.amgis.quit === 'function') {
      window.amgis.quit();
      return;
    }
    window.close();
  });

  btnGameBack?.addEventListener('click', () => {
    stopRenderLoop();
    setActiveScreen('home');
  });
  btnSettingsBack?.addEventListener('click', () => setActiveScreen('home'));
  ui.btnCharacterBack?.addEventListener('click', () => setActiveScreen('home'));
  ui.btnCharacterConfirm?.addEventListener('click', () => {
    handleCharacterConfirmClick();
  });
  ui.selectCharacterGender?.addEventListener('change', () => {
    handleCharacterGenderChange().catch(error => console.warn('Character gender change failed:', error));
  });
  ui.selectCharacterVariant?.addEventListener('change', () => {
    handleCharacterVariantChange().catch(error => console.warn('Character variant change failed:', error));
  });
  ui.btnCombatAttack?.addEventListener('click', handleCombatAttack);
  ui.btnCombatDefend?.addEventListener('click', handleCombatDefend);
  ui.btnCombatRetreat?.addEventListener('click', handleCombatRetreat);
  ui.btnCombatContinue?.addEventListener('click', handleCombatContinue);
  inventoryUi.openBtn?.addEventListener('click', () => toggleInventoryOverlay());
  inventoryUi.closeBtn?.addEventListener('click', () => closeInventoryOverlay());
  inventoryUi.overlay?.addEventListener('click', event => {
    if (event.target === inventoryUi.overlay) {
      closeInventoryOverlay();
    }
  });
  questUi.openBtn?.addEventListener('click', () => toggleQuestOverlay());
  questUi.closeBtn?.addEventListener('click', () => closeQuestOverlay());
  questUi.overlay?.addEventListener('click', event => {
    if (event.target === questUi.overlay) {
      closeQuestOverlay();
    }
  });
  dialogueUi.interactButton?.addEventListener('click', () => attemptNpcInteraction());
  dialogueUi.closeBtn?.addEventListener('click', () => closeDialogueOverlay());
  dialogueUi.overlay?.addEventListener('click', event => {
    if (event.target === dialogueUi.overlay) {
      closeDialogueOverlay();
    }
  });
  saveUi.refreshBtn?.addEventListener('click', () => refreshSaveSlots());
  saveUi.backBtn?.addEventListener('click', () => setActiveScreen('home'));

  await refreshSaveSlots({ silent: true });

  const attempt = async () => {
    try {
      await runBootSequence();
    } catch (error) {
      setLoading(`Error: ${error.message}`, 0);
      retryBtn.style.display = 'inline-block';
    }
  };

  retryBtn.addEventListener('click', attempt);
  await attempt();
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.body) {
    document.body.classList.add('app-dom-ready');
    requestAnimationFrame(() => document.body.classList.add('app-animated'));
  }
  bootstrap();
});
