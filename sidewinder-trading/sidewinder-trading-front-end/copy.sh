npm run build
rm -rf ../sidewinder-trading-api-service/public/*
cp -rf ./build/* ../sidewinder-trading-api-service/public
git add -A
git commit -m "UI Update"

