
var recordPositions = function( camera, intervallTime, maxTime, useLocalStorage ) {

	console.log("Recording states");

	var addPosition = function( states, posIndex ) {
		
		var time = window.performance.now() - startTime;

		states.push({ 
			timestamp : time,
			position : camera.position.clone(), 
			quaternion : camera.quaternion.clone() 
		});

		if ( time >= maxTime ) {
			clearInterval( recorder )
			
			if (useLocalStorage) {
				savePositionsInLocalStorage("flyRecording", states)
			}
			else {
				savePositions( "flyRecording.txt", states );
			}
		}
	}

	var startTime = window.performance.now();
	
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

	// save to file. // http://stackoverflow.com/a/20194533 seem to work.
	var a = window.document.createElement('a');
	a.href = window.URL.createObjectURL(new Blob([statesString], {type: 'text/plain'}));
	a.download = fileName;

	// Append anchor to body.
	document.body.appendChild(a);
	a.click();

	// Remove anchor from body
	document.body.removeChild(a);
}

var savePositionsInLocalStorage = function( key, values ) {
	
	// stringify converts  position to {x:xValue, y:Value, zValue} instead of new THREE.Vector3(...)
	var value = JSON.stringify(values);
	//console.log(value);

	localStorage.setItem(key, value);
}

var flyThroughPositionsFromFile = function( path, camera, useRotations, renderCounter ) {

	$.get( path, function( jsonTextFile ){ 
		var states = JSON.parse(jsonTextFile);
		flyThroughPositions( camera, states, useRotations, renderCounter); 
	});

}

var flyThroughPositionsFromLocalStorage = function( key, camera, useRotations, renderCounter ) {

	var locStorage = localStorage.getItem(key);
	var states = JSON.parse(locStorage);
	flyThroughPositions( camera, states, useRotations, renderCounter ); 
	

}


var flyThroughPositions = function( camera, states, useRotations, renderCounter ) {

	var renderCountStart = renderCounter.counter;
	var timeStart = window.performance.now();

	console.log("Render count before flythrough: " + renderCounter.counter );


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
			// finished
			else {
				
				var renderCountFinished = renderCounter.counter;
				var timeFinished = window.performance.now();
				var averageFPS = 1000 * ( renderCountFinished - renderCountStart ) / ( timeFinished - timeStart ); 
				console.log("Render count after flythrough: " + renderCounter.counter );
				console.log("Average FPS: " + averageFPS );
			}

		}, waitTime );
	}

	var pos = states[0].position;
	setStates( states, 1 );

}
