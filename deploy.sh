#!/bin/bash
set -e

BUCKET="editor-obi-static"
CF_DIST_ID="E3DU7ZRIYS8N7E"

echo "Building..."
npm run build

echo "Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET/editor/ --delete --exclude ".DS_Store"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*" --query 'Invalidation.Id' --output text

echo "Done. Changes will propagate in ~1 minute."
