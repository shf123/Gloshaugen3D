"use strict";
   

var init = function() {
	
	var width = window.innerWidth;
	var height = window.innerHeight;



	addScene();
	addCamera( width, height );
	addControls();
	addCollisionDetection();

	addRenderer( width, height );
	
	if ( useOculus ) {
		addOculus();
	}

	addStats(); 
	addEventlisteners();


	addSomeDebugStuffIfDebug()

	
	addTerrainAndBuildings();
	
	handlePotensiallyGivenFlythroughParameters();
	
	
	
}

var addScene = function() {
	scene = new THREE.Scene();	
	scene.add( new THREE.AmbientLight( 0xababab ) );
}

var addCamera = function( width, height ) {
	// note: 10000 as far value is quite high. Entering more resonable value to see if performance increases
	camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 1000 );
	camera.position.x = getParameterFromUrl("x")*1 || 10;
	camera.position.y = getParameterFromUrl("y")*1 || 0;
	camera.position.z = getParameterFromUrl("z")*1 || 12; // TODO: Less hardcoded
	
	camera.rotation.x = Math.PI / 2;
}

var addControls = function() {
	controls = new THREE.FlyControls( camera );
	controls.movementSpeed = 0.5 * 20;
 	controls.rollSpeed = 0.015 * 20;
 	controls.dragToLook = true;

}

var addCollisionDetection = function() {
	collisionDetection = new CollisionDetection( camera, scene );
}


var addRenderer = function( width, height ) {
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( width, height );
	renderer.setClearColor( 0x222299 );
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

var addTerrainAndBuildings = function() {
	var terrainImporter = new TerrainImporter( addBuildingsCallback );
	
	if ( getParameterFromUrl('wcs') === "true" ) {
		var wcsName = "wcsKartverket";
		var bbox = "569900,7032300,570500,7033300";
		terrainImporter.importTerrainWCS( wcsName, bbox );
	}
	else {
		terrainImporter.importTerrainFile( "../assets/gloshaugen.xyz" );
	}
}

var addBuildingsCallback =  function( terrainMesh, terrainInfo, scale ) {
	scene.add( terrainMesh );

	addBuildingsToScene( terrainInfo, scale, scene,  function() { console.log( "Building callback called" ); } ); // import3dBuildings.js
}

var handlePotensiallyGivenFlythroughParameters = function() {
	var flyThroughRecording = getParameterFromUrl("record") === "true";
	var flyThrough = getParameterFromUrl("fly") === "true";


	if ( flyThrough ) {
		var useRotations = true;
		var recordingName = getParameterFromUrl("recordingName") || "flythrough.txt";
		var recordingPath = "../assets/flyThroughRecordings/" + recordingName;
		flyThroughPositionsFromFile( recordingPath, camera, useRotations)
	}
	else if ( flyThroughRecording ) {
		var waitTimeBetweenRecordings = 1000/40; // ms
		var totalRecordTime = 5000; // ms
		recordPositions( camera, waitTimeBetweenRecordings, totalRecordTime ); 
	}
}


var render = function ()  {

	stats.begin();

	requestAnimationFrame( render );

	// check for collsion here ( before controls )
	collisionDetection.blockCollidingDirections( "FlyControls", controls ); 
	

	var deltaTime = clock.getDelta();

	controls.update(deltaTime); 

	if ( oculus ) {
		if ( oculusOrientation ) {
			// Changed from xyzw to xzyw. Looking up/downwards does not feel right.
			camera.quaternion.set(oculusOrientation.x, -oculusOrientation.z, oculusOrientation.y, oculusOrientation.w);
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

var scene, camera, renderer, controls, stats, terrainGeometry, collisionDetection;
var oculus, oculusBridge, oculusOrientation;
var debugVariable;

var debug = getParameterFromUrl("debug") || false; // show some debug info
var useOculus = getParameterFromUrl("oculus") === "true" ;

var clock = new THREE.Clock( true );

init();
render();



