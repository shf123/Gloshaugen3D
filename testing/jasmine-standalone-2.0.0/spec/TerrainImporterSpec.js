// if runned locally, it must be run on local host
describe("TerrainImporter", function() {

	var terrainImporter;

	beforeEach(function() {
		terrainImporter = new TerrainImporter( new function(){} );

	});

	it("test", function() {
		expect(true).toBe(true);
	});

	
	describe("loadTextFile", function() {

		beforeEach(function() {
			terrainImporter = new TerrainImporter( new function(){} );
		});

		it("load without exception", function() {
			var callback = function() {
			}

			var filePath = "./assets/TerrainImporter/terrainFile1.xyz";

			var loadFile = function() {
				terrainImporter.loadTextFile( filePath, callback );

			}
			expect( loadFile ).not.toThrow();

		});

		it("check content in text file", function( done ) {
			var callback = function( data ) {
				var array = data.split("\n");
				expect(array.length).toBe(7);

				var firstLine = array[0];
				var firstX = parseInt(firstLine.split(" ")[0]);
				expect(firstX).toBe(1);

				var sixthLine = array[5];
				var sixthZ = parseInt(sixthLine.split(" ")[2]);
				expect(sixthZ).toBe(5);

				var lastLine = array[6];
				expect(lastLine).toBe("");

				done();

			}

			var filePath = "./assets/TerrainImporter/terrainFile1.xyz";

			terrainImporter.loadTextFile( filePath, callback );

		});

	});

	describe("getDataFromTerrain", function() {


		it("terrainFile1", function( done ) {
			var callback = function( data ) {
				var dataArray = terrainImporter.splitTextFile( data );
				var dataInfo = terrainImporter.getDataInfoFromTerrain( dataArray );

				expect(dataInfo.minX).toBe(1);
				expect(dataInfo.minY).toBe(1);
				expect(dataInfo.minZ).toBe(0);
				expect(dataInfo.maxX).toBe(3);
				expect(dataInfo.maxY).toBe(2);
				expect(dataInfo.maxZ).toBe(5);

				expect(dataInfo.resolutionX).toBe(1);
				expect(dataInfo.resolutionY).toBe(1);

				expect(dataInfo.bbox).toBe("1,1,3,2");
				expect(dataInfo["length"]).toBe(6);

				expect(dataInfo.averageX()).toBe(2);
				expect(dataInfo.averageY()).toBe(1.5);

				expect(dataInfo.xyVerticesRatio()).toBe(3/2);
				expect(dataInfo.xVertices()).toBe(3);	
				expect(dataInfo.yVertices()).toBe(2);	

				done();

			}

			var filePath = "./assets/TerrainImporter/terrainFile1.xyz";
			terrainImporter.loadTextFile( filePath, callback );

		});



	});
	 
});
