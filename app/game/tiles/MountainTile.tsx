import styles from '../page.module.css'

type Props = {
	hasCoin?: boolean;
}

export default function MountainTile({ hasCoin = false }: Props) {
	return (
		<div className={ [ styles.tile, styles.mountain ].join(' ') }>
			<div className={ styles.inner }>
				{hasCoin && <div className={ styles.mountainCoin }></div>}
			</div>
		</div>
	)
}