"use strict";
   

var init = function() {
	
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

	controls.update();
	renderer.render( scene, camera );

	if (debug) {
		//boundingBoxTerrain.update();
		//boundingBoxHovedbygg.update();
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

var debugVariable;
var terrainGeometry;

init();



