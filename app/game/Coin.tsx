import { useState } from 'react';
import styles from './page.module.css';

type Props = {
	selected: boolean;
	onClick: () => void;
}

const Coin: React.FC<Props> = ( { selected, onClick } ) => {
	return (
		<button
			className={ [ styles.coin, selected && styles.selected ].join( ' ' ) }
			onClick={ onClick }
		/>
	);
}

export default Coin
