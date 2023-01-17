'use client';

import { useState } from 'react';
import styles from './page.module.css'
import { TileType } from './tiles';
import MountainTile from './tiles/MountainTile';
import RuinTile from './tiles/RuinTile';
import StandardTile from './tiles/StandardTile';
import Coin from './Coin';

const ruins = [
	[ 5, 1 ],
	[ 1, 2 ],
	[ 9, 2 ],
	[ 5, 9 ],
	[ 9, 8 ],
	[ 1, 8 ]
];
const mountains = [
	[ 3, 1 ],
	[ 2, 8 ],
	[ 5, 5 ],
	[ 8, 2 ],
	[ 7, 9 ],
];

export default function Game() {
	const [ brush, setBrush ] = useState<TileType>( 'village' );
	const [ board, setBoard ] = useState< { row: number, column: number, type: TileType }[] >( [ ] );

	const gameBoard = [];

	function toggleTile( row: number, column: number ) {
		const type = board.find( s => s.row === row && s.column === column )?.type ?? null;

		if ( type ) {
			setBoard( board.filter( s => s.row !== row || s.column !== column ) );
		} else {
			setBoard( [ ...board, { row, column, type: brush } ] );
		}
	}

	for ( let row = 0; row < 11; row++ ) {
		for ( let column = 0; column < 11; column++ ) {
			const key = `${ row }x${ column }`;

			const type = board.find( s => s.row === row && s.column === column )?.type ?? null;

			if ( ruins.some( ruin => ruin[ 0 ] === column && ruin[ 1 ] === row ) ) {
				gameBoard.push( <RuinTile key={ key } row={ row } column={ column } type={ type } onClick={ toggleTile } /> );
			} else if ( mountains.some( mountain => mountain[ 0 ] === column && mountain[ 1 ] === row ) ) {
				gameBoard.push( <MountainTile key={ key } /> );
			} else {
				gameBoard.push( <StandardTile key={ key } row={ row } column={ column } type={ type } onClick={ toggleTile } /> );
			}
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
				<button onClick={ () => setBoard( [] ) }>Clear</button>
			</header>
			<main>
				<div className={ styles.tileBoard }>
					{ gameBoard }
				</div>
				<div className={ styles.brushes }>
					<button className={ styles.forest } onClick={ () => setBrush( "forest" ) }>Forest</button>
					<button className={ styles.village } onClick={ () => setBrush( "village" ) }>Village</button>
					<button className={ styles.farm } onClick={ () => setBrush( "farm" ) }>Farm</button>
					<button className={ styles.water } onClick={ () => setBrush( "water" ) }>Water</button>
					<button className={ styles.monster } onClick={ () => setBrush( "monster" ) }>Monster</button>
				</div>
				<div className={ styles.coins }>
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
					<Coin />
				</div>
				<div id="score">
					
				</div>
			</main>
		</>
	);
}