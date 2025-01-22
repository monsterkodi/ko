import { RenderTarget, Vector2, PostProcessingUtils } from 'three';
import { TempNode, nodeObject, Fn, float, NodeUpdateType, uv, uniform, convertToTexture, vec2, vec4, QuadMesh, passTexture, mul, NodeMaterial } from 'three/tsl';

// WebGPU: The use of a single QuadMesh for both gaussian blur passes results in a single RenderObject with a SampledTexture binding that
// alternates between source textures and triggers creation of new BindGroups and BindGroupLayouts every frame.

const _quadMesh1 = /*@__PURE__*/ new QuadMesh();
const _quadMesh2 = /*@__PURE__*/ new QuadMesh();

let _rendererState;

class GaussianBlurNode extends TempNode {

	static get type() {

		return 'GaussianBlurNode';

	}

	constructor( textureNode, directionNode = null, sigma = 2 ) {

		super( 'vec4' );

		this.textureNode = textureNode;
		this.directionNode = directionNode;
		this.sigma = sigma;

		this._invSize = uniform( new Vector2() );
		this._passDirection = uniform( new Vector2() );

		this._horizontalRT = new RenderTarget( 1, 1, { depthBuffer: false } );
		this._horizontalRT.texture.name = 'GaussianBlurNode.horizontal';
		this._verticalRT = new RenderTarget( 1, 1, { depthBuffer: false } );
		this._verticalRT.texture.name = 'GaussianBlurNode.vertical';

		this._textureNode = passTexture( this, this._verticalRT.texture );

		this.updateBeforeType = NodeUpdateType.FRAME;

		this.resolution = new Vector2( 1, 1 );

	}

	setSize( width, height ) {

		width = Math.max( Math.round( width * this.resolution.x ), 1 );
		height = Math.max( Math.round( height * this.resolution.y ), 1 );

		this._invSize.value.set( 1 / width, 1 / height );
		this._horizontalRT.setSize( width, height );
		this._verticalRT.setSize( width, height );

	}

	updateBefore( frame ) {

		const { renderer } = frame;

		_rendererState = PostProcessingUtils.resetRendererState( renderer, _rendererState );

		//

		const textureNode = this.textureNode;
		const map = textureNode.value;

		const currentTexture = textureNode.value;

		_quadMesh1.material = this._material;
		_quadMesh2.material = this._material;

		this.setSize( map.image.width, map.image.height );

		const textureType = map.type;

		this._horizontalRT.texture.type = textureType;
		this._verticalRT.texture.type = textureType;

		// horizontal

		renderer.setRenderTarget( this._horizontalRT );

		this._passDirection.value.set( 1, 0 );

		_quadMesh1.render( renderer );

		// vertical

		textureNode.value = this._horizontalRT.texture;
		renderer.setRenderTarget( this._verticalRT );

		this._passDirection.value.set( 0, 1 );

		_quadMesh2.render( renderer );

		// restore

		textureNode.value = currentTexture;

		PostProcessingUtils.setRendererState( renderer, _rendererState );

	}

	getTextureNode() {

		return this._textureNode;

	}

	setup( builder ) {

		const textureNode = this.textureNode;

		if ( textureNode.isTextureNode !== true ) {

			console.error( 'GaussianBlurNode requires a TextureNode.' );

			return vec4();

		}

		//

		const uvNode = textureNode.uvNode || uv();
		const directionNode = vec2( this.directionNode || 1 );

		const sampleTexture = ( uv ) => textureNode.uv( uv );

		const blur = Fn( () => {

			const kernelSize = 3 + ( 2 * this.sigma );
			const gaussianCoefficients = this._getCoefficients( kernelSize );

			const invSize = this._invSize;
			const direction = directionNode.mul( this._passDirection );

			const weightSum = float( gaussianCoefficients[ 0 ] ).toVar();
			const diffuseSum = vec4( sampleTexture( uvNode ).mul( weightSum ) ).toVar();

			for ( let i = 1; i < kernelSize; i ++ ) {

				const x = float( i );
				const w = float( gaussianCoefficients[ i ] );

				const uvOffset = vec2( direction.mul( invSize.mul( x ) ) ).toVar();

				const sample1 = vec4( sampleTexture( uvNode.add( uvOffset ) ) );
				const sample2 = vec4( sampleTexture( uvNode.sub( uvOffset ) ) );

				diffuseSum.addAssign( sample1.add( sample2 ).mul( w ) );
				weightSum.addAssign( mul( 2.0, w ) );

			}

			return diffuseSum.div( weightSum );

		} );

		//

		const material = this._material || ( this._material = new NodeMaterial() );
		material.fragmentNode = blur().context( builder.getSharedContext() );
		material.name = 'Gaussian_blur';
		material.needsUpdate = true;

		//

		const properties = builder.getNodeProperties( this );
		properties.textureNode = textureNode;

		//

		return this._textureNode;

	}

	dispose() {

		this._horizontalRT.dispose();
		this._verticalRT.dispose();

	}

	_getCoefficients( kernelRadius ) {

		const coefficients = [];

		for ( let i = 0; i < kernelRadius; i ++ ) {

			coefficients.push( 0.39894 * Math.exp( - 0.5 * i * i / ( kernelRadius * kernelRadius ) ) / kernelRadius );

		}

		return coefficients;

	}

}

export default GaussianBlurNode;

export const gaussianBlur = ( node, directionNode, sigma ) => nodeObject( new GaussianBlurNode( convertToTexture( node ), directionNode, sigma ) );
