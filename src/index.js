// use strict version of js
"use strict";
    
var scene, camera, renderer, controls;
var debug = getParameterFromUrl("debug") || false; // show some debug info
var debugVariable;
var terrainGeometry;

init();

function init() {
	
	
	var width = window.innerWidth;
	var height = window.innerHeight;

	// scene 
	scene = new THREE.Scene();

	// camera (chose FOV from stemkoski.github.io/Three.js/HelloWorld.html)
	camera = new THREE.PerspectiveCamera( 45, width/height, 0.1, 10000 );
	camera.position.z = 100;


	// controls
	controls = new THREE.TrackballControls( camera );

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	document.getElementById( "threejs" ).appendChild( renderer.domElement );
	
	
	

	// terrain
	var terrainFile = "../assets/gloshaugen.xyz";
	$.get( terrainFile, function(data) {
		var terrain = data.replace(/"/g,'').split("\n");
		terrain.pop(); // since the last line in the file "gloshaugen.xyz" is empty
						
		
		var terrainWidth = 200; 
		var terrainHeight = 200; 
		 
		
		var terrainInfo = getDataInfoFromTerrain(terrain);
		var bbox = terrainInfo.bbox; // "569900,7032300,570500,7033300";
		var widthVertices = terrainInfo.xVertices();
		var heightVertices = terrainInfo.yVertices();
		 
		var widthSegments = widthVertices - 1;
		var heightSegments = heightVertices - 1;
		var averageX = terrainInfo.averageX;
		var averageY = terrainInfo.averageY;

		var scale = {
		  	x : Math.abs(terrainWidth/(terrainInfo.maxX-terrainInfo.minX)),
			y : Math.abs(terrainHeight/(terrainInfo.maxY-terrainInfo.minY)),
		  	z : 1
		  };
		  
		console.log("Make PlaneGeometry");
		terrainGeometry = new THREE.PlaneGeometry( terrainWidth, terrainHeight, widthSegments, heightSegments);
		
		

		var useNorgeIBilder = false;
		if ( getParameterFromUrl( "norgeIBilder" ) === "true" ) {
			useNorgeIBilder = true;
		}

		console.log("Make Material");
		var material = new THREE.MeshLambertMaterial( {map: getMapTextureWms( bbox, 1000, 1000, useNorgeIBilder ), side : THREE.DoubleSide }); 
		material.wireframe = false;

		console.log("Make Mesh");
		var terrainMesh = new THREE.Mesh( terrainGeometry, material);
		terrainMesh.name = "Terrain";

		// add the height values 
		console.log("Adding terrain z-values")
		for ( var i = 0; i < terrainGeometry.vertices.length ; i++)  {
							
			terrainGeometry.vertices[i].z = 1*terrain[i].split(" ")[2];			

		}
			
		scene.add( terrainMesh );
		
		console.log("Adding buildings");
		var objtype = getParameterFromUrl("model") || "collada";
		switch(objtype) {

			case "obj":
			// just Hovedbygget at this moment
				addObjBuildingsToScene( terrainInfo, scale, scene, render );
				break;
			case "json":
			// just Hovedbygget at this moment
				addJsonBuildingsToScene( terrainInfo, scale, scene, render );
				break;
			default:
				addDaeBuildingsToScene( terrainInfo, scale, scene, render );
				break;

		}
		console.log("Buildings added");

		// light
		var light = new THREE.AmbientLight( 0xababab ) ;
		light.position = camera.position;
		scene.add( light );

		var light2 = new THREE.DirectionalLight( 0x444444 );
		light2.position = camera.position;
		scene.add( light2 );
		

		// Debug geometries
		// create axis helper (for debugging)
		if (debug) {
		var axisHelper = new THREE.AxisHelper( 500 );
		scene.add( axisHelper );
		
		boundingBoxTerrain = new THREE.BoundingBoxHelper( terrainMesh, 0xffff00 );
		scene.add(boundingBoxTerrain);
		
		gridHelper = new THREE.GridHelper( 150,10 );
		gridHelper.setColors( 0x888822, 0x888888 );
		gridHelper.rotation = new THREE.Euler(Math.PI/2, 0,0)
		scene.add(gridHelper);

		}
		

			

	});
	
	
	
}

/*
	Iterates through the terrain array of format: array[i] = "x y z"
	object containing min values, max values, bbox etc. is returned.
*/
function getDataInfoFromTerrain(terrainArray) {

	var i, point, minX, minY, minZ, maxX, maxY, maxZ;
	var resolution; // assumes homogeniously and equal resolution in X and Y. e.g 10 means 10x10 (m)
	var numberOfPoints = terrainArray.length;

	// start values for min, max and resolution
	var firstPoint = terrainArray[0].split(" ");
	minX = maxX = firstPoint[0];
	minY = maxY = firstPoint[1];
	minZ = maxZ = firstPoint[2];
	resolution = 10000000; // random huge number

	for (i = 0; i < numberOfPoints; i++) {
		point = terrainArray[i].split(" ");

		// X - East
		minX = Math.min( minX, point[0] );
		maxX = Math.max( maxX, point[0] );

		// Y - North 
		minY = Math.min( minY, point[1] );
		maxY = Math.max( maxY, point[1] );

		// Z - Height
		minZ = Math.min( minZ, point[2] );
		maxZ = Math.max( maxZ, point[2] );

		// Resolution
		if (firstPoint[0] !== point[0]) {
			resolution = Math.min(resolution, Math.abs(firstPoint[0]-point[0]));
		}
	}
   
	var dataInfo = {
		"minX" : minX,
		"maxX" : maxX,
		"minY" : minY,
		"maxY" : maxY,
		"minZ" : minZ,
		"maxZ" : maxZ,
		"resolution" : resolution,

		"bbox" : minX + "," + minY + "," + maxX + "," + maxY,

		"length" : numberOfPoints,	

		"averageX" : function() {
			return (this.minX+this.maxX)/2;
		},

		"averageY" : function() {
			return (this.minY+this.maxY)/2;
		},

		"xyVerticesRatio" : function() {
			return (this.maxX-this.minX+1*this.resolution)/(this.maxY-this.minY+1*this.resolution);
		}, 
		"xVertices" : function() {
			return Math.sqrt(this.length * this.xyVerticesRatio());
		}, 
		"yVertices" : function() {
			return this.length / this.xVertices();
		}
	}




	return dataInfo;

}

var render = function ()  {
	requestAnimationFrame( render );

	controls.update();
	renderer.render( scene, camera );

	if (debug) {
		//boundingBoxTerrain.update();
		//boundingBoxHovedbygg.update();
	}

	return;
};

function getVirtualZValue(buildingX, buildingY, scale, terrainInfo) {

	console.log("buildingX: " + buildingX);
	console.log("buildingY: " + buildingY);

	var localX = (buildingX - terrainInfo.minX)*scale.x;
	var localY = (buildingY - terrainInfo.minY)*scale.y;

	var verticesX = terrainInfo.xVertices();
	var verticesY = terrainInfo.yVertices();

	var xNumber = (localX) / verticesX;
	var yNumber = (localY) / verticesY;

	console.log("xNumber: " + xNumber);
	console.log("yNumber: " + yNumber);

	//Simplifying. :( Should do som interpolation
	var xNumber = Math.round(xNumber);
	var yNumber = Math.round(yNumber);

	var terrainIndex = yNumber*verticesY + xNumber;
	console.log("terrainIndex: " + terrainIndex);
	var z = terrainGeometry.vertices[terrainIndex].z; // assumes terrainGeometry is global :(
	console.log("Z-value: " + z);



	return z;


}

function getMapTextureWms(bbox, width, height, useNorgeIBilder) {
	

	if ( getParameterFromUrl("useStoredTexture") === "true") {
		return THREE.ImageUtils.loadTexture("../assets/texture.png"); //  made from a print screen -> less accurate 
	}

	var norgeIBilder = "http://wms.geonorge.no/skwms1/wms.norgeibilder"; // NorgeIBilder	
	var kartverketOpenWms = "http://openwms.statkart.no/skwms1/wms.topo2";
	
	var path = "";
	var layers = "";
	
	console.log("norgeIBilder = " + useNorgeIBilder + " type: " + typeof(useNorgeIBilder));
	if ( useNorgeIBilder === true ) {
		console.log("NorgeIBilder");
		path = norgeIBilder;
		layers = "OrtofotoAlle";
	}
	else {
		console.log("OpenWms");
		path = kartverketOpenWms;
		layers = topo2layers;
	}
	
	path += "?service=wms&version=1.3.0&request=getmap";
	var crs = "EPSG:32632"; // WGS 84 / UTM zone 32N
	var srs = "EPSG:32632"; 
	var format = "image/png";
	
	
	var url = path + '&crs=' + crs + '&srs=' + srs + '&format=' + format + '&layers=' + layers + '&bbox=' 
	+ bbox + '&WIDTH=' + width + '&HEIGHT=' + height;
	
	console.log("texture url: " + url);
	var imageUtilsCors = THREE.ImageUtils;
	imageUtilsCors.crossOrigin = 'anonymous'; // From Release 65 of THREE.js this line is necessary
	
	return imageUtilsCors.loadTexture(url);

} 

// Returns value of parameter if it exist. 
function getParameterFromUrl( parameter ) {
	var urlParameters = window.location.search.substring(1);
	var parameters = urlParameters.split("&");
	
	for (var i = 0; i < parameters.length; i++ ) {
		var keyValue = parameters[i].split("=");
		if (keyValue[0] === parameter) {
			return keyValue[1];
		}	
	}
	
	return undefined;
}

