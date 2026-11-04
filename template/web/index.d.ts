declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: import('next/image').StaticImageData;
  export default src;
}

declare module '*.jpg' {
  const src: import('next/image').StaticImageData;
  export default src;
}

declare module '*.jpeg' {
  const src: import('next/image').StaticImageData;
  export default src;
}

declare module '*.webp' {
  const src: import('next/image').StaticImageData;
  export default src;
}

declare module '*.css';
