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

export default function RuinTile( { type, row, column, onClick, preview, previewValid, onMouseEnter }: Props ) {
	return (
		<button
			className={ [ styles.tile, styles.ruin, type && styles[ type ], preview && (previewValid ? styles.preview : styles.previewInvalid) ].filter(Boolean).join(' ') }
			onClick={ () => onClick( row, column ) }
			onMouseEnter={onMouseEnter}
		>
			<img src="/ruins.svg" alt="ruins" width="20px" height="20px" />
		</button>
	)
}
