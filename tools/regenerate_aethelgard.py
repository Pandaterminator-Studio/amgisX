#!/usr/bin/env python3
"""Regenerate the Aethelgard sprite sheet and adventure map."""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
WORLD_ROOT = ROOT / 'GameData' / 'Worlds' / 'Aethelgard'
SPRITE_PATH = WORLD_ROOT / 'Aethelgard.png'
MAP_PATH = WORLD_ROOT / 'Aethelgard_map_1.map'

TILE_SIZE = 32
TILES_PER_ROW = 8
WIDTH = 60
HEIGHT = 34
SIZE = WIDTH * HEIGHT


def hex_to_rgba(value: str | None, alpha: int = 255) -> tuple[int, int, int, int] | None:
    if value is None:
        return None
    value = value.lstrip('#')
    if len(value) != 6:
        raise ValueError(f'Invalid color value: {value!r}')
    r = int(value[0:2], 16)
    g = int(value[2:4], 16)
    b = int(value[4:6], 16)
    return (r, g, b, alpha)


tile_specs = [
    {'name': 'meadow-bright', 'bg': '#5f993d', 'noise': '#8ccd4e', 'noise_count': 32, 'noise_radius': 1},
    {'name': 'meadow-lush', 'bg': '#477a2f', 'noise': '#6db946', 'noise_count': 36, 'noise_radius': 1},
    {'name': 'faelight-bloom', 'bg': '#4f7f2d', 'noise': '#a9dd49', 'noise_count': 18, 'noise_radius': 1, 'bloom': '#f4e664', 'bloom_count': 12, 'bloom_radius': 2},
    {'name': 'moss-steppe', 'bg': '#4a6b3a', 'noise': '#7ca45b', 'noise_count': 40, 'noise_radius': 1},
    {'name': 'sun-road', 'bg': '#c1924a', 'noise': '#dfc67a', 'noise_count': 16, 'noise_radius': 1},
    {'name': 'flagstone-run', 'bg': '#808690', 'grid': '#aeb2bd'},
    {'name': 'shallow-water', 'bg': '#2a84c8', 'waves': '#70d3ff'},
    {'name': 'deep-water', 'bg': '#104c8c', 'waves': '#4aa1e8'},
    {'name': 'tree-canopy', 'bg': None, 'leaf': '#133519', 'leaf_alpha': 235, 'highlight': '#245f27', 'highlight_alpha': 200, 'vein': '#0b1d0d'},
    {'name': 'elder-canopy', 'bg': None, 'leaf': '#0f2a13', 'leaf_alpha': 235, 'highlight': '#1f4d20', 'highlight_alpha': 190, 'vein': '#09160a'},
    {'name': 'arcane-rune', 'bg': None, 'ring': '#7f63ff', 'ring_alpha': 255, 'inner': '#d1c2ff', 'inner_alpha': 200},
    {'name': 'spire-plate', 'bg': '#a1adbf', 'grid': '#d5dff5', 'border': '#ffffff'},
    {'name': 'cliff-shadow', 'bg': '#3e2b27', 'strata': '#8c6042'},
    {'name': 'cliff-sun', 'bg': '#5a3a2d', 'strata': '#c97d4a'},
    {'name': 'ember-node', 'bg': None, 'ember': '#ff8a4b', 'ember_alpha': 235, 'sparks': '#ffd8a0'},
    {'name': 'ward-circle', 'bg': None, 'ring': '#64f6ff', 'ring_alpha': 255, 'sigils': '#1f9fd1'}
]


def draw_tile(spec: dict[str, object], seed: int) -> Image.Image:
    random.seed(seed)
    base_color = hex_to_rgba(spec.get('bg'), spec.get('bg_alpha', 255)) if spec.get('bg') else (0, 0, 0, 0)
    tile = Image.new('RGBA', (TILE_SIZE, TILE_SIZE), base_color)
    draw = ImageDraw.Draw(tile)

    def scatter(color_key: str, count_key: str, radius_key: str, alpha_key: str | None = None) -> None:
        color_value = spec.get(color_key)
        if not color_value:
            return
        radius = spec.get(radius_key, 1)
        count = spec.get(count_key, 16)
        alpha = spec.get(alpha_key, 255) if alpha_key else 255
        color = hex_to_rgba(color_value, alpha)
        for _ in range(count):
            x = random.randrange(TILE_SIZE)
            y = random.randrange(TILE_SIZE)
            draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)

    if spec.get('noise'):
        scatter('noise', 'noise_count', 'noise_radius')
    if spec.get('bloom'):
        scatter('bloom', 'bloom_count', 'bloom_radius', 'bloom_alpha')

    if spec.get('grid'):
        grid_color = hex_to_rgba(spec['grid'], spec.get('grid_alpha', 160))
        step = spec.get('grid_step', 8)
        for x in range(0, TILE_SIZE, step):
            draw.line(((x, 0), (x, TILE_SIZE)), fill=grid_color, width=1)
        for y in range(0, TILE_SIZE, step):
            draw.line(((0, y), (TILE_SIZE, y)), fill=grid_color, width=1)

    if spec.get('waves'):
        wave_color = hex_to_rgba(spec['waves'], spec.get('waves_alpha', 180))
        for offset in range(4, TILE_SIZE, 6):
            draw.arc((-TILE_SIZE // 2, offset - 6, TILE_SIZE + TILE_SIZE // 2, offset + 6), 0, 180, fill=wave_color, width=2)

    if spec.get('leaf'):
        leaf_color = hex_to_rgba(spec['leaf'], spec.get('leaf_alpha', 230))
        draw.ellipse((2, 2, TILE_SIZE - 2, TILE_SIZE - 2), fill=leaf_color)
    if spec.get('highlight'):
        highlight_color = hex_to_rgba(spec['highlight'], spec.get('highlight_alpha', 200))
        draw.ellipse((6, 6, TILE_SIZE - 6, TILE_SIZE - 6), fill=highlight_color)
    if spec.get('vein'):
        vein_color = hex_to_rgba(spec['vein'], spec.get('vein_alpha', 180))
        for _ in range(3):
            x0 = random.randint(4, TILE_SIZE - 4)
            y0 = random.randint(4, TILE_SIZE - 4)
            x1 = random.randint(4, TILE_SIZE - 4)
            y1 = random.randint(4, TILE_SIZE - 4)
            draw.line((x0, y0, x1, y1), fill=vein_color, width=2)

    if spec.get('ring'):
        ring_color = hex_to_rgba(spec['ring'], spec.get('ring_alpha', 255))
        draw.ellipse((3, 3, TILE_SIZE - 3, TILE_SIZE - 3), outline=ring_color, width=3)
    if spec.get('inner'):
        inner_color = hex_to_rgba(spec['inner'], spec.get('inner_alpha', 200))
        draw.ellipse((10, 10, TILE_SIZE - 10, TILE_SIZE - 10), fill=inner_color)
    if spec.get('border'):
        border_color = hex_to_rgba(spec['border'], spec.get('border_alpha', 220))
        draw.rectangle((0, 0, TILE_SIZE - 1, TILE_SIZE - 1), outline=border_color, width=2)
    if spec.get('strata'):
        strata_color = hex_to_rgba(spec['strata'], spec.get('strata_alpha', 200))
        for y in range(6, TILE_SIZE, 6):
            draw.line(((0, y), (TILE_SIZE, y)), fill=strata_color, width=2)
    if spec.get('ember'):
        ember_color = hex_to_rgba(spec['ember'], spec.get('ember_alpha', 235))
        draw.ellipse((6, 6, TILE_SIZE - 6, TILE_SIZE - 6), fill=ember_color)
    if spec.get('sparks'):
        scatter('sparks', 'spark_count', 'spark_radius', 'spark_alpha')
    if spec.get('sigils'):
        sigil_color = hex_to_rgba(spec['sigils'], spec.get('sigil_alpha', 200))
        for angle in range(0, 360, 60):
            radians = math.radians(angle)
            cx = TILE_SIZE / 2 + math.cos(radians) * 8
            cy = TILE_SIZE / 2 + math.sin(radians) * 8
            draw.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=sigil_color)

    return tile


def build_sprite_sheet() -> Image.Image:
    rows = math.ceil(len(tile_specs) / TILES_PER_ROW)
    sprite = Image.new('RGBA', (TILES_PER_ROW * TILE_SIZE, rows * TILE_SIZE), (0, 0, 0, 0))
    for idx, spec in enumerate(tile_specs):
        tile = draw_tile(spec, seed=idx * 97 + 2025)
        x = (idx % TILES_PER_ROW) * TILE_SIZE
        y = (idx // TILES_PER_ROW) * TILE_SIZE
        sprite.paste(tile, (x, y), tile)
    return sprite


def build_map_layers() -> tuple[list[int], list[int], list[int]]:
    terrain = [0] * SIZE
    flora = [-1] * SIZE
    structures = [-1] * SIZE
    rand = random.Random(84)

    def idx(x: int, y: int) -> int:
        return y * WIDTH + x

    for y in range(HEIGHT):
        for x in range(WIDTH):
            base_noise = (x * 37 + y * 19) % 27
            tile = 0
            if base_noise == 0:
                tile = 1
            elif base_noise == 1:
                tile = 2
            elif base_noise == 2:
                tile = 3
            else:
                tile = 0
            if y < 3:
                tile = 13 if (x + y) % 2 else 12
            elif y > HEIGHT - 4:
                tile = 12 if (x + y) % 3 else 13
            terrain[idx(x, y)] = tile

    for y in range(12, 22):
        for x in range(20, 38):
            val = 1 if (x + y) % 4 else 2
            terrain[idx(x, y)] = val

    water_cells: set[tuple[int, int]] = set()
    for x in range(WIDTH):
        center = 16 + int(4 * math.sin(x / 6.5) + 2 * math.sin((x + 4) / 3.8))
        for offset in range(-3, 4):
            y = center + offset
            if 0 <= y < HEIGHT:
                tile = 7 if abs(offset) <= 1 else 6
                terrain[idx(x, y)] = tile
                water_cells.add((x, y))

    for x, y in water_cells:
        for nx in range(x - 2, x + 3):
            for ny in range(y - 2, y + 3):
                if 0 <= nx < WIDTH and 0 <= ny < HEIGHT:
                    tile_index = idx(nx, ny)
                    if terrain[tile_index] in (0, 1, 2, 3):
                        terrain[tile_index] = 3

    def fill_rect(layer: list[int], x0: int, y0: int, x1: int, y1: int, tile: int) -> None:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                    layer[idx(x, y)] = tile

    fill_rect(terrain, 24, 14, 36, 20, 5)
    fill_rect(terrain, 44, 7, 56, 13, 11)

    def draw_path(points: list[tuple[int, int]], tile: int, width: int) -> None:
        for (x0, y0), (x1, y1) in zip(points, points[1:]):
            steps = max(abs(x1 - x0), abs(y1 - y0)) or 1
            for step in range(steps + 1):
                t = step / steps
                x = round(x0 + (x1 - x0) * t)
                y = round(y0 + (y1 - y0) * t)
                for px in range(x - width, x + width + 1):
                    for py in range(y - width, y + width + 1):
                        if 0 <= px < WIDTH and 0 <= py < HEIGHT:
                            terrain[idx(px, py)] = tile

    sunroad = [(3, 30), (10, 27), (19, 25), (27, 23), (36, 21), (45, 19), (56, 16)]
    draw_path(sunroad, 4, 1)

    causeway = [(26, 17), (33, 17), (38, 16), (44, 16), (50, 12)]
    draw_path(causeway, 5, 2)

    for y in range(6, 14):
        for x in range(42, 56):
            if terrain[idx(x, y)] not in (6, 7):
                terrain[idx(x, y)] = 11

    def scatter_forest(cx: int, cy: int, radius: int, density: float = 0.75) -> None:
        for y in range(cy - radius, cy + radius + 1):
            for x in range(cx - radius, cx + radius + 1):
                if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                    if math.hypot(x - cx, y - cy) <= radius:
                        tile_index = idx(x, y)
                        if terrain[tile_index] in (0, 1, 2, 3):
                            if rand.random() < density:
                                flora[tile_index] = 8 if rand.random() < 0.65 else 9

    scatter_forest(9, 11, 5, 0.82)
    scatter_forest(8, 26, 4, 0.75)
    scatter_forest(52, 25, 5, 0.78)
    scatter_forest(47, 9, 3, 0.6)

    def place_structures(coords: list[tuple[int, int]], tile: int) -> None:
        for x, y in coords:
            if 0 <= x < WIDTH and 0 <= y < HEIGHT:
                structures[idx(x, y)] = tile

    rune_coords = [(29, 16), (33, 16), (37, 16), (41, 14), (45, 12), (49, 12)]
    place_structures(rune_coords, 10)

    ward_coords = [(32, 19), (48, 9), (20, 24)]
    place_structures(ward_coords, 15)

    ember_coords = [(12, 27), (40, 22), (54, 18)]
    place_structures(ember_coords, 14)

    return terrain, flora, structures


def format_layer(layer_id: int, name: str, data: list[int]) -> str:
    rows = []
    for y in range(HEIGHT):
        start = y * WIDTH
        rows.append(','.join(str(value) for value in data[start:start + WIDTH]))
    payload = ',\n'.join(rows)
    return f"{layer_id}|{name}|{TILE_SIZE}|{TILE_SIZE}|{WIDTH}|{HEIGHT}|{payload}"


def write_map_file(terrain: list[int], flora: list[int], structures: list[int]) -> None:
    layers = [
        format_layer(0, 'terrain', terrain),
        format_layer(1, 'flora', flora),
        format_layer(2, 'structures', structures)
    ]
    payload = ';\n'.join(layers) + ';\n'
    MAP_PATH.write_text(payload)


def main() -> None:
    WORLD_ROOT.mkdir(parents=True, exist_ok=True)
    sprite = build_sprite_sheet()
    sprite.save(SPRITE_PATH)
    terrain, flora, structures = build_map_layers()
    write_map_file(terrain, flora, structures)
    print(f'Regenerated {SPRITE_PATH.relative_to(ROOT)} and {MAP_PATH.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
