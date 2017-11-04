rem building angular site
cd ..\angular
cmd /C ng build --prod --output-path ..\frontend\nexl\site

rem fixing imports
cd ..\scripts
node fix-urls.js "..\frontend\nexl\site\index.html"

rem moving images dir
move ..\frontend\nexl\site\nexl\site\images ..\frontend\nexl\site\images
rmdir ..\frontend\nexl\site\nexl /S /Q

rem copy favicon
copy ..\angular\favicon.ico ..\frontend\nexl\site

pause
