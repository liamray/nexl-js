rem building angular site
cd ..\angular
rem temporary not using --prod and --aot because of bug in jxqwidgets
rem cmd /C ng build --prod --base-href /nexl/site/ --output-path ..\frontend\nexl\site
cmd /C ng build --base-href /nexl/site/ --output-path ..\frontend\nexl\site

pause
