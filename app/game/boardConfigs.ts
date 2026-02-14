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
// Letter-to-index conversion: A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10
export const chasmBoard: BoardConfig = {
	// Ruins: [B,7], [C,3], [E,7], [G,2], [H,9], [J,4]
	ruins: [
		[1, 6],   // B,7 -> [1, 6]
		[2, 2],   // C,3 -> [2, 2]
		[4, 6],   // E,7 -> [4, 6]
		[6, 1],   // G,2 -> [6, 1]
		[7, 8],   // H,9 -> [7, 8]
		[9, 3],   // J,4 -> [9, 3]
	],
	// Mountains: [B,9], [C,4], [H,6], [I,10], [J,3]
	mountains: [
		[1, 8],   // B,9 -> [1, 8]
		[2, 3],   // C,4 -> [2, 3]
		[7, 5],   // H,6 -> [7, 5]
		[8, 9],   // I,10 -> [8, 9]
		[9, 2],   // J,3 -> [9, 2]
	],
	// Chasm: [D,6], [E,5], [E,6], [F,5], [F,6], [F,7], [G,6]
	blockedSpaces: [
		[3, 5],   // D,6 -> [3, 5]
		[4, 4],   // E,5 -> [4, 4]
		[4, 5],   // E,6 -> [4, 5]
		[5, 4],   // F,5 -> [5, 4]
		[5, 5],   // F,6 -> [5, 5]
		[5, 6],   // F,7 -> [5, 6]
		[6, 5],   // G,6 -> [6, 5]
	],
	// All mountains on chasm board have coins
	coinMountains: [
		[1, 8],   // B,9
		[2, 3],   // C,4
		[7, 5],   // H,6
		[8, 9],   // I,10
		[9, 2],   // J,3
	]
};

export const boardConfigs: Record<BoardType, BoardConfig> = {
	default: defaultBoard,
	chasm: chasmBoard
};
