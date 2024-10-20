import { useState, useEffect, useRef } from "react";
import { lensPath, over, not, pathOr } from "ramda";
import ReactECharts from "echarts-for-react";
import reactLogo from "./assets/react.svg";
import "./App.css";

const DEFAULT_LINES = 20;
const DEFAULT_COLS = 40;
const DEFAULT_TICKER_MILISSECONDS = 100;
const DEFAULT_RANDOM_PROBABILITY_OF_LIFE = 15 / 100;

interface ILifeGridCell {
  line: number;
  col: number;
  key: string;
  isAlive: boolean;
}

const generateLifeCell = (line: number, col: number, isAlive: boolean) => ({
  line,
  col,
  key: `cell-${line}-${col}`,
  isAlive,
});

type LifeGrid = Array<Array<ILifeGridCell>>;

interface ILifeGridProps {
  lines?: number;
  columns?: number;
  randomize?: boolean;
}

const generateLifeGrid = ({
  lines = DEFAULT_LINES,
  columns = DEFAULT_COLS,
  randomize = false,
}: ILifeGridProps): LifeGrid =>
  Array.from(Array(lines).fill(null), () => Array(columns).fill(null)).map((line, lineIndex) =>
    line.map((_col, colIndex) =>
      generateLifeCell(
        lineIndex,
        colIndex,
        randomize ? Math.random() < DEFAULT_RANDOM_PROBABILITY_OF_LIFE : false,
      ),
    ),
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

const updateLifeGrid = (lifeGrid: LifeGrid, isBorderLimited: boolean): LifeGrid =>
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

const countLiveCells = (lifeGrid: LifeGrid): number =>
  lifeGrid
    .map((line) => line.map((cell) => cell?.isAlive))
    .flat()
    .filter(Boolean).length;

const initialChartOptions = {
  xAxis: {
    type: "category",
    show: false,
    color: "red",
  },
  yAxis: {
    type: "value",
    show: false,
  },
  tooltip: {
    axisPointer: {
      type: "cross",
      snap: true,
    },
  },
  series: [
    {
      data: [0],
      showSymbol: false,
      type: "line",
      lineStyle: { color: "rgba(0, 200, 200, 1)" },
    },
  ],
};

function App() {
  const [isBorderLimited, setBorderLimited] = useState(false);
  const [isStopWhenBlank, setIsStopWhenBlank] = useState(true);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [grid, setGrid] = useState(generateLifeGrid({}));
  const [livingCellsCount, setLivingCellsCount] = useState([0]);
  const [chartOptions, setChartOptions] = useState(initialChartOptions);
  const ticker = useRef(0);

  const updateLivingCellsCount = (lives: number) => {
    setLivingCellsCount((livingCellsList) => {
      const livingCellsListClone = [...livingCellsList];
      livingCellsListClone[generation] = lives;

      setChartOptions({
        ...chartOptions,
        series: [{ ...chartOptions.series[0], data: livingCellsCount }],
      });

      return livingCellsListClone;
    });
  };

  const handleUpdateCurrentCell = (line: number, col: number) =>
    setGrid((currentGrid) => {
      const newGrid = [...over(lensPath([line, col, "isAlive"]), not, currentGrid)];

      updateLivingCellsCount(countLiveCells(newGrid));

      return newGrid;
    });

  const handleNextGeneration = () => setGeneration((generation) => (generation += 1));

  const handleReset = () => {
    setLivingCellsCount([0]);
    setGeneration(0);
    setGrid(generateLifeGrid({}));
    setIsAutoplay(false);
  };

  const handleRandom = () => {
    const newGrid = generateLifeGrid({ randomize: true });

    updateLivingCellsCount(countLiveCells(newGrid));
    setGrid(newGrid);
  };

  const handleLimitBorder = () => setBorderLimited((currentState) => !currentState);

  const handleStopWhenBlank = () => setIsStopWhenBlank((currentState) => !currentState);

  const handleAutoGenerate = () => {
    setIsAutoplay((autoplay) => !autoplay);
  };

  useEffect(() => {
    if (isAutoplay) {
      ticker.current = setInterval(() => {
        setGeneration((generation) => generation + 1);
      }, DEFAULT_TICKER_MILISSECONDS);
    }

    return () => clearInterval(ticker.current);
  }, [isAutoplay]);

  useEffect(() => {
    const newGrid = updateLifeGrid(grid, isBorderLimited);
    const livingCells = countLiveCells(newGrid);
    const shouldStop = isStopWhenBlank && livingCells === 0;

    if (shouldStop) setIsAutoplay(false);

    updateLivingCellsCount(livingCells);
    setGrid(newGrid);
  }, [isAutoplay, generation]);

  return (
    <div className="App">
      <h1>
        The <img src={reactLogo} className="logo react" alt="React logo" /> Game of Life
      </h1>

      <div className="line">
        <div className="line-inner-wrapper">
          {generation > 0 ? (
            <div className="message-or-graph">
              <ReactECharts
                option={chartOptions}
                style={{
                  width: "100%",
                  height: "100px",
                }}
              />
            </div>
          ) : (
            <div className="message-or-graph">
              <span>
                Hello there! Welcome to the React game of Life!
                <br />
                If you don&apos;t know how to play it, you may visit this great{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life"
                  target="_blank"
                  rel="noreferrer"
                >
                  article
                </a>{" "}
                first.
                <br />
                For a quick experience, just hit &quot;Randomize&quot; and then &quot;Start
                Auto-Generation&quot;.
              </span>
            </div>
          )}
          <div>
            <div className="grid">
              {grid.map((line, i) => (
                <div key={`grid-line-${i}`} className="gridLine">
                  {line.map((cell, j) => (
                    <div
                      key={`grid-cell-${j}`}
                      className={`gridCell ${cell.isAlive ? "alive" : "dead"}`}
                      onClick={() => {
                        handleUpdateCurrentCell(cell.line, cell.col);
                      }}
                    >
                      {" "}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="controls">
          <div className="score">
            <div className="score--line">
              <p className="generation">Generations: {String(generation).padStart(3, "0")}</p>
              <p className="living-cells">
                Living cells: {String(livingCellsCount.at(-1)).padStart(3, "0")}
              </p>
            </div>
          </div>

          <button className="menu-item" onClick={handleRandom} disabled={generation !== 0}>
            <span>⇆</span> <span>Randomize</span>
          </button>

          <button
            className="menu-item"
            onClick={handleAutoGenerate}
            disabled={livingCellsCount.at(0) === 0}
          >
            {isAutoplay ? (
              <>
                <span>⏸︎</span> <span>Pause Auto-Generation</span>
              </>
            ) : (
              <>
                <span>⏵︎</span> <span>Start Auto-Generation</span>
              </>
            )}
          </button>

          <button
            className="menu-item"
            onClick={handleNextGeneration}
            disabled={isAutoplay || livingCellsCount.at(0) === 0}
          >
            <span>⏯︎</span> <span>Next Generation</span>
          </button>

          <button
            className="menu-item"
            onClick={handleReset}
            disabled={generation === 0 && livingCellsCount.at(0) === 0}
          >
            <span>⏹︎</span> <span>Reset</span>
          </button>

          <div className="menu-item">
            <label className="limit">
              <input type="checkbox" checked={isBorderLimited} onChange={handleLimitBorder} />
              limit on border
            </label>
          </div>

          <div className="menu-item">
            <label className="auto-stop">
              <input type="checkbox" checked={isStopWhenBlank} onChange={handleStopWhenBlank} />
              auto-stop when lifeless
            </label>
          </div>

          <p className="footer">
            by RMJ (
            <a href="https://github.com/LionyxML" target="_blank" rel="noreferrer">
              github
            </a>
            )
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
