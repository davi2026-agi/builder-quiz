#!/usr/bin/env python3
"""One-shot, idempotent patch: add OG/Twitter meta to index.html and make the
result page share a crawlable permalink (r/<key>.html) instead of the raw session URL.

Safe to run repeatedly: every replacement is skipped if its marker is already present.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, "index.html")
MARK = "<!-- og:cards -->"

OG_BLOCK = MARK + """
<meta property="og:type" content="website">
<meta property="og:site_name" content="Cognition Insider">
<meta property="og:title" content="Which legendary builder thinks like you?">
<meta property="og:description" content="Ten questions. No sign-up. One historical mind, your strategic profile, and the lesson that mind would give you today.">
<meta property="og:image" content="https://davi2026-agi.github.io/builder-quiz/og/default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://davi2026-agi.github.io/builder-quiz/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Which legendary builder thinks like you?">
<meta name="twitter:description" content="Ten questions. No sign-up. One historical mind, your strategic profile, and the lesson that mind would give you today.">
<meta name="twitter:image" content="https://davi2026-agi.github.io/builder-quiz/og/default.png">
"""

RESULT_URL_JS = """function resultUrl(key){
  return location.origin + location.pathname.replace(/[^/]*$/, "") + "r/" + key + ".html";
}
function shareTarget(){
  return RESULT_KEY ? resultUrl(RESULT_KEY) : location.href;
}
"""


def main():
    s = open(P, encoding="utf-8").read()
    before = s
    changed = []

    if MARK not in s:
        m = re.search(r'<meta name="description"[^>]*>', s)
        if not m:
            raise SystemExit("anchor <meta name=description> not found")
        s = s[: m.end()] + "\n" + OG_BLOCK + s[m.end():]
        changed.append("og-meta")

    if 'id="permLink"' not in s:
        s = s.replace(
            '      <button class="btn ghost copy" onclick="copyLink()">Copy link</button>\n    </div>',
            '      <button class="btn ghost copy" onclick="copyLink()">Copy link</button>\n'
            '      <p class="perm"><a id="permLink" href="#" target="_blank">Preview your share card \u2192</a></p>\n'
            "    </div>",
            1,
        )
        s = s.replace(
            "  .foot{font-size:12px;color:#a1a1a6;margin-top:34px;line-height:1.6;}",
            "  .perm{margin:14px 0 0;font-size:13px;}\n"
            "  .perm a{color:var(--sub);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:2px;}\n"
            "  .foot{font-size:12px;color:#a1a1a6;margin-top:34px;line-height:1.6;}",
            1,
        )
        changed.append("perm-link")

    if "let RESULT_KEY" not in s:
        s = s.replace("let step = 0, answers = [];", "let step = 0, answers = [];\nlet RESULT_KEY = null;", 1)
        s = s.replace(
            '  $("quiz").classList.add("hidden");\n  $("result").classList.remove("hidden");',
            '  RESULT_KEY = key;\n'
            '  const perm = $("permLink");\n'
            '  if (perm) perm.href = resultUrl(key);\n'
            '  $("quiz").classList.add("hidden");\n'
            '  $("result").classList.remove("hidden");',
            1,
        )
        changed.append("result-key")

    if "function shareTarget" not in s:
        s = s.replace("/* ---------- share ---------- */", "/* ---------- share ---------- */\n" + RESULT_URL_JS, 1)
        s = s.replace(
            'encodeURIComponent(shareText()) +\n              "&url=" + encodeURIComponent(location.href)',
            'encodeURIComponent(shareText()) +\n              "&url=" + encodeURIComponent(shareTarget())',
            1,
        )
        s = s.replace(
            'sharer/sharer.php?u=" + encodeURIComponent(location.href)',
            'sharer/sharer.php?u=" + encodeURIComponent(shareTarget())',
            1,
        )
        s = s.replace('const txt = shareText() + " " + location.href;', 'const txt = shareText() + " " + shareTarget();', 1)
        changed.append("share-target")

    if s != before:
        open(P, "w", encoding="utf-8").write(s)
        print("patched: " + ", ".join(changed))
    else:
        print("already patched, nothing to do")


if __name__ == "__main__":
    main()
