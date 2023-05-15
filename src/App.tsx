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

  return map;
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

  return applyMask(map, create2DArray(height, width, TileType.Charger), x, y);
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

  return applyMask(map, create2DArray(height, width, TileType.Roomba), x, y);
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
      newMap = applyMask(newMap, furniture, x, y);
      i++;
    }

  }

  return newMap;
}

function remaining(): number {
  return 25 * 15 - Entities.totalFurnitureBlocks - Entities.totalUniqueTraveledBlocks;
}

function moveRoomba(map: Map, x: number, y: number) {
  const roomba = create2DArray(1, 1, TileType.Roomba);
  const traveled = create2DArray(1, 1, TileType.Traveled);

  const xIsBetweenDomain = numberIsInDomain(0, 25, x);
  const yIsBetweenDomain = numberIsInDomain(0, 15, y);

  if (xIsBetweenDomain === false || yIsBetweenDomain === false) {
    console.log('out of bounds')
    return;
  }

  if (checkRoombaCollision(map, roomba, x, y)) {
    console.log('collision')
    return;
  }


  if (map[y][x] !== TileType.Traveled && map[y][x] !== TileType.Charger) {
    Entities.totalUniqueTraveledBlocks++;
  }

  applyMask(map, roomba, x, y);
  applyMask(map, traveled, Entities.Roomba.x, Entities.Roomba.y);

  if (Entities.Charger.x === Entities.Roomba.x && Entities.Charger.y === Entities.Roomba.y) {
    const chrarger = create2DArray(1, 1, TileType.Charger);
    applyMask(map, chrarger, Entities.Charger.x, Entities.Charger.y);
  }


  Entities.Roomba.x = x;
  Entities.Roomba.y = y;

  return map;
}

function moveRoombaDelta(map: Map, x: number, y: number) {
  const newX = Entities.Roomba.x + x;
  const newY = Entities.Roomba.y + y;

  return moveRoomba(map, newX, newY);
}

// Usage!
function depthFirstSearch(map: Map, x: number, y: number, setMap: Mapper, moveCount: Counter) {
  // const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  // await sleep(500);
  let xIsInBound = numberIsInDomain(0, map[0].length, x);
  let yIsInBound = numberIsInDomain(0, map.length, y);

  if (xIsInBound === false || yIsInBound === false) {
    return;
  }

  console.log("x is in bound", xIsInBound, 0, x, map[0].length);
  console.log("y is in bound", xIsInBound, 0, y, map.length);
  console.log("map", map);

  console.log("map[x][y]", x,y);
  let isDiscovered = map[y][x] === TileType.Traveled;
  if (isDiscovered) {
    return;
  }
  if (roombaIsOnCharger()) {
    return;
  }
  

  let newMap = moveRoomba(map, x, y);
  if (newMap === undefined) {
    return;
  }
  console.log("coordinates", x, y)
  setMap([...newMap]);

  depthFirstSearch(map, x + 1, y, setMap, moveCount);
  depthFirstSearch(map, x - 1, y, setMap, moveCount);
  depthFirstSearch(map, x, y + 1, setMap, moveCount);
  depthFirstSearch(map, x, y - 1, setMap, moveCount);
}

function randomMove(_map: Map, setMap: Mapper, moveCount: Counter) {
  while (remaining() > 0) {
    let map: Map | undefined;
    switch (randomNumberBetween(0, 3)) {
      case 0:
        map = moveRoombaDelta(_map, 1, 0);
        break;
      case 1:
        map = moveRoombaDelta(_map, -1, 0);
        break;
      case 2:
        map = moveRoombaDelta(_map, 0, 1);
        break;
      case 3:
        map = moveRoombaDelta(_map, 0, -1);
        break;
    }
    if (map !== undefined) {
      moveCount.current++;
      setMap([...map]);
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
        const movement = moveRoombaDelta(map, 0, -1);
        if (movement) {
          setMap([...movement]);
          moveCount.current++;
        }
      } else if (e.key === 'ArrowDown') {
        const movement = moveRoombaDelta(map, 0, 1);
        if (movement) {
          setMap([...movement]);
          moveCount.current++;
        }
      } else if (e.key === 'ArrowLeft') {
        const movement = moveRoombaDelta(map, -1, 0);
        if (movement) {
          setMap([...movement]);
          moveCount.current++;
        }
      } else if (e.key === 'ArrowRight') {
        const movement = moveRoombaDelta(map, 1, 0);
        if (movement) {
          setMap([...movement]);
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
        depthFirstSearch(map, Entities.Roomba.x, Entities.Roomba.y, setMap);
      }}>DFS</button>
      <button onClick={() => {
        randomMove(map, setMap, moveCount);
      }}>random</button>
      <div>Moves: {moveCount.current} progress: {25 * 15 - Entities.totalFurnitureBlocks - Entities.totalUniqueTraveledBlocks}</div>
      <div className='grid'>
        {map.map((y, yi) => y.map((x, xi) => <Tile data={x} key={`${yi}-${xi}`} />))}
      </div>
    </div>
  )
}

function Tile({ data }: { data: TileType }) {
  let color = 'empty';

  switch (data) {
    case TileType.Furniture:
      color = 'furniture'
      break;
    case TileType.Charger:
      color = 'charger'
      break;
    case TileType.Roomba:
      color = 'roomba'
      break;
    case TileType.Traveled:
      color = 'traveled'
      break;
    default:
      color = 'empty'
      break;
  }

  return <div className={`test ${color}`}>&nbsp;</div>
}

export default App
