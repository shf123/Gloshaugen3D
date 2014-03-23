"use strict";

console.log("import3dBuildings");

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

var georeferenceBuilding = function ( object , buildingInfo, terrainInfo, scale, objecttype) {
	console.log("georeferencing...");

	if ( objecttype === "dae") {
		object.scale.x *= scale.x;
		object.scale.y *= scale.y;
		object.scale.z *= 0.5;
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

	// need to know the height of the 3D-model since position.z is the senterpoint of the 3D-model that is given her
	// how is it done? This is hardcoded so far and it is still not exacly correct. Maybe all vertices in object need to be traversed to find diff between max and min height value
	object.position.z += buildingInfo.hardCodedHeightValue/2;

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


var buildings = [];

// Do later: Automate the reading of the hardcoded values. 
// Hovedbygget
var building1 =  {
	srs : "UTM32",
	lat : 63.419298, // hardcoded from a kml-file 
	lon : 10.402173, // hardcoded from a kml-file 
	heading : 1.254111853776, //  hardcoded from a kml-file. is it needed?
	path : "./../assets/3D-models/collada/Models with resized images/Grp 7 Hovedbygg Gloshaugen.dae",
	hardCodedHeightValue : 22 // :(
}

// VM-brakke
var building2 =  {
	srs : "UTM32",
	lat : 63.41729721313, // hardcoded from a kml-file 
	lon : 10.40790886266, // hardcoded from a kml-file 
	heading : 1.259220470449, //  hardcoded from a kml-file. is it needed?
	path : "./../assets/3D-models/collada/VM-brakke.dae",
	hardCodedHeightValue : 5
}

// Elektro. Textures need to be resized to 2^x to fix texture issue. Will do that later. 
var building3 =  {
	srs : "UTM32",
	lat : 63.41797145098, // hardcoded from a kml-file 
	lon : 10.40039257524, // hardcoded from a kml-file 
	heading : 1.252504804224, //  hardcoded from a kml-file. is it needed?
	path : "./../assets/3D-models/collada/elektro.dae",
	hardCodedHeightValue : 5
}


// Berg. Textures need to be resized to fix texture issue. Will do that later
var building4 =  {
	srs : "UTM32",
	lat : 63.41732442736, // hardcoded from a kml-file 
	lon : 10.40664009821, // hardcoded from a kml-file 
	heading : 1.252504804224, //  hardcoded from a kml-file. is it needed?
	path : "./../assets/3D-models/collada/berg2.dae",
	hardCodedHeightValue : 10
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

