import styles from '../page.module.css'

export default function BlockedTile() {
	return (
		<div className={ [ styles.tile, styles.blocked ].join(' ') }>
			<div className={ styles.blockedInner }></div>
		</div>
	)
}
