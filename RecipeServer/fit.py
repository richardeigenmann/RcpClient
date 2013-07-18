#!/usr/bin/python2

# This script will read a recipe image and will scale it to the desired size
# maintaining the aspect ratio. If the target size doesn't fit it will be 
# cropped to size from the edges towards the centre.

# It is intended to be run on a webserver in a cgi-bin directory

# Example:
# http://localhost/cgi-bin/fit.py?filename=Rcp502.jpg&width=220&height=180

# The parameters are validated. The filename must not have / or \ chars
# as these could be used to expose files from other directories.
# The width and height must be between 10 and 600

# Copyright, Richard Eigenmann, Zurich, 22 June 2013

# TODO: write the output to cache and next time check if the file is in cache already.

import cgi, cgitb, Image, ImageOps, sys

recipePath="/srv/www/htdocs/Homepage/"
cachePath="/tmp/"

# Sends a HTTP 400 response and an html error string
def respondError(errorMessage):
	print "Status:400 Bad Request "
	print ("Content-type:text/html\r\n\r\n")
	print ('<html>')
	print ('<head>')
	print ('<title>fit.py Error</title>')
	print ('</head>')
	print ("<body>" + errorMessage + "</body></html>")
	exit()


# Get data from fields # validate them
form = cgi.FieldStorage() 
filename = form.getvalue('filename')
if not filename:
	respondError( "Parameter filename is missing in HTTP request")
if "/" in filename:
	respondError( "Illegal character / in filename")
if "\\" in filename:
	respondError( "Illegal character \ in filename")
try:
	with open(recipePath + filename): pass
except IOError:
		respondError("No such file: " + filename)

width  = form.getvalue('width')
if not width:
	respondError( "Parameter width is missing in HTTP request")
try:
	widthInt = int(width)
except ValueError:
	respondError( "Parameter width can't be parsed to int")
if widthInt < 10 or widthInt > 600:
	respondError( "Parameter width is out of range 10 to 600")

height  = form.getvalue('height')
if not height:
	respondError( "Parameter height is missing in HTTP request")
try:
	heightInt = int(height)
except ValueError:
	respondError( "Parameter height can't be parsed to int")

if heightInt < 10 or heightInt > 600:
	respondError( "Parameter height is out of range 10 to 600")


# if we got this far then we have good parameter and can read the image and scale and crop
im = Image.open( recipePath + filename)
im = ImageOps.fit( im,( widthInt, heightInt ), Image.NEAREST, 0, (0.5,0.5) )
# looks like I need to save the image so that it can be opened and printede
im.save( cachePath + filename )


# print the image to the output stream
print ("Content-type: image/jpeg\n")
file = open(cachePath + filename, "r")
print file.read()
