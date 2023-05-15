import { useEffect, useRef, useState } from 'react'
import './index.css'
import { keepNumberInDomain, numberIsInDomain, randomNumberBetween } from './utils/math';

type mapper = React.Dispatch<React.SetStateAction<TileType[][]>>;
type counter = React.MutableRefObject<number>;

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

  const newX = Entities.Roomba.x + x;
  const newY = Entities.Roomba.y + y;

  const newXIsBetweenDomain = numberIsInDomain(0, 25, newX);
  const newYIsBetweenDomain = numberIsInDomain(0, 15, newY);

  if (newXIsBetweenDomain === false || newYIsBetweenDomain === false) {
    console.log('out of bounds')
    return;
  }

  if (checkRoombaCollision(map, roomba, newX, newY)) {
    console.log('collision')
    return;
  }


  if (map[newY][newX] !== TileType.Traveled && map[newY][newX] !== TileType.Charger) {
    Entities.totalUniqueTraveledBlocks++;
  }

  applyMask(map, roomba, newX, newY);
  applyMask(map, traveled, Entities.Roomba.x, Entities.Roomba.y);

  if (Entities.Charger.x === Entities.Roomba.x && Entities.Charger.y === Entities.Roomba.y) {
    const chrarger = create2DArray(1, 1, TileType.Charger);
    applyMask(map, chrarger, Entities.Charger.x, Entities.Charger.y);
  }


  Entities.Roomba.x += x;
  Entities.Roomba.y += y;
  Entities.path.push({ x: Entities.Roomba.x, y: Entities.Roomba.y });
  return map;
}

function depthFirstSearch(map: Map, dx: number, dy: number, setMap: mapper) {
  console.log(2)
  let cx = Entities.Roomba.x + dx;
  let cy = Entities.Roomba.y + dy;

  let xIsInBound = numberIsInDomain(0, map[0].length, cx);
  let yIsInBound = numberIsInDomain(0, map.length, cy);

  if (xIsInBound === false || yIsInBound === false) {
    return;
  }

  let isDiscovered = map[cy][cx] === TileType.Traveled;
  if (isDiscovered) {
    return;
  }
  // if (roombaIsOnCharger()) {
  //   return;
  // }

  let newMap = moveRoomba(map, dx, dy);
  if (newMap === undefined) {
    return;
  }

  console.log("coordinates", cx, cy)
  setMap([...newMap]);

  setTimeout(() => {
    depthFirstSearch(map, 1, 0, setMap)
    depthFirstSearch(map, -1, 0, setMap);
    depthFirstSearch(map, 0, 1, setMap);
    depthFirstSearch(map, 0, -1, setMap);
  }, 750);
}
function randomMove(_map: Map, setMap: mapper, moveCount: counter) {
  while (remaining() > 0) {
    let map: Map | undefined;
    switch (randomNumberBetween(0, 3)) {
      case 0:
        map = moveRoomba(_map, 1, 0);
        break;
      case 1:
        map = moveRoomba(_map, -1, 0);
        break;
      case 2:
        map = moveRoomba(_map, 0, 1);
        break;
      case 3:
        map = moveRoomba(_map, 0, -1);
        break;
    }
    if (map !== undefined) {
      moveCount.current++;
      setMap([...map]);
    }
  }

}

function breadthFirstSearch(_map: Map, setMap: mapper, moveCount: counter) {
  let map = _map;
  let queue: { x: number, y: number }[] = [];
  queue.push(Entities.Roomba);
  let visisted: Set<{ x: number, y: number }> = new Set();
  visisted.add(Entities.Roomba);
  while (queue.length > 0) {
    let current = queue.shift();

    if (current == Entities.Charger) {
      // Path to target found! Return the path or perform necessary operations.
      // You can use a separate function to reconstruct the path if needed.
      console.log("found")
      return;
    }

    const possibleMoves = [
      { x: 1, y: 0 }, // Right
      { x: -1, y: 0 }, // Left
      { x: 0, y: 1 }, // Down
      { x: 0, y: -1 }, // Up
    ];
    for (const move of possibleMoves) {
      let cx = Entities.Roomba.x + move.x;
      let cy = Entities.Roomba.y + move.y;
      let xIsInBound = numberIsInDomain(0, map[0].length, cx);
      let yIsInBound = numberIsInDomain(0, map.length, cy);
      if (xIsInBound === false || yIsInBound === false) {
        continue;
      }
      if (map[cy][cx] === TileType.Furniture) {
        continue;
      }
      if (visisted.has({ x: cx, y: cy })) {
        continue;
      }

      console.log("roomba:", Entities.Roomba)
      console.log("charger:", Entities.Charger)
      console.log(queue.length);
      if (queue.length > 1000) {
        console.log("queue too long")
        return;
      }

      let newMap = moveRoomba(map, move.x, move.y);
      if (newMap !== undefined) {
        queue.push({ x: cx, y: cy });
        visisted.add({ x: cx, y: cy });
        map = newMap;
        moveCount.current++;
        setMap([...map]);
      }
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

    // depthFirstSearch(map, 0, 0, setMap);

    setMap([...map]);

    window.addEventListener('keydown', e => {
      console.log(e.key)
      if (e.key === 'ArrowUp') {
        const movement = moveRoomba(map, 0, -1);
        if (movement) {
          setMap([...movement]);
          moveCount.current++;
        }
      } else if (e.key === 'ArrowDown') {
        const movement = moveRoomba(map, 0, 1);
        if (movement) {
          setMap([...movement]);
          moveCount.current++;
        }
      } else if (e.key === 'ArrowLeft') {
        const movement = moveRoomba(map, -1, 0);
        if (movement) {
          setMap([...movement]);
          moveCount.current++;
        }
      } else if (e.key === 'ArrowRight') {
        const movement = moveRoomba(map, 1, 0);
        if (movement) {
          setMap([...movement]);
          moveCount.current++;
        }
      }
    })


  }, [])

  // useEffect(() => {
  //   const timer = () => {
  //     dfsSearch(map, Entities.Roomba.x, Entities.Roomba.y, setMap);
  //   };

  //   timerRef.current = setInterval(timer, 500);
  // },[timerRef])

  return (
    <div>
      <button onClick={() => {
        clearInterval(timerRef.current);
      }}>stop</button>
      <button onClick={() => {
        depthFirstSearch(map, 0, 0, setMap);
      }}>DFS</button>
      <button onClick={() => {
        randomMove(map, setMap, moveCount);
      }}>random</button>
      <button onClick={() => {
        breadthFirstSearch(map, setMap, moveCount);
      }}>BFS</button>
      <div>Moves: {moveCount.current} progress: {25 * 15 - Entities.totalFurnitureBlocks - Entities.totalUniqueTraveledBlocks}</div>
      <div className='grid'>
        {map.map((y, yi) => y.map((x, xi) => <Tile data={x} key={`${yi}-${xi}`} />))}
      </div>
    </div>
  )
}

function Tile({ data }: { data: TileType }) {
  console.log(Entities.path.at(data))
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
