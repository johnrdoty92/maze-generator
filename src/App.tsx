import { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import './App.css'

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

const getCellKey = (cell: [number, number]) => cell.join(',');

const getNextCell = ([cell1r, cell1c]: [number, number], direction: Directions): [number, number] => {
  const [r, c] = moveMap[direction]
  return [cell1r + r, cell1c + c]
}

const getNextDirection = (currentCell: [number, number], nextCell: [number, number]): Directions | undefined => {
  const newCoordinates = [nextCell[0] - currentCell[0], nextCell[1] - currentCell[1]]
  const directionEntry = Object.entries(moveMap).find((moves) => moves[1].join(',') === newCoordinates.join(','))
  if (!directionEntry || !directions.find((dir) => directionEntry[0] === dir)) return;
  return directionEntry[0] as Directions
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function App() {
  const [gridDimensions, setGridDimensions] = useState(10);
  const ROWS = (Array(gridDimensions)
    .fill(0)
    .map((_, i) => Array(gridDimensions).fill(0).map<[number, number]>((_, j) => ([i, j])))
  );
  const gridRef = useRef<null | HTMLDivElement>(null)
  const grid = ROWS.map((row, i) => (
    <div key={`r${i}`} className="row">
      {row.map((cell) => <div key={getCellKey(cell)} className="cell"/>)}
    </div>
    )
  )

  const handleDimensions: ChangeEventHandler<HTMLInputElement> = ({target}) => {
    setGridDimensions(target.valueAsNumber)
  }

  useEffect(() => {
    let mounted = true;
    const gridRefCopy = gridRef;
    (async () => {
      if (!gridRef.current) return;
      const stack: [number, number][] = [[0,0]];
      const visited = new Set<string>();

      while (stack.length !== 0 && mounted) {
        const currentCell = stack.pop();
        if (!currentCell) break;
        const currentCellKey = getCellKey(currentCell)
        if (visited.has(currentCellKey)) continue;
        const [r, c] = currentCell

        await sleep(10);
        const currentCellNode = gridRef.current.childNodes[r].childNodes[c] as HTMLDivElement;
        currentCellNode.classList.add('visited');
        visited.add(currentCellKey)

        const shuffledDirections = [...directions].sort(() => Math.random() - Math.random())
        shuffledDirections.forEach((direction) => {
          const nextCell = getNextCell(currentCell, direction);
          const nextCellKey = getCellKey(nextCell);
          const [nextR, nextC] = nextCell;
          if (
            !visited.has(nextCellKey)
            && !(stack.find(cell => getCellKey(cell) === nextCellKey))
            && (nextR >= 0 && nextR < gridDimensions)
            && (nextC >= 0 && nextC < gridDimensions)
          ) {
            stack.push(nextCell);
          }
        })
        const nextCell = stack.at(-1);
        if (!nextCell) continue;
        const nextCellDirection = getNextDirection(currentCell, nextCell);
        const nextCellNode = gridRef.current.childNodes[nextCell[0]].childNodes[nextCell[1]] as HTMLDivElement;
        if (!nextCellDirection) { // dead end
          for (const direction of directions) {
            // Find previously visited cell and remove borders
            const neighborCell = getNextCell(nextCell, direction);
            const neighborDirection = getNextDirection(nextCell, neighborCell)
            if (!visited.has(getCellKey(neighborCell)) || !neighborDirection) continue;
            nextCellNode.classList.add(neighborDirection)
            const neighborCellNode = gridRef.current.childNodes[neighborCell[0]].childNodes[neighborCell[1]] as HTMLDivElement;
            neighborCellNode.classList.add(oppositeDirections[neighborDirection])
            break;
          }
        } else {
          // Continue dfs and remove borders
          currentCellNode.classList.add(nextCellDirection);
          nextCellNode.classList.add(oppositeDirections[nextCellDirection])
        }
      }
    })()

    return () => {
      // Reset grid on unmount
      mounted = false;
      if (!gridRefCopy.current) return;
      gridRefCopy.current.childNodes.forEach(({childNodes}) => {
        childNodes.forEach(cell => {
          (cell as HTMLDivElement).classList.remove(...directions, 'visited')
        })
      })
    }
  }, [gridDimensions])

  return (
    <div className='container'>
      <div className='grid' ref={gridRef}>
        {grid}
      </div>
      <button className='button' onClick={() => window.location.reload()}>Reset</button>
      <input type='range' onChange={handleDimensions} value={gridDimensions} min={5} max={20}/>
    </div>
  )
}

export default App
