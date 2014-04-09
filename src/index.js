"use strict";
   

var init = function() {
	
	var width = window.innerWidth;
	var height = window.innerHeight;


	addScene();
	addCamera( width, height );
	addControls();
	addRenderer( width, height );
	
	if ( useOculus ) {
		addOculus();
	}

	addStats(); 
	addEventlisteners();

	addSomeDebugStuffIfDebug()
	
	importTerrain( scene, addBuildingsCallback ); // importTerrain.js
	
	// testing raycasting with the CollisionDetection file
	//var collisionDetection = new CollisionDetection( camera, scene );
	
}

var addScene = function() {
	scene = new THREE.Scene();	
	scene.add( new THREE.AmbientLight( 0xababab ) );
}

var addCamera = function( width, height ) {
	camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 10000 );
	camera.position.z = 12; // TODO: Less hardcoded
	camera.rotation.x = Math.PI / 2;
}

var addControls = function() {
	controls = new THREE.FlyControls( camera );
	controls.movementSpeed = 0.5;
 	controls.rollSpeed = 0.015;
 	controls.dragToLook = true;
}

var addRenderer = function( width, height ) {
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	document.getElementById( "threejs" ).appendChild( renderer.domElement );
}

var addOculus = function() {

	var oculusOrientationChanged = function ( quat ) {
		oculusOrientation = quat;
	}

	oculus = new THREE.OculusRiftEffect(renderer); // oculus renderer
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

var addStats = function() {
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	stats.domElement.style.right = '0px';
	document.body.appendChild( stats.domElement );
}

var addEventlisteners = function() {
	window.addEventListener('resize', onResize, false);
}

var addSomeDebugStuffIfDebug = function() {
	if (debug) {
		// XYZ-axis
		var axisHelper = new THREE.AxisHelper( 500 ); 
		scene.add( axisHelper );
		
		// Grid below the terrain
		var gridHelper = new THREE.GridHelper( 150,10 );
		gridHelper.setColors( 0x888822, 0x888888 );
		gridHelper.rotation = new THREE.Euler(Math.PI/2, 0,0)
		scene.add(gridHelper);

	}
}

var addBuildingsCallback =  function( terrainInfo, scale ) {
	addBuildingsToScene( terrainInfo, scale, scene,  render ); // import3dBuildings.js
}

var render = function ()  {

	stats.begin();

	requestAnimationFrame( render );

	controls.update(1); // TODO: Insert diffTime instead of constant
	
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

var onResize = function ( event ) {
		camera.aspect =  window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );
}


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

// Check webgl
if ( !Detector.webgl ) {
	Detector.addGetWebGLMessage();
}

var scene, camera, renderer, controls, stats, terrainGeometry;
var oculus, oculusBridge, oculusOrientation;
var debugVariable;

var debug = getParameterFromUrl("debug") || false; // show some debug info
var useOculus = getParameterFromUrl("oculus") === "true" ;

init();




