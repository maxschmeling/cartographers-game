import { TileType } from '.'
import styles from '../page.module.css'

type Props = {
	type: TileType | null,
	row: number,
	column: number,
	onClick: ( row: number, column: number ) => void,
}

export default function RuinTile( { type, row, column, onClick }: Props ) {
	return (
		<button
			className={ [ styles.tile, styles.ruin, type && styles[ type ] ].join(' ') }
			onClick={ () => onClick( row, column ) }
		>
			R
		</button>
	)
}