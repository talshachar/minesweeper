'use strict';

const MINE = '&#128163';
const FLAG = '&#128681';

var gBoard;
var gLevel;
var gGame;

function initGame() {
    gLevel = {
        HEIGHT: 4,
        WIDTH: 4,
        MINES: 2,
        LIVES: 1
    };
    gGame = {
        isOn: true,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        remainingLives: gLevel.LIVES
    };
    gBoard = buildBoard(gLevel.HEIGHT, gLevel.WIDTH, gLevel.MINES);

    // console.table(gBoard);
    renderBoard(gBoard, '.board-container');
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

function cellClicked(elCell, i, j) {
    var cell = gBoard[i][j];
    // Clicks aren't consdired in these events
    if (!gGame.isOn || cell.isShown || cell.isMarked) return;
    // First click is never a mine
    if (gGame.shownCount === 0) addMines(gBoard, gLevel.MINES, i, j);

    cell.isShown = true;
    gGame.shownCount++;
    var cellContent = (cell.isMine) ? MINE :
        (cell.minesAroundCount > 0) ? cell.minesAroundCount : '';
    elCell.innerHTML = cellContent;
    elCell.classList.remove('cell');
    elCell.classList.add('clicked', `num${cell.minesAroundCount}`);
    if (cell.isMine) gGame.remainingLives--;
    else if (cellContent === '') expandShown(gBoard, i, j)
    checkGameOver();
}

function cellMarked(elCell, i, j) {
    var cell = gBoard[i][j];
    if (!gGame.isOn || cell.isShown) return;

    cell.isMarked = !cell.isMarked;
    var cellContent = (cell.isMarked) ? FLAG : '';
    elCell.innerHTML = cellContent;

}


function checkGameOver() {
    if (!gGame.isOn) return; // Temporary fix
    // TO Fix - Duplicated code
    if (gGame.remainingLives === 0) {
        gGame.isOn = false;
        alert('Lost! :(')
    } else if (gGame.shownCount === gLevel.HEIGHT * gLevel.WIDTH - gLevel.MINES) {
        gGame.isOn = false;
        alert('Victory! :)')
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