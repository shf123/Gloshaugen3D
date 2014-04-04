"use strict";
   

var init = function() {
	
	var width = window.innerWidth;
	var height = window.innerHeight;

	// scene 
	scene = new THREE.Scene();

	// camera (chose FOV from stemkoski.github.io/Three.js/HelloWorld.html)
	camera = new THREE.PerspectiveCamera( 45, width/height, 0.1, 10000 );
	camera.position.z = 12;
	camera.rotation.x = Math.PI / 2;
	


	// controls
	controls = new THREE.FlyControls( camera );

	// renderer
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	document.getElementById( "threejs" ).appendChild( renderer.domElement );
	
	// use oculus rift?
	if ( useOculus ) {
		var oculusOrientationChanged = function ( quat ) {
			oculusOrientation = quat;
		}

		oculus = new THREE.OculusRiftEffect(renderer);
		oculusBridge = new OculusBridge( {"onConnect" : function() { 
			        console.log("oculus is connected");
			    },
			    "onDisconnect" : function() {
			        console.log("oculus is disconnected");
			    },
			    "onOrientationUpdate" : oculusOrientationChanged
				});
		oculusBridge.connect();

	}


	// initilize stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.right = '0px';
	document.body.appendChild( stats.domElement );
	
	// terrain. 
	var runAfterTerrainIsImported =  function( terrainInfo, scale ) {
		addBuildingsToScene( terrainInfo, scale, scene,  function() {
			render();
		}); // import3dBuildings.js
	}
	importTerrain( scene, runAfterTerrainIsImported ); // importTerrain.js
	

	// add start position object
	var geometry = new THREE.CubeGeometry( 3,3,3 );
	var material = new THREE.MeshBasicMaterial();
	var mesh = new  THREE.Mesh( geometry, material );
	mesh.position.z = 23;





	
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
		
		gridHelper = new THREE.GridHelper( 150,10 );
		gridHelper.setColors( 0x888822, 0x888888 );
		gridHelper.rotation = new THREE.Euler(Math.PI/2, 0,0)
		scene.add(gridHelper);

	}
	
	
}

var render = function ()  {

	stats.begin();

	requestAnimationFrame( render );

	controls.update(1);
	
	if ( oculus ) {
		if ( oculusOrientation ) {
			// Changed from xyzw to xzyw. Looking up/downwards does not feel right.
			camera.quaternion.set(oculusOrientation.x, oculusOrientation.z, oculusOrientation.y, oculusOrientation.w);
			camera.rotateX(Math.PI/2); // Change angle so it gets more natural

		}
		oculus.render( scene, camera );
	}
	else {
		renderer.render( scene, camera );	
	}
	
	stats.end();

	return;
};


// Returns value of parameter if it exist. 
var getParameterFromUrl = function( parameter ) {
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

var scene, camera, renderer, controls, stats;
var debug = getParameterFromUrl("debug") || false; // show some debug info

var oculus = null;
var oculusBridge = null;
var oculusOrientation = null;
var useOculus = getParameterFromUrl("oculus") === "true" ;



var debugVariable;
var terrainGeometry;

init();



