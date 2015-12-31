echo "> Start transpiling ES2015"
echo ""
./node_modules/.bin/babel --plugins "transform-runtime" lib --ignore __tests__ --out-dir ./dist
./node_modules/.bin/browserify --external react index.js > ./dist/browser.js
cat ./dist/browser.js | ./node_modules/.bin/uglifyjs -c > ./dist/browser.min.js
echo ""
echo "> Complete transpiling ES2015"