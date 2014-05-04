rem @echo off

rem dependencies: 7-zip need to be installed and added to the path(7z.exe is used in this program),
rem blender, blender-plugin for exporting the to js, and python

rem the program is probably not very robust. 


set commonDaeFolder=dae
set commonObjFolder=obj
set commonJsFolder=js
set commonKmlFolder=kml

mkdir %commonKmlFolder%
mkdir %commonDaeFolder%
mkdir %commonObjFolder%
mkdir %commonJsFolder%


set fileName=%%~nf
set fileNameAndExt=%%f

set kmlFileNameAndExt=doc.kml

rem the name of the folder with the dae file seem to depend on the age of the kmz file
set daeFolder1=%fileName%\models
set daeFileName1=untitled.dae
set imageFolder1Name=untitled
set imageFolder1=%daeFolder1%\%imageFolder1Name%

set daeFolder2=%fileName%\files

echo Log: > log.txt

for %%f in (*.kmz) do ( 

	echo Processing %%f... >> log.txt

	rem "unzip kmz-file"
	7z x "%fileNameAndExt%" -o"%fileName%"

	rem "move and rename doc.kml"
	move "%fileName%\%kmlFileNameAndExt%" "%commonKmlFolder%\%fileName%.kml" 

	rem some of the file structure in the kml file is different between older and newer versions
	if exist "%daeFolder1%" (
		rem "Found models folder"
		echo Found models folder >> log.txt

		rem "move and rename untitled.dae"
		move "%daeFolder1%\%daeFileName1%" "%commonDaeFolder%\%fileName%.dae"
	
		rem "move and rename untitled(image folder)" 
		move "%imageFolder1%" "%commonDaeFolder%\%fileName%" 

		rem "the images-path inside the dae-file needs to be changed"
		echo replaceInFile.py --files "%commonDaeFolder%\%fileName%.dae"  --findReplace "%imageFolder1Name%/" "%fileName%/"
		replaceInFile.py --files "%commonDaeFolder%\%fileName%.dae"  --findReplace "%imageFolder1Name%/" "%fileName%/"
	
	)
	
	if exist "%daeFolder2%" (
		rem Found files folder
		echo Found files folder >> log.txt

		rem "move and rename .dae-file. The file name is not always the same here, ergo *"
		move "%daeFolder2%\*.dae" "%commonDaeFolder%\%fileName%.dae" 

		rem "move and rename untitled(image folder)"
		mkdir "%commonDaeFolder%\%fileName%"
		move "%daeFolder2%\*.jpg" "%commonDaeFolder%\%fileName%"
	
		rem "the images-path inside the dae-file needs to be changed"
		replaceInFile.py --files "%commonDaeFolder%\%fileName%.dae"  --findReplace ../images/ "%fileName%"/
	)
	
	rem convert dae file to obj and js. then move the obj and js to its own folder with a copy of the images

	
	blender -b -P blender_convert_files.py -- "%commonDaeFolder%\%fileName%.dae"
	move "%commonDaeFolder%\%fileName%.obj" "%commonObjFolder%\%fileName%.obj"
	move "%commonDaeFolder%\%fileName%.mtl" "%commonObjFolder%\%fileName%.mtl"
	move "%commonDaeFolder%\%fileName%.js" "%commonJsFolder%\%fileName%.js"
	xcopy "%commonDaeFolder%\%fileName%" "%commonObjFolder%\%fileName%" /i
	xcopy "%commonDaeFolder%\%fileName%" "%commonJsFolder%\%fileName%" /i

	rem remove the rests of the unzipped kmz-file. 
	rem /S is used to remove all the content in the folder and /Q to not be prompted before deleting
	rmdir /S /Q "%fileName%" 
	
	echo Finished with %%f >> log.txt
	echo. >> log.txt

)  

