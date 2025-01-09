import { NFTVRMLoader } from './nft-vrm-loader.js';
import { loadVRM } from '@pixiv/three-vrm';
import * as THREE from 'three';

export async function loadNFTVRMModel(tokenId) {
  try {
    const loader = new NFTVRMLoader();
    
    // Get the VRM data
    const vrmArrayBuffer = await loader.loadVRM(tokenId);
    
    // Create a THREE.GLTFLoader instance
    const gltfLoader = new THREE.GLTFLoader();
    
    // Load the VRM
    const vrm = await loadVRM(vrmArrayBuffer, gltfLoader);
    
    return vrm;
  } catch (error) {
    console.error('Error loading NFT VRM model:', error);
    throw error;
  }
}

// Example usage:
// const vrm = await loadNFTVRMModel(1); // Load token ID 1
// scene.add(vrm.scene);
