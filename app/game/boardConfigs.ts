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
// Based on the reference image, the chasm is an irregular shape in the center-left
// Coordinates are [column, row] where (0,0) is top-left
export const chasmBoard: BoardConfig = {
	ruins: [],
	mountains: [
		[2, 1],  // top-left with coin
		[7, 1],  // top-right with coin
		[1, 4],  // left with coin
		[7, 6],  // right with coin
		[1, 8],  // bottom-left with coin
	],
	// Chasm area - irregular shape in center-left based on reference image
	// The chasm roughly spans from rows 3-7 and columns 1-5
	blockedSpaces: [
		// Row 3
		[1, 3], [2, 3], [3, 3],
		// Row 4 (skip [1,4] as it's a mountain)
		[2, 4], [3, 4], [4, 4],
		// Row 5
		[1, 5], [2, 5], [3, 5], [4, 5], [5, 5],
		// Row 6
		[1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
		// Row 7
		[1, 7], [2, 7], [3, 7], [4, 7],
	],
	coinMountains: [
		[2, 1],
		[7, 1],
		[1, 4],
		[7, 6],
		[1, 8],
	]
};

export const boardConfigs: Record<BoardType, BoardConfig> = {
	default: defaultBoard,
	chasm: chasmBoard
};
