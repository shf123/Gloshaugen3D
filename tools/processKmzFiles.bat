rem dependencies: 7-zip need to be installed and added to the path(7z.exe is used in this program),
rem blender, blender-plugin for exporting the to js

mkdir kml
mkdir dae
mkdir obj
mkdir js

for %%f in (*.kmz) do ( 
	rem unzip kmz-file
	7z x "%%f" -o"%%~nf"

	rem move and rename doc.kml 
	move "%%~nf\doc.kml" "kml\%%~nf.kml" 

	rem move and rename untitled.dae
	move "%%~nf\models\untitled.dae" "dae\%%~nf.dae"

	rem move and rename untitled(image folder) 
	move "%%~nf\models\untitled" "dae\%%~nf" 
	
	rem remove the rests of the unzipped kmz-file. 
	rem /S is used to remove all the content in the folder and /Q to not be prompted before deleting
	rmdir /S /Q "%%~nf" 

	rem convert dae file to obj and js. then move the obj and js to its own folder with a copy of the images
	blender -b -P blender_convert_files.py -- "dae\%%~nf.dae"
	move "dae\%%~nf.obj" "obj\%%~nf.obj"
	move "dae\%%~nf.js" "js\%%~nf.js"
	xcopy "dae\%%~nf" "obj\%%~nf" /i
	xcopy "dae\%%~nf" "js\%%~nf" /i
 )  


rem explanation:
rem the for loop iterates through all the kmz-files in the current directory
rem the 7z command x is called for each of the files. It unzips one kmz-file("%%f") at a time.
rem the unzipped version is outputed("-o%%~nf") to folder with the same name as the kmz-file
rem "%%~nf" is file name without extension.
rem after the unzipping some renaming and moving occurs. 

