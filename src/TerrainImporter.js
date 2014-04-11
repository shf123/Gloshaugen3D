function TerrainImporter ( callback ) {

	var that = this; // need it for the jquery($.get) callback 
	this.callback = callback;


	this.importTerrainFile = function( terrainFilePath ) {
		this.loadTextFile( terrainFilePath, xyzLoaded );
		

	}

	this.importTerrainWCS = function( wcsName, bbox ) {
		var url = wcsServices.toString( wcsName, bbox );
		this.loadTextFile( url, xyzLoaded );
	}

	this.loadTextFile = function( url, callback ) {
		$.get( url,  callback );
	}

	var xyzLoaded = function( data ) {
		var terrain = that.splitTextFile( data );

		
		var terrainInfo = that.getDataInfoFromTerrain(terrain);
		var bbox = terrainInfo.bbox; // "569900,7032300,570500,7033300";
		var widthVertices = terrainInfo.xVertices();
		var heightVertices = terrainInfo.yVertices();
		 
		var widthSegments = widthVertices - 1;
		var heightSegments = heightVertices - 1;

		var terrainHeight = 200; 
		var terrainWidth = terrainHeight * terrainInfo.xyVerticesRatio() ; 
		
		var scale = {
		  	x : Math.abs(terrainWidth/(terrainInfo.maxX-terrainInfo.minX)),
			y : Math.abs(terrainHeight/(terrainInfo.maxY-terrainInfo.minY))  
		  };
		scale.z = (scale.x+scale.y)/2 
		  
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
							
			terrainGeometry.vertices[i].z = 1*terrain[i].split(" ")[2]*scale.z;			

		}
			
		callback( terrainMesh, terrainInfo, scale );

	}

	var getMapTextureWms =  function (bbox, width, height, useNorgeIBilder) {
		
		console.log( "bbox: " + bbox);
			
		if ( getParameterFromUrl("useStoredTexture") === "true") {
			var path = getParameterFromUrl("norgeIBilder") === "true" ? "../assets/textureSat.png" : "../assets/texture.png";
			return THREE.ImageUtils.loadTexture(path); 
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
	this.getDataInfoFromTerrain = function( terrainArray ) {

		var i, point, minX, minY, minZ, maxX, maxY, maxZ;
		var resolutionX, resolutionY; // assumes homogeniously  resolution in X and Y. 
		var numberOfPoints = terrainArray.length;

		// start values for min, max and resolution
		var firstPoint = terrainArray[0].split(" ");
		minX = maxX = firstPoint[0];
		minY = maxY = firstPoint[1];
		minZ = maxZ = firstPoint[2];
		resolutionX = 10000000; // random huge number
		resolutionY = 10000000; // random huge number

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
				resolutionX = Math.min(resolutionX, Math.abs(firstPoint[0]-point[0]));
			}
			if (firstPoint[1] !== point[1]) {
				resolutionY = Math.min(resolutionY, Math.abs(firstPoint[1]-point[1]));
			}
		}
	   
		var dataInfo = {
			"minX" : minX,
			"maxX" : maxX,
			"minY" : minY,
			"maxY" : maxY,
			"minZ" : minZ,
			"maxZ" : maxZ,
			"resolutionX" : resolutionX,
			"resolutionY" : resolutionY,

			"bbox" : minX + "," + minY + "," + maxX + "," + maxY,

			"length" : numberOfPoints,	

			"averageX" : function() {
				return (this.minX+this.maxX) / 2;
			},

			"averageY" : function() {
				return (this.minY+this.maxY) / 2;
			},

			"xyVerticesRatio" : function() {
				return this.xVertices() / this.yVertices();
			}, 
			"xVertices" : function() {
				return ( this.maxX - this.minX ) / this.resolutionX  + 1;
			}, 
			"yVertices" : function() {
				return ( this.maxY - this.minY ) / this.resolutionY + 1 ;
			}
		}




		return dataInfo;

	}

	this.splitTextFile = function( textFile ) {
		var textArray =  textFile.replace(/"/g,'').split("\n");

		if (textArray[ textArray.length-1 ] === "") {
			textArray.pop(); // since the last line in the file "*.xyz" is empty when using importTerrainFile
		}

		return textArray; 
	}

	var wcsServices = { 
		wcsKartverket : {
			baseUrl : 'http://openwms.statkart.no/skwms1/wcs.dtm',	
			parameters : {
			service : 'WCS',
			version : '1.0.0',
			request : 'GetCoverage',
			format : 'xyz',
			crs : 'EPSG:32632', // UTM32 
			srs : 'EPSG:32632',  // UTM32
			coverage : 'land_utm33_10m', // name of layer
			width : 100, // TODO: a relation between wcs and wms width and height should be added
			height : 100 
			}
		},
		toString : function( name, bbox ) {
			var parameter, value; 
			var url = this[name].baseUrl + "?";
			var parameters = this[name].parameters;
			
			for ( parameter in parameters) {
				value = parameters[parameter];
				url = url + parameter + "=" + value + "&";
			}
			
			url = url + "bbox" + "=" + bbox;
			
			return url;
			
		}
	}


	/*return { 
		'importTerrainFile' : importTerrainFile, 
		
	}; */

}