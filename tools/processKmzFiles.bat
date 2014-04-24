@echo off

rem dependencies: 7-zip need to be installed and added to the path(7z.exe is used in this program),
rem blender, blender-plugin for exporting the to js, and python

rem the program is probably not very robust.

mkdir kml
mkdir dae
mkdir obj
mkdir js

for %%f in (*.kmz) do ( 
	echo "unzip kmz-file"
	7z x "%%f" -o"%%~nf"

	echo "move and rename doc.kml"
	move "%%~nf\doc.kml" "kml\%%~nf.kml" 

	rem some of the file structure in the kml file is different between older and newer versions
	set notFail = "false"
	if exist "%%~nf\models" (
		echo "Found models folder"

		echo "move and rename untitled.dae"
		move "%%~nf\models\untitled.dae" "dae\%%~nf.dae"

		echo "move and rename untitled(image folder)" 
		move "%%~nf\models\untitled" "dae\%%~nf" 

		echo "the images-path inside the dae-file needs to be changed"
		echo replaceInFile.py --files "dae\%%~nf.dae"  --findReplace untitled/ "%%~nf"
		replaceInFile.py --files "dae\%%~nf.dae"  --findReplace untitled/ "%%~nf"/

		set notFail = "true"
	)
	if exist "%%~nf\files" (
		echo "Found files folder"
		echo "move and rename .dae-file. The file name is not always the same here, ergo *"
		move "%%~nf\files\*.dae" "dae\%%~nf.dae" 

		echo "move and rename untitled(image folder)"
		mkdir "dae\%%~nf"
		move "%%~nf\files\*.jpg" "dae\%%~nf"

		echo "the images-path inside the dae-file needs to be changed"
		replaceInFile.py --files "dae\%%~nf.dae"  --findReplace ../images/ "%%~nf"/

		set notFail = "true" 
	)
	
	if notFail=="false" (
		set fail = "Error: The kmz file %%f did not have the expected content!"
		echo fail
		fail >> errorLog.txt
	)


	rem convert dae file to obj and js. then move the obj and js to its own folder with a copy of the images
	blender -b -P blender_convert_files.py -- "dae\%%~nf.dae"
	move "dae\%%~nf.obj" "obj\%%~nf.obj"
	move "dae\%%~nf.mtl" "obj\%%~nf.mtl"
	move "dae\%%~nf.js" "js\%%~nf.js"
	xcopy "dae\%%~nf" "obj\%%~nf" /i
	xcopy "dae\%%~nf" "js\%%~nf" /i


	rem remove the rests of the unzipped kmz-file. 
	rem /S is used to remove all the content in the folder and /Q to not be prompted before deleting
	rmdir /S /Q "%%~nf" 
	

)  

