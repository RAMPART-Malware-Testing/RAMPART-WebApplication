declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          "camera-controls"?: string;
          "camera-orbit"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          "interpolation-decay"?: string;
          exposure?: string;
          "shadow-intensity"?: string;
          "environment-image"?: string;
          "skybox-image"?: string;
          loading?: string;
          poster?: string;
          autoplay?: string;
          "touch-action"?: string;
          ar?: string;
          "ar-modes"?: string;
          style?: React.CSSProperties;
          class?: string;
          ref?: React.Ref<HTMLElement>;
        },
        HTMLElement
      >;
    }
  }
}

export {};
