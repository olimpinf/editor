#!/bin/bash
# Download/copy all CDN assets so the editor and CMS can run without external CDNs.
#
# Run once before first deploy, and again if versions below change.
# deploy.sh calls this automatically.
#
# Produces:
#   public/cdn/monaco/0.54.0/min/vs/           ← served at /editor/cdn/monaco/…
#   public/fonts/noto-sans/                     ← served at /editor/fonts/noto-sans/…
#   public/media/                               ← served at /editor/media/… (Blockly toolbar icons)
#   public/cdn/wasm-toolchains/{cpp,python}/    ← served at /editor/cdn/wasm-toolchains/…
#                                                  (local Executar fallback when not running
#                                                  inside ExamLock — see local-run-config.ts)
#   s3://editor-obi-static/shared/pdfjs/3.11.174/  ← for CMS task_description.html

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUCKET="editor-obi-static"

MONACO_VERSION="0.54.0"   # must match version in node_modules/monaco-editor
PDFJS_VERSION="3.11.174"  # must match version in task_description.html
BROWSERCC_VERSION="0.1.1" # must match browsercc in package.json
PYODIDE_VERSION="314.0.6" # must match pyodide in package.json

# ─── 1. Monaco ────────────────────────────────────────────────────────────────

MONACO_DST="$PROJECT_DIR/public/cdn/monaco/$MONACO_VERSION/min/vs"

if [ ! -d "$MONACO_DST" ]; then
    MONACO_SRC="$PROJECT_DIR/node_modules/monaco-editor/min/vs"
    if [ ! -d "$MONACO_SRC" ]; then
        echo "ERROR: node_modules/monaco-editor not found. Run 'npm install' first." >&2
        exit 1
    fi
    echo "Copying Monaco $MONACO_VERSION from node_modules..."
    mkdir -p "$(dirname "$MONACO_DST")"
    cp -r "$MONACO_SRC" "$MONACO_DST"
    echo "  Done. ($(du -sh "$MONACO_DST" | cut -f1))"
else
    echo "Monaco $MONACO_VERSION already in public/cdn/ — skipping."
fi

# ─── 2. Noto Sans ─────────────────────────────────────────────────────────────

FONTS_DST="$PROJECT_DIR/public/fonts/noto-sans"

if [ ! -d "$FONTS_DST" ]; then
    echo "Downloading Noto Sans from Google Fonts..."
    mkdir -p "$FONTS_DST"

    python3 - "$FONTS_DST" <<'PYEOF'
import re, os, sys, urllib.request

fonts_dir = sys.argv[1]
UA = ('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
FONTS_URL = ('https://fonts.googleapis.com/css2'
             '?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap')

req = urllib.request.Request(FONTS_URL, headers={'User-Agent': UA})
with urllib.request.urlopen(req) as r:
    css = r.read().decode()

urls = list(dict.fromkeys(re.findall(r'https://fonts\.gstatic\.com/[^\s)]+\.woff2', css)))
for i, url in enumerate(urls, 1):
    fname = f'noto-{i:02d}.woff2'
    with urllib.request.urlopen(url) as r:
        with open(os.path.join(fonts_dir, fname), 'wb') as f:
            f.write(r.read())
    css = css.replace(url, fname)

with open(os.path.join(fonts_dir, 'noto-sans.css'), 'w') as f:
    f.write(css)

print(f'  Done. ({len(urls)} woff2 files downloaded)')
PYEOF

else
    echo "Noto Sans already in public/fonts/ — skipping."
fi

# ─── 3. Blockly media (trashcan/zoom/etc. icons) ──────────────────────────────

BLOCKLY_MEDIA_DST="$PROJECT_DIR/public/media"

if [ ! -d "$BLOCKLY_MEDIA_DST" ]; then
    BLOCKLY_MEDIA_SRC="$PROJECT_DIR/node_modules/blockly/media"
    if [ ! -d "$BLOCKLY_MEDIA_SRC" ]; then
        echo "ERROR: node_modules/blockly not found. Run 'npm install' first." >&2
        exit 1
    fi
    echo "Copying Blockly UI media from node_modules..."
    mkdir -p "$BLOCKLY_MEDIA_DST"
    cp -r "$BLOCKLY_MEDIA_SRC/." "$BLOCKLY_MEDIA_DST/"
    echo "  Done. ($(du -sh "$BLOCKLY_MEDIA_DST" | cut -f1))"
else
    echo "Blockly media already in public/media/ — skipping."
fi

# ─── 4. PDF.js ────────────────────────────────────────────────────────────────
# PDF.js is used only by the CMS template, not by the editor build.
# Upload directly to S3 so it's available at /shared/pdfjs/…

PDFJS_S3="s3://$BUCKET/shared/pdfjs/$PDFJS_VERSION"

if aws s3 ls "$PDFJS_S3/pdf.min.js" &>/dev/null; then
    echo "PDF.js $PDFJS_VERSION already in S3 — skipping."
else
    echo "Downloading and uploading PDF.js $PDFJS_VERSION..."
    TMP=$(mktemp -d)
    # shellcheck disable=SC2064
    trap "rm -rf '$TMP'" EXIT
    cd "$TMP"

    npm pack "pdfjs-dist@$PDFJS_VERSION" --silent
    tar -xzf "pdfjs-dist-$PDFJS_VERSION.tgz" --strip-components=1

    aws s3 cp build/pdf.min.js        "$PDFJS_S3/pdf.min.js"         --quiet
    aws s3 cp build/pdf.worker.min.js "$PDFJS_S3/pdf.worker.min.js"  --quiet
    aws s3 cp web/pdf_viewer.css      "$PDFJS_S3/pdf_viewer.min.css" --quiet
    aws s3 sync cmaps/                "$PDFJS_S3/cmaps/"             --quiet
    aws s3 sync standard_fonts/       "$PDFJS_S3/standard_fonts/"    --quiet

    cd "$PROJECT_DIR"
    echo "  Done."
fi

# ─── 5. WASM toolchains (local Executar: C/C++ via browsercc, Python via Pyodide) ──
# Fallback path for when the editor runs standalone (outside ExamLock, which
# instead serves these same files via its bundled 'examlock-assets://'
# protocol — see exam-app-branch-version2.0/build-scripts/fetch-wasm-toolchains.sh).

WASM_DST="$PROJECT_DIR/public/cdn/wasm-toolchains"

if [ -d "$WASM_DST/cpp" ] && [ -d "$WASM_DST/python" ]; then
    echo "WASM toolchains already in public/cdn/wasm-toolchains/ — skipping."
else
    BROWSERCC_SRC="$PROJECT_DIR/node_modules/browsercc/dist"
    PYODIDE_SRC="$PROJECT_DIR/node_modules/pyodide"
    if [ ! -d "$BROWSERCC_SRC" ] || [ ! -d "$PYODIDE_SRC" ]; then
        echo "ERROR: node_modules/browsercc or node_modules/pyodide not found. Run 'npm install' first." >&2
        exit 1
    fi

    echo "Copying browsercc $BROWSERCC_VERSION WASM assets..."
    mkdir -p "$WASM_DST/cpp"
    cp "$BROWSERCC_SRC/clang.wasm"   "$WASM_DST/cpp/"
    cp "$BROWSERCC_SRC/lld.wasm"     "$WASM_DST/cpp/"
    cp "$BROWSERCC_SRC/sysroot.tar"  "$WASM_DST/cpp/"
    cp "$BROWSERCC_SRC/stdc++.h.pch" "$WASM_DST/cpp/"
    echo "  Done. ($(du -sh "$WASM_DST/cpp" | cut -f1))"

    echo "Copying Pyodide $PYODIDE_VERSION WASM assets..."
    mkdir -p "$WASM_DST/python"
    cp "$PYODIDE_SRC/pyodide.asm.mjs"   "$WASM_DST/python/"
    cp "$PYODIDE_SRC/pyodide.asm.wasm"  "$WASM_DST/python/"
    cp "$PYODIDE_SRC/python_stdlib.zip" "$WASM_DST/python/"
    cp "$PYODIDE_SRC/pyodide-lock.json" "$WASM_DST/python/"
    echo "  Done. ($(du -sh "$WASM_DST/python" | cut -f1))"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────

echo ""
echo "All CDN assets ready."
echo ""
echo "Remaining manual step (one-time):"
echo "  Set CDN_BASE in:"
echo "  cms_1.6_obi/cms/server/contest/templates/task_description.html"
echo "  to the base URL of your S3/CloudFront distribution, e.g.:"
echo "    https://YOUR_DOMAIN.unicamp.br/shared"
echo "  Run: aws cloudfront get-distribution --distribution-id E3DU7ZRIYS8N7E \\"
echo "             --query 'Distribution.DomainName' --output text"
