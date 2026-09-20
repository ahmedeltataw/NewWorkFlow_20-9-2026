export interface FontFaceDescriptor {
  family: string;
  weight: number;
  file: string;
}

export interface FontAssetState {
  present: FontFaceDescriptor[];
  missing: FontFaceDescriptor[];
}

export interface FontFaceRuntime {
  dir: string;
  faces: FontFaceDescriptor[];
  fontAssetState(): FontAssetState;
  assertFontSources(): void;
  fontFacesCss(): string;
}

export declare const FONT_DIR: string;
export declare const FONT_FACES: FontFaceDescriptor[];
export declare const FONT_DISPLAY: "swap";

export declare function createFontFaces(options?: {
  dir?: string;
}): FontFaceRuntime;

export declare function fontAssetState(): FontAssetState;
export declare function assertFontSources(): void;
export declare function fontFacesCss(): string;
