// Board configuration types and data

export type BoardType = 'default' | 'chasm';

export interface BoardConfig {
	ruins: Array<[number, number]>;
	mountains: Array<[number, number]>;
	blockedSpaces: Array<[number, number]>;
	coinMountains: Array<[number, number]>;
}

// Default board configuration (current board)
export const defaultBoard: BoardConfig = {
	ruins: [
		[5, 1],
		[1, 2],
		[9, 2],
		[5, 9],
		[9, 8],
		[1, 8]
	],
	mountains: [
		[3, 1],
		[2, 8],
		[5, 5],
		[8, 2],
		[7, 9],
	],
	blockedSpaces: [],
	coinMountains: []
};

// Chasm board configuration (board B with blocked spaces and coin mountains)
// This board features 7 blocked chasm spaces that creates blocked/impassable spaces,
// along with 5 mountains that have coin markers and 6 ruins.
// Layout precisely matching the official Cartographers board B reference image.
// Coordinates are [column, row] where (0,0) is top-left
// Notation: [Letter, Number] where Letter=row (A=0, B=1...), Number=column (1=0, 2=1...)
export const chasmBoard: BoardConfig = {
	// Ruins: [B,7], [C,3], [E,7], [G,2], [H,9], [J,4]
	// Format: [Letter, Number] -> Letter is row, Number is column
	ruins: [
		[6, 1],   // B,7 -> row B (1), column 7 (6) -> [6, 1]
		[2, 2],   // C,3 -> row C (2), column 3 (2) -> [2, 2]
		[6, 4],   // E,7 -> row E (4), column 7 (6) -> [6, 4]
		[1, 6],   // G,2 -> row G (6), column 2 (1) -> [1, 6]
		[8, 7],   // H,9 -> row H (7), column 9 (8) -> [8, 7]
		[3, 9],   // J,4 -> row J (9), column 4 (3) -> [3, 9]
	],
	// Mountains: [B,9], [C,4], [H,6], [I,10], [J,3]
	mountains: [
		[8, 1],   // B,9 -> row B (1), column 9 (8) -> [8, 1]
		[3, 2],   // C,4 -> row C (2), column 4 (3) -> [3, 2]
		[5, 7],   // H,6 -> row H (7), column 6 (5) -> [5, 7]
		[9, 8],   // I,10 -> row I (8), column 10 (9) -> [9, 8]
		[2, 9],   // J,3 -> row J (9), column 3 (2) -> [2, 9]
	],
	// Chasm: [D,6], [E,5], [E,6], [F,5], [F,6], [F,7], [G,6]
	blockedSpaces: [
		[5, 3],   // D,6 -> row D (3), column 6 (5) -> [5, 3]
		[4, 4],   // E,5 -> row E (4), column 5 (4) -> [4, 4]
		[5, 4],   // E,6 -> row E (4), column 6 (5) -> [5, 4]
		[4, 5],   // F,5 -> row F (5), column 5 (4) -> [4, 5]
		[5, 5],   // F,6 -> row F (5), column 6 (5) -> [5, 5]
		[6, 5],   // F,7 -> row F (5), column 7 (6) -> [6, 5]
		[5, 6],   // G,6 -> row G (6), column 6 (5) -> [5, 6]
	],
	// All mountains on chasm board have coins
	coinMountains: [
		[8, 1],   // B,9
		[3, 2],   // C,4
		[5, 7],   // H,6
		[9, 8],   // I,10
		[2, 9],   // J,3
	]
};

export const boardConfigs: Record<BoardType, BoardConfig> = {
	default: defaultBoard,
	chasm: chasmBoard
};
