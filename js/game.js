'use strict';

// const MINE = '&#128163';
const MINE = '<img src="img/bomb.png" class="game-el"/>';
// const FLAG = '&#128681';
const FLAG = '<img src="img/flag.png" class="game-el"/>';
const WRONG_MARK = '<img src="img/not-bomb.png" class="game-el"/>';
// const SAFE = '<img src="img/safe.png" class="game-el"/>';

var gBoard;
var gLevel;
var gGame;
var gUndos;

function initGame() {
    var difficulty = document.querySelector('input[name="difficulty"]:checked').dataset;
    gLevel = {
        // Add UI settings to select custom lives, safe-clicks, mines and height & width
        HEIGHT: +difficulty.i,
        WIDTH: +difficulty.j,
        MINES: +difficulty.mines,
        LIVES: +difficulty.lives,
        SAFE_CLICKS: +difficulty.safeclicks
    };
    gGame = {
        isOn: true,
        numsShownCount: 0,
        markedCount: 0,
        remainingLives: gLevel.LIVES,
        remainingSafeClicks: gLevel.SAFE_CLICKS,
        isHint: false,
        isBoardHasMines: false
    };
    gBoard = buildBoard(gLevel.HEIGHT, gLevel.WIDTH, gLevel.MINES);
    gUndos = [];

    resetStopwatch();
    loadBestScores();
    document.querySelector('.smiley').src = 'img/smiley-happy.png';
    document.querySelector('.safe-clicks').innerText = gGame.remainingSafeClicks;
    updateLives();
    resetHints();
    updateBombsCount(gGame, gLevel);

    renderBoard(gBoard, '.game-table tbody');
}

function cellClicked(elCell, i, j, isCalledFromRecursion = false) {
    var cell = gBoard[i][j];
    if (!gGame.isOn || cell.isShown || cell.isMarked) return;
    if (!gGame.isBoardHasMines) {
        addMines(gBoard, gLevel.MINES, i, j); // First click is never a mine
        startStopwatch();
        gGame.isBoardHasMines = true;
    } else if (gGame.isHint) {
        revealHint(gBoard, i, j);
        return;
    }

    cell.isShown = true;
    var cellContent = (cell.isMine) ? MINE :
        (cell.minesAroundCount > 0) ? cell.minesAroundCount : '';
    elCell.innerHTML = cellContent;
    elCell.classList.remove('clickable');
    elCell.classList.add('clicked', `num${cell.minesAroundCount}`);

    gUndos.push({ elCell: elCell, i: i, j: j, recursive: isCalledFromRecursion })
    if (cell.isMine) updateLives(elCell);
    else {
        gGame.numsShownCount++;
        if (cellContent === '') {
            expandShown(gBoard, i, j)
        }
    }

    checkGameOver(elCell);
}

function cellMarked(elCell, i, j) {
    var cell = gBoard[i][j];
    if (!gGame.isOn || cell.isShown) return;

    elCell.classList.toggle('clickable');
    cell.isMarked = !cell.isMarked;
    var cellContent = (cell.isMarked) ? FLAG : '';
    elCell.innerHTML = cellContent;
    gGame.markedCount += (cell.isMarked) ? 1 : -1;
    updateBombsCount(gGame, gLevel);
    gUndos.push({ elCell: elCell, i: i, j: j, isMark: true })
}


function safeClick() {
    if (gGame.numsShownCount === 0) alert('First click is always safe :)');
    if (!gGame.isOn || gGame.remainingSafeClicks === 0 || gGame.numsShownCount === 0) return;
    var clearCells = getClearCellsPos(gBoard);
    for (var idx = 0; idx < clearCells.length; idx++) {
        if (gBoard[clearCells[idx].i][clearCells[idx].j].isMine) {
            clearCells.splice(idx, 1);
        }
    }
    if (!clearCells.length) return;
    var randIdx = Math.floor(Math.random() * clearCells.length);
    var randSafeCellPos = clearCells[randIdx];

    var elSafeCell = document.querySelector(`.cell-${randSafeCellPos.i}-${randSafeCellPos.j}`);
    elSafeCell.innerHTML = WRONG_MARK;
    elSafeCell.classList.remove('clickable');
    gBoard[randSafeCellPos.i][randSafeCellPos.j].isShown = true;
    gGame.remainingSafeClicks--;
    document.querySelector('.safe-clicks').innerText = gGame.remainingSafeClicks;

    setTimeout(function () {
        elSafeCell.innerHTML = ''
        elSafeCell.classList.add('clickable');
        gBoard[randSafeCellPos.i][randSafeCellPos.j].isShown = false;
    }, 1500);
}


function toggleHint(elHint) {
    if (gGame.numsShownCount === 0) {
        alert('Hints are available only after starting the game!'); // Replace with modal
        return;
    } else if (!elHint.src.includes('active')) {
        if (gGame.isHint || document.querySelectorAll('img[src="img/light-bulb-active.png"]').length > 0 || !gGame.isOn) {
            return;
        }
    }

    gGame.isHint = !gGame.isHint
    if (gGame.isHint) {
        elHint.src = 'img/light-bulb-active.png';
        elHint.parentElement.style.backgroundColor = '#eea'
    } else {
        elHint.src = 'img/light-bulb.png';
        elHint.parentElement.style.backgroundColor = 'initial'
    }
}

function revealHint(board, rowIdx, colIdx) {
    var revealedCells = []
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue;
            var currCell = board[i][j];
            var currElCell = document.querySelector(`.cell-${i}-${j}`);
            if (currCell.isShown) continue;
            revealedCells.push({ i: i, j: j });

            var cellContent = (currCell.isMine) ? MINE :
                (currCell.minesAroundCount > 0) ? currCell.minesAroundCount : '';
            currElCell.innerHTML = cellContent;
            currElCell.classList.remove('clickable');
            currElCell.classList.add('clicked', `num${currCell.minesAroundCount}`);
            gGame.isHint = false;

        }
    }
    setTimeout(function () {
        for (var idx = 0; idx < revealedCells.length; idx++) {
            i = revealedCells[idx].i
            j = revealedCells[idx].j
            currElCell = document.querySelector(`.cell-${i}-${j}`);
            currElCell.innerText = '';
            currElCell.classList.add('clickable');
            currElCell.classList.remove('clicked');
        }
        var elHint = document.querySelector('img[src="img/light-bulb-active.png"]');
        elHint.parentElement.style.backgroundColor = 'initial';
        elHint.src = 'img/light-bulb.png';
        elHint.style.display = 'none';
    }, 1000);
}

function undo() {
    if (!gUndos.length || !gGame.isOn) return;
    var currUndo = gUndos.pop();
    var currCell = gBoard[currUndo.i][currUndo.j];
    if (currUndo.isMark) {
        currCell.isMarked = !currCell.isMarked;
        gGame.markedCount += (currCell.isMarked) ? 1 : -1;
        updateBombsCount(gGame, gLevel);

        currUndo.elCell.classList.toggle('clickable');
        var cellContent = (currCell.isMarked) ? FLAG : '';
        currUndo.elCell.innerHTML = cellContent;
    } else {
        gBoard[currUndo.i][currUndo.j].isShown = false;
        gGame.numsShownCount--;
        if (gBoard[currUndo.i][currUndo.j].isMine) {
            currUndo.elCell.style.backgroundColor = 'initial';
            gGame.remainingLives++;
            updateLives();
        }
        currUndo.elCell.innerText = '';
        currUndo.elCell.classList.add('clickable');
        currUndo.elCell.classList.remove('clicked');
        if (currUndo.recursive) undo();
    }
}

function checkGameOver(clickedBombEl) {
    // if (!gGame.isOn) return;
    if (gGame.remainingLives === 0) {
        clickedBombEl.style.backgroundColor = 'red';
        gGame.isOn = false;
        document.querySelector('.smiley').src = 'img/smiley-sad.png';
        revealGameElements(gBoard, MINE);
    } else if (gGame.numsShownCount === gLevel.HEIGHT * gLevel.WIDTH - gLevel.MINES) {
        gGame.isOn = false;
        document.querySelector('.smiley').src = 'img/smiley-cool.png';
        revealGameElements(gBoard, FLAG);
        var time = document.querySelector('.stopwatch span').innerText;
        var difficulty = document.querySelector('input[name="difficulty"]:checked').dataset.name;

    }
    updateBombsCount(gGame, gLevel);
    if (!gGame.isOn) {
        clearInterval(gStopwatchInterval);
        gStopwatchInterval = null;
        removeClassFromAllElements('.clickable');
        updateBestScores(difficulty, time);
    }
}


function expandShown(board, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            var cell = board[i][j];
            if (j < 0 || j >= board[0].length) continue;
            if (i === rowIdx && j === colIdx) continue;
            if (!cell.isMine) {
                var elCell = document.querySelector(`.cell-${i}-${j}`);
                // gUndos[gUndos.length - 1].recursive = true;
                cellClicked(elCell, i, j, true);
            }
        }
    }
    return board;
}

function buildBoard(height, width, minesCount) {
    var board = [];
    for (var i = 0; i < height; i++) {
        board[i] = [];
        for (var j = 0; j < width; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            };
        }
    }
    // addMines is being called on first cell clicked
    return board;
}

function addMines(board, minesCount, iClicked, jClicked) {
    for (var i = 0; i < minesCount; i++) {
        var randRow = Math.floor(Math.random() * board.length);
        var randCol = Math.floor(Math.random() * board[0].length);
        var cell = board[randRow][randCol];
        if (cell.isMine || randRow === iClicked && randCol === jClicked) {
            i--;
            continue;
        }
        cell.isMine = true;
        setMinesAroundCount(board, randRow, randCol);
    }
}

function setMinesAroundCount(board, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue;
            if (i === rowIdx && j === colIdx) continue;
            board[i][j].minesAroundCount++;
        }
    }
    return board;
}