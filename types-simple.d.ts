// Minimal type declarations for IDE compatibility

// Node.js types
declare namespace NodeJS {
  interface Timeout {
    ref(): this;
    unref(): this;
  }
}

// Module declarations
declare module 'next/link' {
  const Link: any;
  export default Link;
}

declare module 'next/image' {
  const Image: any;
  export default Image;
}

declare module 'lucide-react' {
  const lucideReact: any;
  export default lucideReact;
}

// Global functions
declare global {
  function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
  function clearTimeout(timeoutId: NodeJS.Timeout): void;
  function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timeout;
  function clearInterval(intervalId: NodeJS.Timeout): void;
}

export {};
