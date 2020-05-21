'use strict';

// const MINE = '&#128163';
const MINE = '<img src="img/bomb.png" class="game-el"/>';
// const FLAG = '&#128681';
const FLAG = '<img src="img/flag.png" class="game-el"/>';
const WRONG_MARK = '<img src="img/not-bomb.png" class="game-el"/>';

var gBoard;
var gLevel;
var gGame;

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
        markedCount: 0, // Add remaining bombs indicator using this key
        remainingLives: gLevel.LIVES,
        remainingSafeClicks: gLevel.SAFE_CLICKS,
        // isHint = false
    };
    gBoard = buildBoard(gLevel.HEIGHT, gLevel.WIDTH, gLevel.MINES);

    resetStopwatch();
    loadBestScores();
    document.querySelector('.smiley').src = 'img/smiley_smile.png';
    document.querySelector('.safe-clicks').innerText = gGame.remainingSafeClicks;
    updateLives();
    updateBombsCount(gGame, gLevel);

    renderBoard(gBoard, '.game-table tbody');
}

function cellClicked(elCell, i, j) {
    var cell = gBoard[i][j];
    if (!gGame.isOn || cell.isShown || cell.isMarked) return;
    if (gGame.numsShownCount === 0) {
        addMines(gBoard, gLevel.MINES, i, j); // First click is never a mine
        startStopwatch();
    } /* else if (gGame.isHint) {
        revealHint(gBoard, i, j)
    } */

    cell.isShown = true;
    var cellContent = (cell.isMine) ? MINE :
        (cell.minesAroundCount > 0) ? cell.minesAroundCount : '';
    elCell.innerHTML = cellContent;
    elCell.classList.remove('clickable');
    elCell.classList.add('clicked', `num${cell.minesAroundCount}`);

    if (cell.isMine) updateLives(elCell);
    else {
        gGame.numsShownCount++;
        if (cellContent === '') expandShown(gBoard, i, j)
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
                cellClicked(elCell, i, j);
            }
        }
    }
    return board;
}

function safeClick() {
    if (!gGame.isOn || gGame.remainingSafeClicks === 0) return;
    var clearCells = getClearCellsPos(gBoard);
    for (var idx = 0; idx < clearCells.length; idx++) {
        if (gBoard[clearCells[idx].i][clearCells[idx].j].isMine) {
            clearCells.splice(idx, 1);
        }
    }
    var randIdx = Math.floor(Math.random() * clearCells.length);
    var randSafeCellPos = clearCells[randIdx];

    var elSafeCell = document.querySelector(`.cell-${randSafeCellPos.i}-${randSafeCellPos.j}`);
    elSafeCell.innerHTML = FLAG;
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

// function toggleHint() {
//     gGame.isHint = !gGame.isHint
//     // Append css to lightbulb according to isHint state
// }

// function revealHint(board, rowIdx, colIdx) {
//     var revealedCells = []
//     for

//             var currCell = board[i][j];
//             var currElCell = document.querySelector(`.cell-${i}-${j}`);

//             if (currCell.isShown) continue;
//             revealedCells.push({ i: i, j: j});
//             var cellContent = (cell.isMine) ? MINE :
//                 (cell.minesAroundCount > 0) ? cell.minesAroundCount : '';
//             currElCell.innerHTML = cellContent;
//             currElCell.classList.remove('clickable');
//             currElCell.classList.add('clicked', `num${cell.minesAroundCount}`);
//             setTimeout(function () {

//             }, 1000);
//         }
//     }
// }


function checkGameOver(clickedBombEl) {
    // if (!gGame.isOn) return;
    if (gGame.remainingLives === 0) {
        clickedBombEl.style.backgroundColor = 'red';
        gGame.isOn = false;
        document.querySelector('.smiley').src = 'img/smiley_sad.png';
        revealGameElements(gBoard, MINE);
    } else if (gGame.numsShownCount === gLevel.HEIGHT * gLevel.WIDTH - gLevel.MINES) {
        gGame.isOn = false;
        document.querySelector('.smiley').src = 'img/smiley_cool.png';
        revealGameElements(gBoard, FLAG);
        var time = document.querySelector('.stopwatch').innerText;
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