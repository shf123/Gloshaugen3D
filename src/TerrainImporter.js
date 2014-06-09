function TerrainImporter ( callback ) {

	var that = this; // need it for the jquery($.get) callback 
	this.callback = callback;


	this.importTerrainFile = function( terrainFilePath ) {
		// TODO: Check that the file type is correct
		this.loadTextFile( terrainFilePath, xyzFileLoaded ); 
	};

	this.importTerrainWCS = function( wcsName, bbox ) {
		// it is not ideal that width and height is hardcoded. This will cause the resolution to depend on the bbox.
		// The parameters RESX and RESY may be safer to use instead of WIDTH and HEIGHT. 
		var url = wcsServices.toString( wcsName, bbox, 100, 100 ); // width and height = 100.

		
		var format = wcsServices[wcsName].parameters.format;
		switch(format) {
			case "xyz":
				this.loadTextFile( url, xyzFileLoaded );	
				break;
			default: 
				throw new Error("The format '" + format + "' is not supported!" );
		}

		
	};

	this.loadTextFile = function( url, callback ) {
		$.get( url,  callback );
	};

	var xyzFileLoaded = function( data ) {
		
		var terrain = that.splitTextFile( data );
		var terrainInfo = that.getDataInfoFromTerrain(terrain);
		
		// import3dBuildings.js depends on terrainGeometry to be global. TODO: fix it
		terrainGeometry = makeFlatTerrainGeometry( terrainInfo );

		var scale = getScale( terrainGeometry, terrainInfo); 

		giveZValuesToGeometry( terrainGeometry, terrain, scale.z );

		var terrainMaterial = makeTerrainMaterial( terrainInfo );

		var terrainMesh = makeTerrainMesh ( terrainGeometry, terrainMaterial );

		
			
		callback( terrainMesh, terrainInfo, scale );

	};

	var makeFlatTerrainGeometry = function( terrainInfo ) {

		var widthSegments = terrainInfo.xVertices() - 1;
		var heightSegments = terrainInfo.yVertices() - 1;
		
		var terrainHeight = 200; 
		var terrainWidth = terrainHeight * terrainInfo.xyLengthRatio(); 

		return new THREE.PlaneGeometry( terrainWidth, terrainHeight, widthSegments, heightSegments);	
	};

	var giveZValuesToGeometry = function ( terrainGeometry, terrain, scaleZ ) {
		// add the height values to terrainGeometry
		for ( var i = 0; i < terrainGeometry.vertices.length ; i++)  {
							
			terrainGeometry.vertices[i].z = 1*terrain[i].split(" ")[2]*scaleZ;			

		}
	};

	var makeTerrainMaterial = function( terrainInfo ) {
		
		// for testing purposes:
		if (getParameterFromUrl("randonTerrainColor") === "true" ) {
			return new THREE.MeshLambertMaterial( { color:'#'+ Math.floor(Math.random()*16777215).toString(16) });
		}

		var bbox = terrainInfo.bbox;
		
		var wmsName;
		if ( getParameterFromUrl( "norgeIBilder" ) === "true" ) {
			wmsName = "wmsGeoNorge";
		}
		else {
			wmsName = "wmsKartverket";
		}

		return new THREE.MeshLambertMaterial( { map: getMapTextureWms( bbox, 1000, 1000, wmsName ), face:THREE.DoubleSide } ); 
	};	

	var makeTerrainMesh = function( terrainGeometry, terrainMaterial ) {
		var terrainMesh = new THREE.Mesh( terrainGeometry, terrainMaterial);
		terrainMesh.name = "Terrain";
		return terrainMesh;
	};

	

	var getScale = function( terrainGeometry, terrainInfo ) {
		
		var scale = {
			x : Math.abs( terrainGeometry.width  / (terrainInfo.maxX - terrainInfo.minX) ),
			y : Math.abs( terrainGeometry.height / (terrainInfo.maxY - terrainInfo.minY) )  
		};
		scale.z = ( scale.x + scale.y )/ 2;

		return scale;
	};

	var getMapTextureWms =  function (bbox, width, height, wmsName) {
		
		// it is quicker to useStoredTexture
		if ( getParameterFromUrl("useStoredTexture") === "true") {
			var path = getParameterFromUrl("norgeIBilder") === "true" ? "../assets/textureSat.png" : "../assets/texture.png";
			return THREE.ImageUtils.loadTexture(path); 
		}
		
		var url = wmsServices.toString( wmsName, bbox, width, height );

		

		console.log("texture url: " + url);
		var imageUtilsCors = THREE.ImageUtils;
		imageUtilsCors.crossOrigin = 'anonymous'; // From Release 65 of THREE.js this line is necessary
		
		return imageUtilsCors.loadTexture(url);

	};

	 
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
			},
			"xyLengthRatio" : function() {
				return ( maxX-minX ) / ( maxY-minY ) ;
			}
		};




		return dataInfo;

	};

	this.splitTextFile = function( textFile ) {
		var textArray =  textFile.replace(/"/g,'').split("\n");

		if (textArray[ textArray.length-1 ] === "") {
			textArray.pop(); // since the last line in the "*.xyz" file is empty
		}

		return textArray; 
	};

	/*
		Is used by wmsServices and wcsServices as the toString method. It makes 
		an url based on the wms/wcs information
	*/
	var wxsServicesToString = function( name, bbox, width, height ) {
		var parameter, value; 
		var url = this[name].baseUrl + "?";
		var parameters = this[name].parameters;
		
		for ( parameter in parameters) {
			if ( parameters.hasOwnProperty( parameter ) ) {
				value = parameters[parameter];
				url = url + parameter + "=" + value + "&";	
			}
		}
		
		url = url + "bbox" + "=" + bbox + "&";
		url = url + "width" + "=" + width + "&";
		url = url + "height" + "=" + height;

		return url;
		
	};

	var wmsServices = {
		wmsKartverket : {
			baseUrl : 'http://openwms.statkart.no/skwms1/wms.topo2',	
			parameters : {
			service : 'wms',
			version : '1.3.0',
			request : 'getmap',
			format : 'image/png',
			crs : 'EPSG:32632', // UTM32 
			srs : 'EPSG:32632',  // UTM32
			layers : topo2layers // in topo2.layers.js 
			}
		},
		wmsGeoNorge : {
			baseUrl : 'http://wms.geonorge.no/skwms1/wms.norgeibilder',	
			parameters : {
			service : 'wms',
			version : '1.3.0',
			request : 'getmap',
			format : 'image/png',
			crs : 'EPSG:32632', // UTM32 
			srs : 'EPSG:32632',  // UTM32
			layers : "OrtofotoAlle" 
			}
		},
		toString : wxsServicesToString
	};


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
			}
		},
		toString : wxsServicesToString
	};


	// method from http://philipwalton.com/articles/how-to-unit-test-private-functions-in-javascript/ 
	// I'll maybe start to use this method instead of having public methods that should be private
	/* test-code */
	//this.__testonly__.<method> = <method>;
	/* end-test-code */

	

}