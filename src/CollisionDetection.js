// Far from finished

// Will use Raycaster to find objects in the way in the "lookAt"-direction
// I also want to know which building the mouse pointer is pointing at ( This could be usefull if you
//	want to show some extra information about an object while hovered. And also if you want to move an object)

// Starts with checking which buiding that is hovered
// http://threejs.org/examples/#webgl_geometry_terrain_raycast is a good place to look for some tips

function CollisionDetection( camera, scene ) {

	var mousemove = function( event ) {
	 	
	 	var raycaster = unprojectMouseCoords ( event.clientX, event.clientY );

	}

	var mouseclick = function( event ) { 	

		console.log("Mouse click x,y : " + event.clientX + "," + event.clientY );
	 	var raycaster = unprojectMouseCoords ( event.clientX, event.clientY );


	 	//addCubeAtFirstRayIntersection( raycaster );
	
		isColliding();

	}


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

	}

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

	}


	// not finished yet
	var isColliding = function() {
		var i, dirVector;

		var dirVectors = [];
		dirVectors.push(  new THREE.Vector3(  0,  0,  1 ) ); // up
		dirVectors.push(  new THREE.Vector3(  0,  0, -1 ) ); // down
		dirVectors.push(  new THREE.Vector3(  1,  0,  0 ) ); // right
		dirVectors.push(  new THREE.Vector3( -1,  0,  0 ) ); // left
		dirVectors.push(  new THREE.Vector3(  0,  1,  0 ) ); // forward
		dirVectoras.push(  new THREE.Vector3(  0, -1,  0 ) ); // back

		var projector = new THREE.Projector();
		var raycasters = new Array( dirVectors.length );

		for ( i = 0; i < dirVectors.length; i++ ) {
			
			dirVector = dirVectors[i];
			projector.unprojectVector( dirVector, camera );
			dirVector.sub( camera.position ).normalize(); 
			raycasters[i] = new THREE.Raycaster( camera.position, dirVector );
			var intersections = raycasters[i].intersectObjects( scene.children, true );
			
			// debug locate intersection
			if ( intersections.length > 0 ) {
				var geom = new THREE.CubeGeometry(1,1,1);
				var color;
				switch(i) {
					case 0:
						color = '#ff0000';
						break;
					case 1:
						color = '#880000';
						break;
					case 2:
						color = '#00ff00';
						break;
					case 3:
						color = '#008800';
						break;
					case 4:
						color = '#0000ff';
						break;
					case 5:
						color = '#000088';
						break;
								
				}

		 		var mat = new THREE.MeshBasicMaterial({ 'color':  color }); 

		 		var mesh = new THREE.Mesh( geom, mat );
		 		mesh.position = intersections[0].point;
		 		
		 		scene.add(mesh);
			}
			console.log( intersections );

		}


	}

	// add mouse listener
	//window.addEventListener( 'mousemove', mousemove, false);
	window.addEventListener('click', mouseclick, false);
}





