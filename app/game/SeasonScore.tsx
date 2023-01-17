import { useState } from 'react';
import styles from './page.module.css';

type Props = {
	onScoreTotalChange: ( score: number ) => void;
}

export default function SeasonScore( { onScoreTotalChange }: Props ) {
	const [ scoreOne, setScoreOne ] = useState( 0 );
	const [ scoreTwo, setScoreTwo ] = useState( 0 );
	const [ scoreCoin, setScoreCoin ] = useState( 0 );
	const [ scoreMonster, setScoreMonster ] = useState( 0 );

	const scoreTotal = scoreOne + scoreTwo + scoreCoin + scoreMonster;

	return (
		<div className={ styles.seasonScore }>
			<div className={ styles.seasonScoreComponents }>
				<input type="number" onChange={ e => {
					setScoreOne( parseInt( e.target.value ) );
					onScoreTotalChange( parseInt( e.target.value ) + scoreTwo + scoreCoin + scoreMonster );
				} } />
				<input type="number" onChange={ e => {
					setScoreTwo( parseInt( e.target.value ) );
					onScoreTotalChange( scoreOne + parseInt( e.target.value ) + scoreCoin + scoreMonster );
				} } />
				<input type="number" onChange={ e => {
					setScoreCoin( parseInt( e.target.value ) );
					onScoreTotalChange( scoreOne + scoreTwo + parseInt( e.target.value ) + scoreMonster );
				} } />
				<input type="number" onChange={ e => {
					setScoreMonster( parseInt( e.target.value ) );
					onScoreTotalChange( scoreOne + scoreTwo + scoreCoin + parseInt( e.target.value ) );
				} } />
			</div>
			<div className={ styles.seasonScoreTotal }>
				{ scoreTotal }
			</div>
		</div>
	);
}