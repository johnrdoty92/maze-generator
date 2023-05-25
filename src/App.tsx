import { useEffect, useRef } from 'react';
import './App.css'

const GRID_DIMENSIONS = 5;
const ROWS = (Array(GRID_DIMENSIONS)
  .fill(0)
  .map((_, i) => (
    Array(GRID_DIMENSIONS).fill(0).map((_, j) => ([i, j]))
    )
  )
);

const directions = ['top', 'left', 'right', 'bottom'] as const;
type Directions = typeof directions[number];

const moveMap: Record<Directions, [number, number]> = {
  top: [-1, 0],
  right: [0, 1],
  left: [0, -1],
  bottom: [1, 0],
}

const oppositeDirections: Record<Directions, Directions> = {
  top: "bottom",
  right: "left",
  left: "right",
  bottom: "top",
}

const getNextCell = ([cell1r, cell1c]: [number, number], direction: Directions): [number, number] => {
  const [r, c] = moveMap[direction]
  return [cell1r + r, cell1c + c]
}

const getNextDirection = (currentCell: [number, number], nextCell: [number, number]): Directions | undefined => {
  const newCoordinates = [nextCell[0] - currentCell[0], nextCell[1] - currentCell[1]]
  const directionEntry = Object.entries(moveMap).find(([_, coords]) => coords.join(',') === newCoordinates.join(','))
  if (!directionEntry || !directions.find((dir) => directionEntry[0] === dir)) return;
  return directionEntry[0] as Directions
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function App() {
  const gridRef = useRef<null | HTMLDivElement>(null)
  const grid = ROWS.map((row, i) => (
    <div key={`r${i}`} className="row">
      {row.map((cell, j) => <div key={`c${j}`} className="cell">{`[${cell.join(", ")}]`}</div>)}
    </div>
    )
  )

  useEffect(() => {
    let mounted = true;
    const gridRefCopy = gridRef;
    (async () => {
      if (!gridRef.current) return;
      const stack: [number, number][] = [[0,0]];
      const visited = new Set<string>();
      const borderClasses: Map<string, Set<Directions>> = new Map()

      while (stack.length !== 0 && mounted) {
        const currentCell = stack.pop();
        if (!currentCell) break;
        const [r, c] = currentCell
        const currentCellKey = `${r},${c}`
        if (visited.has(currentCellKey)) continue;

        await sleep(50);
        const currentCellNode = gridRef.current.childNodes[r].childNodes[c] as HTMLDivElement;
        currentCellNode.classList.add('visited');
        visited.add(currentCellKey)

        const shuffledDirections = [...directions].sort(() => Math.random() - Math.random())
        shuffledDirections.forEach((direction) => {
          const [nextR, nextC] = getNextCell(currentCell, direction)
          if (
            !visited.has(`${nextR},${nextC}`)
            && (nextR >= 0 && nextR < GRID_DIMENSIONS)
            && (nextC >= 0 && nextC < GRID_DIMENSIONS)
          ) {
            stack.push([nextR, nextC]);
            const pushedCellDirection = getNextDirection(currentCell, [nextR, nextC]);
            const currentCellClasses = borderClasses.get(currentCellKey) ?? new Set();
            if (pushedCellDirection) currentCellClasses.add(pushedCellDirection)
            borderClasses.set(currentCellKey, currentCellClasses)
          }
        })
        const nextCell = stack.at(-1) as [number, number];
        const nextDirection = getNextDirection(currentCell, nextCell);
        if (!nextDirection) continue; // dead end
        const oppositeDirection = oppositeDirections[nextDirection];
        const nextCellKey = nextCell.join(',');
        const nextCellClasses = borderClasses.get(nextCellKey) ?? new Set();
        nextCellClasses.add(oppositeDirection);
        borderClasses.set(nextCellKey, nextCellClasses);
      }
      
      if (!mounted) return;
      borderClasses.forEach((directionsSet, coordsAsString) => {
        if (!gridRef.current) return;
        const [r, c] = coordsAsString.split(',').map(coord => parseInt(coord))
        const cellNode = gridRef.current.childNodes[r].childNodes[c] as HTMLDivElement;
        directionsSet.forEach(direction => cellNode.classList.add(direction))
      }
    )})()

    return () => {
      // Reset grid on unmount
      mounted = false;
      if (!gridRefCopy.current) return;
      gridRefCopy.current.childNodes.forEach(({childNodes}) => {
        childNodes.forEach(cell => {
          (cell as HTMLDivElement).classList.remove(...directions)
        })
      })
    }
  }, [])

  return (
    <div ref={gridRef}>
      {grid}
    </div>
  )
}

export default App
