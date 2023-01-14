import styles from '../page.module.css'

export default function MountainTile() {
	return (
		<div className={ [ styles.tile, styles.mountain ].join(' ') }>M</div>
	)
}