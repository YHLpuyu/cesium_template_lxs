import * as Cesium from "cesium";
import {Texture3D} from "./texture3D.js";
import { viewer } from "./view";
import { noise } from "./perlin.js";

const fragmentShaderSource = `precision mediump sampler3D;
    #define epsilon 0.0001
    uniform float slice_size;
    uniform sampler3D volumnTexture_lxs;
    uniform vec3 halfdim;
    

    varying vec3 vOrigin;
    varying vec3 vDirection;
    varying vec2 vst;

    float getData(vec3 pos_lxs){
        vec3 pos=pos_lxs/(halfdim*2.);
        
        return texture(volumnTexture_lxs,pos).r;
    }
    vec2 hitBox( vec3 orig, vec3 dir ) {
        vec3 box_min = vec3( -halfdim );
        vec3 box_max = vec3( halfdim );
        vec3 inv_dir = 1.0 / dir;
        vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
        vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
        vec3 tmin = min( tmin_tmp, tmax_tmp );
        vec3 tmax = max( tmin_tmp, tmax_tmp );
        float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
        float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
        return vec2( t0, t1 );
    }
    vec3 normal( vec3 coord ) {
        if ( coord.x < epsilon ) return vec3( 1.0, 0.0, 0.0 );
        if ( coord.y < epsilon ) return vec3( 0.0, 1.0, 0.0 );
        if ( coord.z < epsilon ) return vec3( 0.0, 0.0, 1.0 );
        if ( coord.x > 1.0 - epsilon ) return vec3( - 1.0, 0.0, 0.0 );
        if ( coord.y > 1.0 - epsilon ) return vec3( 0.0, - 1.0, 0.0 );
        if ( coord.z > 1.0 - epsilon ) return vec3( 0.0, 0.0, - 1.0 );

        float step = 0.01;
        float x = getData( coord + vec3( - step, 0.0, 0.0 ) ) - getData( coord + vec3( step, 0.0, 0.0 ) );
        float y = getData( coord + vec3( 0.0, - step, 0.0 ) ) - getData( coord + vec3( 0.0, step, 0.0 ) );
        float z = getData( coord + vec3( 0.0, 0.0, - step ) ) - getData( coord + vec3( 0.0, 0.0, step ) );

        return normalize( vec3( x, y, z ) );
    }

    void main()
    {
        vec4 color=vec4(0);
        vec3 rayDir=normalize(vDirection);
        vec2 bounds=hitBox(vOrigin,rayDir);

        if(bounds.x>bounds.y) discard;
        bounds.x=max(bounds.x,0.0);

        vec3 p=vOrigin+bounds.x*rayDir;
        vec3 inc=1.0/abs(rayDir);
        float delta=min(inc.x,min(inc.y,inc.z));
        delta/=200.;

        // for(float i=0.;i<500.0;i+=1.){
        for ( float t = bounds.x; t < bounds.y; t += delta ){
            float d=getData(p+halfdim);
            if(d>0.6){
                color.rgb=normal(p+0.5)*0.5+(p*1.5+0.25);
                color.a=1.;
                break;
            }
            p+=rayDir*delta;
            // bounds.x+=delta;
            // if(bounds.x>bounds.y) break;
        }
        if(color.a==0.) discard;

        gl_FragColor=color;
    }
   `;
const vertexShaderSource = `
  attribute vec3 position;
  attribute vec2 st;

  varying vec3 vOrigin;
  varying vec3 vDirection;
  varying vec2 vst;

  void main()
  {    
      vOrigin=czm_encodedCameraPositionMCHigh+czm_encodedCameraPositionMCLow;
      vDirection=position-vOrigin;
      vst=st;

      gl_Position = czm_modelViewProjection * vec4(position,1.0);
  }
	`;

class lxs_primitive {

    constructor(options) {
        this.drawCommand = undefined;

        if (Cesium.defined(options)) {
            this.modelMatrix = options.modelMatrix;
            this.geometry_lxs = options.geometry_lxs;
            this.data = options.data;
            this.halfdim = new Cesium.Cartesian3();
            Cesium.Cartesian3.divideByScalar(options.dim, 2, this.halfdim);
        }
    }
    createCommand(context) {
        if (!Cesium.defined(this.geometry_lxs)) return;
        const geometry = Cesium.BoxGeometry.createGeometry(this.geometry_lxs);
        const attributelocations = Cesium.GeometryPipeline.createAttributeLocations(geometry);
        this.vertexarray = Cesium.VertexArray.fromGeometry({
            context: context,
            geometry: geometry,
            attributes: attributelocations
        });
        const renderstate = Cesium.RenderState.fromCache({
            depthTest: {
                enabled: true,
            },
            cull: {
                enabled: false,
            }
        })
        const shaderProgram = Cesium.ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            attributeLocations: attributelocations
        });
        const that = this;
        const uniformmap = {
            slice_size() {
                return size;
            },
            volumnTexture_lxs() {
                return that.getTexture(context);
            },
            halfdim() {
                return that.halfdim;
            }
        };

        this.drawCommand = new Cesium.DrawCommand({
            boundingVolume: this.geometry_lxs.boundingSphere,
            modelMatrix: this.modelMatrix,
            pass: Cesium.Pass.OPAQUE,
            shaderProgram: shaderProgram,
            renderState: renderstate,
            vertexArray: this.vertexarray,
            uniformMap: uniformmap
        });
    }
    getTexture(context) {
        if(!this.texture){
            const texture_size = Math.ceil(Math.sqrt(this.data.length));
            const texturetypearray=new Uint8Array(8*8*8);
            for (let i = 0; i < this.data.length; i++) {
                texturetypearray[i] = this.data[i];
            }
            this.texture=new Texture3D({
                width:8,
                height:8,
                depth:8,
                context: context,
                flipY: false,
                pixelFormat: Cesium.PixelFormat.ALPHA,
                pixelDataType: Cesium.ComponentDatatype.fromTypedArray(
                    texturetypearray
                ),
                source: {
                    width: texture_size,
                    height: texture_size,
                    arrayBufferView: texturetypearray,
                },
                sampler: new Cesium.Sampler({
                    minificationFilter: Cesium.TextureMinificationFilter.NEAREST,
                    magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
                }),
            })
        }

        return this.texture;
    }
    update(frameState) {
        if (!this.drawCommand) {
            this.createCommand(frameState.context);
        }
        frameState.commandList.push(this.drawCommand);
    }
}
const dim_lxs = new Cesium.Cartesian3(3, 2, 1);
var geometry = Cesium.BoxGeometry.fromDimensions({
    vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
    dimensions: dim_lxs,
});
const primitive_modelMatrix = Cesium.Matrix4.multiplyByTranslation(
    Cesium.Transforms.eastNorthUpToFixedFrame(
        Cesium.Cartesian3.fromDegrees(
            124.21936679679918,
            45.85136872098397
        )
    ),
    new Cesium.Cartesian3(0.0, 0.0, 80.0),
    new Cesium.Matrix4()
);
/**
 * 生成体数据
 */
const size = 8;
//data在0~255之间
const data = new Uint8Array(size * size * size);
let dx, dy, dz;
let i = 0;
for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            dx = x * 1.0 / size;
            dy = y * 1.0 / size;
            dz = z * 1.0 / size;
            const d = noise(dx * 6.5, y * 6.5, z * 6.5);
            data[i++] = d * 128 + 128;
        }
    }
}

const options = {
    modelMatrix: primitive_modelMatrix,
    geometry_lxs: geometry,
    data: data,
    dim: dim_lxs
};

const lxs = viewer.scene.primitives.add(
    new lxs_primitive(options)
);