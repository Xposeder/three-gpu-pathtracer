import * as THREE from 'three';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PathTracingSceneGenerator, PathTracingRenderer } from '../src/index.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { LambertPathTracingMaterial } from '../src/materials/LambertPathTracingMaterial.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let renderer, controls, sceneInfo, ptRenderer, camera, fsQuad;
let samplesEl;
const params = {

	material1: {
		color: '#ffffff',
		roughness: 1.0,
		metalness: 1.0,
		ior: 1.0,
		transmission: 0.0,
	},
	material2: {
		color: '#ffffff',
		roughness: 1.0,
		metalness: 1.0,
		ior: 1.0,
		transmission: 0.0,
	},
	environmentIntensity: 3,
	bounces: 3,
	samplesPerFrame: 1,

};

init();

async function init() {

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	document.body.appendChild( renderer.domElement );

	fsQuad = new FullScreenQuad( new THREE.MeshBasicMaterial( { transparent: true } ) );

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.025, 500 );
	camera.position.set( - 4, 2, 3 );

	ptRenderer = new PathTracingRenderer( renderer );
	ptRenderer.camera = camera;
	ptRenderer.material = new LambertPathTracingMaterial( { transparent: true, depthWrite: false } );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', () => {

		ptRenderer.reset();

	} );

	samplesEl = document.getElementById( 'samples' );

	const envMapPromise = new Promise( resolve => {

		new RGBELoader()
			.load( 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr', texture => {

				const pmremGenerator = new THREE.PMREMGenerator( renderer );
				pmremGenerator.compileCubemapShader();

				const envMap = pmremGenerator.fromEquirectangular( texture );

				texture.mapping = THREE.EquirectangularReflectionMapping;
				ptRenderer.material.environmentMap = envMap.texture;
				resolve();

			} );

	} );

	const generator = new PathTracingSceneGenerator();
	const gltfPromise = new GLTFLoader()
		.setMeshoptDecoder( MeshoptDecoder )
		.loadAsync( 'https://raw.githubusercontent.com/gkjohnson/gltf-demo-models/main/material-balls/material-ball.glb' )
		.then( gltf => {

			gltf.scene.scale.setScalar( 0.01 );
			gltf.scene.updateMatrixWorld();
			return generator.generate( gltf.scene );

		} )
		.then( result => {

			sceneInfo = result;
			sceneInfo.scene.add( new THREE.DirectionalLight() );

			const { bvh, textures, materials } = result;
			const geometry = bvh.geometry;
			const material = ptRenderer.material;

			material.bvh.updateFrom( bvh );
			material.normalAttribute.updateFrom( geometry.attributes.normal );
			material.tangentAttribute.updateFrom( geometry.attributes.tangent );
			material.uvAttribute.updateFrom( geometry.attributes.uv );
			material.materialIndexAttribute.updateFrom( geometry.attributes.materialIndex );
			material.textures.setTextures( renderer, 2048, 2048, textures );
			material.materials.updateFrom( materials, textures );
			material.setDefine( 'MATERIAL_LENGTH', materials.length );
			ptRenderer.reset();

			generator.dispose();

		} );

	await Promise.all( [ gltfPromise, envMapPromise ] );

	document.getElementById( 'loading' ).remove();

	onResize();
	window.addEventListener( 'resize', onResize );

	const gui = new GUI();
	const ptFolder = gui.addFolder( 'Path Tracing' );
	ptFolder.add( params, 'samplesPerFrame', 1, 10, 1 ).onChange( () => {

		ptRenderer.reset();

	} );
	ptFolder.add( params, 'environmentIntensity', 0, 10 ).onChange( () => {

		ptRenderer.reset();

	} );
	ptFolder.add( params, 'bounces', 1, 10, 1 ).onChange( value => {

		console.log( value );
		ptRenderer.material.setDefine( 'BOUNCES', value );
		ptRenderer.reset();

	} );

	const matFolder1 = gui.addFolder( 'Material 1' );
	matFolder1.addColor( params.material1, 'color' );
	matFolder1.add( params.material1, 'roughness', 0, 1 );
	matFolder1.add( params.material1, 'metalness', 0, 1 );
	matFolder1.add( params.material1, 'transmission', 0, 1 );
	matFolder1.add( params.material1, 'ior', 0.5, 2.0 );
	matFolder1.open();

	const matFolder2 = gui.addFolder( 'Material 2' );
	matFolder2.addColor( params.material2, 'color' );
	matFolder2.add( params.material1, 'roughness', 0, 1 );
	matFolder2.add( params.material1, 'metalness', 0, 1 );
	matFolder2.add( params.material1, 'transmission', 0, 1 );
	matFolder2.add( params.material1, 'ior', 0.5, 2 );
	matFolder2.open();

	animate();

}

function onResize() {

	const w = window.innerWidth;
	const h = window.innerHeight;
	const scale = 1;
	const dpr = window.devicePixelRatio;

	ptRenderer.target.setSize( w * scale * dpr, h * scale * dpr );
	ptRenderer.reset();

	renderer.setSize( w, h );
	renderer.setPixelRatio( window.devicePixelRatio );
	camera.aspect = w / h;
	camera.updateProjectionMatrix();

}


function animate() {

	requestAnimationFrame( animate );

	ptRenderer.material.environmentIntensity = params.environmentIntensity;
	ptRenderer.material.environmentBlur = 0.35;

	camera.updateMatrixWorld();

	for ( let i = 0, l = params.samplesPerFrame; i < l; i ++ ) {

		ptRenderer.update();

	}

	renderer.autoClear = false;
	fsQuad.material.map = ptRenderer.target.texture;
	fsQuad.render( renderer );
	renderer.autoClear = true;

	samplesEl.innerText = `Samples: ${ ptRenderer.samples }`;

}




