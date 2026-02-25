import { TileType } from '.'
import styles from '../page.module.css'

type Props = {
	type: TileType | null,
	row: number,
	column: number,
	onClick: ( row: number, column: number ) => void,
	preview?: boolean,
	previewValid?: boolean,
	onMouseEnter?: () => void,
}

export default function StandardTile( { type, row, column, onClick, preview, previewValid, onMouseEnter }: Props ) {
	return (
		<button
			className={ [ styles.tile, type && styles[ type ], preview && (previewValid ? styles.preview : styles.previewInvalid) ].filter(Boolean).join( ' ' ) }
			onClick={ () => onClick( row, column ) }
			onMouseEnter={onMouseEnter}>
		</button>
	)
}
