'use strict';
//  Consider creating renderCell() to be called from cellClicked & cellMarked

function renderBoard(board, selector) {
    var strHTML = '<table><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var className = `cell cell-${i}-${j}`;
            strHTML += `<td class="${className}" onclick="cellClicked(this, ${i}, ${j})"
             oncontextmenu="cellMarked(this, ${i}, ${j}); return false"> </td>`;
        }
    }
    strHTML += '</tbody></table>';
    document.querySelector(selector).innerHTML = strHTML;
}