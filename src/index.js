// use strict version of js
//"use strict";
    
var scene, camera, renderer, controls;
var debug = getParameterFromUrl("debug") || false; // show some debug info
var debugVariable;

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
		 
		 // hardcoded ratio based on clipping parameters in gdal :(. TODO: Those can also be calculated by going through the terrain array
		var bbox = "569900,7032300,570500,7033300";
		var widthHeightRatio = Math.abs((569900-570500)/(7032300-7033300)); // = 0.6
		var widthVertices = Math.sqrt(terrain.length * widthHeightRatio); 
		var heightVertices = terrain.length / widthVertices; 
		 
		var widthSegments = widthVertices - 1;
		var heightSegments = heightVertices - 1;
		 averageX = (569900+570500)/2;
		 averageY = (7032300+7033300)/2;


		  scaleX = Math.abs(terrainWidth/(569900-570500));
		  scaleY = Math.abs(terrainHeight/(7032300-7033300));
		  scaleZ = Math.abs(1);

		console.log("Make PlaneGeometry");
		 terrainGeometry = new THREE.PlaneGeometry( terrainWidth, terrainHeight, widthSegments, heightSegments);
		
		

		var useNorgeIBilder = false;
		if ( getParameterFromUrl( "norgeIBilder" ) === "true" ) {
			useNorgeIBilder = true;
		}

		console.log("Make Material");
		var material = new THREE.MeshLambertMaterial( {map: getMapTextureWms( bbox, 1000, 1000, useNorgeIBilder ) }); 
		
		console.log("Make Mesh");
		var terrainMesh = new THREE.Mesh( terrainGeometry, material);
		terrainMesh.name = "Terrain";

		// add the height values 
		for ( var i = 0; i < terrainGeometry.vertices.length ; i++)  {
							
			terrainGeometry.vertices[i].z = 1*terrain[i].split(" ")[2];			

		}
			
		scene.add( terrainMesh );
		
		var objtype = getParameterFromUrl("model") || "collada";
		if (objtype === "obj") {
			// Add hovedbygget from a .obj-file. Based on some hard coding
			var objLoader = new THREE.OBJMTLLoader();
			objLoader.load ( "../assets/3D-models/hovedbygget.obj", 
								"../assets/3D-models/hovedbygget.mtl",
								function ( result ) {
									obj = result;
									result.scale.x *= scaleX;
									result.scale.z *= scaleY;
									result.scale.y = 0.5;

									result.position.x = (building1.X - averageX)*scaleX;
									result.position.y = (building1.Y - averageY)*scaleY;


									result.position.z = 1*getZValue(building1.X, building1.Y, scaleX, scaleY, averageX, averageY, widthVertices, heightVertices);

									
									result.lookAt(new THREE.Vector3( result.position.x, result.position.y, 0 ));

									scene.add(result);

									// debugging
									if (debug) {
										boundingBoxHovedbygg = new THREE.BoundingBoxHelper( result, 0xffff00 );
										scene.add(boundingBoxHovedbygg);
									}

									render();

			});
			
		}
		else {
		// Add hovedbygget from a .dae-file. Based on some hard coding
		var loader = new THREE.ColladaLoader();
		// global from import3dBuildings.js: building1
		loader.load (building1.path, function (result) {
			console.log("3d model path: " + building1.path);

			result.scene.scale.x *= scaleX;
			result.scene.scale.y *= scaleY;

			result.scene.position.x = (building1.X - averageX)*scaleX;
			result.scene.position.y = (building1.Y - averageY)*scaleY;

			// 10 + : hardcoded correction for this specific case
			result.scene.position.z = 10 + getZValue(building1.X, building1.Y, scaleX, scaleY, averageX, averageY, widthVertices, heightVertices);

			//result.scene.rotation.z = building1.heading;

			scene.add(result.scene);

			globCol = result;

			// debugging
			if (debug) {
				boundingBoxHovedbygg = new THREE.BoundingBoxHelper( globCol.scene, 0xffff00 );
				scene.add(boundingBoxHovedbygg);
			}

			render();

		});
		
		}

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


var render = function ()  {
	requestAnimationFrame( render );

	controls.update();
	renderer.render( scene, camera );

	if (debug) {
		boundingBoxTerrain.update();
		boundingBoxHovedbygg.update();
	}

	return;
};

function getZValue(x, y, scaleX, scaleY, averageX, averageY, widthVertices, heightVertices) {

	// litt hardkoding :(
	localX = (building1.X - averageX)*scaleX;
	localY = (building1.Y - averageY)*scaleY;

	verticesX = 60;
	verticesY = 100;

	xNumber = (localX + 100)/ verticesX;
	yNumber = (localY + 100)/ verticesY;

	console.log("xNumber: " + xNumber);
	console.log("yNumber: " + yNumber);

	//Simplifying. :(
	xNumber = Math.round(xNumber);
	yNumber = Math.round(yNumber);

	terrainIndex = yNumber*verticesY + xNumber;
	console.log("terrainIndex: " + terrainIndex);
	z = terrainGeometry.vertices[terrainIndex].z; // assumes terrainGeometry is global :(
	console.log("Z-value: " + z);
	return z;


}

function getMapTextureWms(bbox, width, height, useNorgeIBilder) {
	
	// temp 
	if ( window.location.origin === "http://localhost:8000") {
		return  THREE.ImageUtils.loadTexture("../assets/texture.png");
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

