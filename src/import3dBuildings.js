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

	console.log("Adding buildings");
	var objtype = getParameterFromUrl("model") || "collada";
	
	var loader;
	switch(objtype) {

		case "obj":
			loader = addObjBuildingsToScene;
			break;
		case "js":
			loader = addJsonBuildingsToScene;
			break;
		default:
			loader = addDaeBuildingsToScene;
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
					
					georeferenceBuilding( object, coords, terrainInfo, scale, objtype);
					
					scene.add( object );
				
				} 
				$.get( urlKml, kmlFileLoaded );

			} 

			

			if ( objtype === "js") {
				loader( terrainInfo, scale, scene, url, whenFinishedJson );
			}
			else {
				loader( terrainInfo, scale, scene, url, whenFinished );
				
			}

		}
		

		for ( i = 0; i < filePaths.length; i++ ) {

			helper(i, filePaths[i]);
		}

		whenFinished(); // render()
	
	}

	var directory = "../assets/3D-models/" + objtype + "/";
	getFilesInDirectory( directory , objtype , callbackGetFiles);


	//console.log("Buildings added");
	

}


var globalDebugArray = []; // for debugging
var addDaeBuildingsToScene = function( terrainInfo, scale, scene, callback ) {
	
	var helper = function( i ) {

		var loader = new THREE.ColladaLoader();
		//var aBuilding = buildings[i]; 
		var daeUrl = daeBuildingUrls[i];

		loader.load (daeUrl, function (result) {

			console.log("3d model path: " + daeUrl);

			
			//get coordinates from kml file
			var coords = {};
			var urlKml = daeUrl.replace(".dae", ".kml"); 
			var kmlFileLoaded = function( kmlFile ) {
				var coords = $(kmlFile).find("Placemark").find("Model").find("Location");
				coords.lat = coords.find("latitude")[0].innerHTML;
				coords.lon = coords.find("longitude")[0].innerHTML;

				coords.utm = getUtmFromLonLat( coords.lon, coords.lat );

				// x-> y and y -> x as a matter of preference
				coords.Y = coords.utm.x 
				coords.X = coords.utm.y; 

				georeferenceBuilding( result.scene, coords, terrainInfo, scale, "dae");

				scene.add(result.scene);
				
			} 
			$.get( urlKml, kmlFileLoaded );

			
		});
	}

	var directory = "./../assets/3D-models/collada/";
	// assumes excistence of kml-file with same name for getting coordinates. Are using kml since they are a part of the availiable kmz-files
	
	var daeBuildingUrls;
	var callbackGetDaeFilesIn = function( daeFilePaths ) {
		console.log("for loop helper(i)");
		var i;

		daeBuildingUrls = daeFilePaths;

		for ( i = 0; i < daeBuildingUrls.length; i++ ) {
			console.log("Building " + i)
			helper(i);

		}
	}
	
	getFilesInDirectory( directory , ".dae", callbackGetDaeFilesIn);

	
	
	callback();
	

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

var addObjBuildingsToScene = function( terrainInfo, scale, scene, callback)  {


	var callbackGetObjFiles = function ( objFilePaths ) {
		var i;

		var helper = function (i, objUrl) {
			var mtlUrl = objUrl.replace(".obj", ".mtl");
			var objLoader = new THREE.OBJMTLLoader();
			objLoader.load ( objUrl, mtlUrl,
					function ( result ) {


				//get coordinates from kml file
				var coords = {};
				var urlKml = objUrl.replace(".obj", ".kml"); 
				var kmlFileLoaded = function( kmlFile ) {
					var coords = $(kmlFile).find("Placemark").find("Model").find("Location");
					coords.lat = coords.find("latitude")[0].innerHTML;
					coords.lon = coords.find("longitude")[0].innerHTML;

					coords.utm = getUtmFromLonLat( coords.lon, coords.lat );

					// x-> y and y -> x as a matter of preference
					coords.Y = coords.utm.x 
					coords.X = coords.utm.y; 

					
					georeferenceBuilding( result, coords, terrainInfo, scale, "obj");
					
					scene.add(result);
				
				} 
			$.get( urlKml, kmlFileLoaded );


			});
		}
		

		for ( i = 0; i < objFilePaths.length; i++ ) {

			helper(i, objFilePaths[i]);
		}

		callback(); // render()
		
	}

	var directory = "../assets/3D-models/obj/";
	getFilesInDirectory( directory , ".obj", callbackGetObjFiles);

}



// just Hovedbygget at this moment
var addJsonBuildingsToScene = function( terrainInfo, scale, scene, url, callback)  {
	console.log("addJsonBuildingsToScene...");


	var jsonLoader = new THREE.JSONLoader();

	// give folder path: 
	var textureFolderPath = url.replace(".js","") + "/";	
	console.log("folder: " + textureFolderPath); 

	jsonLoader.load( url, callback, textureFolderPath);

	/*
	var callbackGetJsonFiles = function ( jsonFilePaths ) {
		var i;

		var helper = function (i, jsonUrl) {


			var jsonLoader = new THREE.JSONLoader();

			// give folder path: 
			var textureFolderPath = jsonUrl.replace(".js","") + "/";	
			console.log("folder: " + textureFolderPath); 

			jsonLoader.load( jsonUrl,  function( geometry, materials ) {

				//get coordinates from kml file
				var coords = {};
				var urlKml = jsonUrl.replace(".js", ".kml"); 
				var kmlFileLoaded = function( kmlFile ) {
					var coords = $(kmlFile).find("Placemark").find("Model").find("Location");
					coords.lat = coords.find("latitude")[0].innerHTML;
					coords.lon = coords.find("longitude")[0].innerHTML;

					coords.utm = getUtmFromLonLat( coords.lon, coords.lat );

					// x-> y and y -> x as a matter of preference
					coords.Y = coords.utm.x 
					coords.X = coords.utm.y; 


					var material = new THREE.MeshFaceMaterial( materials );
					var mesh = new THREE.Mesh(geometry, material)

		
					georeferenceBuilding( mesh, coords, terrainInfo, scale, "json");
					
					scene.add(mesh);
				
				} 
				$.get( urlKml, kmlFileLoaded );
		
				
				callback();

			}, textureFolderPath);

		}
		
		console.log("Adding " + jsonFilePaths.length + " buildings");

		for ( i = 0; i < jsonFilePaths.length; i++ ) {

			helper(i, jsonFilePaths[i]);
		}

		callback(); // render()
		
	}

	var directory = "../assets/3D-models/threejsNative/";
	getFilesInDirectory( directory , ".js", callbackGetJsonFiles);
	*/

	
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
		
			
			var boxG = new THREE.BoxGeometry( 10,10,1 );
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
		object.scale.z *= scale.y;	
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

	//console.log("buildingX: " + buildingX);
	//console.log("buildingY: " + buildingY);

	var localX = (buildingX - terrainInfo.minX)*scale.x;
	var localY = (buildingY - terrainInfo.minY)*scale.y;

	var verticesX = terrainInfo.xVertices();
	var verticesY = terrainInfo.yVertices();

	// need to document why this formulas is like this
	var terrainWidth = scale.x * (terrainInfo.maxX-terrainInfo.minX); 
	var terrainHeight = scale.y * (terrainInfo.maxY-terrainInfo.minY); 


	var xNumber = (localX) * verticesX / terrainWidth;
	var yNumber = (verticesY-1) - ((localY) * verticesY / terrainHeight); // Northvalues increases upwards, y-values increases downwords

	//console.log("xNumber: " + xNumber);
	//console.log("yNumber: " + yNumber);

	//Simplifying. :( Should do som interpolation
	var xNumber = Math.round(xNumber);
	var yNumber = Math.round(yNumber);

	// should by verticesX instead of verticesY
	var terrainIndex = yNumber*verticesX + xNumber;
	//console.log("terrainIndex: " + terrainIndex);
	var z = terrainGeometry.vertices[terrainIndex].z; // assumes terrainGeometry is global :(
	//console.log("Z-value: " + z);



	return z;


}

console.log("import3dBuildings");
