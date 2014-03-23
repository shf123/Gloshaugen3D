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
var globalDebugArray = []; // for debugging

var addDaeBuildingsToScene = function( terrainInfo, scale, scene, callback ) {
	
	var helper = function( i ) {

		var loader = new THREE.ColladaLoader();
		var aBuilding = buildings[i]; 

		loader.load (aBuilding.path, function (result) {


			console.log("3d model path: " + aBuilding.path);

			result.scene.scale.x *= scale.x;
			result.scene.scale.y *= scale.y;

			result.scene.position.x = (aBuilding.X - terrainInfo.averageX())*scale.x;
			result.scene.position.y = (aBuilding.Y - terrainInfo.averageY())*scale.y;

			result.scene.position.z = getVirtualZValue(aBuilding.X, aBuilding.Y, scale, terrainInfo);

			

			scene.add(result.scene);

			globalDebugArray.push(result);

			// debugging
			if ( debug ) {
				boundingBoxHovedbygg = new THREE.BoundingBoxHelper( result.scene, 0xffff00 );
				scene.add(boundingBoxHovedbygg);
				console.log("bbox: " + boundingBoxHovedbygg.box.min + " " + boundingBoxHovedbygg.box.max);
			}

			callback();

		});
	}

	var i;
	for ( i = 0; i < buildings.length; i++ ) {
		console.log("Building " + i)
		helper(i);

	}
	

}

var addObjBuildingsToScene = function( terrainInfo, scale, scene, callback)  {
var obj; // global for debuging
// Add hovedbygget from a .obj-file. Based on some hard coding and only adds hovedbygget. The rotation is not right at all.
	var objLoader = new THREE.OBJMTLLoader();
	objLoader.load ( "../assets/3D-models/obj/hovedbygget.obj", 
			"../assets/3D-models/obj/hovedbygget.mtl",
			function ( result ) {
				obj = result;
				result.scale.x *= scale.x;
				result.scale.z *= scale.y;
				result.scale.y = 0.5; // calculated guess

				result.position.x = (building1.X - terrainInfo.averageX())*scale.x;
				result.position.y = (building1.Y - terrainInfo.averageY())*scale.y;


				result.position.z = 1*getVirtualZValue(building1.X, building1.Y, scale, terrainInfo);

				// need to know the height of the 3D-model since position.z is the senterpoint of the 3D-model that is given her
				// how is it done? This is hardcoded so far and it is still not exacly correct
				result.position.z += building1.hardCodedHeightValue/2;
			
				
				// rotation of the building is not becoming right :(
				//result.lookAt(new THREE.Vector3( result.position.x, result.position.y, 0 )); // did not work as expected

				// this rotation works
				result.rotation.x = -Math.PI / 2; // point up
				result.rotation.y = Math.PI // rotate 180 degrees in the real Z-axis.
				result.rotation.z = Math.PI;


				scene.add(result);

				// debugging
				/*if (debug) {
					boundingBoxHovedbygg = new THREE.BoundingBoxHelper( result, 0xffff00 );
					scene.add(boundingBoxHovedbygg);
				}*/

				callback();

	});

}



// just Hovedbygget at this moment
var globJSON;
var addJsonBuildingsToScene = function( terrainInfo, scale, scene, callback)  {
	console.log("addJsonBuildingsToScene...");


	var jsonLoader = new THREE.JSONLoader();
	var url = "../assets/3D-models/threejsNative/hovedbygget/hovedbygget.js"
	jsonLoader.load( url,  function( geometry, materials ) {

		var material = new THREE.MeshFaceMaterial( materials );

		var mesh = new THREE.Mesh(geometry, material)
		globJSON = mesh;

		mesh.scale.x *= scale.x;
		mesh.scale.z *= scale.y;
		mesh.scale.y = 0.5; // calculated guess

		mesh.position.x = (building1.X - terrainInfo.averageX())*scale.x;
		mesh.position.y = (building1.Y - terrainInfo.averageY())*scale.y;


		mesh.position.z = 1*getVirtualZValue(building1.X, building1.Y, scale, terrainInfo);

		// need to know the height of the 3D-model since position.z is the senterpoint of the 3D-model that is given her
		// how is it done? This is hardcoded so far and it is still not exacly correct
		mesh.position.z += building1.hardCodedHeightValue/2;
		
	
		mesh.rotation.x = -Math.PI / 2; // point up
		mesh.rotation.y = Math.PI // rotate 180 degrees in the real Z-axis.
		mesh.rotation.z = Math.PI;

		

		scene.add(mesh);




		console.log("json building added");

		callback();

	});

}


var buildings = [];

// Do later: Automate the reading of the hardcoded values
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

