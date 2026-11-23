#!/usr/bin/env python3
"""Generate 1200x630 OG share cards (SVG, then optionally PNG) for the builder quiz.

Source of truth for names/taglines is index.html itself, so the cards can never
drift from the test.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
W, H = 1200, 630

INK = "#0d0d10"
PAPER = "#f7f5f1"
BRONZE = "#c39a63"
MUTED = "#8d8d96"
WATER = "#17171c"

SERIF = "Noto Serif Display, Noto Serif, DejaVu Serif"
SANS = "DejaVu Sans, Noto Sans"


def load_figures():
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    pat = re.compile(r'(\w+)\s*:\s*\{\s*name:"([^"]+)",\s*tagline:"([^"]+)"')
    items = pat.findall(html)
    if not items:
        raise SystemExit("could not parse FIGURES from index.html")
    return [(k, n, t) for k, n, t in items]


def fit_size(text, max_w, start, floor):
    """Rough width fit for a serif face: ~0.55em average advance."""
    size = start
    while size > floor:
        if len(text) * size * 0.55 <= max_w:
            break
        size -= 4
    return size


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def card(name, tagline, idx, total, kicker="COGNITION INSIDER", footer=None):
    name_size = fit_size(name, 760, 118, 52)
    counter = f"{idx:02d} / {total}" if idx else ""
    footer = footer or "Which legendary builder thinks like you?  \u00b7  10 questions  \u00b7  no sign-up"
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <rect width="{W}" height="{H}" fill="{INK}"/>
  <text x="1130" y="500" font-family="{SERIF}" font-size="340" fill="{WATER}" text-anchor="end">?</text>
  <rect x="80" y="96" width="54" height="3" fill="{BRONZE}"/>
  <text x="152" y="108" font-family="{SANS}" font-size="20" letter-spacing="5" fill="{BRONZE}">{esc(kicker)}</text>
  <text x="1120" y="108" font-family="{SANS}" font-size="19" letter-spacing="3" fill="{MUTED}" text-anchor="end">{esc(counter)}</text>
  <text x="80" y="316" font-family="{SERIF}" font-size="{name_size}" fill="{PAPER}">{esc(name)}</text>
  <text x="80" y="386" font-family="{SANS}" font-size="26" letter-spacing="1" fill="{BRONZE}">{esc(tagline.upper())}</text>
  <line x1="80" y1="470" x2="1120" y2="470" stroke="#2a2a30" stroke-width="1"/>
  <text x="80" y="522" font-family="{SANS}" font-size="23" fill="#a9a9b2">{esc(footer)}</text>
  <text x="80" y="566" font-family="{SANS}" font-size="23" letter-spacing="2" fill="{BRONZE}">davi2026-agi.github.io/builder-quiz</text>
</svg>
"""


def main():
    figures = load_figures()
    total = len(figures)
    out_svg = os.path.join(ROOT, "og-src")
    out_png = os.path.join(ROOT, "og")
    os.makedirs(out_svg, exist_ok=True)
    render_png = "--png" in sys.argv
    if render_png:
        os.makedirs(out_png, exist_ok=True)
        import cairosvg

    manifest = {}
    written = 0
    for i, (key, name, tagline) in enumerate(figures, start=1):
        svg = card(name, tagline, i, total)
        open(os.path.join(out_svg, f"{key}.svg"), "w", encoding="utf-8").write(svg)
        if render_png:
            cairosvg.svg2png(
                bytestring=svg.encode("utf-8"),
                write_to=os.path.join(out_png, f"{key}.png"),
                output_width=W,
                output_height=H,
            )
        manifest[key] = {"name": name, "tagline": tagline}
        written += 1

    default_svg = card(
        "Which builder are you?",
        "20 minds  \u00b7  one match",
        0,
        total,
        kicker="COGNITION INSIDER \u00b7 MINDSET TEST",
        footer="Ten questions. No sign-up. Your match, your profile, your lesson.",
    )
    open(os.path.join(out_svg, "default.svg"), "w", encoding="utf-8").write(default_svg)
    if render_png:
        import cairosvg
        cairosvg.svg2png(
            bytestring=default_svg.encode("utf-8"),
            write_to=os.path.join(out_png, "default.png"),
            output_width=W,
            output_height=H,
        )

    json.dump(
        {"count": written, "figures": manifest},
        open(os.path.join(HERE, "figures.json"), "w", encoding="utf-8"),
        indent=2,
        ensure_ascii=False,
    )
    print(f"generated {written} figure cards + 1 default  (png={render_png})")


if __name__ == "__main__":
    main()
