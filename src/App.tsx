import { useState } from "react";
import { lensPath, over, not, pathOr } from "ramda";
import reactLogo from "./assets/react.svg";
import "./App.css";

const DEFAULT_LINES = 20;
const DEFAULT_COLS = 40;

type lifeGridType = Array<Array<{ line: number; col: number; key: string; isAlive: boolean }>>;

const lifeGridFactory = (lines = DEFAULT_LINES, columns = DEFAULT_COLS): lifeGridType =>
  Array.from(Array(lines).fill(null), () => Array(columns).fill(null)).map((line, lineIndex) =>
    line.map((_col, colIndex) => ({
      line: lineIndex,
      col: colIndex,
      key: `cell-${lineIndex}-${colIndex}`,
      isAlive: false,
    })),
  );

const countNeighbors = (line: number, col: number, lifeGrid: lifeGridType): number =>
  [
    pathOr(false, [line !== 0 ? line - 1 : "force_path_error", col - 1, "isAlive"], lifeGrid),
    pathOr(false, [line !== 0 ? line - 1 : "force_path_error", col, "isAlive"], lifeGrid),
    pathOr(false, [line !== 0 ? line - 1 : "force_path_error", col + 1, "isAlive"], lifeGrid),
    pathOr(false, [line, col !== 0 ? col - 1 : "force_path_error", "isAlive"], lifeGrid),
    pathOr(false, [line, col + 1, "isAlive"], lifeGrid),
    pathOr(false, [line + 1, col !== 0 ? col - 1 : "force_path_error", "isAlive"], lifeGrid),
    pathOr(false, [line + 1, col, "isAlive"], lifeGrid),
    pathOr(false, [line + 1, col + 1, "isAlive"], lifeGrid),
  ].filter((x) => x).length;

const generateFutureAliviness = (isAlive: boolean, neighbors: number): boolean => {
  if (!isAlive && neighbors === 3) return true;
  if (isAlive && neighbors < 2) return false;
  if (isAlive && [2, 3].includes(neighbors)) return true;
  if (isAlive && neighbors > 3) return false;
  return false;
};

const updateLifeGrid = (lifeGrid: lifeGridType) => {
  return lifeGrid.map((line, lineIndex) =>
    line.map((cell, colIndex) => ({
      line: lineIndex,
      col: colIndex,
      key: `cell-${lineIndex}-${colIndex}`,
      isAlive: generateFutureAliviness(cell.isAlive, countNeighbors(lineIndex, colIndex, lifeGrid)),
    })),
  );
};

function App() {
  const [generation, setGeneration] = useState(0);
  const [grid, setGrid] = useState(lifeGridFactory());

  const changeCurrentGrid = (line: number, col: number) => {
    setGrid((currentGrid) => [...over(lensPath([line, col, "isAlive"]), not, currentGrid)]);
  };

  const handleNextGeneration = (grid: lifeGridType) => {
    setGrid(updateLifeGrid(grid));
    setGeneration((generation) => generation + 1);
  };

  const handleReset = () => {
    setGeneration(0);
    setGrid(lifeGridFactory());
  };

  return (
    <div className="App">
      <h1>
        The <img src={reactLogo} className="logo react" alt="React logo" /> Game of Life
      </h1>
      <p>
        Click on a cell (or many cells) to populate it and use [Next Generation] or other control
        button below.
      </p>
      <div className="grid">
        {grid.map((line, i) => (
          <div key={`grid-line-${i}`} className="gridLine">
            {line.map((cell, j) => (
              <div
                key={`grid-cell-${j}`}
                className={`gridCell ${cell.isAlive ? "alive" : "dead"}`}
                onClick={() => {
                  changeCurrentGrid(cell.line, cell.col);
                }}
              >
                {" "}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="line">
          <p>This is generation {generation}</p>
          <button onClick={handleReset} disabled={generation === 0}>
            Reset
          </button>
          <button onClick={() => handleNextGeneration(grid)}>Next Generation</button>
        </div>
      </div>
      <p className="footer">
        by RMJ (<a href="https://github.com/LionyxML">github</a>)
      </p>
    </div>
  );
}

export default App;
