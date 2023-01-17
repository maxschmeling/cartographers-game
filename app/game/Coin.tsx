import { useState } from 'react';
import styles from './page.module.css';

export default function Coin() {
	const [ selected, setSelected ] = useState<boolean>( false );

	return (
		<button
			className={ [ styles.coin, selected && styles.selected ].join( ' ' ) }
			onClick={ () => setSelected( !selected ) }
		></button>
	);
}