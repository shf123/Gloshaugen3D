"use strict";

var getUtmFromLonLat = function ( lon, lat, lon0, lat0, ellipsoid, coordSystem ) {

	var hjs = Holsen();
	
	var lon0 = lon0 || 9; // 9 -> UTM32
	var lat0 =  lat0 || 0;

	var elipsoid = ellipsoid || hjs.getEllipsoids().wgs84;
	var coordSystem = coordSystem || hjs.getCoordsystems().UTM;

	hjs.setEllipsoid(elipsoid);
	hjs.setCoordsystem(coordSystem);

	var utm = hjs.bl_to_xy(lon, lat, lon0, lat0);

	console.log(utm);
	return utm;

}

var addBuildingsToScene = function( terrainInfo, scale, scene, whenFinished  ) {

	console.log("Adidng buildings");
	var objtype = getParameterFromUrl("model") || "collada";


	var loader;
	switch(objtype) {

		case "obj":
			loader = loadObjBuilding;
			break;
		case "js":
			loader = loadJsonBuilding;
			break;
		case "debug":
			addDebugGeometriesToScene( terrainInfo, scale, scene, whenFinished); 
			return;
		default:
			objtype = "dae";
			loader = loadDaeBuilding;
			break;
	}


	var callbackGetFiles = function ( filePaths ) {
		var i;

		var helper = function (i, url) {
		
			var whenFinishedJson = function( geometry, materials) {
				var material = new THREE.MeshFaceMaterial( materials );
				var object = new THREE.Mesh(geometry, material );
				whenFinished ( object );
			}

			var whenFinishedDae = function ( collada ) {
				whenFinished( collada.scene );
			}

			var whenFinished = function ( object ) {

				//get coordinates from kml file
				var coords = {};
				var urlKml = url.replace("." + objtype, ".kml"); 
				var kmlFileLoaded = function( kmlFile ) {
					
					var coords = $(kmlFile).find("Placemark").find("Model").find("Location");
					coords.lat = coords.find("latitude")[0].innerHTML;
					coords.lon = coords.find("longitude")[0].innerHTML;

					coords.utm = getUtmFromLonLat( coords.lon, coords.lat );

					// x-> y and y -> x as a matter of preference
					coords.Y = coords.utm.x 
					coords.X = coords.utm.y; 		
					
					georeferenceBuilding( object, coords, terrainInfo, scale, objtype );
					
					scene.add( object );
				
				} 
				$.get( urlKml, kmlFileLoaded );

			} 

			switch(objtype) {
				case "dae":
					loader( url, whenFinishedDae );
					break;
				case "js":
					loader( url, whenFinishedJson );
					break;
				default:
					loader( url, whenFinished );
			}

		}
		

		for ( i = 0; i < filePaths.length; i++ ) {

			helper(i, filePaths[i]);
		}

		whenFinished(); // render()
	
	}

	var directory = "../assets/3D-models/" + objtype + "/";
	getFilesInDirectory( directory , objtype , callbackGetFiles);
	
}




var getFilesInDirectory = function ( directory , fileExtension, callback) {
	console.log("Get dae files");

	var directoryLoaded = function( data ) {
		var i;	

		var daeFilesHtml = $(data).find("a:contains(" + "." + fileExtension + ")");

		var urls = [];	

		for ( i = 0; i < daeFilesHtml.length; i++) {

			var urlDae = directory + daeFilesHtml[i].innerHTML;
			urls.push(urlDae);

			console.log("Got ." + fileExtension + " path: " + urlDae );
			


		}
		callback( urls );

	}

	$.get( directory, directoryLoaded);


}

var loadDaeBuilding = function( url, callback ) {
	
	var loader = new THREE.ColladaLoader();
	loader.load (url, callback );
}

var loadObjBuilding = function( url, callback)  {


	var mtlUrl = url.replace(".obj", ".mtl"); 
	var objLoader = new THREE.OBJMTLLoader();
	objLoader.load ( url, mtlUrl, callback );


}

var loadJsonBuilding = function( url, callback)  {

	var jsonLoader = new THREE.JSONLoader();

	// give folder path: 
	var textureFolderPath = url.replace(".js","") + "/";	
	console.log("folder: " + textureFolderPath); 

	jsonLoader.load( url, callback, textureFolderPath);
	
}

// testing georeferenceBuilding()
var addDebugGeometriesToScene = function ( terraininfo, scale, scene, callback ) {
	console.log("addDebugGeometriesToScene");

	var x, y, xMin, yMin, xMax, yMax;
	xMin = 569905;
	yMin = 7032305;
	xMax = 570495;
	yMax = 7033295;



	var log = "";
	for (x = xMin; x < xMax; x += 10*2) {
		for (y = yMin; y < yMax; y += 10*2) {
		
			
			var boxG = new THREE.BoxGeometry( 5,5,1 );
			var boxM = new THREE.MeshBasicMaterial( );
			var boxMesh = new THREE.Mesh( boxG, boxM );
			
			var buildingInfo =  {
				X : x,
				Y : y	
			}

			georeferenceBuilding ( boxMesh , buildingInfo, terraininfo, scale, "dae");

			log += "x,y,z: " + boxMesh.position.x + ", " +  boxMesh.position.y  + ", " +  boxMesh.position.z  + "\n";

			scene.add(boxMesh);
		
		}
		console.log(log);
	}
	console.log("Callback");
	callback();		

}


var georeferenceBuilding = function ( object , buildingInfo, terrainInfo, scale, objecttype) {
	//console.log("georeferencing...");

	if ( objecttype === "dae") {
		object.scale.x *= scale.x;
		object.scale.y *= scale.y;
		object.scale.z *= 0.5; // calculated guess
	}
	// obj or js/native threejs 
	else {

		object.scale.x *= scale.x;
		object.scale.z *= scale.y;	// switch of z and y since default settings in blender exporter did this. should be checked if it is normal for obj and json objects in general
		object.scale.y *= 0.5; // calculated guess

		// this rotation works
		object.rotation.x = -Math.PI / 2; // point up
		object.rotation.y = Math.PI // rotate 180 degrees in the real Z-axis.
		object.rotation.z = Math.PI;

	}
	

	// x and y is possible not exactly right since it does not fit the map texture exactly
	object.position.x = (buildingInfo.X - terrainInfo.averageX())*scale.x;
	object.position.y = (buildingInfo.Y - terrainInfo.averageY())*scale.y;

	object.position.z = getVirtualZValue(buildingInfo.X, buildingInfo.Y, scale, terrainInfo);


}

var getVirtualZValue = function(buildingX, buildingY, scale, terrainInfo) {

	var localX = (buildingX - terrainInfo.minX)*scale.x;
	var localY = (buildingY - terrainInfo.minY)*scale.y;

	var verticesX = terrainInfo.xVertices();
	var verticesY = terrainInfo.yVertices();

	// need to document why this formulas is like this
	var terrainWidth = scale.x * (terrainInfo.maxX-terrainInfo.minX); 
	var terrainHeight = scale.y * (terrainInfo.maxY-terrainInfo.minY); 


	var xNumber = (localX) * verticesX / terrainWidth;
	var yNumber = (verticesY-1) - ((localY) * verticesY / terrainHeight); // Northvalues increases upwards, y-values increases downwords


	//Simplifying. :( Should do som interpolation
	var xNumber = Math.round(xNumber);
	var yNumber = Math.round(yNumber);


	var terrainIndex = yNumber*verticesX + xNumber;
	var z = terrainGeometry.vertices[terrainIndex].z; // terrainGeometry is global


	return z;


}


