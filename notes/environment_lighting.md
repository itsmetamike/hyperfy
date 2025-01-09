# Environment Lighting in Hyperfy

## HDR Environment Maps
- HDR files are stored in `src/client/public/`
- HDR maps provide both lighting and reflections for the scene
- Changed via `buildHDR()` in `ClientEnvironment.js`
- Example HDR files: `day2.hdr`, `dusk3.hdr`, `black-hdr.hdr`

## Lighting Systems

### CSM (Cascaded Shadow Maps)
```javascript
buildCSM() {
  this.csm = new CSM({
    mode: 'practical',
    cascades: 3,
    shadowMapSize: 2048,
    maxFar: 100,
    lightIntensity: 1,
    lightDirection: new THREE.Vector3(0, -1, 0).normalize(),
    fade: true,
    parent: scene,
    camera: camera,
  })
}
```
- Provides high-quality shadows using multiple shadow maps
- Configurable via `csmLevels` settings (none, low, med, high)
- Requires update per frame: `this.csm.update()`
- Light direction can be adjusted via `lightDirection` vector

### Alternative Light Types
1. Directional Light
```javascript
const light = new THREE.DirectionalLight(0xffffff, 2)
light.position.set(0, 10, 0)
light.castShadow = true
```

2. Spotlight
```javascript
const light = new THREE.SpotLight(0xffffff, 2)
light.position.set(0, 10, 0)
light.angle = Math.PI / 3
light.penumbra = 0.5
```

## Shadow Configuration
- Shadow map size affects quality: typically 2048x2048
- Shadow camera parameters control shadow coverage
- Shadow bias and normal bias help prevent shadow artifacts
