
var recordPositions = function( camera, intervallTime, maxTime ) {

	console.log("Recording states");

	var addPosition = function( states, posIndex ) {
		
		var time = new Date().getTime() - startTime;

		states.push({ 
			timestamp : time,
			position : camera.position.clone(), 
			quaternion : camera.quaternion.clone() 
		});

		if ( time >= maxTime ) {
			clearInterval( recorder )
			savePositions( "flyRecording.txt", states );
		}
	}

	var startTime = new Date().getTime();
	
	var states = []; // format: {timestamp, position, rotations}  position: new THREE.Vector3(x,y,z) quaternion: new THREE.Quaternion (_x, _y,_z,_w...)
	var counter = 0;

	var	recorder = setInterval( function() {
		addPosition( states, counter );
		counter = counter + 1;

	}, intervallTime);
	

}

// The function only prints out the result in the console
var savePositions = function( fileName, states ) {

	// stringify converts  position to {x:xValue, y:Value, zValue} instead of new THREE.Vector3(...)
	var statesString = JSON.stringify(states);
	console.log(statesString);

	// save to file. 
	var htmlElement = document.createElement('a');
	htmlElement.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(statesString));
	htmlElement.setAttribute("download", fileName );
	htmlElement.click();
}


// controller is needed since it might block the rotations. it will be "disabled" in the beginning and "activiated" in the end
var flyThroughPositionsFromFile = function( path, camera, controller, useRotations ) {

	$.get( path, function( jsonTextFile ){ 
		var states = JSON.parse(jsonTextFile);
		flyThroughPositions( camera, states, controller, useRotations ); 
	});

}

var flyThroughPositions = function( camera, states, controller, useRotations ) {


	// recursive function
	var setStates = function( states, i ) {
		var waitTime = states[i].timestamp - states[ i-1 ].timestamp;
		setTimeout( function() {
			var pos = states[i].position;
			camera.position = new THREE.Vector3( pos.x, pos.y, pos.z ); 
			
			if ( useRotations ) {
				var rot = states[i].quaternion;
				camera.quaternion.x = rot._x;
				camera.quaternion.y = rot._y;
				camera.quaternion.z = rot._z;	
				camera.quaternion.w = rot._w;		
			}

			if ( states.length > (i + 1) ) {
				setStates( states,  i + 1);
			}

		}, waitTime );
	}

	var pos = states[0].position;
	setStates( states, 1 );

}
