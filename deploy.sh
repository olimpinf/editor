#!/bin/bash
set -e

BUCKET="editor-obi-static"
CF_DIST_ID="E3DU7ZRIYS8N7E"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Fetching self-hosted CDN assets..."
"$SCRIPT_DIR/scripts/fetch-cdn.sh"

#echo "Generating info page (ambiente_prova.html)..."
#OBI_HTML="/Users/ranido/OBI/obi2026/html/info_prova.html"
#TEMP_HTML="$(mktemp /tmp/ambiente_prova_XXXX.html)"
# Strip Django {% static '...' %} tags → plain relative paths
#sed "s|{%[[:space:]]*static[[:space:]]*'\([^']*\)'[[:space:]]*%}|editor/\1|g" "$AMBIENTE_HTML" > "$TEMP_HTML"

AMBIENTE_HTML="ambiente_prova.html"

# echo "Uploading info page image assets..."
# OBI_STATIC="static"
# INFO_IMGS=(
#   "img/lampada-yellow-black-text.svg"
#   "img/editor-all.png"
#   "img/editor-codigo.png"
#   "img/editor-bar-codigo.png"
#   "img/icon-font-size-black.svg"
#   "img/icon-theme-black.svg"
#   "img/icon-info-black.svg"
#   "img/icon-grow-black.svg"
# )
# for img in "${INFO_IMGS[@]}"; do
#   aws s3 cp "$OBI_STATIC/$img" s3://$BUCKET/editor/$img
# done

echo "Building..."
npm run build



echo "Uploading CDN assets to S3 (size-only, no delete)..."
aws s3 sync dist/cdn/   s3://$BUCKET/editor/cdn/   --size-only --exclude ".DS_Store"
aws s3 sync dist/fonts/ s3://$BUCKET/editor/fonts/ --size-only --exclude ".DS_Store"

echo "Uploading Vite assets to S3 (no delete — content-hashed files accumulate safely)..."
aws s3 sync dist/assets/ s3://$BUCKET/editor/assets/ --exclude ".DS_Store"

# CloudFront maps /ambiente_prova.html → S3 bucket root (no editor/ prefix).
# The editor sync goes to editor/ prefix, so upload this separately to the root.
echo "Uploading info page to S3 root..."
aws s3 cp "$AMBIENTE_HTML" s3://$BUCKET/ambiente_prova.html \
    --content-type "text/html; charset=utf-8"



echo "Copying aditiontal image assets..."
OBI_STATIC="static"
INFO_IMGS=(
  "img/lampada-yellow-black-text.svg"
  "img/editor-all.png"
  "img/editor-codigo.png"
  "img/editor-bar-codigo.png"
  "img/icon-font-size-black.svg"
  "img/icon-theme-black.svg"
  "img/icon-info-black.svg"
  "img/icon-grow-black.svg"
)
for img in "${INFO_IMGS[@]}"; do
  cp "$OBI_STATIC/$img" dist/img
done

ls dist/img

echo "Uploading editor to S3..."
aws s3 sync dist/ s3://$BUCKET/editor/ --delete \
    --exclude ".DS_Store" \
    --exclude "cdn/*" \
    --exclude "fonts/*" \
    --exclude "assets/*" \
    --exclude "ambiente_prova.html"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*" --query 'Invalidation.Id' --output text

echo "Done. Changes will propagate in ~1 minute."
