const fs = require('fs');
const path = require('path');

const GAMES_FILE = path.join(__dirname, 'ttt.json');
const GAME_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

const initialBoard = () => Array(9).fill(null);

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const checkWin = (board, player) => {
    for (const combo of winningCombinations) {
        if (combo.every(index => board[index] === player)) {
            return true;
        }
    }
    return false;
};

const isBoardFull = (board) => board.every(cell => cell !== null);

const getAvailableMoves = (board) => board.map((cell, index) => cell === null ? index : null).filter(index => index !== null);

const minimax = (board, depth, isMaximizingPlayer, aiPlayer, humanPlayer) => {
    if (checkWin(board, aiPlayer)) return 10 - depth;
    if (checkWin(board, humanPlayer)) return depth - 10;
    if (isBoardFull(board)) return 0;

    if (isMaximizingPlayer) {
        let bestScore = -Infinity;
        getAvailableMoves(board).forEach(move => {
            const newBoard = [...board];
            newBoard[move] = aiPlayer;
            bestScore = Math.max(bestScore, minimax(newBoard, depth + 1, false, aiPlayer, humanPlayer));
        });
        return bestScore;
    } else {
        let bestScore = Infinity;
        getAvailableMoves(board).forEach(move => {
            const newBoard = [...board];
            newBoard[move] = humanPlayer;
            bestScore = Math.min(bestScore, minimax(newBoard, depth + 1, true, aiPlayer, humanPlayer));
        });
        return bestScore;
    }
};

const findBestMove = (board, aiPlayer, humanPlayer) => {
    let bestScore = -Infinity;
    let bestMove = -1;
    getAvailableMoves(board).forEach(move => {
        const newBoard = [...board];
        newBoard[move] = aiPlayer;
        const score = minimax(newBoard, 0, false, aiPlayer, humanPlayer);
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });
    return bestMove;
};

const makeEasyMove = (board) => {
    const availableMoves = getAvailableMoves(board);
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
};

const formatBoard = (board) => {
    const emojiBoard = board.map((cell, index) => {
        if (cell === '❌') return '❌';
        if (cell === '⭕') return '⭕';
        return `${index + 1}️⃣`;
    });
    return `${emojiBoard[0]}${emojiBoard[1]}${emojiBoard[2]}\n${emojiBoard[3]}${emojiBoard[4]}${emojiBoard[5]}\n${emojiBoard[6]}${emojiBoard[7]}${emojiBoard[8]}`;
};

const loadGames = () => {
    try {
        const data = fs.readFileSync(GAMES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
};

const saveGames = (games) => {
    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), 'utf8');
};

const cleanupGames = (games) => {
    const now = Date.now();
    for (const username in games) {
        if (games[username].ended || (now - games[username].lastMoveTime > GAME_TIMEOUT)) {
            delete games[username];
        }
    }
};

module.exports = async function(req, res) {
    const username = req.query.username;
    const start = req.query.start;
    const move = req.query.move;

    if (!username) {
        return res.status(400).json({ error: "Oops! Kamu lupa kasih tau namamu (username) di parameter request." });
    }

    let games = loadGames();
    cleanupGames(games);

    let userGame = games[username];

    if (start) {
        if (start !== 'sulit' && start !== 'mudah') {
            return res.status(400).json({ error: "Pilihan levelnya cuma 'sulit' atau 'mudah'." });
        }
        userGame = {
            board: initialBoard(),
            level: start,
            userPlayer: '❌',
            aiPlayer: '⭕',
            lastMoveTime: Date.now(),
            ended: false,
            winner: null
        };

        // Randomly decide who starts
        if (Math.random() < 0.5) { // AI starts
            const aiMove = makeEasyMove(userGame.board); // Easy move for first move regardless of level
            userGame.board[aiMove] = userGame.aiPlayer;
            if (checkWin(userGame.board, userGame.aiPlayer)) {
                 userGame.ended = true;
                 userGame.winner = 'ai';
            } else if (isBoardFull(userGame.board)) {
                 userGame.ended = true;
                 userGame.winner = 'draw';
            }
        }
        games[username] = userGame;
        saveGames(games);

        const response = {
             menang: userGame.ended,
             usermenang: userGame.ended ? (userGame.winner === 'user' ? true : (userGame.winner === 'ai' ? false : null)) : null,
             level: userGame.level,
             papan: formatBoard(userGame.board)
        };

        if (userGame.ended) {
            delete games[username];
            saveGames(games);
        }

        return res.json(response);

    } else if (move) {
        if (!userGame || userGame.ended) {
            return res.status(400).json({ error: "Kayaknya kamu belum mulai game baru deh. Pakai parameter 'start' dulu ya!" });
        }

        const moveIndex = parseInt(move, 10) - 1;
        if (isNaN(moveIndex) || moveIndex < 0 || moveIndex > 8) {
            return res.status(400).json({ error: "Langkahmu harus angka 1 sampai 9." });
        }

        if (userGame.board[moveIndex] !== null) {
            return res.status(400).json({ error: "Wah, kotak itu udah ada isinya. Pilih kotak lain ya!" });
        }

        userGame.board[moveIndex] = userGame.userPlayer;
        userGame.lastMoveTime = Date.now();

        if (checkWin(userGame.board, userGame.userPlayer)) {
            userGame.ended = true;
            userGame.winner = 'user';
        } else if (isBoardFull(userGame.board)) {
            userGame.ended = true;
            userGame.winner = 'draw';
        } else {
            // AI makes a move
            let aiMove;
            if (userGame.level === 'sulit') {
                aiMove = findBestMove(userGame.board, userGame.aiPlayer, userGame.userPlayer);
            } else {
                aiMove = makeEasyMove(userGame.board);
            }

            if (aiMove !== -1) { // Check if there's a move to make
                userGame.board[aiMove] = userGame.aiPlayer;
                userGame.lastMoveTime = Date.now();

                if (checkWin(userGame.board, userGame.aiPlayer)) {
                    userGame.ended = true;
                    userGame.winner = 'ai';
                } else if (isBoardFull(userGame.board)) {
                    userGame.ended = true;
                    userGame.winner = 'draw';
                }
            } else if (isBoardFull(userGame.board) && !userGame.ended) { // Case where user move filled the last spot resulting in a draw
                 userGame.ended = true;
                 userGame.winner = 'draw';
            }
        }

        const response = {
             menang: userGame.ended,
             usermenang: userGame.ended ? (userGame.winner === 'user' ? true : (userGame.winner === 'ai' ? false : null)) : null,
             level: userGame.level,
             papan: formatBoard(userGame.board)
        };

        if (userGame.ended) {
            delete games[username];
            saveGames(games);
        } else {
            games[username] = userGame;
            saveGames(games);
        }

        return res.json(response);

    } else {
        return res.status(400).json({ error: "Eh? Mau main apa mau jalanin pion? Kasih parameter 'start' atau 'move' dong!" });
    }
};