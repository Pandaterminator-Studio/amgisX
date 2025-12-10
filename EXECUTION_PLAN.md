# AmgisX Development Execution Plan

Follow the steps below sequentially to evolve AmgisX into the full-featured RPG engine. **After each step, pause and ask the user if they want to continue before moving on.**

## Step 1 – Establish Core Architecture & Managers
- **Goal:** Scaffold `GameApp`, `SceneManager`, `AssetManager`, `AudioManager`, `InputManager`, `SaveSystem`, and `WorldLoader` modules with placeholder implementations and TypeScript-style JSDoc types.
- **Actions:**
  1. Create `/src/core` folder and add skeleton files for each manager plus a central `GameApp` orchestrator.
  2. Define shared event types and configuration interfaces (`config/defaults.json`).
  3. Write unit tests (or stubs) validating manager instantiation.
- **Verification:** `npm test` runs (even if only placeholder tests) and Electron boot still succeeds with minimal integrations.
- **On completion:** Ask the user: *“Core managers scaffolded. Continue to Boot Scene?”*

## Step 2 – Implement BootScene & Loading Screen
- **Goal:** Provide a branded loading scene that preloads assets and world metadata while displaying progress.
- **Actions:**
  1. Add `BootScene` under `/src/scenes` using new `SceneManager` interface.
  2. Hook `AssetManager` to load sprite sheets, audio, `.wrld`, `.maps`, and map files asynchronously, emitting progress events.
  3. Update renderer entry point to initialize `GameApp`, push `BootScene`, and render loading UI (progress bar + status text).
  4. Handle load failures with retry UI.
- **Verification:** Launching the app shows the loading screen, increments progress, and transitions to the next scene (stubbed `HomeScene`).
- **On completion:** Ask the user: *“Boot scene complete. Proceed to Home menu?”*

## Step 3 – Build HomeScene & Navigation Shell
- **Goal:** Create a responsive home menu with New Game, Continue (if save exists), Save Games, Settings, Quit.
- **Actions:**
  1. Implement `HomeScene` UI (HTML/CSS components or canvas-based) with keyboard/controller navigation via `InputManager`.
  2. Wire buttons to callbacks that trigger scene transitions (e.g., `SceneManager.push('NewGameScene')`).
  3. Query `SaveSystem` to enable/disable Continue option.
- **Verification:** After BootScene, menu appears, options highlight on input, and selecting an item logs/executes the correct transition.
- **On completion:** Ask the user: *“Home screen ready. Move on to Save/New Game flow?”*

## Step 4 – Save System & Slot Management
- **Goal:** Persist player/world state, expose save slots UI, and support Continue/New Game flows.
- **Actions:**
  1. Implement `SaveSystem` to read/write JSON save slots in Electron’s `app.getPath('userData')` via preload APIs.
  2. Create `SaveGamesScene` with slot list, metadata display (playtime, location), load/delete actions.
  3. Update `HomeScene` Continue button to load latest slot; `NewGameScene` should create a fresh slot.
- **Verification:** Creating a new game writes a save file; Save Games scene lists accurate metadata; Continue loads previous session.
- **On completion:** Ask the user: *“Save system functional. Continue to gameplay scene?”*

## Step 5 – GameScene & Map Rendering Enhancements
- **Goal:** Replace the current static renderer with a scene-driven gameplay view supporting player movement, camera, and layers.
- **Actions:**
  1. Extend `WorldLoader` to parse multi-layer maps, collision masks, entity placements.
  2. Implement `GameScene` with a tile-map renderer, entity update loop, and camera clamped to map bounds.
  3. Introduce `PlayerManager` to handle movement physics, animation states, and interaction hooks.
  4. Integrate `InputManager` actions (move, interact, menu) and pause overlay.
- **Verification:** Player avatar spawns on default world, can move within map, collisions respected, rendering performs at target FPS.
- **On completion:** Ask the user: *“Core gameplay running. Continue to audio & settings?”*

## Step 6 – Audio & Settings Integration
- **Goal:** Add BGM/SFX playback plus a settings UI for audio, controls, and display options.
- **Actions:**
  1. Flesh out `AudioManager` with channel mixing, volume groups (BGM, SFX, UI), and fade transitions.
  2. Implement `SettingsScene` with tabs for Audio, Controls (key remap), Display (pixel scale/fullscreen), Gameplay (text speed).
  3. Persist settings via `SaveSystem` or dedicated config file; apply changes immediately.
- **Verification:** Settings adjustments persist across restarts; audio responds to volume changes; remapped keys update `InputManager`.
- **On completion:** Ask the user: *“Audio/settings done. Proceed to advanced systems?”*

## Step 7 – Advanced Systems & Polish
- **Goal:** Add supporting systems and quality improvements.
- **Topics:** Dialogue/cutscene scripting, quest tracking, combat scene placeholder, logging overlay, hot reload tools, automated tests (Spectron/Playwright), documentation in `/docs` (file formats, architecture).
- **Process:** Prioritize items with the user before implementation; each sub-feature should follow the ask-to-continue rule once finished.
- **On completion:** Ask the user: *“Advanced features implemented. Continue with deployment packaging?”*

## Step 8 – Packaging & QA
- **Goal:** Prepare for distribution and ensure quality.
- **Actions:**
  1. Integrate bundler (Vite/Webpack) if needed, set up ESLint/Prettier, add CI workflow (GitHub Actions) running lint/test/build.
  2. Configure electron-builder or Forge for cross-platform installers, include assets.
  3. Write release checklist and update `README` with screenshots, instructions.
- **Verification:** CI passes, installers build successfully, manual smoke tests confirm boot → gameplay flow.
- **On completion:** Ask the user: *“Packaging complete. Continue with next milestone?”*

---
Use this plan as the master checklist. Remember to pause for confirmation after each step before proceeding.
