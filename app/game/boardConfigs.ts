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
// This board features 7 blocked chasm spaces in the center of the map
// that creates blocked/impassable spaces, along with 5 mountains that have coin markers.
// Layout based on the official Cartographers board B design:
// - Chasm: 7 spaces in an irregular pattern in the center (around columns 4-6, rows 3-6)
// - 5 mountains with coins at positions: [2,1], [7,1], [1,4], [7,6], [1,8]
// - No ruins on this board variant
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
	// Chasm area - 7 blocked spaces forming an irregular shape in the center
	// Based on the reference image showing the chasm in the middle of the board
	blockedSpaces: [
		[5, 3],  // top of chasm
		[4, 4],  // upper left
		[5, 4],  // upper center
		[4, 5],  // middle left
		[5, 5],  // middle center
		[5, 6],  // lower center
		[6, 6],  // lower right
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
