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
// along with 5 mountains that have coin markers.
// Layout precisely matching the official Cartographers board B reference image.
// Coordinates are [column, row] where (0,0) is top-left
export const chasmBoard: BoardConfig = {
	ruins: [],
	mountains: [
		[2, 2],  // top-left mountain with coin
		[8, 1],  // top-right mountain with coin
		[0, 4],  // left middle mountain with coin
		[9, 7],  // right middle mountain with coin
		[0, 8],  // bottom-left mountain with coin
	],
	// Chasm area - 7 blocked spaces forming an irregular vertical shape in left-center
	// Examining the reference image carefully, the chasm spans roughly:
	// - Vertically from row 3 to row 6
	// - Horizontally from column 1 to column 3
	blockedSpaces: [
		[2, 3],  // top
		[1, 4],  // upper left 
		[2, 4],  // upper center
		[1, 5],  // middle left
		[2, 5],  // middle center
		[1, 6],  // lower left
		[2, 6],  // lower center
	],
	coinMountains: [
		[2, 2],
		[8, 1],
		[0, 4],
		[9, 7],
		[0, 8],
	]
};

export const boardConfigs: Record<BoardType, BoardConfig> = {
	default: defaultBoard,
	chasm: chasmBoard
};
