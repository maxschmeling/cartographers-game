'use client';

import { useState, useReducer } from 'react';
import styles from './page.module.css'
import { TileType } from './tiles';
import MountainTile from './tiles/MountainTile';
import RuinTile from './tiles/RuinTile';
import StandardTile from './tiles/StandardTile';
import BlockedTile from './tiles/BlockedTile';
import Coin from './Coin';
import SeasonScore from './SeasonScore';
import { BoardType, boardConfigs } from './boardConfigs';

const ruins: Array<[number, number]> = [
	[5, 1],
	[1, 2],
	[9, 2],
	[5, 9],
	[9, 8],
	[1, 8]
];
const mountains: Array<[number, number]> = [
	[3, 1],
	[2, 8],
	[5, 5],
	[8, 2],
	[7, 9],
];

type SeasonScore = {
	edictOne: number;
	edictTwo: number;
	coinCount: number;
	monsterCount: number;
}

type TileSelection = {
	row: number;
	column: number;
	type: TileType;
}

type GameBoard = {
	server?: boolean;
	selections: TileSelection[];
	coinCount: number;
	seasonScores: SeasonScore[];
	boardType?: BoardType;
};

function loadOrInitGame(): GameBoard | null {
	if (typeof localStorage !== 'undefined') {
		const board = localStorage.getItem('board');

		if (board) {
			const parsed = JSON.parse(board);
			// Ensure boardType exists (backward compatibility)
			if (!parsed.boardType) {
				parsed.boardType = 'default';
			}
			return parsed;
		}

		return {
			server: true,
			selections: [],
			coinCount: 0,
			seasonScores: [
				{ edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
				{ edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
				{ edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
				{ edictOne: 0, edictTwo: 0, coinCount: 0, monsterCount: 0 },
			],
			boardType: 'default'
		};
	}

	return null;
}

type GameBoardAction =
	| { type: 'select-tile', row: number, column: number, tileType: TileType }
	| { type: 'clear-tile', row: number, column: number }
	| { type: 'set-season-score', season: number, score: SeasonScore }
	| { type: 'set-coin-count', coinCount: number }
	| { type: 'set-board-type', boardType: BoardType }
	| { type: 'clear-board' };

function findAdjacentMountain(row: number, column: number, boardType: BoardType): [number, number] | null {
	const config = boardConfigs[boardType];
	const adjacentMountains = config.mountains.filter(mountain => {
		const rowDiff = Math.abs(mountain[1] - row);
		const columnDiff = Math.abs(mountain[0] - column);

		return (rowDiff === 0 && columnDiff === 1) || (rowDiff === 1 && columnDiff === 0);
	});

	if (adjacentMountains.length) {
		return adjacentMountains[0];
	}

	return null;
}

function mountainIsSurrounded(selections: TileSelection[], mountain: [number, number]): boolean {
	const adjacentTiles = [
		[mountain[0] - 1, mountain[1]],
		[mountain[0] + 1, mountain[1]],
		[mountain[0], mountain[1] - 1],
		[mountain[0], mountain[1] + 1],
	];

	return adjacentTiles.every(tile => selections.some(s => s.row === tile[1] && s.column === tile[0]));
}

function gameReducer(state: GameBoard | null, action: GameBoardAction): GameBoard | null {
	if ( !state ) return null;

	let newBoard = { ...state };

	switch (action.type) {
		case 'select-tile':
			newBoard.selections = newBoard.selections.filter(s => s.row !== action.row || s.column !== action.column);
			newBoard.selections = [...newBoard.selections, { row: action.row, column: action.column, type: action.tileType }];

			const selectTileAdjacentMountain = findAdjacentMountain(action.row, action.column, newBoard.boardType || 'default');

			if (selectTileAdjacentMountain && mountainIsSurrounded(newBoard.selections, selectTileAdjacentMountain)) {
				newBoard.coinCount++;
			}

			break;
		case 'clear-tile':
			newBoard.selections = newBoard.selections.filter(s => s.row !== action.row || s.column !== action.column);

			const clearTileAdjacentMountain = findAdjacentMountain(action.row, action.column, newBoard.boardType || 'default');

			if (
				clearTileAdjacentMountain &&
				mountainIsSurrounded(state.selections, clearTileAdjacentMountain) &&
				!mountainIsSurrounded(newBoard.selections, clearTileAdjacentMountain)
			) {
				newBoard.coinCount--;
			}

			break;
		case 'set-season-score':
			newBoard.seasonScores[action.season] = action.score;
			break;
		case 'set-coin-count':
			newBoard.coinCount = action.coinCount;
			break;
		case 'set-board-type':
			newBoard.boardType = action.boardType;
			newBoard.selections = [];
			newBoard.coinCount = 0;
			break;
		case 'clear-board':
			localStorage.removeItem('board');
			newBoard = loadOrInitGame()!;
			break;
	}

	localStorage.setItem('board', JSON.stringify(newBoard));

	return newBoard;
}

export default function Game() {
	const [brush, setBrush] = useState<TileType>('village');
	const [board, dispatch] = useReducer(
		gameReducer, undefined, loadOrInitGame
	);
	const [seasonOneScore, setSeasonOneScore] = useState(0);
	const [seasonTwoScore, setSeasonTwoScore] = useState(0);
	const [seasonThreeScore, setSeasonThreeScore] = useState(0);
	const [seasonFourScore, setSeasonFourScore] = useState(0);

	if (!board) return null;

	const boardType = board.boardType || 'default';
	const config = boardConfigs[boardType];
	const gameBoard = [];

	for (let row = 0; row < 11; row++) {
		for (let column = 0; column < 11; column++) {
			const key = `${row}x${column}`;

			const type = board.selections.find(s => s.row === row && s.column === column)?.type ?? null;

			// Check if this is a blocked space
			if (config.blockedSpaces.some(blocked => blocked[0] === column && blocked[1] === row)) {
				gameBoard.push(<BlockedTile key={key} />);
			}
			// Check if this is a ruin
			else if (config.ruins.some(ruin => ruin[0] === column && ruin[1] === row)) {
				gameBoard.push(
					<RuinTile
						key={key}
						row={row}
						column={column}
						type={type}
						onClick={toggleTile}
					/>
				);
			}
			// Check if this is a mountain
			else if (config.mountains.some(mountain => mountain[0] === column && mountain[1] === row)) {
				const hasCoin = config.coinMountains.some(coinMtn => coinMtn[0] === column && coinMtn[1] === row);
				gameBoard.push(<MountainTile key={key} hasCoin={hasCoin} />);
			}
			// Standard tile
			else {
				gameBoard.push(
					<StandardTile
						key={key}
						row={row}
						column={column}
						type={type}
						onClick={toggleTile}
					/>
				);
			}
		}
	}

	function toggleTile(row: number, column: number) {
		if ( !board) return;

		const tile = board.selections.find(s => s.row === row && s.column === column);

		if (!tile || tile.type !== brush) {
			dispatch({ type: 'select-tile', row, column, tileType: brush });
		} else {
			dispatch({ type: 'clear-tile', row, column });
		}
	}

	return (
		<>
			<header>
				<div>
					<div>
						<label>Cartographer</label>
						<input type="text" />
					</div>
					<div>
						<label>Title</label>
						<input type="text" />
					</div>
				</div>
				<button onClick={() => dispatch({ type: 'clear-board' })}>Clear</button>
			</header>
			<main>
				<div className={styles.boardSelector}>
					<label>Board:</label>
					<select 
						value={boardType} 
						onChange={(e) => dispatch({ type: 'set-board-type', boardType: e.target.value as BoardType })}
					>
						<option value="default">Default</option>
						<option value="chasm">Chasm (B)</option>
					</select>
				</div>
				<div className={styles.tileBoard}>
					{gameBoard}
				</div>
				<div className={styles.brushes}>
					<button className={styles.forest} onClick={() => setBrush("forest")}>Forest</button>
					<button className={styles.village} onClick={() => setBrush("village")}>Village</button>
					<button className={styles.farm} onClick={() => setBrush("farm")}>Farm</button>
					<button className={styles.water} onClick={() => setBrush("water")}>Water</button>
					<button className={styles.monster} onClick={() => setBrush("monster")}>Monster</button>
				</div>
				<div className={styles.coins}>
					{[...Array(14)].map(
						(_, index) => (
							<Coin key={index} selected={board.coinCount > index} onClick={
								() => {
									if (board.coinCount === index + 1) {
										dispatch({ type: "set-coin-count", coinCount: index });
									} else {
										dispatch({ type: "set-coin-count", coinCount: index + 1 });
									}
								}
							} />
						)
					)}
				</div>
				<div className={styles.scoreBoard}>
					<div className={styles.seasonScores}>
						<SeasonScore onScoreTotalChange={setSeasonOneScore} />
						<SeasonScore onScoreTotalChange={setSeasonTwoScore} />
						<SeasonScore onScoreTotalChange={setSeasonThreeScore} />
						<SeasonScore onScoreTotalChange={setSeasonFourScore} />
					</div>
					<div className={styles.totalScore}>
						{seasonOneScore + seasonTwoScore + seasonThreeScore + seasonFourScore}
					</div>
				</div>
			</main>
		</>
	);
}