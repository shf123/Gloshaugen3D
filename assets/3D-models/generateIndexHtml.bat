@echo off
rem Overwrite/make index.html to show all the files in list of directories
rem This is made since Github pages does not have directory listing

set htmlName=fileList.html
set directoryList=(.\dae\ .\obj\. .\js\)
echo %directoryList%

rem ENABLEDELAYEDEXPANSION seem to be necessary to get the expected result for the value htmlFilePath
rem then ! is used instead of % around the variable
setlocal ENABLEDELAYEDEXPANSION

for %%g in %directoryList% do (

	set htmlFilePath="%%g%htmlName%"
	echo !htmlFilePath!

	set title=Directory listing for %%g

	rem ^ is an escape sign. The first line below have only one > to remove existing content
	echo ^<!DOCTYPE html^> > !htmlFilePath!
	echo ^<html^> >> !htmlFilePath!
	echo ^<title^>%title% ^</title^> >> !htmlFilePath!
	echo ^<body^> >> !htmlFilePath!
	echo ^<h2^>%title% ^</h2^> >> !htmlFilePath!

	echo ^<hr^> >> !htmlFilePath!
	echo ^<ul^> >> !htmlFilePath!	

	rem add directories
	for /D %%f in ("%%g*.*") do (
		set directory=%%~pf
		echo ^<li^>^<a href="%%~nf\"^>%%~nf\^</a^> >> !htmlFilePath!
	)

	rem add files
	for %%f in ("%%g*.*") do (
		set file=%%~nxf
		echo ^<li^>^<a href="%%~nxf"^>%%~nxf^</a^> >> !htmlFilePath!
	)

	echo ^</ul^>  >> !htmlFilePath!
	echo ^<hr^>  >> !htmlFilePath!
	echo ^</body^>  >> !htmlFilePath!
	echo ^</html^>  >> !htmlFilePath!

)
