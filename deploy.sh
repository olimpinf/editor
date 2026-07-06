#!/bin/bash
set -e

BUCKET="editor-obi-static"
CF_DIST_ID="E3DU7ZRIYS8N7E"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Fetching self-hosted CDN assets..."
"$SCRIPT_DIR/scripts/fetch-cdn.sh"

echo "Building..."
npm run build

echo "Uploading CDN assets to S3 (size-only, no delete)..."
aws s3 sync dist/cdn/   s3://$BUCKET/editor/cdn/   --size-only --exclude ".DS_Store"
aws s3 sync dist/fonts/ s3://$BUCKET/editor/fonts/ --size-only --exclude ".DS_Store"

echo "Uploading editor to S3..."
aws s3 sync dist/ s3://$BUCKET/editor/ --delete \
    --exclude ".DS_Store" \
    --exclude "cdn/*" \
    --exclude "fonts/*"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*" --query 'Invalidation.Id' --output text

echo "Done. Changes will propagate in ~1 minute."
