#!/usr/bin/env python3
"""Build transparent, limited-palette header illustrations from public-domain scans."""

from __future__ import annotations

import argparse
import shutil
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


CANVAS_SIZE = (1455, 812)
HEADER_BLUE = "#173B57"
PALETTE = {
    "paper": (233, 228, 220),
    "deep": (13, 38, 56),
    "slate": (53, 80, 100),
    "coral": (216, 121, 131),
}

DEFAULT_SOURCES = {
    "cherry": Path(
        r"C:\Users\karicche\.copilot\attachments"
        r"\f9928d22-adcb-449b-b439-43725be0c741-9a551a65-5742-49a2-a193-8b18fba3fee0-clipboard.png"
    ),
    "temple": Path(
        r"C:\Users\karicche\.copilot\attachments"
        r"\05ffb7a9-6957-423d-a434-056fa6bec3c3-d28d6422-d68b-4756-a1f1-c57e6e64bda9-clipboard.png"
    ),
    "fuji": Path(
        r"C:\Users\karicche\.copilot\attachments"
        r"\f534f34b-4ca7-4031-bc00-964086933671-a5523834-2e2f-42d7-9d27-3ca2c0f7778c-clipboard.png"
    ),
}


@dataclass(frozen=True)
class AssetConfig:
    crop: tuple[int, int, int, int]
    background_refs: tuple[tuple[int, int, int], ...]
    max_size: tuple[int, int]
    final_size: tuple[int, int]
    placement: tuple[int, int]
    threshold: float
    solid_at: float
    score_weights: tuple[float, float, float, float]
    gamma: float
    rotate_degrees: float = 0
    accent: bool = False
    accent_red_threshold: float = 0.07
    accent_saturation_threshold: float = 0.08
    accent_fraction: float = 0.58
    paper_luma_cut: float = 0.39
    light_detail_to_paper: bool = False
    deep_texture_fraction: float = 0
    exclusions: tuple[tuple[int, int, int, int], ...] = ()
    edge_fade: tuple[int, int, int, int] = (0, 0, 0, 0)


CONFIGS = {
    "cherry": AssetConfig(
        crop=(8, 18, 704, 951),
        background_refs=((235, 233, 226), (226, 224, 217)),
        max_size=(1375, 760),
        final_size=(1120, 720),
        placement=(745, 410),
        threshold=0.075,
        solid_at=0.36,
        score_weights=(0.44, 0.26, 0.22, 0.08),
        gamma=0.90,
        rotate_degrees=38,
        paper_luma_cut=0.48,
        light_detail_to_paper=True,
        deep_texture_fraction=0.08,
    ),
    "temple": AssetConfig(
        crop=(55, 72, 652, 1088),
        background_refs=((170, 207, 199), (235, 218, 174), (231, 220, 191)),
        max_size=(720, 775),
        final_size=(650, 775),
        placement=(790, 405),
        threshold=0.105,
        solid_at=0.47,
        score_weights=(0.42, 0.36, 0.12, 0.10),
        gamma=0.82,
        exclusions=((535, 0, 597, 1016), (0, 925, 125, 1016)),
        edge_fade=(24, 160, 0, 36),
    ),
    "fuji": AssetConfig(
        crop=(5, 20, 307, 222),
        background_refs=((218, 199, 157), (207, 192, 157)),
        max_size=(1370, 760),
        final_size=(1370, 760),
        placement=(727, 414),
        threshold=0.090,
        solid_at=0.43,
        score_weights=(0.50, 0.28, 0.12, 0.10),
        gamma=0.86,
        exclusions=((252, 0, 302, 62),),
        edge_fade=(120, 120, 0, 100),
    ),
}


BAYER_8 = (
    np.array(
        [
            [0, 48, 12, 60, 3, 51, 15, 63],
            [32, 16, 44, 28, 35, 19, 47, 31],
            [8, 56, 4, 52, 11, 59, 7, 55],
            [40, 24, 36, 20, 43, 27, 39, 23],
            [2, 50, 14, 62, 1, 49, 13, 61],
            [34, 18, 46, 30, 33, 17, 45, 29],
            [10, 58, 6, 54, 9, 57, 5, 53],
            [42, 26, 38, 22, 41, 25, 37, 21],
        ],
        dtype=np.float32,
    )
    + 0.5
) / 64.0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cherry", type=Path, default=DEFAULT_SOURCES["cherry"])
    parser.add_argument("--temple", type=Path, default=DEFAULT_SOURCES["temple"])
    parser.add_argument("--fuji", type=Path, default=DEFAULT_SOURCES["fuji"])
    parser.add_argument("--output-dir", type=Path, default=Path("public/art"))
    parser.add_argument(
        "--preview-dir",
        type=Path,
        help="Optional temporary directory for composites against the header blue.",
    )
    return parser.parse_args()


def fit_size(size: tuple[int, int], bounds: tuple[int, int]) -> tuple[int, int]:
    scale = min(bounds[0] / size[0], bounds[1] / size[1])
    return max(1, round(size[0] * scale)), max(1, round(size[1] * scale))


def source_mask(size: tuple[int, int], exclusions: tuple[tuple[int, int, int, int], ...]) -> Image.Image:
    mask = np.full((size[1], size[0]), 255, dtype=np.uint8)
    for left, top, right, bottom in exclusions:
        mask[top:bottom, left:right] = 0
    return Image.fromarray(mask, mode="L")


def prepare_source(source: Path, config: AssetConfig) -> tuple[Image.Image, Image.Image]:
    image = Image.open(source).convert("RGB").crop(config.crop)
    mask = source_mask(image.size, config.exclusions)

    if config.rotate_degrees:
        fill = config.background_refs[0]
        image = image.rotate(
            config.rotate_degrees,
            resample=Image.Resampling.BICUBIC,
            expand=True,
            fillcolor=fill,
        )
        mask = mask.rotate(
            config.rotate_degrees,
            resample=Image.Resampling.NEAREST,
            expand=True,
            fillcolor=0,
        )

    fitted = fit_size(image.size, config.max_size)
    image = image.resize(fitted, Image.Resampling.LANCZOS)
    mask = mask.resize(fitted, Image.Resampling.NEAREST)
    return image, mask


def minimum_background_distance(
    rgb: np.ndarray, refs: tuple[tuple[int, int, int], ...]
) -> np.ndarray:
    distances = []
    for ref in refs:
        ref_array = np.asarray(ref, dtype=np.float32) / 255.0
        distances.append(np.sqrt(np.sum((rgb - ref_array) ** 2, axis=2)) / np.sqrt(3))
    return np.minimum.reduce(distances)


def neighbor_count(mask: np.ndarray) -> np.ndarray:
    padded = np.pad(mask.astype(np.uint8), 1)
    count = np.zeros(mask.shape, dtype=np.uint8)
    for y_offset in range(3):
        for x_offset in range(3):
            if x_offset == 1 and y_offset == 1:
                continue
            count += padded[
                y_offset : y_offset + mask.shape[0],
                x_offset : x_offset + mask.shape[1],
            ]
    return count


def posterize(image: Image.Image, allowed_mask: Image.Image, config: AssetConfig) -> Image.Image:
    softened = image.filter(ImageFilter.GaussianBlur(radius=0.55))
    rgb = np.asarray(softened, dtype=np.float32) / 255.0
    original = np.asarray(image, dtype=np.uint8)
    permitted = np.asarray(allowed_mask, dtype=np.uint8) > 0

    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    saturation = np.divide(
        maximum - minimum,
        np.maximum(maximum, 1e-5),
        out=np.zeros_like(maximum),
        where=maximum > 0,
    )
    luminance = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
    reference_luminance = max(
        0.2126 * ref[0] / 255 + 0.7152 * ref[1] / 255 + 0.0722 * ref[2] / 255
        for ref in config.background_refs
    )
    darkness = np.clip((reference_luminance - luminance) / max(reference_luminance, 1e-5), 0, 1)
    distance = minimum_background_distance(rgb, config.background_refs)
    gradient_y, gradient_x = np.gradient(luminance)
    gradient = np.clip(np.hypot(gradient_x, gradient_y) * 5.0, 0, 1)

    weights = config.score_weights
    score = (
        weights[0] * darkness
        + weights[1] * distance
        + weights[2] * saturation
        + weights[3] * gradient
    )
    coverage = np.clip(
        (score - config.threshold) / (config.solid_at - config.threshold),
        0,
        1,
    )
    coverage = np.power(coverage, config.gamma)

    height, width = coverage.shape
    ordered_threshold = np.tile(
        BAYER_8,
        ((height + 7) // 8, (width + 7) // 8),
    )[:height, :width]

    left_fade, right_fade, top_fade, bottom_fade = config.edge_fade
    if left_fade:
        coverage[:, :left_fade] *= np.linspace(0, 1, left_fade, dtype=np.float32)
    if right_fade:
        coverage[:, -right_fade:] *= np.linspace(1, 0, right_fade, dtype=np.float32)
    if top_fade:
        coverage[:top_fade, :] *= np.linspace(0, 1, top_fade, dtype=np.float32)[:, None]
    if bottom_fade:
        coverage[-bottom_fade:, :] *= np.linspace(1, 0, bottom_fade, dtype=np.float32)[:, None]

    selected = (coverage >= ordered_threshold) & permitted

    # Remove isolated threshold freckles while retaining high-confidence fine lines.
    selected &= (neighbor_count(selected) >= 2) | (score >= config.solid_at * 0.92)

    output = np.zeros((height, width, 4), dtype=np.uint8)
    paper = np.asarray(PALETTE["paper"], dtype=np.uint8)
    deep = np.asarray(PALETTE["deep"], dtype=np.uint8)
    slate = np.asarray(PALETTE["slate"], dtype=np.uint8)

    dark_pixels = luminance < config.paper_luma_cut
    middle_pixels = (luminance >= config.paper_luma_cut) & (luminance < 0.66)
    light_pixels = ~(dark_pixels | middle_pixels)
    output[selected & dark_pixels, :3] = paper
    output[selected & middle_pixels, :3] = slate
    output[selected & light_pixels, :3] = paper if config.light_detail_to_paper else deep
    if config.light_detail_to_paper:
        output[selected & light_pixels & (ordered_threshold > 0.88), :3] = deep
    if config.deep_texture_fraction:
        deep_texture = (
            selected
            & (coverage > 0.85)
            & (ordered_threshold > 1 - config.deep_texture_fraction)
        )
        output[deep_texture, :3] = deep

    if config.accent:
        red_bias = rgb[:, :, 0] - (rgb[:, :, 1] + rgb[:, :, 2]) / 2
        accent_pixels = (
            selected
            & (red_bias >= config.accent_red_threshold)
            & (saturation >= config.accent_saturation_threshold)
            & (ordered_threshold < config.accent_fraction)
        )
        output[accent_pixels, :3] = PALETTE["coral"]

    output[selected, 3] = 255
    return Image.fromarray(output, mode="RGBA")


def center_on_canvas(
    motif: Image.Image, placement: tuple[int, int], final_size: tuple[int, int]
) -> Image.Image:
    alpha_box = motif.getchannel("A").getbbox()
    if not alpha_box:
        raise RuntimeError("Posterization removed the entire motif.")
    motif = motif.crop(alpha_box)
    fitted = fit_size(motif.size, final_size)
    if fitted != motif.size:
        motif = motif.resize(fitted, Image.Resampling.NEAREST)
    x = placement[0] - motif.width // 2
    y = placement[1] - motif.height // 2
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    canvas.alpha_composite(motif, (x, y))
    return canvas


def save_optimized(image: Image.Image, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, format="PNG", optimize=True, compress_level=9)


def make_preview(image: Image.Image, output: Path) -> None:
    background = Image.new("RGBA", image.size, HEADER_BLUE)
    background.alpha_composite(image)
    background.convert("RGB").save(output, format="PNG", optimize=True, compress_level=9)


def validate(image: Image.Image, output: Path, uses_accent: bool) -> dict[str, object]:
    if image.size != CANVAS_SIZE:
        raise RuntimeError(f"{output}: expected {CANVAS_SIZE}, got {image.size}")
    if image.mode != "RGBA":
        raise RuntimeError(f"{output}: expected RGBA, got {image.mode}")

    colors = image.getcolors(maxcolors=CANVAS_SIZE[0] * CANVAS_SIZE[1])
    if colors is None:
        raise RuntimeError(f"{output}: unexpectedly large palette")
    visible_rgb = {color[:3] for _, color in colors if color[3] > 0}
    allowed = {PALETTE["paper"], PALETTE["deep"], PALETTE["slate"]}
    if uses_accent:
        allowed.add(PALETTE["coral"])
    if not visible_rgb <= allowed:
        raise RuntimeError(f"{output}: palette contains unexpected colors: {visible_rgb - allowed}")
    alpha_values = {color[3] for _, color in colors}
    if 0 not in alpha_values or 255 not in alpha_values:
        raise RuntimeError(f"{output}: expected both transparent and opaque pixels")

    alpha = image.getchannel("A")
    return {
        "dimensions": f"{image.width}x{image.height}",
        "bytes": output.stat().st_size,
        "rgb_colors": len(visible_rgb),
        "rgba_colors": len(colors),
        "alpha_bbox": alpha.getbbox(),
        "opaque_pixels": sum(count for count, color in colors if color[3] == 255),
    }


def main() -> None:
    args = parse_args()
    sources = {"cherry": args.cherry, "temple": args.temple, "fuji": args.fuji}
    output_names = {
        "cherry": "header-cherry-paper.png",
        "temple": "header-temple-paper.png",
        "fuji": "header-fuji-paper.png",
    }

    for source in sources.values():
        if not source.is_file():
            raise FileNotFoundError(source)

    if args.preview_dir:
        if args.preview_dir.exists():
            shutil.rmtree(args.preview_dir)
        args.preview_dir.mkdir(parents=True)

    for name, source in sources.items():
        config = CONFIGS[name]
        prepared, allowed_mask = prepare_source(source, config)
        motif = posterize(prepared, allowed_mask, config)
        finished = center_on_canvas(motif, config.placement, config.final_size)
        output = args.output_dir / output_names[name]
        save_optimized(finished, output)

        if args.preview_dir:
            make_preview(finished, args.preview_dir / f"{name}-on-blue.png")

        stats = validate(finished, output, config.accent)
        print(
            f"{output}: {stats['dimensions']}, {stats['bytes']} bytes, "
            f"{stats['rgb_colors']} visible RGB colors, {stats['rgba_colors']} RGBA colors, "
            f"alpha bbox={stats['alpha_bbox']}, opaque={stats['opaque_pixels']}"
        )


if __name__ == "__main__":
    main()
