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
			loader = loadObjBuilding;
			break;
		case "js":
			loader = loadJsonBuilding;
			break;
		case "debug":
			addDebugGeometriesToScene( terrainInfo, scale, scene, whenFinished); 
			return;
		case "none":
			console.log("Buildings is chosen to not be imported");
			whenFinished();
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
				geometry.computeVertexNormals(); // necessary for collision detection and raycasting

				// some buildings only shows a wall from the inside. fixes this by specifying double side
				for (var i = 0; i < materials.length; i++) {
					materials[i].side = THREE.DoubleSide;
				};


				// render buildings without the image texture, to compare performance
				if (getParameterFromUrl("greyBuildingColors") === "true" ) {
					var material = new THREE.MeshBasicMaterial( { color:'#555555', face:THREE.DoubleSide }); 
				}
				else {
					var material = new THREE.MeshFaceMaterial( materials );
				}	
				
				var object = new THREE.Mesh(geometry, material );
				whenFinished ( object );
			}

			var whenFinishedDae = function ( collada ) {
				var j;
				// compute vertex normals for collision detection.  
				var meshs =  collada.scene.children[0].children; // scene.children only contains one element
				for ( j = 0; j < meshs.length; j++ ) {
					var aMesh = meshs[j];
					if (aMesh.geometry) { // meshs also contains Object3Ds in addition to meshs
						aMesh.geometry.computeVertexNormals();
					}
				}

				whenFinished( collada.scene );
			}

			var whenFinishedObj = function ( object ) {
				var j;
				// compute vertex normals for collision detection. does not work :(.  
				for ( j = 0; j < object.children.length; j++ ) {
					var aMesh = object.children[j].children[0];
					aMesh.geometry.computeVertexNormals();

					// some buildings only shows a wall from the inside. fixes this by specifying double side
					aMesh.material.side = THREE.DoubleSide;
				}

				whenFinished( object );
			}

			var whenFinished = function ( object ) {



				//get coordinates from kml file
				var coords = {};
				var kmlDirectory = "../assets/3D-models/kml/";
				var fileName = url.split("/");  // Does this work on non windows platforms? / vs \?
				fileName = fileName[fileName.length-1];
				var kmlName = fileName.replace("." + objtype, ".kml");
				var urlKml = kmlDirectory + kmlName; 

				console.log("kml-file: " + urlKml);
				var kmlFileLoaded = function( kmlFile ) {
					
					var coords = $(kmlFile).find("Placemark").find("Model").find("Location");
					coords.lat = coords.find("latitude")[0].innerHTML;
					coords.lon = coords.find("longitude")[0].innerHTML;

					coords.utm = getUtmFromLonLat( coords.lon, coords.lat );

					// x-> y and y -> x as a matter of preference
					coords.Y = coords.utm.x 
					coords.X = coords.utm.y; 


					console.log("wgs84: " + coords.lat + ", "  + coords.lon);
					console.log("utm32: " + coords.Y + ", "  + coords.X);
							
					
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
				case "obj":
					loader( url, whenFinishedObj );
				default:
					loader( url, whenFinished );
			}

		}
		

		for ( i = 0; i < filePaths.length; i++ ) {

			helper(i, filePaths[i]);
		}

		console.log("Checkpoint, end of callbackGetFiles")
		whenFinished(); // As suspected, it is called before buldings is loaded. It is unfortunate with to methods of same name.

	
	}

	var directory = "../assets/3D-models/" + objtype + "/";
	getFilesInDirectory( directory , objtype , callbackGetFiles);
	
}




var getFilesInDirectory = function ( directory , fileExtension, callback) {
	console.log("Get dae files");

	var directoryLoaded = function( data ) {
		var i;	

		var files = $(data).find("a:contains(" + "." + fileExtension + ")");

		var urls = [];	

		for ( i = 0; i < files.length; i++) {

			var url = directory + files[i].innerHTML;

			// don't add if the file extension is in the end of the path, e.g. <dir>/somename.<file extension><more text>
			if ( isSuffix(url, fileExtension) ) {
				urls.push(url);
				console.log("Got ." + fileExtension + " path: " + url );
			} 

		}
		callback( urls );

	}

	var isSuffix = function  ( string, suffix ) {
		if (string.lastIndexOf( suffix ) !== -1 ) {
			return string.lastIndexOf(suffix) + suffix.length === string.length;
		}
		else {
			return false;
		}

	}

	// this did not work at github pages. 
	//$.get( directory, directoryLoaded);

	// so I made a file named fileList.html in the directory that will be used instead. Hopefully this can be improved later
	var path =  directory + "fileList.html";
	console.log("fileList path: " + path);
	$.get( path, directoryLoaded );

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

	// shrinked: should have been called shrunk
	if ( getParameterFromUrl("shrinked") === "true" ) {
		textureFolderPath = textureFolderPath + "shrinked/";
	}

	console.log("folder: " + textureFolderPath); 

	jsonLoader.load( url, callback, textureFolderPath);
	
}

// testing georeferenceBuilding()
var addDebugGeometriesToScene  = function ( terrainInfo, scale, scene, callback ) {
	console.log("addDebugGeometriesToScene");

	var x, y, xMin, yMin, xMax, yMax;
	var i;
	
	
	xMin = 569905;
	yMin = 7032305; 
	xMax = 570495;
	yMax = 7033295;

	var log = "";
	var sizeX = 5;
	var sizeY = 5;

	for (x = xMin; x <= xMax; x += 59) {
		for (y = yMin; y <= yMax; y += 99) {
		
			//if( x !== xMin && x !== xMax  && y !== yMin && y !== yMax){
			//	break;
			//}
			
			var boxG = new THREE.BoxGeometry( sizeX,sizeY,1 );
			var boxM = new THREE.MeshBasicMaterial( {color: 0xdd0000} );
			var boxMesh = new THREE.Mesh( boxG, boxM );
			
			var buildingInfo =  {
				X : x,
				Y : y	
			}

			georeferenceBuilding ( boxMesh , buildingInfo, terrainInfo, scale, "dae");

			log += "x,y,z: " + boxMesh.position.x + ", " +  boxMesh.position.y  + ", " +  boxMesh.position.z  + "\n";

			scene.add(boxMesh);
		
		}
		console.log(log);
	}

	// Add specific points:	
	var point1 = {
		name : 'Crossing path in the lawn between hovedbygget and sentralbygget',
		lat : 63.41860, 
		lon : 10.40277,
		Y   : 7032997,
		X 	: 570030
	}

	var point2 = {
		name : 'Center of roundabout near "lerkendalsbygget"',
		lat : 63.41489, 
		lon : 10.40756,
		Y   : 7032588,  
		X   : 570279
	}

	var point3 = {
		name : 'Upper east corner of realfagsbygget',
		lat : 63.41672, 
		lon : 10.40704,
		Y   : 7032792,  
		X   : 570248
	}


	var specificTestPoints = [ point1, point2, point3 ];

	var radius = 1;
	var height = 20;
	var convertFromWgsAnyway = true;
	for ( i = 0; i < specificTestPoints.length; i++ ) {


		var geometry = new THREE.CylinderGeometry( radius, radius, height );
		var material = new THREE.MeshBasicMaterial( { color: 0x0000ff} );
		var mesh = new THREE.Mesh(geometry, material); 

		var point = specificTestPoints[i];
		
		if ((!point.X || !point.Y) || convertFromWgsAnyway )  {
			point.utm = getUtmFromLonLat( point.lon, point.lat );
			// x-> y and y -> x as a matter of preference
			point.Y = point.utm.x 
			point.X = point.utm.y; 
		}

		console.log("name: " + point.name);
		console.log("wgs84: " + point.lat + ", "  + point.lon);
		console.log("utm32: " + point.Y + ", "  + point.X);
		
		georeferenceBuilding( mesh, point, terrainInfo, scale, "debug" );
		
		scene.add( mesh );

	}


	console.log("Callback");
	callback();		

}


var georeferenceBuilding = function ( object , buildingInfo, terrainInfo, scale, objecttype) {
	//console.log("georeferencing...");

	if ( objecttype === "dae") {
		object.scale.x *= scale.x;
		object.scale.y *= scale.y;
		object.scale.z *= scale.z;
	}
	// obj or js/native threejs 
	else {

		object.scale.x *= scale.x;
		object.scale.z *= scale.y;	// switch of z and y since default settings in blender exporter did this. should be checked if it is normal for obj and json objects in general
		object.scale.y *= scale.z; 

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

	if (buildingX < terrainInfo.minX || buildingX > terrainInfo.maxX 
		|| buildingY < terrainInfo.minY  || buildingY > terrainInfo.maxY) {
		console.log("building outside terrain data!");
		return 0; // there is no terrain data at this coordinate 
	}

	var localX = (buildingX - terrainInfo.minX)*scale.x;
	var localY = (buildingY - terrainInfo.minY)*scale.y;

	var verticesX = terrainInfo.xVertices(); // 60
	var verticesY = terrainInfo.yVertices(); // 100

	// need to document why this formulas is like this
	var terrainWidth = scale.x * (terrainInfo.maxX-terrainInfo.minX); 
	var terrainHeight = scale.y * (terrainInfo.maxY-terrainInfo.minY); 


	var xNumber = (localX) * (verticesX-1) / terrainWidth;
	var yNumber = (verticesY-1) - ((localY) * (verticesY-1) / terrainHeight); // Northvalues increases upwards, y-values increases downwords


	//Simplifying. :( Should do som interpolation
	var xNumber = Math.round(xNumber); // 
	var yNumber = Math.round(yNumber);


	var terrainIndex = yNumber*verticesX + xNumber; 
	var z = terrainGeometry.vertices[terrainIndex].z; // terrainGeometry is global


	return z;


}


