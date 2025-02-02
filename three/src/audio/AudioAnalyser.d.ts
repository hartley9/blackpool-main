import { Audio } from './Audio';

export class AudioAnalyser {

	constructor( audio: Audio, fftSize: number );

	analyser: AnalyserNode;
	data: Uint8Array;

	getFrequencyData(): Uint8Array;
	getAverageFrequency(): number;

	/**
	 * @deprecated Use {@link AudioAnalyser#getFrequencyData .getFrequencyData()} instead.
	 */
	getData( file: any ): any;

}
