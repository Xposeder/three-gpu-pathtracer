var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},e={},n={},a=t.parcelRequire5b70;null==a&&((a=function(t){if(t in e)return e[t].exports;if(t in n){var a=n[t];delete n[t];var r={id:t,exports:{}};return e[t]=r,a.call(r.exports,r,r.exports),r.exports}var i=new Error("Cannot find module '"+t+"'");throw i.code="MODULE_NOT_FOUND",i}).register=function(t,e){n[t]=e},t.parcelRequire5b70=a);var r=a("hGT0Q"),i=a("hwk6U"),o=a("4EHgc"),l=a("W2bOH"),s=a("aBPXg"),m=a("hYZ9M"),c=a("c0AwW"),d=(r=a("hGT0Q"),a("mNwkg")),u=a("6TM0u"),g=a("1yYrt"),p=a("bOW4I");class v extends r.ShaderMaterial{constructor(t){super({defines:{BOUNCES:3,MATERIAL_LENGTH:0,USE_ENVMAP:1,GRADIENT_BG:0},uniforms:{bvh:{value:new d.MeshBVHUniformStruct},normalAttribute:{value:new d.FloatVertexAttributeTexture},tangentAttribute:{value:new d.FloatVertexAttributeTexture},uvAttribute:{value:new d.FloatVertexAttributeTexture},materialIndexAttribute:{value:new d.UIntVertexAttributeTexture},materials:{value:new g.MaterialStructArrayUniform},textures:{value:(new p.RenderTarget2DArray).texture},cameraWorldMatrix:{value:new r.Matrix4},invProjectionMatrix:{value:new r.Matrix4},environmentBlur:{value:.2},environmentIntensity:{value:2},environmentMap:{value:null},seed:{value:0},opacity:{value:1},gradientTop:{value:new r.Color(12572927)},gradientBottom:{value:new r.Color(16777215)},bgGradientTop:{value:new r.Color(1118481)},bgGradientBottom:{value:new r.Color(0)}},vertexShader:"\n\n                varying vec2 vUv;\n                void main() {\n\n                    vec4 mvPosition = vec4( position, 1.0 );\n                    mvPosition = modelViewMatrix * mvPosition;\n                    gl_Position = projectionMatrix * mvPosition;\n\n                    vUv = uv;\n\n                }\n\n            ",fragmentShader:`\n                #define RAY_OFFSET 1e-5\n\t\t\t\t#define ENVMAP_TYPE_CUBE_UV\n\n                precision highp isampler2D;\n                precision highp usampler2D;\n                precision highp sampler2DArray;\n\t\t\t\tvec4 envMapTexelToLinear( vec4 a ) { return a; }\n                #include <common>\n\t\t\t\t#include <cube_uv_reflection_fragment>\n\n                ${d.shaderStructs}\n                ${d.shaderIntersectFunction}\n\t\t\t\t${u.shaderMaterialStructs}\n\t\t\t\t${u.pathTracingHelpers}\n\n\t\t\t\t#if USE_ENVMAP\n\n\t\t\t\tuniform float environmentBlur;\n                uniform sampler2D environmentMap;\n\n\t\t\t\t#else\n\n                uniform vec3 gradientTop;\n                uniform vec3 gradientBottom;\n\n\t\t\t\t#endif\n\n\t\t\t\t#if GRADIENT_BG\n\n\t\t\t\tuniform vec3 bgGradientTop;\n                uniform vec3 bgGradientBottom;\n\n\t\t\t\t#endif\n\n                uniform mat4 cameraWorldMatrix;\n                uniform mat4 invProjectionMatrix;\n                uniform sampler2D normalAttribute;\n                uniform sampler2D tangentAttribute;\n                uniform sampler2D uvAttribute;\n\t\t\t\tuniform usampler2D materialIndexAttribute;\n                uniform BVH bvh;\n                uniform float environmentIntensity;\n                uniform int seed;\n                uniform float opacity;\n\t\t\t\tuniform Material materials[ MATERIAL_LENGTH ];\n\t\t\t\tuniform sampler2DArray textures;\n                varying vec2 vUv;\n\n                void main() {\n\n\t\t\t\t\trng_initialize( gl_FragCoord.xy, seed );\n\n                    // get [-1, 1] normalized device coordinates\n                    vec2 ndc = 2.0 * vUv - vec2( 1.0 );\n                    vec3 rayOrigin, rayDirection;\n                    ndcToCameraRay( ndc, cameraWorldMatrix, invProjectionMatrix, rayOrigin, rayDirection );\n\n                    // Lambertian render\n                    gl_FragColor = vec4( 0.0 );\n\n                    vec3 throughputColor = vec3( 1.0 );\n\n                    // hit results\n                    uvec4 faceIndices = uvec4( 0u );\n                    vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );\n                    vec3 barycoord = vec3( 0.0 );\n                    float side = 1.0;\n                    float dist = 0.0;\n\t\t\t\t\tint i;\n                    for ( i = 0; i < BOUNCES; i ++ ) {\n\n                        if ( ! bvhIntersectFirstHit( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist ) ) {\n\n\t\t\t\t\t\t\t#if GRADIENT_BG\n\n\t\t\t\t\t\t\tif ( i == 0 ) {\n\n\t\t\t\t\t\t\t\trayDirection = normalize( rayDirection );\n\t\t\t\t\t\t\t\tfloat value = ( rayDirection.y + 1.0 ) / 2.0;\n\n\t\t\t\t\t\t\t\tvalue = pow( value, 2.0 );\n\n\t\t\t\t\t\t\t\tgl_FragColor = vec4( mix( bgGradientBottom, bgGradientTop, value ), 1.0 );\n\t\t\t\t\t\t\t\tbreak;\n\n\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t\t#endif\n\n\t\t\t\t\t\t\t#if USE_ENVMAP\n\n                            vec3 skyColor = textureCubeUV( environmentMap, rayDirection, environmentBlur ).rgb;\n\n\t\t\t\t\t\t\t#else\n\n\t\t\t\t\t\t\trayDirection = normalize( rayDirection );\n\t\t\t\t\t\t\tfloat value = ( rayDirection.y + 1.0 ) / 2.0;\n\t\t\t\t\t\t\tvec3 skyColor = mix( gradientBottom, gradientTop, value );\n\n\t\t\t\t\t\t\t#endif\n\n                            gl_FragColor += vec4( skyColor * throughputColor * environmentIntensity, 1.0 );\n\n                            break;\n\n\t\t\t\t\t\t}\n\n\n\t\t\t\t\t\tuint materialIndex = uTexelFetch1D( materialIndexAttribute, faceIndices.x ).r;\n\t\t\t\t\t\tMaterial material = materials[ materialIndex ];\n\n\t\t\t\t\t\tif ( material.opacity < rand() ) {\n\n\t\t\t\t\t\t\tvec3 point = rayOrigin + rayDirection * dist;\n\t\t\t\t\t\t\trayOrigin += rayDirection * dist - faceNormal * RAY_OFFSET;\n\t\t\t\t\t\t\tthroughputColor *= mix( vec3( 1.0 ), material.color, 0.5 * material.opacity );\n\n\t\t\t\t\t\t\ti --;\n\t\t\t\t\t\t\tcontinue;\n\n\t\t\t\t\t\t}\n\n                        // fetch the interpolated smooth normal\n                        vec3 normal = normalize( textureSampleBarycoord(\n\t\t\t\t\t\t\tnormalAttribute,\n\t\t\t\t\t\t\tbarycoord,\n\t\t\t\t\t\t\tfaceIndices.xyz\n\t\t\t\t\t\t).xyz );\n\n\t\t\t\t\t\tvec2 uv = textureSampleBarycoord( uvAttribute, barycoord, faceIndices.xyz ).xy;\n\n\t\t\t\t\t\t// emission\n\t\t\t\t\t\tvec3 emission = material.emissiveIntensity * material.emissive;\n\t\t\t\t\t\tif ( material.emissiveMap != - 1 ) {\n\n\t\t\t\t\t\t\temission *= texture2D( textures, vec3( uv, material.emissiveMap ) ).xyz;\n\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tgl_FragColor.rgb += throughputColor * emission * max( side, 0.0 );\n\n\t\t\t\t\t\t// 1 / PI attenuation for physically correct lambert model\n                        // https://www.rorydriscoll.com/2009/01/25/energy-conservation-in-games/\n                        throughputColor *= 1.0 / PI;\n\n\t\t\t\t\t\t// albedo\n\t\t\t\t\t\tthroughputColor *= material.color;\n\t\t\t\t\t\tif ( material.map != - 1 ) {\n\n\t\t\t\t\t\t\tthroughputColor *= texture2D( textures, vec3( uv, material.map ) ).xyz;\n\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\t// normal\n\t\t\t\t\t\tif ( material.normalMap != - 1 ) {\n\n\t\t\t\t\t\t\tvec4 tangentSample = textureSampleBarycoord(\n\t\t\t\t\t\t\t\ttangentAttribute,\n\t\t\t\t\t\t\t\tbarycoord,\n\t\t\t\t\t\t\t\tfaceIndices.xyz\n\t\t\t\t\t\t\t);\n\n\t\t\t\t\t\t\t// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate\n\t\t\t\t\t\t\t// resulting in NaNs and slow path tracing.\n\t\t\t\t\t\t\tif ( length( tangentSample.xyz ) > 0.0 ) {\n\n\t\t\t\t\t\t\t\tvec3 tangent = normalize( tangentSample.xyz );\n\t\t\t\t\t\t\t\tvec3 bitangent = normalize( cross( normal, tangent ) * tangentSample.w );\n\t\t\t\t\t\t\t\tmat3 vTBN = mat3( tangent, bitangent, normal );\n\n\t\t\t\t\t\t\t\tvec3 texNormal = texture2D( textures, vec3( uv, material.normalMap ) ).xyz * 2.0 - 1.0;\n\t\t\t\t\t\t\t\ttexNormal.xy *= material.normalScale;\n\t\t\t\t\t\t\t\tnormal = vTBN * texNormal;\n\n\t\t\t\t\t\t\t}\n\n\t\t\t\t\t\t}\n\n\t\t\t\t\t\tnormal *= side;\n\n                        // adjust the hit point by the surface normal by a factor of some offset and the\n                        // maximum component-wise value of the current point to accommodate floating point\n                        // error as values increase.\n                        vec3 point = rayOrigin + rayDirection * dist;\n                        vec3 absPoint = abs( point );\n                        float maxPoint = max( absPoint.x, max( absPoint.y, absPoint.z ) );\n                        rayOrigin = point + faceNormal * ( maxPoint + 1.0 ) * RAY_OFFSET;\n                        rayDirection = getHemisphereSample( normal, rand2() );\n\n\t\t\t\t\t\t// if the surface normal is skewed such that the outgoing vector can wind up underneath\n\t\t\t\t\t\t// the triangle surface then just consider it absorbed.\n\t\t\t\t\t\tif ( dot( rayDirection, faceNormal ) < 0.0 ) {\n\n\t\t\t\t\t\t\tbreak;\n\n\t\t\t\t\t\t}\n\n\n                    }\n\n\t\t\t\t\t// gl_FragColor.rgb = mix( gl_FragColor.rgb / 2.0, gl_FragColor.rgb, clamp( float( i ), 0.0, 1.0 ) );\n\t\t\t\t\t// gl_FragColor.rgb = mix( textureCubeUV( environmentMap, rayDirection, 0.0 ).rgb, gl_FragColor.rgb, clamp( float( i ), 0.0, 1.0 ) );\n                    gl_FragColor.a = opacity;\n\n                }\n\n            `});for(const t in this.uniforms)Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(e){this.uniforms[t].value=e}});this.setValues(t)}setDefine(t,e){null==e?t in this.defines&&(delete this.defines[t],this.needsUpdate=!0):this.defines[t]!==e&&(this.defines[t]=e,this.needsUpdate=!0)}}var h=a("ghLil");let f,y,b,x,w,M,C,T;const A={material1:{color:"#ffffff",roughness:1,metalness:1,ior:1,transmission:0,opacity:1},material2:{color:"#26C6DA",roughness:1,metalness:1,ior:1,transmission:0,opacity:1},environmentIntensity:3,bounces:3,samplesPerFrame:1,acesToneMapping:!0,resolutionScale:1/window.devicePixelRatio};function F(){const t=window.innerWidth,e=window.innerHeight,n=A.resolutionScale,a=window.devicePixelRatio;x.target.setSize(t*n*a,e*n*a),x.reset(),f.setSize(t,e),f.setPixelRatio(window.devicePixelRatio),w.aspect=t/e,w.updateProjectionMatrix()}function S(){x.reset()}function D(){requestAnimationFrame(D);const t=C[0];t.color.set(A.material1.color).convertSRGBToLinear(),t.metalness=A.material1.metalness,t.roughness=A.material1.roughness,t.transmission=A.material1.transmission,t.ior=A.material1.ior,t.opacity=A.material1.opacity;const e=C[1];e.color.set(A.material2.color).convertSRGBToLinear(),e.metalness=A.material2.metalness,e.roughness=A.material2.roughness,e.transmission=A.material2.transmission,e.ior=A.material2.ior,e.opacity=A.material2.opacity,x.material.materials.updateFrom(b.materials,b.textures),x.material.environmentIntensity=A.environmentIntensity,x.material.environmentBlur=.35,w.updateMatrixWorld();for(let t=0,e=A.samplesPerFrame;t<e;t++)x.update();f.autoClear=!1,M.material.map=x.target.texture,M.render(f),f.autoClear=!0,T.innerText=`Samples: ${x.samples}`}!async function(){f=new r.WebGLRenderer({antialias:!0}),f.toneMapping=r.ACESFilmicToneMapping,document.body.appendChild(f.domElement),M=new i.FullScreenQuad(new r.MeshBasicMaterial({transparent:!0})),w=new r.PerspectiveCamera(75,window.innerWidth/window.innerHeight,.025,500),w.position.set(-4,2,3),x=new s.PathTracingRenderer(f),x.camera=w,x.material=new v({transparent:!0,depthWrite:!1}),y=new l.OrbitControls(w,f.domElement),y.addEventListener("change",(()=>{x.reset()})),T=document.getElementById("samples");const t=new Promise((t=>{(new m.RGBELoader).load("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr",(e=>{const n=new r.PMREMGenerator(f);n.compileCubemapShader();const a=n.fromEquirectangular(e);e.mapping=r.EquirectangularReflectionMapping,x.material.environmentMap=a.texture,t()}))})),e=new s.PathTracingSceneGenerator,n=(new o.GLTFLoader).setMeshoptDecoder(c.MeshoptDecoder).loadAsync("https://raw.githubusercontent.com/gkjohnson/gltf-demo-models/main/material-balls/material-ball.glb").then((t=>{const n=new r.Group;t.scene.scale.setScalar(.01),t.scene.updateMatrixWorld(),n.add(t.scene);const a=new r.Box3;a.setFromObject(t.scene);const i=new r.Mesh(new r.CylinderBufferGeometry(3,3,.05,200),new r.MeshStandardMaterial({color:1710618}));i.geometry=i.geometry.toNonIndexed(),i.geometry.clearGroups(),i.position.y=a.min.y-.025,n.add(i);const o=new r.MeshStandardMaterial,l=new r.MeshStandardMaterial;return t.scene.traverse((t=>{"Sphere_1"===t.name?t.material=l:t.material=o,"subsphere_1"===t.name&&(t.visible=!1)})),C=[o,l],e.generate(n)})).then((t=>{b=t,b.scene.add(new r.DirectionalLight);const{bvh:n,textures:a,materials:i}=t,o=n.geometry,l=x.material;l.bvh.updateFrom(n),l.normalAttribute.updateFrom(o.attributes.normal),l.tangentAttribute.updateFrom(o.attributes.tangent),l.uvAttribute.updateFrom(o.attributes.uv),l.materialIndexAttribute.updateFrom(o.attributes.materialIndex),l.textures.setTextures(f,2048,2048,a),l.materials.updateFrom(i,a),l.setDefine("MATERIAL_LENGTH",i.length),x.reset(),e.dispose()}));await Promise.all([n,t]),document.getElementById("loading").remove(),F(),window.addEventListener("resize",F);const a=new h.GUI,d=a.addFolder("Path Tracing");d.add(A,"samplesPerFrame",1,10,1),d.add(A,"environmentIntensity",0,10).onChange((()=>{x.reset()})),d.add(A,"bounces",1,10,1).onChange((t=>{x.material.setDefine("BOUNCES",t),x.reset()})),d.add(A,"acesToneMapping").onChange((t=>{f.toneMapping=t?r.ACESFilmicToneMapping:r.NoToneMapping,M.material.needsUpdate=!0})),d.add(A,"resolutionScale",0,1).onChange((()=>{F()}));const u=a.addFolder("Material 1");u.addColor(A.material1,"color").onChange(S),u.add(A.material1,"roughness",0,1).onChange(S),u.add(A.material1,"metalness",0,1).onChange(S),u.add(A.material1,"opacity",0,1).onChange(S),u.add(A.material1,"transmission",0,1).onChange(S),u.add(A.material1,"ior",.5,2).onChange(S),u.open();const g=a.addFolder("Material 2");g.addColor(A.material2,"color").onChange(S),g.add(A.material2,"roughness",0,1).onChange(S),g.add(A.material2,"metalness",0,1).onChange(S),g.add(A.material2,"opacity",0,1).onChange(S),g.add(A.material2,"transmission",0,1).onChange(S),g.add(A.material2,"ior",.5,2).onChange(S),g.open(),D()}();
//# sourceMappingURL=materialBall.ed530ff1.js.map
