# replaceInFile.py --files file1 file2 .. --findReplace find1 replace1 find2 replace2 ..

import sys

FILES_FLAG = "--files";
FIND_REPLACE_FLAG = "--findReplace"

#  replaceInFiles is based on stackoverflow http://stackoverflow.com/a/13089373
def replaceInFiles(files, replacements):

	# iterate files
	for file in files:
		
		infile = open(file, 'r')
		outfile = open(file, 'r+') # 'w' instead of 'r+' did not work

		# iterate lines in infile
		for line in infile:
			# iterate replacements dictionary 
			for key, value in replacements.iteritems():
				line = line.replace(key, value)
			outfile.write(line)

		infile.close()
		outfile.close()

if __name__ == '__main__':
	
	args = sys.argv
	if ( FILES_FLAG not in args or FIND_REPLACE_FLAG not in args):
		raise Exception("Program did not receive the right input." + 
			" It should be in this format: replaceInFile.py --files file1 file2 .." +
			" --findReplace find1 replace1 find2 replace2 ..")
	
	files = args[(args.index("--files")+1):args.index("--findReplace")]
	findReplace = args[(args.index("--findReplace")+1):]
	
	replacements = {}
	for i in range(len(findReplace)/2):
		key = findReplace[i*2]
		value =findReplace[i*2+1]
		replacements[key] = value
	
	replaceInFiles(files, replacements)


