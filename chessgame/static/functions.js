//I left commented print statements because I might return to this project in the future

var status = "choosingPiece";
var id = -1;
var turn = "";

var chosenPiece = null;
var board = new Array(8); //8 rows in a chessboard
for (var i = 0; i < board.length; i++) { 
	    board[i] = new Array(8); 
}
var attacker = null;

var kingXWhite = -1;
var kingYWhite = -1;
var kingXBlack = -1;
var kingYBlack = -1;


function sendLocation(x) {
	if (status == "choosingPiece") {
		//I got this code on stack overflow https://stackoverflow.com/questions/4998953/get-cell-location
		var pieceY = x.parentNode.rowIndex - 1;
		var pieceX = x.cellIndex - 1;
		if (chosenPiece == null) {
			var xhttp = new XMLHttpRequest();


			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {

					tempBoard = JSON.parse(this.responseText);
					for (var i = 0; i < board.length; i++) {
						for (var j = 0; j < board.length; j++) {
							board[i][j] = tempBoard[8 * i + j];
						}
					}

					chosenPiece = board[pieceY][pieceX];

					
					for (var i = 0; i < 8; i++) { //8 rows in a chessboard
						for (var j = 0; j < 8; j++) { //8 columns in a chessboard
							if (board[i][j].color == "white" && board[i][j].type == "k") {
								kingXWhite = j;
								kingYWhite = i;
							}
							if (board[i][j].color == "black" && board[i][j].type == "k") {
								kingXBlack = j;
								kingYBlack = i;
							}
						}
					}

					if (chosenPiece.color == turn) {
						status = "choosingMove";
						document.getElementById("row").innerHTML = "Row: " + chosenPiece.x;
						document.getElementById("column").innerHTML = "Column: " + chosenPiece.y;
					}


				}
			};


			xhttp.open("POST", "getBoard?&id=" + id, true);
			xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			xhttp.send();
		} else {
			chosenPiece = board[pieceY][pieceX];
			if (chosenPiece.color == turn) {
				status = "choosingMove";
				document.getElementById("row").innerHTML = "Row: " + chosenPiece.x;
				document.getElementById("column").innerHTML = "Column: " + chosenPiece.y;
			}
		}
		

		
		
	} else if (status == "choosingMove") {
		moveY = x.parentNode.rowIndex - 1;
		moveX = x.cellIndex - 1;
		status = "choosingPiece";

		
		//Validating Move
		if (!validateMove(chosenPiece, moveX, moveY, board, false, false)) {
			document.getElementById("row").innerHTML = "Row";
			document.getElementById("column").innerHTML = "Column";
			return;
		}

		//Setting king coordinates
		if (chosenPiece.type == "k") {
			if (chosenPiece.color == "white") {
				kingXWhite = moveX;
				kingYWhite = moveY;
			} else if (chosenPiece.color == "black") {
				kingXBlack = moveX;
				kingYBlack = moveY;
			}
		}
		

		

		var xhttp = new XMLHttpRequest();

		xhttp.open("POST", "move?pieceX=" + chosenPiece.x + "&pieceY=" + chosenPiece.y + "&moveX=" + moveX + "&moveY=" + moveY + "&id=" + id, true);
		
		//Got this code from StackOverflow https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest
		xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');



		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {

				//console.log("made it here");

				document.getElementById("row").innerHTML = "Row";
				document.getElementById("column").innerHTML = "Column";

				var ret = this.responseText;
				turn = ret.substring(ret.length - 5, ret.length);
				document.getElementById("turn-display").innerHTML = "It is currently " + turn + "'s turn";
				//console.log(turn)
				ret = ret.substring(0, ret.length - 5);
				
				tempBoard = JSON.parse(ret);

				updateBoard(tempBoard);
				checkPromotion();

				
				//Check end conditions
				if(isInCheckMate("white")) {
					end("black");
				} else if (isInCheckMate("black")) {
					end("white");
				} else if (checkForDraw()) {
					end("draw");
				}

			}
		}; 

		xhttp.send();
	}

}

//This function makes the player resign
function resign() {

	if (turn == "white") {
		end("black");
	} else if (turn == "black") {
		end("white");
	} else {
		console.log("Invalid turn resign()");
	}

}

function end(winner) {


	var xhttp = new XMLHttpRequest();

	xhttp.open("POST", "end?winner=" + winner + "&id=" + id, true);
	
	//Got this code from StackOverflow https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest
	xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');



	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			if (winner == "black") {
				alert("Black has won!");
			} else if (winner == "white") {
				alert("White has won!");
			} else if (winner == "draw") {
				alert("The game has ended in a draw!");
			} else {
				console.log("Something went very wrong, wrong winner, end()");
			}
			window.location.replace(".");
		}
	}

	xhttp.send();
}


function updateBoard(tempBoard) {

	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board.length; j++) {
			board[i][j] = tempBoard[8 * i + j];
		}
	}
	
	for (var i = 1; i < 9; i++) {//8 rows in a chess board, must not include the headers
		var row = document.getElementById("board").rows[i].cells;
		for (var j = 1; j < 9; j++) {//8 columns in a chess board, must not include the headers
			var cell = row[j];
			var img = document.createElement('img');
			if (board[i-1][j-1].color == "black") {
				if (board[i-1][j-1].type == "p") {
					img.src = "static/Pawn_Black.png";
				} else if (board[i-1][j-1].type == "r") {
					img.src = "static/Rook_Black.png";
				} else if (board[i-1][j-1].type == "n") {
					img.src = "static/Knight_Black.png";
				} else if (board[i-1][j-1].type == "b") {
					img.src = "static/Bishop_Black.png";
				} else if (board[i-1][j-1].type == "q") {
					img.src = "static/Queen_Black.png";
				} else if (board[i-1][j-1].type == "k") {
					img.src = "static/King_Black.png";
				}
				
			} else if (board[i-1][j-1].color == "white") {
				if (board[i-1][j-1].type == "p") {
					img.src = "static/Pawn_White.png";
				} else if (board[i-1][j-1].type == "r") {
					img.src = "static/Rook_White.png";
				} else if (board[i-1][j-1].type == "n") {
					img.src = "static/Knight_White.png";
				} else if (board[i-1][j-1].type == "b") {
					img.src = "static/Bishop_White.png";
				} else if (board[i-1][j-1].type == "q") {
					img.src = "static/Queen_White.png";
				} else if (board[i-1][j-1].type == "k") {
					img.src = "static/King_White.png";
				}
			} else {
				img.src = "static/blank.png";
			}

			cell.innerHTML = "";
			cell.appendChild(img);
		}

		
	}
}

//Makes the board checkered colors
function makeCheckeredBoard() {

	for (var i = 1; i < 9; i++) {//8 rows in a chess board, must not include the headers
		var row = document.getElementById("board").rows[i].cells;
		for (var j = 1; j < 9; j++) {//8 columns in a chess board, must not include the headers
			var cell = row[j];
			
			if ((i % 2 + j % 2) % 2 == 1) {
				cell.className = "green";
			} else {
				cell.className = "beige";
			}
		}

		
	}
}


//Important function
//Checks whether or not a piece can move to a specifc spot
function validateMove(piece, moveX, moveY, curBoard, ignoreSelfTake, fromIsInCheck) {
//This may seem redundant, but it needs to do a different thing when it is called from isAttacked, isInCheck, and other methods
	

	if (moveX < 0 || moveX > 7 || moveY < 0 || moveY > 7) {
		return false;
	}

	if (moveX == piece.x && moveY == piece.y) {
		return false;
	}

	if (curBoard[moveY][moveX].color == piece.color && !ignoreSelfTake) {
		return false;
	}

	if (!fromIsInCheck) {
		if (isInCheck(piece.color, true, piece.x, piece.y, moveX, moveY)) {
			return false;
		}
	}
	

	if (piece.type == "p") {
		if (piece.color == "black") {
			
			if (moveX == piece.x && moveY == piece.y + 1 && curBoard[moveY][moveX].type == " ") {
				return true;
			} else if (moveX == piece.x && moveY == piece.y + 2 && curBoard[moveY][moveX].type == " " && curBoard[moveY - 1][moveX].type == " " && piece.moved == 0) {
				return true;
			} else if (moveX == piece.x + 1 && moveY == piece.y + 1 && curBoard[moveY][moveX].type != " ") {
				return true;
			} else if (moveX == piece.x - 1 && moveY == piece.y + 1 && curBoard[moveY][moveX].type != " ") {
				return true;
			} else {
				return false;
			}
			

			
		} else if (piece.color == "white") {
			

			if (moveX == piece.x && moveY == piece.y - 1 && curBoard[moveY][moveX].type == " ") {
				return true;
			} else if (moveX == piece.x && moveY == piece.y - 2 && curBoard[moveY][moveX].type == " " && curBoard[moveY + 1][moveX].type == " " && piece.moved == 0) {
				return true;
			} else if (moveX == piece.x + 1 && moveY == piece.y - 1 && curBoard[moveY][moveX].type != " ") {
				return true;
			} else if (moveX == piece.x - 1 && moveY == piece.y - 1 && curBoard[moveY][moveX].type != " ") {
				return true;
			} else {
				return false;
			}
			
		} else {
			console.log("something went wrong (validateMove() pawn)");
		}

	} else if (piece.type == "r") {
		
		

		if (moveX == piece.x) {
			var bigY = moveY;
			var smallY = piece.y;
			if (smallY > bigY) {
				smallY = moveY;
				bigY = piece.y;
			}

			if (smallY < 0 || bigY > 8) {
				return false;
			}

			for (var i = smallY + 1; i < bigY; i++) {
				if (curBoard[i][moveX].type != " ") {
					return false;
				}
			}
			return true;

		} else if (moveY == piece.y) {
			var bigX = moveX;
			var smallX = piece.x;
			if (smallX > bigX) {
				smallX = moveX;
				bigX = piece.x;
			}

			if (smallX < 0 || bigY > 8) {
				return false;
			}

			for (var i = smallX + 1; i < bigX; i++) {
				if (curBoard[moveY][i].type != " ") {
					return false;
				}
			}
			return true;

		} else {
			return false;
		}

	} else if (piece.type == "b") {

		if (Math.abs(piece.x - moveX) != Math.abs(piece.y - moveY)) {
			//console.log("this failed");
			return false;
		}

		var xDiff = 1;
		var yDiff = 1;
		if (moveX < piece.x) {
			xDiff = -1;
		}
		if (moveY < piece.y) {
			yDiff = -1;
		}

		for (var i = 1; i < Math.abs(piece.x - moveX); i++) {

			if (curBoard[piece.y + (i * yDiff)][piece.x + (i * xDiff)].type != " ") {
				//console.log("for failed" + xDiff + " " + yDiff+ " " + i + " " + JSON.stringify(curBoard[piece.y + (i * yDiff)][i * xDiff]) + " " + (piece.y + i * yDiff));
				return false;
			}

		}
		return true;
	} else if (piece.type == "n") {

		if (!(Math.abs(piece.x - moveX) == 2 && Math.abs(piece.y - moveY) == 1) && !(Math.abs(piece.x - moveX) == 1 && Math.abs(piece.y - moveY) == 2)) {
			return false;
		}

		return true;
	} else if (piece.type == "q") {

		if (moveX == piece.x) {
			var bigY = moveY;
			var smallY = piece.y;
			if (smallY > bigY) {
				smallY = moveY;
				bigY = piece.y;
			}

			if (smallY < 0 || bigY > 8) {
				return false;
			}

			for (var i = smallY + 1; i < bigY; i++) {
				if (curBoard[i][moveX].type != " ") {
					return false;
				}
			}
			return true;

		} else if (moveY == piece.y) {

			var bigX = moveX;
			var smallX = piece.x;
			if (smallX > bigX) {
				smallX = moveX;
				bigX = piece.x;
			}

			if (smallX < 0 || bigY > 8) {
				return false;
			}
			for (var i = smallX + 1; i < bigX; i++) {
				if (curBoard[moveY][i].type != " ") {
					return false;
				}
			}
			return true;
		} 
		if (Math.abs(piece.x - moveX) != Math.abs(piece.y - moveY)) {
			//console.log("this failed");
			return false;
		}

		var xDiff = 1;
		var yDiff = 1;
		if (moveX < piece.x) {
			xDiff = -1;
		}
		if (moveY < piece.y) {
			yDiff = -1;
		}

		for (var i = 1; i < Math.abs(piece.x - moveX); i++) {
			if (curBoard[piece.y + (i * yDiff)][piece.x + (i * xDiff)].type != " ") {
				//console.log("for failed" + xDiff + " " + yDiff+ " " + i + " " + JSON.stringify(curBoard[piece.y + (i * yDiff)][i * xDiff]) + " " + (piece.y + i * yDiff));
				return false;
			}
		}
		return true;
	} else if (piece.type == "k") {

		if (Math.abs(piece.x - moveX) == 2 && piece.moved == 0 && curBoard[moveY][(moveX - piece.x) * 1.75 + 3.5].moved == 0) {//King will castle two steps either direction
		//(moveX - piece.x) is either 2 or negative 2 depending on whether its right, and it needs to become 7 or 0, so this math gets it there
			
			if (curBoard[moveY][moveX].type == " " && curBoard[moveY][piece.x + (moveX - piece.x)/2].type == " ") {
				if (moveX - piece.x < 0 && curBoard[moveY][moveX - 1].type != " ") {
					return false;
				}

				if (isInCheck(piece.color, false, 0, 0, 0, 0)) {
					return false;
				} else if (isAttacked(piece.color, (piece.x + (moveX - piece.x)/2), piece.y)) {
					return false;
				} else if (isAttacked(piece.color, moveX, moveY)) {
					return false;
				}

				

				//move rook
				var xhttp = new XMLHttpRequest();

				xhttp.open("POST", "move?pieceX=" + ((moveX - piece.x) * 1.75 + 3.5) + "&pieceY=" + moveY + "&moveX=" + (moveX - (moveX - piece.x)/2) + "&moveY=" + moveY + "&id=" + id, true);
				//Got this code from StackOverflow https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest
				xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');



				xhttp.onreadystatechange = function() {
					if (this.readyState == 4 && this.status == 200) {

						var ret = this.responseText;
						ret = ret.substring(0, ret.length - 5);
						
						tempBoard = JSON.parse(ret);

						updateBoard(tempBoard);

						


					}
				}

				xhttp.send();

				

				return true;
			}
		}

		if (Math.abs(piece.x - moveX) > 1 || Math.abs(piece.y - moveY) > 1) {
			return false;
		}
		
		return true;
	} else {
		console.log("something went wrong validateMove() piece type");
	}

	console.log("something went wrong validateMove() return error");

}

function isInCheck(color, move, pieceX, pieceY, moveX, moveY) {

	//console.log("isInCheck was called with color: "+color+" move: "+move+" x1: "+pieceX+" y1: "+pieceY+" x2: "+moveX+" y2: "+moveY);

	var tempBoard = new Array(8); //chessboard is 8x8
	for (var i = 0; i < tempBoard.length; i++) { 
    	tempBoard[i] = new Array(8); //chessboard is 8x8
	}

	for (var i = 0; i < tempBoard.length; i++) {
		for (var j = 0; j < tempBoard.length; j++) {
			tempBoard[i][j] = board[i][j];
		}
	}
	

	if (move) {
		tempBoard[pieceY][pieceX] = JSON.parse("{\"id\":" + id + ",\"type\":\" \",\"color\":\"none\",\"x\":" + pieceX + ",\"y\":" + pieceY + ",\"moved\":1}");
		tempBoard[moveY][moveX] = JSON.parse("{\"id\":" + id + ",\"type\":\"" + board[pieceY][pieceX].type + "\",\"color\":\"" + board[pieceY][pieceX].color + "\",\"x\":"
			 + moveX + ",\"y\":" + moveY + ",\"moved\":1}");
	}

	var kingX = -1;
	var kingY = -1;

	if (color == "white") {
		kingX = kingXWhite;
		kingY = kingYWhite;
	} else if (color == "black") {
		kingX = kingXBlack;
		kingY = kingYBlack;
	}

	if (kingX == pieceX && kingY == pieceY) {
		kingX = moveX;
		kingY = moveY;
	}

	//console.log(kingXWhite + " " + kingYWhite + " " + kingXBlack + " " + kingYBlack);

	return runDirectionInCheck(kingX, kingY, color, tempBoard, false);

}


function isAttacked(color, x, y, barKing) {


	//console.log("isAttacked was called with color: " + color + " x: " + x + " y: " + y);

	var tempBoard = new Array(8); //chessboard is 8x8
	for (var i = 0; i < tempBoard.length; i++) { 
    	tempBoard[i] = new Array(8); //chessboard is 8x8
	}

	for (var i = 0; i < tempBoard.length; i++) {
		for (var j = 0; j < tempBoard.length; j++) {
			tempBoard[i][j] = board[i][j];
		}
	}


	

	
	

	return runDirectionInCheck(x, y, color, tempBoard, true, barKing);

	
}

function runDirectionInCheck(xPos, yPos, color, tempBoard, isIsAttacked, barKing) {
	//console.log("running runDirectionInCheck with xPos: " + xPos + " yPos: " + yPos + " color: " + color + " isIsAttacked: " + isIsAttacked);

	//This essentailly runs directionNotInCheck() in all directions
	for (var i = -1; i < 2; i++) { 
		for (var j = -1; j < 2; j++) {
			if (i != 0 || j != 0) {
				//console.log("running directionInCheck with i: " + i + " j: " + j + " kingX: " + xPos + " kingY: " + yPos + " color: " + color);
				if (directionInCheck(i, j, xPos, yPos, color, tempBoard, isIsAttacked, barKing)) {
					//console.log("directionInCheck returned true");
					return true;
				}
			}
		}
	}

	var nOneX = -1;
	var nOneY = -1;
	var nTwoX = -1;
	var nTwoY = -1;
	for (var i = 0; i < 8; i++) { //8 rows in a chessboard
		for (var j = 0; j < 8; j++) { //8 columns in a chessboard
			if (tempBoard[i][j].color != color && tempBoard[i][j].type == "n") {
				if (nOneX == -1) {
					nOneX = j;
					nOneY = i;
				} else {
					nTwoX = j;
					nTwoY = i;
				}
			}
		}
	}
	//console.log("nOne: " + nOneX + ", " + nOneY + "   nTwo: " + nTwoX + ", " + nTwoY);

	if (nOneX != -1) {
		//console.log(JSON.stringify(tempBoard[nOneY][nOneX]) + " " + xPos + " " + yPos);
		if (validateMove(tempBoard[nOneY][nOneX], xPos, yPos, tempBoard, isIsAttacked, !isIsAttacked)) {
			//console.log("nOne returned true");
			return true;
		}
		if (nTwoX != -1) {
			//console.log(JSON.stringify(tempBoard[nTwoY][nTwoX]) + " " + xPos + " " + yPos);
			if (validateMove(tempBoard[nTwoY][nTwoX], xPos, yPos, tempBoard, isIsAttacked, !isIsAttacked)) {
				//console.log("nTwo returned true");
				return true;
			}
		}
	}

	return false;
}

function directionInCheck(x, y, kingX, kingY, color, tempBoard, isIsAttacked, barKing) {

	//console.log ("directionInCheck with x: " + x + " y: " + y + " kingX: " + kingX + " kingY: " + kingY + " color: " + color + " isIsAttacked: " + isIsAttacked);

	var iterations = 0;
	var xDistance = distanceToEdge(x, kingX);
	var yDistance = distanceToEdge(y, kingY);



	if (x != 0 && y != 0) {
		
		if (xDistance < yDistance) {
			iterations = xDistance;
		} else {
			iterations = yDistance;
		}
	} else if (x == 0) {
		iterations = yDistance;
	} else {
		iterations = xDistance;
	}


	for (var i = 0; i < iterations; i++) {

		var checker = tempBoard[(kingY + (i + 1) * y)][kingX + (i + 1) * x];
		//console.log(JSON.stringify(checker) + " " + (kingY + (i + 1) * y) + " " + i + " " + iterations + " " + y);
		if (checker.color == color) {
			return false;
		}
		if (checker.type == "k" && barKing) {
			return false;
		}
		if (checker.type != " ") {

			var ret = validateMove(checker, kingX, kingY, tempBoard, isIsAttacked, !isIsAttacked);

			if (ret) {
				attacker = checker;
				//console.log(JSON.stringify("attacker"));
			}

			return ret;

			
			
		}
	}


	return false;
}

function distanceToEdge(direction, coord) {

	if (direction == 0) {
		return -1;
	}
	var count = 0;

	while(coord != -1 && coord != 8) {
		count++;
		coord = coord + direction;
	}

	count--;

	return count;

}

function isInCheckMate(color) {

	//console.log("isInCheckmate was called with color: " + color);

	var oppColor = "";
	if (color == "white") {
		oppColor = "black";
	} else {
		oppColor = "white";
	}

	if (!isInCheck(color, false, 0, 0, 0, 0)) {
		return false;
	}

	//console.log("made it past check");

	var checkmater = JSON.parse(JSON.stringify(attacker));


	var kingX = -1;
	var kingY = -1;

	if (color == "white") {
		kingX = kingXWhite;
		kingY = kingYWhite;
	} else if (color == "black") {
		kingX = kingXBlack;
		kingY = kingYBlack;
	}

	if (kingX == -1 || kingY == -1) {
		console.log("Something went wrong, can't find king isInCheckMate()");
	}


	for (var i = -1; i < 2; i++) { 
		for (var j = -1; j < 2; j++) {
			if (i != 0 || j != 0) {
				if (kingY + i >= 0 && kingY + i <= 7 && kingX + j >= 0 && kingX + j <= 7) {
					if (board[kingY + i][kingX + j].color != color) {
						if (!isAttacked(color, kingX + j, kingY + i, false)) {
							return false;
						}
					}
				}
			}
		}
	}

	//console.log("made it past surroundings");

	if (isAttacked(oppColor, checkmater.x, checkmater.y, true)) {
		return false;
	}

	//console.log("made it past checker");

	if (checkmater.type == "b") {
		//console.log("am bishop");
		var xDir = Math.abs(checkmater.x - kingX)/(checkmater.x - kingX);
		var yDir = Math.abs(checkmater.y - kingY)/(checkmater.y - kingY);

		for (var i = 1; i < Math.abs(checkmater.x - kingX); i++) {
			if (isAttacked(oppColor, kingX + i * xDir, kingY + i * yDir, false)) {
				return false;
			}
		}
	} else if (checkmater.type == "r") {

		//console.log("am rook");
		var xDir = -1;
		var yDir = -1;

		var distance = -1;

		if (checkmater.x == kingX) {
			xDir = 0;
			yDir = Math.abs(checkmater.y - kingY)/(checkmater.y - kingY);
			distance = Math.abs(checkmater.y - kingY);
		} else {
			xDir = Math.abs(checkmater.x - kingX)/(checkmater.x - kingX);
			yDir = 0;
			distance = Math.abs(checkmater.x - kingX);
		}

		for (var i = 1; i < distance; i++) {
			if (isAttacked(oppColor, kingX + i * xDir, kingY + i * yDir, false)) {
				return false;
			}
		}
	} else if (checkmater.type == "q") {

		//console.log("am queen");
		if (checkmater.x == kingX || checkmater.y == kingY) {
			var xDir = -1;
			var yDir = -1;

			var distance = -1;

			if (checkmater.x == kingX) {
				xDir = 0;
				yDir = Math.abs(checkmater.y - kingY)/(checkmater.y - kingY);
				distance = Math.abs(checkmater.y - kingY);
			} else {
				xDir = Math.abs(checkmater.x - kingX)/(checkmater.x - kingX);
				yDir = 0;
				distance = Math.abs(checkmater.x - kingX);
			}

			for (var i = 1; i < distance; i++) {
				if (isAttacked(oppColor, kingX + i * xDir, kingY + i * yDir, false)) {
					return false;
				}
			}
		} else {

			var xDir = Math.abs(checkmater.x - kingX)/(checkmater.x - kingX);
			var yDir = Math.abs(checkmater.y - kingY)/(checkmater.y - kingY);

			for (var i = 1; i < Math.abs(checkmater.x - kingX); i++) {
				if (isAttacked(oppColor, kingX + i * xDir, kingY + i * yDir, false)) {
					return false;
				}
			}
		}

		
	}

	//console.log("checkmate returned true");
	return true;


}

function checkForDraw() {

	//console.log("CHECKFORDRAW WAS CALLED");
	var blackCanMove = false;
	var whiteCanMove = false;

	for (var i = 0; i < 8; i++) { //8 rows in a chessboard
		for (var j = 0; j < 8; j++) {// 8 columns in a chessboard
			var temp = board[i][j];
			if (temp.color == "black") {
				if (!blackCanMove) {
					if (canMove(temp)) {
						blackCanMove = true;
					}
				}
			} else {
				if (!whiteCanMove) {
					if (canMove(temp)) {
						whiteCanMove = true;
					}
				}
			}
		}
	}

	return !(blackCanMove && whiteCanMove);
}

function canMove(piece) {

	if (piece.type == " ") {
		return false;
	} else if (piece.type == "p") {

		if (piece.color == "white") {
			return validateMove(piece, piece.x, piece.y - 1, board, false, false);
		} else if (piece.color == "black") {
			return validateMove(piece, piece.x, piece.y + 1, board, false, false);
		} else {
			console.log("Something went wrong, missing pawn color? canMove()");
		}

	} else if (piece.type == "r") {

		if (validateMove(piece, piece.x + 1, piece.y, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x - 1, piece.y, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x, piece.y + 1, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x, piece.y - 1, board, false, false)) {
			return true;
		}

	} else if (piece.type == "n") {

		if (validateMove(piece, piece.x + 2, piece.y + 1, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x + 2, piece.y - 1, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x - 2, piece.y + 1, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x - 2, piece.y - 1, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x + 1, piece.y + 2, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x + 1, piece.y - 2, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x - 1, piece.y + 2, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x - 1, piece.y - 2, board, false, false)) {
			return true;
		}

	} else if (piece.type == "b") {

		if (validateMove(piece, piece.x + 1, piece.y + 1, board, false)) {
			return true;
		} else if (validateMove(piece, piece.x + 1, piece.y - 1, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x - 1, piece.y + 1, board, false, false)) {
			return true;
		} else if (validateMove(piece, piece.x - 1, piece.y - 1, board, false, false)) {
			return true;
		}

	} else if (piece.type == "q" || piece.type == "k") {

		for (var i = -1; i < 2; i++) {
			for (var j = -1; j < 2; j++) {
				if (piece.x + i >= 0 && piece.x + i <= 7 && piece.y + j >= 0 && piece.y + j <= 7) {
					if (validateMove(piece, piece.x + i, piece.y + j, board, false, false)) {
						//console.log(JSON.stringify(piece) + " " + (piece.x + i) + " " + (piece.y + j));
						return true;
					}
				}
			}
		}

	} else {
		console.log("Something went wrong, invalid piece type canMove()");
	}
	
	return false;
}

function checkPromotion() {

	for (var i = 0; i < 8; i++) {//8 columns in a chessboard
		if (board[0][i].type == "p") {
			if (board[0][i].color == "black") {
				console.log("How did this pawn get here?");
			}
			promote(i, 0);
		}
	}

	for (var i = 0; i < 8; i++) {//8 columns in a chessboard
		if (board[7][i].type == "p") {
			if (board[7][i].color == "white") {
				console.log("How did this pawn get here?");
			}
			promote(i, 7);
		}
	}
}

function promote(x, y) {
	var xhttp = new XMLHttpRequest();

	xhttp.open("POST", "update?x=" + x + "&y=" + y + "&type=q&id=" + id, true);
	//Got this code from StackOverflow https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest
	xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			tempBoard = JSON.parse(this.responseText);

			updateBoard(tempBoard);
		}
	}
	xhttp.send();
}