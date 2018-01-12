rem building angular site
cd ..\angular
cmd /C ng build --prod --aot --base-href /nexl/site/ --output-path ..\frontend\nexl\site

pause
