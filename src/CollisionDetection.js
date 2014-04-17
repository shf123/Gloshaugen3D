// Strugled with raycasting in all the movement directions -> Instead try to make an invisible
// shape around the current position instead. This worked

// Can also find out which building the mouse pointer is pointing at ( This could be usefull if you
// want to show some extra information about an object while hovered. And also if you want to move an object)
// Maybe finish that later.



function CollisionDetection( camera, scene ) {

	var mousemove = function( event ) {
	 	
	 	var raycaster = unprojectMouseCoords ( event.clientX, event.clientY );

	};

	var mouseclick = function( event ) { 	

		console.log("Mouse click x,y : " + event.clientX + "," + event.clientY );
	 	var raycaster = unprojectMouseCoords ( event.clientX, event.clientY );

	 	//addCubeAtFirstRayIntersection( raycaster );

	};


	var unprojectMouseCoords = function( x, y ) {

		// convert to [-1, 1]
		var localX = ( x / window.innerWidth ) * 2 - 1;
		var localY = -(( y / window.innerHeight) * 2 - 1);

		var vector = new THREE.Vector3 ( localX, localY, camera.near);

		// 'vector' is being changed here. It should end up somewhere in front of the camera with a distance of camera.near 
		var projector = new THREE.Projector();
		projector.unprojectVector( vector, camera ); 

		var normalizedDiff = vector.sub( camera.position ).normalize(); // vector is also changed here

		return new THREE.Raycaster ( camera.position,  normalizedDiff );

	};

	// just for fun and testing
	var addCubeAtFirstRayIntersection = function ( raycaster ) {

	 	var rayObj = raycaster.intersectObjects( scene.children, true ); // recursive = true 
	 	console.log("Raycast.length: " + rayObj.length);
	 	if (rayObj.length > 0) {
	 		var geom = new THREE.CubeGeometry(1,1,1);
	 		var mat = new THREE.MeshBasicMaterial({ color: '#'+ Math.floor(Math.random()*16777215).toString(16) }); // random color:http://www.paulirish.com/2009/random-hex-color-code-snippets/

	 		var mesh = new THREE.Mesh( geom, mat );
	 		mesh.position = rayObj[0].point;

	 		scene.add(mesh);
	 		console.log("Added cube at: " + mesh.position.x + ", " + mesh.position.y + ", "  + mesh.position.z );
	 	}

	};

	// make a shape where each vertex represent a direction to be moved
	var makeDirectionShape = function() {

		var shapeSize = 5;

		// vertices: 0-right, 1-left, 2-up, 3-down, 4-back, 5-forward
		var directionShape = new THREE.OctahedronGeometry( shapeSize );
		var directionMaterial = new THREE.MeshBasicMaterial();
		var directionMesh = new THREE.Mesh( directionShape, directionMaterial );
		
		// follow the camera
		directionMesh.position = camera.position;
		directionMesh.rotation = camera.rotation;

		return directionMesh;

	};

	var isColliding = function( minDistanceValue ) {
		var i, dirVector;


		var projector = new THREE.Projector();
		var numberOfDirections = directionMesh.geometry.vertices.length;
		var raycasters = new Array( numberOfDirections );

			
		var collitionDirections = [];

		for ( i = 0; i < numberOfDirections; i++ ) {
			
			var localPoint = directionMesh.geometry.vertices[i].clone();
	 		var globalPoint = localPoint.applyMatrix4( camera.matrix );

	 		var directionVector = globalPoint.clone().sub( camera.position ).normalize();

			raycasters[i] = new THREE.Raycaster( camera.position, directionVector );
			var intersections = raycasters[i].intersectObjects( scene.children, true );

			if (intersections.length > 0 && intersections[0].distance <  minDistanceValue ) {
				collitionDirections.push( i );
			}

		}


		return collitionDirections;

	};


	this.blockCollidingDirections = function( controllName, controls) {
		
		switch(	controllName ) {
			case "FlyControls":
				blockCollidingDirectionsForFlyControls ( controls );
				break;
			default:
				throw new Error("blockCollidingDirection is not supported for " + controllName + "!");

		}

		

	};

	var blockCollidingDirectionsForFlyControls = function ( controls ) {
		var collitionDirections = isColliding( 1 );

		for (var i = 0; i < collitionDirections.length; i++) {
			var collitionDirection = collitionDirections[i];

			// sets moveVector for x, y and/or z to 0 if necessary to avoid colliding in a object
			switch(collitionDirection) {
				case 0: // right
					controls.moveVector.x = Math.min(0, controls.moveVector.x); 
					break;
				case 1: // left
					controls.moveVector.x = Math.max(0, controls.moveVector.x);
					break;
				case 2: // up
					controls.moveVector.y = Math.min(0, controls.moveVector.y);
					break;
				case 3: // down
					controls.moveVector.y = Math.max(0, controls.moveVector.y);
					break;
				case 4: // back
					controls.moveVector.z = Math.min(0, controls.moveVector.z);
					break;
				case 5: // forward
					controls.moveVector.z = Math.max(0, controls.moveVector.z);
					break;

			}

		};



	};

	var directionMesh = makeDirectionShape();

	// add mouse listener
	//window.addEventListener( 'mousemove', mousemove, false);
	//window.addEventListener('click', mouseclick, false);
}





