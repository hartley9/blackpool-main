export interface WebGLCapabilitiesParameters {
	precision?: string;
	logarithmicDepthBuffer?: boolean;
}

export class WebGLCapabilities {

	constructor(
		gl: WebGLRenderingContext,
		extensions: any,
		parameters: WebGLCapabilitiesParameters
	);

	isWebGL2: boolean;
	precision: string;
	logarithmicDepthBuffer: boolean;
	maxTextures: number;
	maxVertexTextures: number;
	maxTextureSize: number;
	maxCubemapSize: number;
	maxAttributes: number;
	maxVertexUniforms: number;
	maxVaryings: number;
	maxFragmentUniforms: number;
	vertexTextures: boolean;
	floatFragmentTextures: boolean;
	floatVertexTextures: boolean;

	getMaxAnisotropy(): number;
	getMaxPrecision( precision: string ): string;

}
