import { useState } from "react";
import { lensPath, over, not, pathOr } from "ramda";
import reactLogo from "./assets/react.svg";
import "./App.css";

const DEFAULT_LINES = 20;
const DEFAULT_COLS = 40;

type LifeGridCell = {
  line: number;
  col: number;
  key: string;
  isAlive: boolean;
};

const generateLifeCell = (line: number, col: number, isAlive: boolean) => ({
  line,
  col,
  key: `cell-${line}-${col}`,
  isAlive,
});

type LifeGrid = Array<Array<LifeGridCell>>;

const generateLifeGrid = (lines = DEFAULT_LINES, columns = DEFAULT_COLS): LifeGrid =>
  Array.from(Array(lines).fill(null), () => Array(columns).fill(null)).map((line, lineIndex) =>
    line.map((_col, colIndex) => generateLifeCell(lineIndex, colIndex, false)),
  );

const countCellNeighbors = (
  line: number,
  col: number,
  lifeGrid: LifeGrid,
  isBorderLimited: boolean,
): number => {
  const lastLine = lifeGrid.length - 1;
  const lastCol = lifeGrid[0].length - 1;

  return (
    isBorderLimited
      ? [
          line !== 0 ? pathOr(false, [line - 1, col - 1, "isAlive"], lifeGrid) : false,
          line !== 0 ? pathOr(false, [line - 1, col, "isAlive"], lifeGrid) : false,
          line !== 0 ? pathOr(false, [line - 1, col + 1, "isAlive"], lifeGrid) : false,
          col !== 0 ? pathOr(false, [line, col - 1, "isAlive"], lifeGrid) : false,
          pathOr(false, [line, col + 1, "isAlive"], lifeGrid),
          col !== 0 ? pathOr(false, [line + 1, col - 1, "isAlive"], lifeGrid) : false,
          pathOr(false, [line + 1, col, "isAlive"], lifeGrid),
          pathOr(false, [line + 1, col + 1, "isAlive"], lifeGrid),
        ]
      : [
          pathOr(false, [line > 0 ? line - 1 : lastLine, col - 1, "isAlive"], lifeGrid),
          pathOr(false, [line > 0 ? line - 1 : lastLine, col, "isAlive"], lifeGrid),
          pathOr(
            false,
            [line > 0 ? line - 1 : lastLine, col < lastCol ? col + 1 : 0, "isAlive"],
            lifeGrid,
          ),
          pathOr(false, [line, col > 0 ? col - 1 : lastCol, "isAlive"], lifeGrid),
          pathOr(false, [line, col < lastCol ? col + 1 : 0, "isAlive"], lifeGrid),
          pathOr(
            false,
            [line < lastLine ? line + 1 : 0, col > 0 ? col - 1 : lastCol, "isAlive"],
            lifeGrid,
          ),
          pathOr(false, [line < lastLine ? line + 1 : 0, col, "isAlive"], lifeGrid),
          pathOr(
            false,
            [line < lastLine ? line + 1 : 0, col < lastCol ? col + 1 : 0, "isAlive"],
            lifeGrid,
          ),
        ]
  ).filter((x) => x).length;
};

const generateFutureAliviness = (isAlive: boolean, neighbors: number): boolean => {
  if (!isAlive && neighbors === 3) return true;
  if (isAlive && neighbors < 2) return false;
  if (isAlive && [2, 3].includes(neighbors)) return true;
  if (isAlive && neighbors > 3) return false;
  return false;
};

const updateLifeGrid = (lifeGrid: LifeGrid, isBorderLimited: boolean) =>
  lifeGrid.map((line, lineIndex) =>
    line.map((cell, colIndex) =>
      generateLifeCell(
        lineIndex,
        colIndex,
        generateFutureAliviness(
          cell.isAlive,
          countCellNeighbors(lineIndex, colIndex, lifeGrid, isBorderLimited),
        ),
      ),
    ),
  );

function App() {
  const [isBorderLimited, setBorderLimited] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [grid, setGrid] = useState(generateLifeGrid());

  const changeCurrentGrid = (line: number, col: number) => {
    setGrid((currentGrid) => [...over(lensPath([line, col, "isAlive"]), not, currentGrid)]);
  };

  const handleNextGeneration = (grid: LifeGrid, isBorderLimited: boolean) => {
    setGrid(updateLifeGrid(grid, isBorderLimited));
    setGeneration((generation) => generation + 1);
  };

  const handleReset = () => {
    setGeneration(0);
    setGrid(generateLifeGrid());
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
          <p className="generation">Current Generation: {String(generation).padStart(3, "0")}</p>

          <button onClick={handleReset} disabled={generation === 0}>
            Reset
          </button>

          <button onClick={() => handleNextGeneration(grid, isBorderLimited)}>
            Next Generation
          </button>

          <div>
            <label>
              <input
                type="checkbox"
                checked={isBorderLimited}
                onChange={() => setBorderLimited((currentState) => !currentState)}
              />
              limit on border
            </label>
          </div>
        </div>
      </div>

      <p className="footer">
        by RMJ (<a href="https://github.com/LionyxML">github</a>)
      </p>
    </div>
  );
}

export default App;
