/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Node.js global types
declare namespace NodeJS {
  interface Timeout {
    ref(): this;
    unref(): this;
  }
}

// Explicit module declarations - more comprehensive
declare module 'next/link' {
  import React from 'react';
  interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean;
    legacyBehavior?: boolean;
  }
  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
  export { LinkProps };
}

declare module 'next/image' {
  import React from 'react';
  interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string | StaticImageData;
    alt: string;
    width?: number | string;
    height?: number | string;
    fill?: boolean;
    sizes?: string;
    quality?: number;
    priority?: boolean;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    unoptimized?: boolean;
    loader?: ImageLoader;
    onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
    onLoadingComplete?: (event: { naturalWidth: number; naturalHeight: number }) => void;
  }
  interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
    blurWidth?: number;
    blurHeight?: number;
  }
  type ImageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => string;
  const Image: React.ForwardRefExoticComponent<ImageProps & React.RefAttributes<HTMLImageElement>>;
  export default Image;
  export { ImageProps, StaticImageData, ImageLoader };
}

declare module 'lucide-react' {
  // Common icon components that might be used
  export const ArrowLeft: any;
  export const Compass: any;
  export const Heart: any;
  export const Sparkles: any;
  export const Stars: any;
  export const Clock: any;
  export const Flame: any;
  export const Coffee: any;
  export const Crown: any;
  export const Zap: any;
  export const MapPin: any;
  export const DollarSign: any;
  export const Users: any;
  export const Shuffle: any;
  export const ChevronRight: any;
  export const ChevronDown: any;
  export const Utensils: any;
  export const Music: any;
  export const Palette: any;
  export const TreePine: any;
  export const Plus: any;
  export const X: any;
  export const AlertCircle: any;
  export const History: any;
  export const Archive: any;
  export const CalendarDays: any;
  export const Trash2: any;
  export const Menu: any;
  export const CreditCard: any;
  
  // Default export
  const lucideReact: any;
  export default lucideReact;
}

// Global type for setTimeout return
declare global {
  interface Window {
    requestAnimationFrame(callback: FrameRequestCallback): number;
    cancelAnimationFrame(id: number): void;
  }
  
  function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
  function clearTimeout(timeoutId: NodeJS.Timeout): void;
  function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
  function clearInterval(intervalId: NodeJS.Timeout): void;
}

export {};
