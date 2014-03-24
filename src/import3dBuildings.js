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
	switch(objtype) {

		case "obj":
		// just Hovedbygget at this moment
			addObjBuildingsToScene( terrainInfo, scale, scene, whenFinished );
			break;
		case "json":
		// just Hovedbygget at this moment
			addJsonBuildingsToScene( terrainInfo, scale, scene, whenFinished );
			break;
		case "debug":
			addDebugGeometriesToScene( terrainInfo, scale, scene, whenFinished );
			break;
		default:
			addDaeBuildingsToScene( terrainInfo, scale, scene, whenFinished );
			break;

	}
	console.log("Buildings added");
	

}


var globalDebugArray = []; // for debugging
var addDaeBuildingsToScene = function( terrainInfo, scale, scene, callback ) {
	
	var helper = function( i ) {

		var loader = new THREE.ColladaLoader();
		var aBuilding = buildings[i]; 

		loader.load (aBuilding.path, function (result) {

			console.log("3d model path: " + aBuilding.path);

			georeferenceBuilding( result.scene, aBuilding, terrainInfo, scale, "dae");



			scene.add(result.scene);

			
			// debugging
			globalDebugArray.push(result);
			if ( debug ) {
				boundingBoxHovedbygg = new THREE.BoundingBoxHelper( result.scene, 0xffff00 );
				scene.add(boundingBoxHovedbygg);
				console.log("bbox: " + boundingBoxHovedbygg.box.min + " " + boundingBoxHovedbygg.box.max);
			}

			

		});
	}

	var i;
	for ( i = 0; i < buildings.length; i++ ) {
		console.log("Building " + i)
		helper(i);

	}

	callback();
	

}

var addObjBuildingsToScene = function( terrainInfo, scale, scene, callback)  {
var obj; // global for debuging
// Add hovedbygget from a .obj-file. Based on some hard coding and only adds hovedbygget. The rotation is not right at all.
	var objLoader = new THREE.OBJMTLLoader();
	objLoader.load ( "../assets/3D-models/obj/hovedbygget.obj", 
			"../assets/3D-models/obj/hovedbygget.mtl",
			function ( result ) {
				
				georeferenceBuilding( result, building1, terrainInfo, scale, "obj");
				
				scene.add(result);

				callback(); // render()

	});

}



// just Hovedbygget at this moment
var addJsonBuildingsToScene = function( terrainInfo, scale, scene, callback)  {
	console.log("addJsonBuildingsToScene...");


	var jsonLoader = new THREE.JSONLoader();
	var url = "../assets/3D-models/threejsNative/hovedbygget/hovedbygget.js"
	jsonLoader.load( url,  function( geometry, materials ) {

		var material = new THREE.MeshFaceMaterial( materials );
		var mesh = new THREE.Mesh(geometry, material)
		
		georeferenceBuilding( mesh, building1, terrainInfo, scale, "json");	

		scene.add(mesh);

		
		
		callback();

	});

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

var buildings = [];

// Do later: Automate the reading of the hardcoded values. 
// Hovedbygget
var building1 =  {
	srs : "UTM32",
	lat : 63.419298, // hardcoded from a kml-file 
	lon : 10.402173, // hardcoded from a kml-file 
	path : "./../assets/3D-models/collada/Models with resized images/Grp 7 Hovedbygg Gloshaugen.dae",
}

// VM-brakke
var building2 =  {
	srs : "UTM32",
	lat : 63.41729721313, // hardcoded from a kml-file 
	lon : 10.40790886266, // hardcoded from a kml-file 
	path : "./../assets/3D-models/collada/VM-brakke.dae",
}

// Elektro. Textures need to be resized to 2^x to fix texture issue. Will do that later. Also need to import bigger area of terrain 
// On this builing it is also very obvious that not accounting for unhomogen terrain below an building is not good enougth.
var building3 =  {
	srs : "UTM32",
	lat : 63.41797145098, // hardcoded from a kml-file 
	lon : 10.40039257524, // hardcoded from a kml-file 
	path : "./../assets/3D-models/collada/elektro.dae",
}


// Berg. Textures need to be resized to fix texture issue. Will do that later
var building4 =  {
	srs : "UTM32", 
	lat : 63.41732442736, // hardcoded from a kml-file 
	lon : 10.40664009821, // hardcoded from a kml-file 
	path : "./../assets/3D-models/collada/berg2.dae",
}


buildings.push(building1);
buildings.push(building2);
buildings.push(building3);
buildings.push(building4);

var i, aBuilding;
for (i = 0; i < buildings.length; i++) {
	aBuilding = buildings[i];

	aBuilding.utm = getUtmFromLonLat( aBuilding.lon, aBuilding.lat );

	// x-> y and y -> x as a matter of preference
	aBuilding.Y = aBuilding.utm.x // building1.Y = 7033073.6101;
	aBuilding.X = aBuilding.utm.y; // building1.X = 570003.0541;


}
