var piece = require('./piece.js'),
	game = require('./game.js'),
	gameValidation = require('./gameValidation.js');

// private methods
var isMoveValid = function (src, dest, validMoves) {
	'use strict';

	var i = 0,
		isFound = function (expr, sq) {
			return ((typeof expr === 'string' && sq.file + sq.rank === expr) ||
				(expr.rank && expr.file &&
					sq.file === expr.file && sq.rank === expr.rank));
		},
		squares = [];

	for (i = 0; i < validMoves.length; i++) {
		if (isFound(src, validMoves[i].src)) {
			squares = validMoves[i].squares;
		}
	}

	if (squares && squares.length > 0) {
		for (i = 0; i < squares.length; i++) {
			if (isFound(dest, squares[i])) {
				return true;
			}
		}
	}

	return false;
};

var updateGameClient = function (gameClient) {
	'use strict';

	gameClient.validation.start(function (err, resultWhite, resultBlack) {
		if (err) {
			throw new Error(err);
		}

		gameClient.white.isCheck = resultWhite.isCheck;
		gameClient.white.isCheckmate = resultWhite.isCheckmate;
		gameClient.white.isRepetition = resultWhite.isRepetition;
		gameClient.white.isStalemate = resultWhite.isStalemate;
		gameClient.white.validMoves = resultWhite.validMoves;

		gameClient.black.isCheck = resultBlack.isCheck;
		gameClient.black.isCheckmate = resultBlack.isCheckmate;
		gameClient.black.isRepetition = resultBlack.isRepetition;
		gameClient.black.isStalemate = resultBlack.isStalemate;
		gameClient.black.validMoves = resultBlack.validMoves;
	});
};

// ctor
var SimpleGameClient = function (g) {
	'use strict';

    this.white = {};
	this.white.isCheck = false;
	this.white.isCheckmate = false;
	this.white.isRepetition = false;
	this.white.isStalemate = false;
	this.white.validMoves = [];

    this.black = {};
	this.black.isCheck = false;
	this.black.isCheckmate = false;
	this.black.isRepetition = false;
	this.black.isStalemate = false;
	this.black.validMoves = [];

	this.game = g;
	this.validation = gameValidation.create(this.game);
};

SimpleGameClient.prototype.getStatus = function (forceUpdate) {
	'use strict';

	if (forceUpdate) {
		updateGameClient(this);
	}

	return {
		board : this.game.board,
        white: {
            isCheck : this.white.isCheck,
            isCheckmate : this.white.isCheckmate,
            isRepetition : this.white.isRepetition,
            isStalemate : this.white.isStalemate,
            validMoves : this.white.validMoves
        },
        black: {
            isCheck : this.black.isCheck,
            isCheckmate : this.black.isCheckmate,
            isRepetition : this.black.isRepetition,
            isStalemate : this.black.isStalemate,
            validMoves : this.black.validMoves
        }
	};
};

SimpleGameClient.prototype.move = function (src, dest, side, promo) {
	'use strict';

	var move = null,
		p = null,
		validMoves = side === piece.SideType.White ? this.white.validMoves : this.black.validMoves;

	if (src && dest && side && isMoveValid(src, dest, validMoves)) {

		move = this.game.board.move(src, dest);

		if (move) {
			// apply pawn promotion
			if (promo) {
				switch (promo) {
				case 'B':
					p = piece.createBishop(side);
					break;
				case 'N':
					p = piece.createKnight(side);
					break;
				case 'Q':
					p = piece.createQueen(side);
					break;
				case 'R':
					p = piece.createRook(side);
					break;
				}

				if (p) {
					this.game.board.promote(move.move.postSquare, p);
					/*
					p.moveCount = move.move.postSquare.piece.moveCount;
					move.move.postSquare.piece = p;
					//*/
				}
			}

			updateGameClient(this);
			return move;
		}
	}

	throw 'Move is invalid (' + src + ' to ' + dest + ')';
};

// exports
module.exports = {
	create : function () {
		'use strict';

		var g = game.create(),
			gc = new SimpleGameClient(g);

		updateGameClient(gc);
		return gc;
	}
};
