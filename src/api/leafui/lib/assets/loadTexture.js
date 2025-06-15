// Inspiration for this code goes to Matt DesLauriers @mattdesl,
// really awesome dude, give him a follow!
// https://github.com/mattdesl/threejs-app/blob/master/src/util/loadTexture.js
import * as THREE from 'three'
import loadImage from 'image-promise'

const onTextureLoadingCompleted = (_texture) => {
    _texture.encoding = THREE.sRGBEncoding; // this line is necessary to make the color space dark as intended
    const material = new THREE.MeshBasicMaterial({ map: _texture });
    material.dithering = true;
    material.toneMapped = false;
    let mesh = new THREE.Mesh( geometry, material );
    //threejs_props.backdrop_mesh = mesh;

    threejs_props.current.scene.add(mesh);
    if (threejs_props.current.backdrop_mesh) {
        threejs_props.current.scene.remove(threejs_props.current.backdrop_mesh);
    }
    threejs_props.current.backdrop_mesh = mesh;
    console.log('#########: backdrop_mesh created!');
};

const textureloader = new THREE.TextureLoader();

export default async function loadTexture(url, options, onTextureLoadingCompleted=null) {
  //const texture = new THREE.Texture()
  //texture.name = url
  //texture.encoding = options.encoding || THREE.LinearEncoding
  //setTextureParams(url, texture, options)
  const testcallback = (_texture) => {
    console.log(_texture);
  }

  try {
    //const texture = (onTextureLoadingCompleted) ? 
    //    textureloader.load(
    //        url, 
    //        function(texture) {onTextureLoadingCompleted(texture)}
    //    ) :
    //    textureloader.load(url);
    //const texture = textureloader.load(url, testcallback);
    const texture = await textureloader.loadAsync(url);

    texture.name = url
    texture.encoding = options.encoding || THREE.sRGBEncoding;
    //setTextureParams(url, texture, options)

    if (options.renderer) {
      // Force texture to be uploaded to GPU immediately,
      // this will avoid "jank" on first rendered frame
      options.renderer.initTexture(texture)
    }
    //texture.needsUpdate = true
    return texture
  } catch (err) {
    throw new Error(`Could not load texture ${url}`)
  }
};

// spark_dev_note: marked as deprecated 11/Nov/2022.
async function loadTextureOld(url, options) {
  const texture = new THREE.Texture()
  texture.name = url
  texture.encoding = options.encoding || THREE.LinearEncoding
  setTextureParams(url, texture, options)

  try {
    const image = await loadImage(url, { crossorigin: 'anonymous' })

    texture.image = image
    if (options.renderer) {
      // Force texture to be uploaded to GPU immediately,
      // this will avoid "jank" on first rendered frame
      options.renderer.initTexture(texture)
    }
    texture.needsUpdate = true
    return texture
  } catch (err) {
    throw new Error(`Could not load texture ${url}`)
  }
};

const setTextureParams = function setTextureParams(url, texture, opt) {
  if (typeof opt.flipY === 'boolean') texture.flipY = opt.flipY
  if (typeof opt.mapping !== 'undefined') {
    texture.mapping = opt.mapping
  }
  if (typeof opt.format !== 'undefined') {
    texture.format = opt.format
  } else {
    // choose a nice default format
    const isJPEG = url.search(/\.(jpg|jpeg)$/) > 0 || url.search(/^data:image\/jpeg/) === 0
    //texture.format = isJPEG ? THREE.RGBFormat : THREE.RGBAFormat
    //texture.format = isJPEG ? THREE.RGBAFormat : THREE.RGBAFormat
    texture.format = isJPEG ? THREE.sRGBEncoding : THREE.sRGBEncoding
  }
  if (opt.repeat) texture.repeat.copy(opt.repeat)
  texture.wrapS = opt.wrapS || THREE.ClampToEdgeWrapping
  texture.wrapT = opt.wrapT || THREE.ClampToEdgeWrapping
  texture.minFilter = opt.minFilter || THREE.LinearMipMapLinearFilter
  texture.magFilter = opt.magFilter || THREE.LinearFilter
  texture.generateMipmaps = opt.generateMipmaps !== false
}

