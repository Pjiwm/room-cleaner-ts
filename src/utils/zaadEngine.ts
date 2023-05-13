type Roomba = {
	x: number,
	y: number,
}
type Charger = {
	x: number,
	y: number,
}

type Entities = {
	roomba: Roomba,
	charger: Charger,
	totalFurnitureBlocks: number,
	totalUniqueTraveledBlocks: number,
}

enum TileType {
	Empty = 0,
	Furniture = 1,
	Charger = 2,
	Roomba = 3,
	Traveled = 4,
  }

  type Map = TileType[][];


export class ZaadEngine {
	private entities: Entities = {
		roomba: { x: 0, y: 0 },
		charger: { x: 0, y: 0 },
		totalFurnitureBlocks: 2,
		totalUniqueTraveledBlocks: 0,
	};

	constructor(mapInitializer: { x: number, y:number }) {

	}

	public roombaIsOnCharger(): boolean {
		return this.entities.roomba.x === this.entities.charger.x && this.entities.roomba.y === this.entities.charger.y;
	}

	private createEntity(height: number, width: number, type: TileType) {
		return Array.from({ length: height }, () => Array(width).fill(type)) as Map;
	}

	private checkCollisionWithClipping(map: Map, mask: Map, x: number, y: number) {
		const maskWidth = mask[0].length;
		const maskHeight = mask.length;

		const mapWidth = map[0].length;
		const mapHeight = map.length;

		const xMin = keepNumberInDomain(0, mapWidth - 1, x - 1);
		const xMax = keepNumberInDomain(0, mapWidth - 1, x + maskWidth);
		const yMin = keepNumberInDomain(0, mapHeight - 1, y - 1);
		const yMax = keepNumberInDomain(0, mapHeight - 1, y + maskHeight);

		for (let yi = yMin; yi <= yMax; yi++) {
		  for (let xi = xMin; xi <= xMax; xi++) {
			if (map[yi][xi] !== TileType.Empty) {
			  return true;
			}
		  }
		}

		return false;
	  }

	  private checkRoombaCollision(map: Map, mask: Map, x: number, y: number) {
		for (let yi = 0; yi < mask.length; yi++) {
		  for (let xi = 0; xi < mask[yi].length; xi++) {
			if (map[y + yi][x + xi] === TileType.Furniture) {
			  return true;
			}
		  }
		}

		return false;

	  }
}