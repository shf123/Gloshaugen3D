var importTerrain =  function( scene, callbackTerrainFinished) {
	console.log("Import terrain");

	var terrainFile = "../assets/gloshaugen.xyz";

	$.get( terrainFile, function( data ) {
		var terrain = data.replace(/"/g,'').split("\n");
		terrain.pop(); // since the last line in the file "gloshaugen.xyz" is empty
						
		var terrainInfo = getDataInfoFromTerrain(terrain);
		var bbox = terrainInfo.bbox; // "569900,7032300,570500,7033300";
		var widthVertices = terrainInfo.xVertices();
		var heightVertices = terrainInfo.yVertices();
		 
		var widthSegments = widthVertices - 1;
		var heightSegments = heightVertices - 1;

		var terrainHeight = 200; 
		var terrainWidth = terrainHeight * terrainInfo.xyVerticesRatio() ; 
		
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
		var material = new THREE.MeshLambertMaterial( {map: getMapTextureWms( bbox, 1000, 1000, useNorgeIBilder )/*, side : THREE.DoubleSide*/ }); 
		material.wireframe = false;

		console.log("Make Mesh");
		var terrainMesh = new THREE.Mesh( terrainGeometry, material);
		terrainMesh.name = "Terrain";

		// add the height values to terrainGeometry
		console.log("Adding terrain z-values")
		for ( var i = 0; i < terrainGeometry.vertices.length ; i++)  {
							
			terrainGeometry.vertices[i].z = 1*terrain[i].split(" ")[2];			

		}
			
		scene.add( terrainMesh );
			
		callbackTerrainFinished( terrainInfo, scale );
	});



}

var getMapTextureWms =  function (bbox, width, height, useNorgeIBilder) {
	

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

 
/*
	Iterates through the terrain array of format: array[i] = "x y z"
	object containing min values, max values, bbox etc. is returned.
*/
var getDataInfoFromTerrain = function( terrainArray ) {

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