// for debugging
var showScene = false; 
var renderAppended = false;


describe("CollisionDetection", function() {

	var collisionDetection, scene;

	
	describe("isColliding", function() {

		var container1, container2, container3, container4;
		var /*camera,*/ controller, longSize, shortSize, xWall, yWall, floor, 
		xPositivePos, xNegativePos, yPositivePos, yNegativePos, 
		zFloorPos, zRoofPos;


		// some methods
		var addFloor, addWall, render, getDirectionsWithCollisionFromContainerElements;

		beforeEach(function() {
			var init = function () {

				var width = 500;
				var height = 500;

				// make camera
				camera = new THREE.PerspectiveCamera( 45, width / height, 0.1, 10000 );

				// rotation adjustment since camera is thinking of y as up instead of z
				camera.rotation.x = Math.PI / 2;
				camera.rotation.z = 0;

				// make scene
				scene = new THREE.Scene();	
				scene.add( new THREE.AmbientLight( 0xababab ) );

				// make control
				controller = new THREE.FlyControls( camera );
				controller.dragToLook = true;

				// make renderer
				renderer = new THREE.WebGLRenderer();
				renderer.setSize( width, height );
				
				if ( showScene ) {			
					
					var htmlElement = document.getElementById("debugRenderer");
					
					// remove last render element if appended
					if ( renderAppended ) {
						var lastElement = htmlElement.children[ htmlElement.children.length - 1 ];
						htmlElement.removeChild( lastElement ) ;
					}
					
					htmlElement.appendChild( renderer.domElement );
					renderAppended = true;			

				}
				

				setConstants();
			};

			render = function ()  {
					requestAnimationFrame( render );
					controller.update(1);
					renderer.render( scene, camera );	
					return;
			};

			var setConstants = function() {
				longSize = 10;
				shortSize = 0.1;

				xWall = new THREE.Vector3( longSize,  shortSize, longSize );
				yWall = new THREE.Vector3( shortSize, longSize,  longSize );
				floor = new THREE.Vector3( longSize,  longSize,  shortSize );

				xPositivePos = new THREE.Vector3( 0, longSize / 2, 0 );
				xNegativePos = new THREE.Vector3( 0, -longSize / 2, 0 );

				yPositivePos = new THREE.Vector3(  longSize / 2, 0, 0);
				yNegativePos = new THREE.Vector3( -longSize / 2, 0, 0);

				zFloorPos = new THREE.Vector3( 0, 0, -longSize / 2 );
				zRoofPos = new THREE.Vector3( 0, 0, longSize / 2);
			};


			getDirectionsWithCollisionFromContainerElements = function( container ) {
				var collisionDetection = new CollisionDetection( camera, container );
				var collisionDistance = longSize / 2; // distance to the walls the camera

				return collisionDetection.__testonly__.getDirectionsWithCollision( collisionDistance ); // get collisions as numbers

			};

			addFloor = function( container, posVector, sizeVector ) {
				var floorGeometry = new THREE.CubeGeometry( sizeVector.x, sizeVector.y, 0.1 );
				var floorMaterial = new THREE.MeshBasicMaterial( { color:0x550000});
				var floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
				floorMesh.position = posVector.clone();
				floorMesh.name = "floor";

				container.add( floorMesh );

				return floorMesh;
			};

			addWall = function( container, posVector, sizeVector ) {
				var wallGeometry = new THREE.CubeGeometry( sizeVector.x, sizeVector.y, sizeVector.z);
				var wallMaterial = new THREE.MeshBasicMaterial( { color: 0x000055 });
				var wallMesh = new THREE.Mesh( wallGeometry, wallMaterial );
				wallMesh.position = posVector.clone();
				wallMesh.name = "wall";

				container.add( wallMesh );

				return wallMesh;
			};

			init();

		});
				
		// order in collisionDirections
		// 0: 'right', 	 1: 'left',  2: 'up',  3: 'down',  4: 'back',  5: 'forward'
		it("collision test 1", function() {
			var makeContainer1 = function() {
				var container1 = new THREE.Object3D();
				addFloor( container1, zFloorPos, floor );
				addWall( container1, yPositivePos, yWall ); // "right" wall
				addWall( container1, xPositivePos , xWall ); // "front" wall
				return container1;
			};

			var doTests = function() {

				expect(collisionDirections.length).toBe(3); // 3 = number of directions with collisions

				expect(collisionDirections[0]).toBe("right"); 
				expect(collisionDirections[1]).toBe("down"); 
				expect(collisionDirections[2]).toBe("forward"); 
			};
	
			// make container with floor and walls
			var container1 = makeContainer1();
			scene.add( container1 );
			
			// position the camera
			camera.position = container1.position.clone();

			render();
			
			collisionDirections = getDirectionsWithCollisionFromContainerElements( container1 ); // render must be called first

			doTests();


		});

		it("collision test 2", function() {
			var makeContainer2 = function() {
				var container2 = new THREE.Object3D();
				addFloor( container2, zFloorPos, floor );
				addWall( container2, yNegativePos , yWall ); // "left" wall
				addWall( container2, yPositivePos, yWall );  // "right" wall

				return container2;
			};

			var doTests = function() {

				expect(collisionDirections.length).toBe(3); // 3 = number of directions with collisions

				expect(collisionDirections[0]).toBe("right"); 
				expect(collisionDirections[1]).toBe("left"); 
				expect(collisionDirections[2]).toBe("down"); 
			};
	
			// make container with floor and walls
			var container2 = makeContainer2();
			container2.position.y = 1 * ( 2 * longSize );
			scene.add( container2 );
			
			// position the camera
			camera.position = container2.position.clone();

			render();
			
			collisionDirections = getDirectionsWithCollisionFromContainerElements( container2 ); // render must be called first

			doTests();


		});
		
		// order in collisionDirections
		// 0: 'right', 	 1: 'left',  2: 'up',  3: 'down',  4: 'back',  5: 'forward'
		it("collision test 3", function() {

			var makeContainer3 = function() {
				var container3 = new THREE.Object3D();
				addFloor( container3, zFloorPos, floor );
				addWall( container3, zRoofPos , floor ); // roof
				addWall( container3, yPositivePos , yWall ); // "right" wall

				return container3;
			};

			var doTests = function() {

				expect(collisionDirections.length).toBe(3); // 3 = number of directions with collisions

				expect(collisionDirections[0]).toBe("right"); 
				expect(collisionDirections[1]).toBe("up"); 
				expect(collisionDirections[2]).toBe("down"); 
			};
	
			// make container with floor and walls
			var container3 = makeContainer3();
			container3.position.y = 2 * ( 2 * longSize );
			scene.add( container3 );
			
			// position the camera
			camera.position = container3.position.clone();

			render();
			
			collisionDirections = getDirectionsWithCollisionFromContainerElements( container3 ); // render must be called first

			doTests();


		});


		it("collision test 4", function() {

				var makeContainer4 = function(){
				var container4 = new THREE.Object3D();
				addFloor( container4, zFloorPos, floor );
				addWall( container4, xNegativePos , xWall ); // "back" wall

				return container4;
			};

			var doTests = function() {

				expect(collisionDirections.length).toBe(2); // 2 = number of directions with collisions

				expect(collisionDirections[0]).toBe("down"); 
				expect(collisionDirections[1]).toBe("back"); 

			};
	
			// make container with floor and walls
			var container4 = makeContainer4();
			container4.position.y = 3 * ( 2 * longSize );
			scene.add( container4 );
			
			// position the camera
			camera.position = container4.position.clone();

			render();
			
			collisionDirections = getDirectionsWithCollisionFromContainerElements( container4 ); // render must be called first

			doTests();


		});



	});



		
	 
});
