'use strict';
//  Consider creating renderCell() to be called from cellClicked & cellMarked

var gTimeBegan;
var gStopwatchInterval;

function renderBoard(board, selector) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var className = `cell clickable cell-${i}-${j}`;
            strHTML += `<td class="${className}" onclick="cellClicked(this, ${i}, ${j})"
             oncontextmenu="cellMarked(this, ${i}, ${j}); return false"</td>`;
        }
    }
    document.querySelector(selector).innerHTML = strHTML;
}

function removeClassFromAllElements(className) {
    var classNode = document.querySelectorAll(className);
    className = className.substring(1);
    for (var i = 0; i < classNode.length; i++) {
        classNode[i].classList.remove(className);
    }
}

function revealGameElements(board, gameEl) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            var currElCell = document.querySelector(`.cell-${i}-${j}`);
            if (currCell.isMine) currElCell.innerHTML = gameEl;
            else if (currCell.isMarked) currElCell.innerHTML = WRONG_MARK;

            if (currCell.isMine && gameEl === MINE ||
                !currCell.isMine && currCell.isMarked) {
                currElCell.classList.add('clicked');
            }
        }
    }
}

// function toggleClearCellsClicks(board) {
//     var clearCells = getClearCellsPos(board);
//     for (var idx = 0; idx < clearCells.length; idx++) {
//         var i = clearCells[idx].i;
//         var j = clearCells[idx].j;
//         var currCell = board[i][j];
//         var currElCell = document.querySelector(`.cell-${i}-${j}`);

//         currCell.isShown = !currCell.isShown;
//         currElCell.classList.toggle('clickable');
//     }
// }

function getClearCellsPos(board) {
    var clearCells = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j];
            if (!currCell.isShown && !currCell.isMarked) {
                clearCells.push({ i: i, j: j });
            }
        }
    }
    return clearCells;
}

function updateLives(bombCellEl = null) {
    if (bombCellEl) {
        gGame.remainingLives--;
        if (gGame.remainingLives > 0) bombCellEl.style.backgroundColor = '#ff5';
        document.querySelector('.lives').style.color = 'red';
        setTimeout(function () {
            document.querySelector('.lives').style.color = 'initial';
        }, 1000);
    }
    document.querySelector('.lives').innerText = gGame.remainingLives;
}

function updateBombsCount(game, level) {
    var bombsCount = level.MINES - game.markedCount - (level.LIVES - game.remainingLives);

    document.querySelector('.bombs-count span').innerText = (bombsCount > 9) ? bombsCount :
        (bombsCount >= 0) ? '0' + bombsCount : '00';
}

function resetHints() {
    var hints = document.querySelectorAll('.hint');
    for (var i = 0; i < hints.length; i++) {
        hints[i].innerHTML = '<img onclick="toggleHint(this)" src="img/light-bulb.png" style=" cursor: pointer;" />';
        hints[i].style.backgroundColor = 'initial';
    }
}

// -- Stopwatch --
function startStopwatch() {
    gTimeBegan = new Date();
    gStopwatchInterval = setInterval(runStopwatch, 11);
}

function runStopwatch() {
    var currentTime = new Date();
    var timeElapsed = new Date(currentTime - gTimeBegan);
    var min = timeElapsed.getUTCMinutes();
    var sec = timeElapsed.getUTCSeconds();
    var ms = timeElapsed.getUTCMilliseconds();

    document.querySelector('.stopwatch span').innerText =
        (min > 9 ? min + ':' : min > 0 ? '0' + min + ':' : '') +
        (sec > 9 ? sec : '0' + sec) + '.' +
        (ms > 99 ? ms : ms > 9 ? '0' + ms : '00' + ms);
}

function resetStopwatch() {
    clearInterval(gStopwatchInterval);
    gStopwatchInterval = null;
    document.querySelector('.stopwatch span').innerText = "00.000";
}
// ---------------


// -- Best scores --
function updateBestScores(difficulty, time) {
    if (!difficulty || !time) return;
    var bestScore = localStorage.getItem(difficulty);
    if (!bestScore || timeStringToFloat(time) < timeStringToFloat(bestScore)) {
        localStorage.setItem(difficulty, time);
        var bestScoreHTML = document.querySelector('.' + difficulty + '-score');
        bestScoreHTML.innerText = time;
        document.querySelector('.highscore').style.display = 'initial';
    }
}

function timeStringToFloat(time) {
    var splittedTime = time.split(':');
    var minsToSecs = splittedTime[1] ? splittedTime[0] * 60 : 0;
    var seconds = splittedTime[1] ? splittedTime[1] : splittedTime[0];
    return (+minsToSecs) + (+seconds);
}

function loadBestScores() {
    // document.querySelector('.highscore').style.display = 'none'; // Add a new highscore modal
    var bestScoreHTML = document.querySelector('.beginner-score');
    var bestScore = localStorage.getItem('beginner');
    if (bestScore) bestScoreHTML.innerText = bestScore;
    bestScoreHTML = document.querySelector('.medium-score');
    var bestScore = localStorage.getItem('medium');
    if (bestScore) bestScoreHTML.innerText = bestScore;
    bestScoreHTML = document.querySelector('.expert-score');
    var bestScore = localStorage.getItem('expert');
    if (bestScore) bestScoreHTML.innerText = bestScore;
}
// -----------------