const delay = (time) => {
  return new Promise(resolve => setTimeout(resolve, time));
}

const visitedAnimation = (t, color) => {
  t.element.style.opacity = 0;
  t.element.style.backgroundColor = color;
  t.element.offsetWidth;
  t.element.style.opacity = 1;
  t.element.style.transition = 'opacity 0.4s ease-in-out';

  t.element.addEventListener('transitionend', function () {
    t.element.style.transition = '';
  });
}

const wallColor = 'black';
const emptyTileColor = 'white';
const visitedTileColor = '#3d5a80';
const finalPathTileColor = '#f7b801'
const startTileColor = 'green';
const finalTileColor = 'red';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TILES CLASS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let startTile = -1;
let endTile = -1;
let previousStartTile = null;
let previousEndTile = null;
let isMouseDown = false;
let currentAlg = -1;
let pathFindingDone = false;
let clickedOnToMove = -1;
let selectionStep = 0;

const guideUser = () => {
  const stepInfo = document.getElementById('step-info');
  const mazeButton = document.querySelector('.maze-button');
  if (selectionStep === 0) {
    stepInfo.textContent = "Step 1: Select the wall tiles.";
    selectedColor = wallColor;
    mazeButton.classList.remove('hidden');
  } else if (selectionStep === 1) {
    stepInfo.textContent = "Step 2: Select the start tile.";
    selectedColor = startTileColor;
    mazeButton.classList.add('hidden');
  } else if (selectionStep === 2) {
    stepInfo.textContent = "Step 3: Select the end tile.";
    selectedColor = finalTileColor;
  } else if (selectionStep === 3) {
    stepInfo.textContent = "Step 4: Start the algorithm.";
    Swal.fire({
      title: 'Start Algorithm?',
      text: "Do you want to start the algorithm?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then((result) => {
      if (result.isConfirmed) {
        const selectedAlgorithm = localStorage.getItem('selectedAlgorithm');
        if (selectedAlgorithm) {
          if (selectedAlgorithm === 'bfs') {
            bfs();
          } else if (selectedAlgorithm === 'dfs') {
            dfs();
          } else if (selectedAlgorithm === 'dijkstra-euclidean') {
            dijkstra('euclidean');
          } else if (selectedAlgorithm === 'dijkstra-manhattan') {
            dijkstra('manhattan');
          }
        }
      } else {
        reset();
      }
    });
  }
}

const nextStep = () => {
  if (selectionStep < 3) {
    selectionStep++;
    guideUser();
  }
}

class Tile {
  constructor(number, r, c) {
    this.number = number;
    this.isWall = false;
    this.row = r;
    this.col = c;
    this.neighbors = [];
  }

  getTileRow = () => {
    return this.row;
  }

  getTileCol = () => {
    return this.col;
  }

  isTileWall = () => {
    return this.isWall;
  }

  setTileWall = () => {
    this.isWall = true;
  }

  setTileNotWall = () => {
    this.isWall = false;
  }

  getTileNumber = () => {
    return this.tileNumber;
  }

  appendNeighbors = (neighbor) => {
    this.neighbors.push(neighbor);
  }

  handleClick = () => {
    if (editMode) {
      if (selectionStep === 0 && selectedColor === wallColor) {
        if (this.isTileWall()) {
          this.setTileNotWall();
          this.element.style.backgroundColor = emptyTileColor;
        } else {
          this.setTileWall();
          visitedAnimation(this, selectedColor);
        }
      } else if (selectionStep === 1 && selectedColor === startTileColor) {
        if (previousStartTile) {
          previousStartTile.element.style.backgroundColor = emptyTileColor;
        }
        this.setTileNotWall();
        startTile = this.number;
        previousStartTile = this;
        visitedAnimation(this, selectedColor);
      } else if (selectionStep === 2 && selectedColor === finalTileColor) {
        if (previousEndTile) {
          previousEndTile.element.style.backgroundColor = emptyTileColor;
        }
        this.setTileNotWall();
        endTile = this.number;
        previousEndTile = this;
        visitedAnimation(this, selectedColor);
      }
    }

    if (selectedColor === wallColor) {
      if (this.isTileWall()) {
        this.setTileNotWall();
        this.element.style.backgroundColor = emptyTileColor;
      }

      if (this.number === endTile) {
        endTile = -1;
      } else if (this.number === startTile) {
        startTile = -1;
      }
    }


  }

  // Creates a tile as a div
  createElement = (size) => {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.style.width = size + 'px';
    tile.style.height = size + 'px';
    tile.addEventListener('click', this.handleClick.bind(this));

    tile.addEventListener('mousedown', () => {
      isMouseDown = true;
    });

    tile.addEventListener('mousemove', () => {
      if (isMouseDown && this.number === startTile) {
        clickedOnToMove = 1;
      } else if (isMouseDown && this.number === endTile) {
        clickedOnToMove = 0;
      }

      if (isMouseDown && editMode && selectedColor === wallColor && !this.isTileWall()) {
        this.setTileWall();
        visitedAnimation(this, selectedColor);

        if (this.number === endTile) {
          endTile = -1;
        } else if (this.number === startTile) {
          startTile = -1;
        }
      }

      if (isMouseDown && pathFindingDone) {
        if (clickedOnToMove == 0) {
          if (!this.isTileWall() && this.number !== startTile && previousEndTile !== this) {
            if (previousEndTile) {
              previousEndTile.element.style.backgroundColor = emptyTileColor;
            }

            this.setTileNotWall();
            endTile = this.number;
            previousEndTile = this;
            this.element.style.backgroundColor = finalTileColor;
          }

        }

        if (clickedOnToMove == 1) {
          if (!this.isTileWall() && this.number !== endTile && previousStartTile !== this) {
            if (previousStartTile) {
              previousStartTile.element.style.backgroundColor = emptyTileColor;
            }

            this.setTileNotWall();
            startTile = this.number;
            previousStartTile = this;
            this.element.style.backgroundColor = startTileColor;
          }

        }

        if (currentAlg == 0) {
          bfsTime(0);
        } else if (currentAlg == 1) {
          dfsTime(0);
        } else if (currentAlg == 2) {
          dijTime(0, 'euclidean');
        } else if (currentAlg == 3) {
          dijTime(0, 'manhattan');
        } else if (currentAlg == 4) {
          astarTime(0, 'euclidean');
        }
      }


    });

    document.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    this.element = tile;
    return tile;
  }

}

const navigateHome = () => {
  window.location.href = 'index.html';
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// CREATING GRID
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Grid Size
const gridSizeX = 37;
const gridSizeY = 15;
let tileNumber = gridSizeX * gridSizeY;
let tiles = [];
let editMode = true;
let resetOn = false;
let tileSize = updateTileSize();

// Listen for changes in the width of the container
window.addEventListener("resize", () => {
  const gridContainer = document.querySelector(".grid-container");
  let width = gridContainer.offsetWidth;
  let height = width * 15 / 37; // Set height to be 15/37 of the width

  gridContainer.style.height = `${height}px`; // Set the height of the container using the style property
  tileSize = width / 37 - 2;
  updateTileSize2();
});

function updateTileSize2() {
  for (let i = 0; i < tileElementArray.length; i++) {
    tileElementArray[i].style.width = tileSize + 'px';
    tileElementArray[i].style.height = tileSize + 'px';
  }
}

function updateTileSize() {
  const gridContainer = document.querySelector(".grid-container");
  const width = gridContainer.offsetWidth;
  const tileSize = width / 37 - 2;
  return tileSize;
}

let tileElementArray = [];

// Creates the tile map
const createTiles = () => {
  tileElementArray = [];
  tiles = [];
  const gridContainer = document.querySelector(".grid-container");
  gridContainer.innerHTML = "";

  // Appends the tiles to the grid Container
  for (let i = 0; i < tileNumber; i++) {
    row = Math.floor(i / gridSizeX);
    col = i % gridSizeX;
    const tile = new Tile(i, row, col);
    const tileElement = tile.createElement(tileSize);
    tileElementArray.push(tileElement);
    tiles.push(tile);
    gridContainer.appendChild(tileElement);
  }
}

const updateNeighbors = (tile, allTiles) => {
  // Calculate the indices of the neighboring tiles
  const indices = [
    tile.number - gridSizeX, // Top
    tile.number + gridSizeX, // Bottom
    tile.number - 1, // Left
    tile.number + 1, // Right
  ];

  // Clear the existing neighbors array
  tile.neighbors = [];

  // Add the neighboring tiles to the neighbors array
  indices.forEach((index) => {
    // Check if the index is within the bounds of the array
    if (index >= 0 && index < tileNumber) {
      const neighbor = allTiles[index];

      // Check if the neighbor is in the same row or column as the tile
      if (neighbor.row === tile.row || neighbor.col === tile.col) {
        if (!neighbor.isTileWall()) tile.neighbors.push(neighbor);
      }
    }
  });
}

const updateTileNeighbors = () => {
  for (let j = 0; j < tiles.length; j++) {
    updateNeighbors(tiles[j], tiles)
  }
}

// Resets the tile map
async function reset() {
  openTiles = [];
  clickedOnToMove = -1;
  startTile = -1;
  endTile = -1;
  previousStartTile = null;
  previousEndTile = null;
  isMouseDown = false;
  resetOn = true;
  editMode = true;
  currentAlg = -1;
  pathFindingDone = false;
  visitedTiles = [];
  selectedColor = '';
  selectionStep = 0;
  createTiles();
  guideUser();
}

// Changes the color of the tile
let selectedColor = '';
const changeColor = (color) => {
  selectedColor = color;
}

window.onload = function () {
  createTiles();
  guideUser();
}




////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Algorithms
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let visitedTiles = []

const buildGraph = () => {
  const graph = {};

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    graph[tile.number] = [];

    for (let j = 0; j < tile.neighbors.length; j++) {
      const neighbor = tile.neighbors[j];
      graph[tile.number].push(neighbor.number);
    }
  }
  return graph;
}

const resetVisitedTiles = () => {
  for (let i = 0; i < visitedTiles.length; i++) {
    if (visitedTiles[i].number !== startTile && visitedTiles[i].number !== endTile) {
      visitedTiles[i].element.style.backgroundColor = emptyTileColor;
    }
  }

  visitedTiles = [];
}


const checkToStart = () => {
  return (endTile > -1 && startTile > -1);
}

const displayStepCount = (count) => {
  const stepCountElement = document.getElementById('step-count');
  stepCountElement.textContent = `Number of steps: ${count}`;
  Swal.fire({
    title: 'Algorithm Completed!',
    text: `The algorithm completed in ${count} steps.`,
    icon: 'success',
    confirmButtonText: 'OK'
  });
}

const displayNoPathMessage = () => {
  Swal.fire({
    title: 'No Path Available!',
    text: 'There is no available path from the start tile to the end tile.',
    icon: 'error',
    confirmButtonText: 'OK'
  });
}

///////////////////////
// BFS
///////////////////////

const bfs = () => {
  resetOn = true;
  pathFindingDone = false;
  currentAlg = 0;
  bfsTime(30)
}

async function bfsTime(delayTime) {
  await delay(300);
  selectedColor = '';
  if (!checkToStart()) {
    return;
  }

  editMode = false;
  resetOn = false;
  updateTileNeighbors();
  const graph = buildGraph();
  const visited = new Set([startTile]);
  const queue = [[startTile, 0]];
  const prev = {};
  let endNode = null;
  resetVisitedTiles();
  let stepCount = 0;

  outerLoop: while (queue.length > 0) {
    if (resetOn) {
      return;
    }
    if (delayTime > 0) {
      await delay(delayTime);
    }
    const [node, distance] = queue.shift();

    if (node == endTile) {
      endNode = node;
      break;
    }

    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, distance + 1]);
        if (neighbor !== startTile && neighbor !== endTile) {
          if (delayTime == 0) {
            tiles[neighbor].element.style.backgroundColor = visitedTileColor;
          } else {
            visitedAnimation(tiles[neighbor], visitedTileColor);
          }
          visitedTiles.push(tiles[neighbor]);
        }
        prev[neighbor] = node;
        if (endTile == neighbor) {
          endNode = neighbor;
          break outerLoop;
        }
      }
    }
  }
  // print(endNode);
  if (!endNode) {
    displayNoPathMessage();
    return;
  }

  // Color the path from end to start
  let node = endNode, total = 0;
  while (node != startTile && !resetOn) {
    total++;
    node = prev[node];
  }
  node = endNode;
  while (node != startTile && !resetOn) {
    stepCount++;
    if (node !== endNode) {
      if (delayTime == 0) {
        tiles[node].element.style.backgroundColor = finalPathTileColor;
      } else {
        // console.log("HI");
        visitedAnimation(tiles[node], finalPathTileColor);
        await delay(delayTime);
      }
    }
    tiles[node].element.textContent = total - stepCount + 1;
    tiles[node].element.style.fontSize = '24px'; // Set font size
    tiles[node].element.style.fontWeight = 'bold'; // Make text bold
    tiles[node].element.style.color = 'black'; // Set text color
    tiles[node].element.style.textAlign = 'center'; // Center text horizontally
    tiles[node].element.style.lineHeight = '1.5';
    // tiles[node].element.style.backgroundColor = '; // Highlight background
    node = prev[node];
  }

  pathFindingDone = true;
  displayStepCount(stepCount); // Include the end tile
}

///////////////////////
// DFS
///////////////////////

const dfs = () => {
  resetOn = true;
  pathFindingDone = false;
  currentAlg = 1;
  dfsTime(30)
}

// async function dfsTime(delayTime) {
//   await delay(50);
//   selectedColor = '';
//   if (!checkToStart()) {
//     return;
//   }

//   editMode = false;
//   resetOn = false;
//   updateTileNeighbors();
//   const graph = buildGraph();
//   const visited = new Set([startTile]);
//   const array = [[startTile, 0]];
//   const prev = {};
//   let endNode = null;
//   resetVisitedTiles();
//   let stepCount = 0;

//   outerLoop : while (array.length > 0) {
//     if (resetOn) {
//       return;
//     }
//     if (delayTime > 0) {
//       await delay(delayTime);
//     } 
//     const [node, distance] = array.pop();

//     if (node == endTile) {
//       endNode = node;
//       break;
//     }

//     for (let neighbor of graph[node]) {
//       if (!visited.has(neighbor)) {
//         visited.add(neighbor);
//         array.push([neighbor, distance + 1]);
//         if (neighbor !== startTile && neighbor !== endTile) {
//           if (delayTime == 0) {
//             tiles[neighbor].element.style.backgroundColor = visitedTileColor;
//           } else {
//             visitedAnimation(tiles[neighbor], visitedTileColor);
//           }
//           visitedTiles.push(tiles[neighbor]);
//         } 
//         prev[neighbor] = node;
//         if (endTile == neighbor) {
//           endNode = neighbor;
//           break outerLoop;
//         }
//       }
//     }
//   }

//   if (!endNode) {
//     displayNoPathMessage();
//     return;
//   }

//   // Color the path from end to start
//   let node = endNode,total=0;
//   while (node != startTile && !resetOn) {
//     total++;
//     node = prev[node];
//   }
//   node=endNode;
//   while (node != startTile && !resetOn) {
//     stepCount++;
//     if (node !== endNode) {
//       if (delayTime == 0) {
//         tiles[node].element.style.backgroundColor = finalPathTileColor;
//       } else {
//         visitedAnimation(tiles[node], finalPathTileColor);
//         await delay(delayTime); 
//       }
//     }
//     tiles[node].element.textContent=total-stepCount+1; 
//     tiles[node].element.style.fontSize = '24px'; // Set font size
//     tiles[node].element.style.fontWeight = 'bold'; // Make text bold
//     tiles[node].element.style.color = 'black'; 
//     tiles[node].element.style.textAlign = 'center'; // Center text horizontally
//     tiles[node].element.style.lineHeight = '1.5';
//     node = prev[node];
//   }

//   pathFindingDone = true;
//   displayStepCount(stepCount); // Include the end tile
// }
// Helper function to shuffle array randomly
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function dfsTime(delayTime) {
  await delay(50);
  selectedColor = '';
  if (!checkToStart()) return;

  editMode = false;
  resetOn = false;
  updateTileNeighbors();
  const graph = buildGraph();
  const visited = new Set();
  const prev = {};
  let endNode = null;
  resetVisitedTiles();
  let stepCount = 0;

  async function dfsRecursive(node) {
    if (resetOn || endNode) return;
    visited.add(node);

    // Color current node
    if (node !== startTile && node !== endTile) {
      if (delayTime == 0) {
        tiles[node].element.style.backgroundColor = visitedTileColor;
      } else {
        visitedAnimation(tiles[node], visitedTileColor);
        await delay(delayTime);
      }
      visitedTiles.push(tiles[node]);
    }

    // Found end tile
    if (node === endTile) {
      endNode = node;
      return;
    }

    // Get neighbors and shuffle them randomly
    let neighbors = [...graph[node]];
    neighbors = shuffleArray(neighbors);

    // Recursively visit unvisited neighbors
    for (let neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        prev[neighbor] = node;
        await dfsRecursive(neighbor);
      }
    }
  }

  // Start DFS from start tile
  await dfsRecursive(startTile);

  // Rest of your path coloring code...
  if (!endNode) {
    displayNoPathMessage();
    return;
  }

  let node = endNode, total = 0;
  while (node != startTile && !resetOn) {
    total++;
    node = prev[node];
  }

  node = endNode;
  while (node != startTile && !resetOn) {
    stepCount++;
    if (node !== endNode) {
      if (delayTime == 0) {
        tiles[node].element.style.backgroundColor = finalPathTileColor;
      } else {
        visitedAnimation(tiles[node], finalPathTileColor);
        await delay(delayTime);
      }
    }
    tiles[node].element.textContent = total - stepCount + 1;
    tiles[node].element.style.fontSize = '24px';
    tiles[node].element.style.fontWeight = 'bold';
    tiles[node].element.style.color = 'black';
    tiles[node].element.style.textAlign = 'center';
    tiles[node].element.style.lineHeight = '1.5';
    node = prev[node];
  }

  pathFindingDone = true;
  displayStepCount(stepCount);
}

///////////////////////
// Dijkstrax
///////////////////////

const addToQueueDij = (queue, tile, type) => {
  let startR = getRow(startTile);
  let startC = getCol(startTile);
  let dis = -1;

  if (type === 'euclidean') {
    dis = Math.sqrt(Math.pow(getCol(tile) - startC, 2) + Math.pow(getRow(tile) - startR, 2));
  } else if (type === 'manhattan') {
    dis = Math.abs(getCol(tile) - startC) + Math.abs(getRow(tile) - startR);
  }

  const newItem = [tile, dis];

  let i = 0;

  // Iterate through the queue and find the index where the new item should be inserted based on its fCost
  while (i < queue.length && queue[i][1] <= dis) {
    i++;
  }

  // Insert the new item at the correct index
  queue.splice(i, 0, newItem);

  return queue;
}

const dijkstra = (type) => {
  resetOn = true;
  pathFindingDone = false;
  if (type === 'euclidean') {
    currentAlg = 2;
  } else {
    currentAlg = 3;
  }
  dijTime(30, type)
}

async function dijTime(delayTime, type) {
  await delay(50);
  selectedColor = '';
  if (!checkToStart()) {
    return;
  }

  editMode = false;
  updateTileNeighbors();
  const graph = buildGraph();
  const visited = new Set([startTile]);
  let prioQueue = [[startTile, 0]];
  const prev = {};
  let endNode = null;
  resetVisitedTiles();
  resetOn = false;
  let stepCount = 0;

  outerLoop: while (prioQueue.length > 0) {
    if (resetOn) {
      return;
    }
    if (delayTime > 0) {
      await delay(delayTime);
    }

    const [node, distance] = prioQueue.shift();

    if (node == endTile) {
      endNode = node;
      break;
    }

    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        prioQueue = addToQueueDij(prioQueue, neighbor, type);

        if (neighbor !== startTile && neighbor !== endTile) {
          if (delayTime == 0) {
            tiles[neighbor].element.style.backgroundColor = visitedTileColor;
          } else {
            visitedAnimation(tiles[neighbor], visitedTileColor);
          }
          visitedTiles.push(tiles[neighbor]);
        }
        prev[neighbor] = node;
        if (endTile == neighbor) {
          endNode = neighbor;
          break outerLoop;
        }
      }
    }
  }

  if (!endNode) {
    displayNoPathMessage();
    return;
  }

  // Color the path from end to start
  let node = endNode, total = 0;
  while (node != startTile && !resetOn) {
    total++;
    node = prev[node];
  }
  node = endNode;
  while (node != startTile && !resetOn) {
    stepCount++;
    if (node !== endNode) {
      if (delayTime == 0) {
        tiles[node].element.style.backgroundColor = finalPathTileColor;
      } else {
        visitedAnimation(tiles[node], finalPathTileColor);
        await delay(delayTime);
      }
    }
    tiles[node].element.textContent = total - stepCount + 1;
    tiles[node].element.style.fontSize = '24px'; // Set font size
    tiles[node].element.style.fontWeight = 'bold'; // Make text bold
    tiles[node].element.style.color = 'black';
    tiles[node].element.style.textAlign = 'center'; // Center text horizontally
    tiles[node].element.style.lineHeight = '1.5';
    node = prev[node];
  }

  pathFindingDone = true;
  displayStepCount(stepCount); // Include the end tile
}

const getRow = (num) => {
  return Math.floor(num / gridSizeX);
}

const getCol = (num) => {
  return num % gridSizeX;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Maze
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let openTiles = [];

async function maze() {
  reset();
  await delay(25);
  pathFindingDone = false;
  for (let i = 0; i < tiles.length; i++) {
    let r = getRow(tiles[i].number);
    let c = getCol(tiles[i].number);
    if (r % 2 == 0 && c % 2 == 0) {
      tiles[i].setTileWall();
      visitedAnimation(tiles[i], wallColor);
    }
    else if (r % 2 != 1 || c % 2 != 1) {
      visitedAnimation(tiles[i], wallColor);
      if (r == 0 || r == gridSizeY - 1 || c == 0 || c == gridSizeX - 1) {
        tiles[i].setTileWall();
      }
    } else {
      openTiles.push(tiles[i]);
    }

  }
  createMazeNeighbors();
  dfsMaze();
}

const createMazeNeighbors = () => {
  for (let i = 0; i < openTiles.length; i++) {
    let tile = openTiles[i];
    // Calculate the indices of the neighboring tiles
    const indices = [
      tile.number - (gridSizeX * 2), // Top
      tile.number + (gridSizeX * 2), // Bottom
      tile.number - 2, // Left
      tile.number + 2, // Right
    ];

    // Clear the existing neighbors array
    tile.neighbors = [];

    // Add the neighboring tiles to the neighbors array
    indices.forEach((index) => {
      // Check if the index is within the bounds of the array
      if (index >= 0 && index < ((gridSizeX) * (gridSizeY))) {
        const neighbor = tiles[index];

        // Check if the neighbor is in the same row or column as the tile
        if (neighbor.row === tile.row || neighbor.col === tile.col) {
          if (!neighbor.isTileWall()) tile.neighbors.push(neighbor);
        }
      }
    });
  }
}

const buildMazeGraph = () => {
  const graph = {};

  for (let i = 0; i < openTiles.length; i++) {
    const tile = openTiles[i];
    graph[tile.number] = [];

    for (let j = 0; j < tile.neighbors.length; j++) {
      const neighbor = tile.neighbors[j];
      graph[tile.number].push(neighbor.number);
    }
  }
  return graph;
}

const getRidOfWall = (neighbor, node, color) => {
  neR = getRow(neighbor);
  noR = getRow(node)

  if (neR - noR == 2) {
    visitedAnimation(tiles[node + gridSizeX], color);
    return;
  } else if (neR - noR == -2) {
    visitedAnimation(tiles[node - gridSizeX], color);
    return;
  }

  neC = getCol(neighbor);
  noC = getCol(node)
  if (neC - noC == 2) {
    visitedAnimation(tiles[node + 1], color);
    return;
  } else if (neC - noC == -2) {
    visitedAnimation(tiles[node - 1], color);
    return;
  }
}


async function dfsMaze() {
  selectedColor = '';

  let delayTime = 1;
  const randStartIndex = Math.floor(Math.random() * openTiles.length);
  let s = openTiles[randStartIndex].number;
  const graph = buildMazeGraph();
  const visited = new Set([s]);
  const stack = [s];
  resetVisitedTiles();
  let neighbors = graph[s];
  let neighbor = neighbors[0];
  let node = stack[0];

  outerLoop: while (stack.length != 0) {
    node = stack[stack.length - 1];

    if (delayTime > 0) {
      await delay(delayTime);
    }

    neighbors = graph[node];

    for (let i = 0; i < neighbors.length; i++) {
      const randomIndex = Math.floor(Math.random() * neighbors.length);
      neighbor = neighbors[randomIndex];
      if (!visited.has(neighbor)) {
        neighbors.splice(randomIndex, 1);
        break;
      } else {
        neighbors.splice(randomIndex, 1);
      }
    }

    if (neighbors.length == 0) {
      stack.pop();
      continue;
    }


    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      stack.push(neighbor);
      if (neighbor !== s) {
        visitedAnimation(tiles[neighbor], emptyTileColor);
        visitedTiles.push(tiles[neighbor]);
      }

      getRidOfWall(neighbor, node, emptyTileColor);

    }

  }

  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].element.style.backgroundColor == wallColor) {
      tiles[i].setTileWall();
    }
  }

  pathFindingDone = true;
}