import { ethers } from 'ethers';

const EMERGENCE_CONTRACT = '0xD24Fd3721DDCE82595FB737B55f1c5272bcb0413';
const ALCHEMY_URL = 'https://eth-mainnet.g.alchemy.com/v2/tBEM7zTnACO6V9tbxhtS8CT0YDYYA5xb';

// Basic ERC721 ABI for tokenURI
const ERC721_ABI = [
  'function tokenURI(uint256 tokenId) view returns (string)'
];

export class NFTVRMLoader {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(ALCHEMY_URL);
    this.contract = new ethers.Contract(EMERGENCE_CONTRACT, ERC721_ABI, this.provider);
  }

  async getMetadata(tokenId) {
    try {
      const tokenURI = await this.contract.tokenURI(tokenId);
      // Handle IPFS URI
      const url = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const response = await fetch(url);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      throw error;
    }
  }

  async getVRMUrl(tokenId) {
    const metadata = await this.getMetadata(tokenId);
    if (!metadata.animation_url) {
      throw new Error('No VRM URL found in metadata');
    }
    // Convert IPFS URL to HTTP gateway URL
    return metadata.animation_url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }

  async loadVRM(tokenId) {
    try {
      const vrmUrl = await this.getVRMUrl(tokenId);
      const response = await fetch(vrmUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Return the array buffer which can be used to load the VRM
      return arrayBuffer;
    } catch (error) {
      console.error('Error loading VRM:', error);
      throw error;
    }
  }
}
