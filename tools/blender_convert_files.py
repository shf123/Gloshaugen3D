# blender -b -P blender_convert_files.py -- daeFile1.dae daeFile2.dae etc

# dependencies: blender, blender-plugin for exporting the to js

# inspired by http://auxmem.com/2012/01/24/convert-3ds-files-to-obj-with-blender/

import bpy
import sys
import os.path


def convertFilesToObjFiles( files ):

	for file in files:

		# remove potenisal things which is in the scene
		emptyScene()

   		# import dae-file
		importFile(file)

   		# export to obj with same name
		objFile = os.path.splitext(file)[0] + ".obj"
		bpy.ops.export_scene.obj(filepath=objFile)

def convertFilesToJsFiles( files ):
	
	for file in files:
		# remove potenisal things which is in the scene
		emptyScene()

   		# import dae-file
		importFile(file)

   		# export to js(the threejs format) with same name
		jsFile = os.path.splitext(file)[0] + ".js"
		bpy.ops.export.threejs(filepath=jsFile)

def emptyScene():
	bpy.ops.object.select_all(action="SELECT")
	bpy.ops.object.delete()

def importFile(file):
	extension = os.path.splitext(file)[1]

	if (extension == ".dae"):
		importDaeFile(file)
	else:
		raise Exception("Importing file with the extension '" + extension + "' is not implemented")


def importDaeFile(daeFile):
	bpy.ops.wm.collada_import(filepath=daeFile)


if __name__ == '__main__':

	sysArgs = sys.argv 
	files = sys.argv[(sysArgs.index("--") + 1):] # all args after "--"

	print(sysArgs)
	print(files)

	convertFilesToObjFiles(files)
	convertFilesToJsFiles(files)



