declare namespace JSX {
  interface IntrinsicElements {
    "weave-button": JSX.HTMLAttributes<HTMLElement> & {
      type?: "button" | "submit" | "reset";
      variant?: "outlined" | "flat" | "solid";
      density?: "high" | "medium";
      iconposition?: "left" | "right";
    },
    "weave-select": JSX.HTMLAttributes<HTMLElement> & {
      placeholder?: any;
      value: any;
      children: JSX.Element[];
      onChange: (e: CustomEvent<{ value: string; text: string }>) => void;
    },
    "weave-select-option": JSX.HTMLAttributes<HTMLElement> & {
      disabled?: true;
      value: any;
      children?: JSX.Element | string;
    }
    "weave-dot": JSX.HTMLAttributes<HTMLElement> & {
      slot?: string
    }
    "weave-inputslider": JSX.HTMLAttributes<HTMLElement> & {
      label?: string
      variant?: string
    }
    "weave-input": JSX.HTMLAttributes<HTMLElement> & {
      id?: string
      value: number;
      step: number;
      min: number;
      max: number;
      unit?: string;
      variant?: string
    }
    "weave-slider": JSX.HTMLAttributes<HTMLElement> & {
      value: number;
      step: number;
      min: number;
      max: number;
      label?: string
      variant?: string
    }
  }
}
