import { useEffect, useRef, useState } from 'react'
import './index.css'
import { keepNumberInDomain, numberIsInDomain, randomNumberBetween } from './utils/math';
type Mapper = React.Dispatch<React.SetStateAction<TileType[][]>>;
type Counter = React.MutableRefObject<number>;

enum TileType {
  Empty = 0,
  Furniture = 1,
  Charger = 2,
  Roomba = 3,
  Traveled = 4,
}

type Map = TileType[][];

const Entities = {
  Roomba: { x: 0, y: 0 },
  Charger: { x: 0, y: 0 },
  totalFurnitureBlocks: 2,
  totalUniqueTraveledBlocks: 0,
  path: Array<{ x: number, y: number }>(),
  rgb: [255, 255, 0]
}


function create2DArray(height: number, width: number, type: TileType) {
  return Array.from({ length: height }, () => Array(width).fill(type)) as Map;
}

//
function roombaIsOnCharger(): boolean {
  return Entities.Charger.x === Entities.Roomba.x && Entities.Charger.y === Entities.Roomba.y;
}

function generateFurniture() {
  const width = randomNumberBetween(2, 13);
  const height = randomNumberBetween(3, 8);
  return create2DArray(height, width, TileType.Furniture);
}

function applyMask(map: Map, mask: Map, x: number, y: number) {
  for (let yi = 0; yi < mask.length; yi++) {
    for (let xi = 0; xi < mask[yi].length; xi++) {
      map[y + yi][x + xi] = mask[yi][xi];
    }
  }
}

function generateCharger(map: Map): Map {
  const width = 1;
  const height = 1;
  const x = randomNumberBetween(0, map[0].length - width);
  const y = randomNumberBetween(0, map.length - height);

  if (checkCollision(map, create2DArray(height, width, TileType.Charger), x, y)) {
    return generateCharger(map);
  }

  Entities.Charger.x = x;
  Entities.Charger.y = y;

  applyMask(map, create2DArray(height, width, TileType.Charger), x, y);
  return map;
}

function generateRoomba(map: Map): Map {
  const width = 1;
  const height = 1;
  const x = randomNumberBetween(0, map[0].length - width);
  const y = randomNumberBetween(0, map.length - height);

  if (checkCollision(map, create2DArray(height, width, TileType.Roomba), x, y)) {
    return generateRoomba(map);
  }

  Entities.Roomba.x = x;
  Entities.Roomba.y = y;

  applyMask(map, create2DArray(height, width, TileType.Roomba), x, y);
  return map;
}



function checkCollision(map: Map, mask: Map, x: number, y: number) {
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

function checkRoombaCollision(map: Map, mask: Map, x: number, y: number) {
  for (let yi = 0; yi < mask.length; yi++) {
    for (let xi = 0; xi < mask[yi].length; xi++) {
      if (map[y + yi][x + xi] === TileType.Furniture) {
        return true;
      }
    }
  }

  return false;

}

function generateFurnitureForPlay(map: Map, amount: number) {
  let newMap = map;
  let i = 0;

  while (i < amount) {
    const furniture = generateFurniture()

    const x = randomNumberBetween(0, map[0].length - furniture[0].length);
    const y = randomNumberBetween(0, map.length - furniture.length);

    if (!checkCollision(newMap, furniture, x, y)) {
      Entities.totalFurnitureBlocks += furniture.length * furniture[0].length;
      applyMask(newMap, furniture, x, y);
      i++;
    }

  }

  return newMap;
}

function remaining(): number {
  // return 25 * 15 - Entities.totalFurnitureBlocks - Entities.totalUniqueTraveledBlocks;
  return 25 * 15 - Entities.totalFurnitureBlocks - Entities.path.length;
}

function moveRoomba(map: Map, x: number, y: number, setMap: Mapper): boolean {
  const roomba = create2DArray(1, 1, TileType.Roomba);
  const traveled = create2DArray(1, 1, TileType.Traveled);

  const xIsBetweenDomain = numberIsInDomain(0, 25, x);
  const yIsBetweenDomain = numberIsInDomain(0, 15, y);

  if (xIsBetweenDomain === false || yIsBetweenDomain === false) {
    return false;
  }

  if (checkRoombaCollision(map, roomba, x, y)) {
    return false;
  }


  if (map[y][x] !== TileType.Traveled && map[y][x] !== TileType.Charger) {
    // Entities.totalUniqueTraveledBlocks++;
    if (Entities.path.find((p) => p.x === x && p.y === y) === undefined) {
      Entities.path.push({ x, y });
    }
  }

  applyMask(map, roomba, x, y);
  applyMask(map, traveled, Entities.Roomba.x, Entities.Roomba.y);

  if (Entities.Charger.x === Entities.Roomba.x && Entities.Charger.y === Entities.Roomba.y) {
    const charger = create2DArray(1, 1, TileType.Charger);
    applyMask(map, charger, Entities.Charger.x, Entities.Charger.y);
  }

  Entities.Roomba.x = x;
  Entities.Roomba.y = y;

  setMap([...map])
  return true;
}

function moveRoombaDelta(map: Map, x: number, y: number, setMap: Mapper) {
  const newX = Entities.Roomba.x + x;
  const newY = Entities.Roomba.y + y;

  return moveRoomba(map, newX, newY, setMap);
}

// Usage!
function depthFirstSearch(map: Map, x: number, y: number, setMap: Mapper, moveCount: Counter) {
  let xIsInBound = numberIsInDomain(0, map[0].length, x);
  let yIsInBound = numberIsInDomain(0, map.length, y);

  if (xIsInBound === false || yIsInBound === false) {
    return;
  }

  let isDiscovered = map[y][x] === TileType.Traveled;
  if (isDiscovered) {
    return;
  }
  if (roombaIsOnCharger()) {
    return;
  }


  let moved = moveRoomba(map, x, y, setMap);
  if (moved === false) {
    return;
  } else {
    moveCount.current++;
  }

  depthFirstSearch(map, x + 1, y, setMap, moveCount);
  depthFirstSearch(map, x - 1, y, setMap, moveCount);
  depthFirstSearch(map, x, y + 1, setMap, moveCount);
  depthFirstSearch(map, x, y - 1, setMap, moveCount);
}

function randomMove(_map: Map, setMap: Mapper, moveCount: Counter) {
  while (remaining() > 0) {
    let moved = false;
    switch (randomNumberBetween(0, 3)) {
      case 0:
        moved = moveRoombaDelta(_map, 1, 0, setMap);
        break;
      case 1:
        moved = moveRoombaDelta(_map, -1, 0, setMap);
        break;
      case 2:
        moved = moveRoombaDelta(_map, 0, 1, setMap);
        break;
      case 3:
        moved = moveRoombaDelta(_map, 0, -1, setMap);
        break;
    }
    if (moved) {
      moveCount.current++;
    }
  }

}

function breadthFirstSearch(_map: Map, setMap: Mapper, moveCount: Counter) {
  let map = _map;
  let queue: { x: number, y: number }[] = [];
  queue.push(Entities.Roomba);
  // let visisted: Set<{ x: number, y: number }> = new Set();
  let visisted: Array<{ x: number, y: number }> = [];
  visisted.push(Entities.Roomba);
  while (queue.length > 0) {
    let current = queue.shift();
    if (current === undefined) {
      return;
    }
    if (roombaIsOnCharger()) {
      return;
    }
    if (current == Entities.Charger) {
      // Path to target found! Return the path or perform necessary operations.
      // You can use a separate function to reconstruct the path if needed.
      return;
    }

    const possibleMoves = [
      { x: 1, y: 0 }, // Right
      { x: -1, y: 0 }, // Left
      { x: 0, y: 1 }, // Down
      { x: 0, y: -1 }, // Up
    ];
    for (const move of possibleMoves) {
      let cx = current.x + move.x;
      let cy = current.y + move.y;
      let xIsInBound = numberIsInDomain(0, map[0].length, cx);
      let yIsInBound = numberIsInDomain(0, map.length, cy);
      if (xIsInBound === false || yIsInBound === false) {
        continue;
      }
      if (map[cy][cx] === TileType.Furniture) {
        continue;
      }

      if (visisted.find(item => item.x === cx && item.y === cy) !== undefined) {
        continue;
      }

      queue.push({ x: current.x + move.x, y: current.y + move.y });
    }

    let moved = moveRoomba(map, current.x, current.y, setMap);
    if (moved) {
      visisted.push(current);
      moveCount.current++;
    }
  }
}

function App() {
  const [map, setMap] = useState<TileType[][]>([[0]])
  const moveCount = useRef(0);
  const timerRef = useRef(0);

  useEffect(() => {
    let map = create2DArray(15, 25, TileType.Empty);
    let amount = randomNumberBetween(3, 6);
    generateFurnitureForPlay(map, amount);
    generateCharger(map);
    generateRoomba(map);

    setMap([...map]);

    window.addEventListener('keydown', e => {
      console.log(e.key)
      if (e.key === 'ArrowUp') {
        const movement = moveRoombaDelta(map, 0, -1, setMap);
        if (movement) {
          moveCount.current++;
        }
      } else if (e.key === 'ArrowDown') {
        const movement = moveRoombaDelta(map, 0, 1, setMap);
        if (movement) {
          moveCount.current++;
        }
      } else if (e.key === 'ArrowLeft') {
        const movement = moveRoombaDelta(map, -1, 0, setMap);
        if (movement) {
          moveCount.current++;
        }
      } else if (e.key === 'ArrowRight') {
        const movement = moveRoombaDelta(map, 1, 0, setMap);
        if (movement) {
          moveCount.current++;
        }
      }
    })


  }, [])

  return (
    <div>
      <button onClick={() => {
        clearInterval(timerRef.current);
      }}>stop</button>
      <button onClick={() => {
        depthFirstSearch(map, Entities.Roomba.x, Entities.Roomba.y, setMap, moveCount);
      }}>DFS</button>
      <button onClick={() => {
        randomMove(map, setMap, moveCount);
      }}>random</button>
      <button onClick={() => {
        breadthFirstSearch(map, setMap, moveCount);
      }}>BFS</button>
      <div>Moves: {moveCount.current} progress: {remaining()} cleaned: {Entities.path.length}</div>

      <div className='grid'>
        {map.map((y, yi) => y.map((x, xi) => <Tile data={x} key={`${yi}-${xi}`} />))}
      </div>
    </div>
  )
}

function Tile({ data }: { data: TileType }) {
  let color = 'white';
  switch (data) {
    case TileType.Furniture:
      color = 'SlateBlue'
      break;
    case TileType.Charger:
      color = 'green'
      break;
    case TileType.Roomba:
      color = 'red'
      break;
    case TileType.Traveled:

      const [r, g, b] = Entities.rgb;
      color = `rgb(${r},${g},${b})`
      Entities.rgb = [r - 2, g - 2, b]
      break;
    default:
      color = 'empty'
      break;
  }

  return <div className={'test'} style={{ background: color }}>&nbsp;</div>
}

export default App
