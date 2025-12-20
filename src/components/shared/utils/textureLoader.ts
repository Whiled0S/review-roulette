import * as THREE from "three";

/**
 * Texture cache to avoid reloading the same textures
 */
const textureCache = new Map<string, THREE.Texture>();
const loadingTextures = new Map<string, Promise<THREE.Texture>>();

/**
 * Load a texture with caching support
 * Returns cached texture if already loaded, or loads and caches it
 */
export const loadTexture = (url: string): Promise<THREE.Texture> => {
  // Return cached texture if available
  if (textureCache.has(url)) {
    return Promise.resolve(textureCache.get(url)!);
  }

  // Return pending promise if already loading
  if (loadingTextures.has(url)) {
    return loadingTextures.get(url)!;
  }

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");

  const promise = new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        textureCache.set(url, texture);
        loadingTextures.delete(url);
        resolve(texture);
      },
      undefined,
      (error) => {
        console.error("Failed to load texture:", url, error);
        loadingTextures.delete(url);
        reject(error);
      },
    );
  });

  loadingTextures.set(url, promise);
  return promise;
};

/**
 * Clear the texture cache (useful for memory management)
 */
export const clearTextureCache = (): void => {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
};
