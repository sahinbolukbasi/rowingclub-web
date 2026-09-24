#!/usr/bin/env bash
set -e

REGION="eu-central-1"
FUNCTION_NAME="kurek-kulubu"
S3_BUCKET="kurek-kulubu-assets"
CF_DISTRIBUTION_ID="E3IRPZTI2AE4WX"
TMP_ZIP="/tmp/kurek-lambda-deploy.zip"

echo "==> 1. Proje derleniyor..."
bun run build

echo "==> 2. Statik dosyalar S3 bucket'ına yükleniyor ($S3_BUCKET/public)..."
aws s3 sync .output/public/ "s3://$S3_BUCKET/public/" --region "$REGION"

echo "==> 3. Lambda paketi hazırlanıyor ($TMP_ZIP)..."
rm -f "$TMP_ZIP"
(cd .output && zip -r -q "$TMP_ZIP" .)

echo "==> 4. AWS Lambda ($FUNCTION_NAME) güncelleniyor..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$TMP_ZIP" \
  --region "$REGION" > /dev/null

echo "==> 5. Lambda güncellemesi tamamlanması bekleniyor..."
aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"

echo "==> 6. CloudFront önbelleği temizleniyor ($CF_DISTRIBUTION_ID)..."
aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "/*" > /dev/null

echo "==> Canlıya alma başarıyla tamamlandı!"
echo "    Canlı URL: https://d3t0vozwha6x31.cloudfront.net/"
