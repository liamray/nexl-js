cd ..\angular
cmd /C ng build --prod --output-path ..\frontend\nexl\site
cd ..\scripts
node fix-urls.js "..\frontend\nexl\site\index.html"
