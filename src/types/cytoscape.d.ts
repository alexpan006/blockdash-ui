declare module 'cytoscape' {

  interface ConcentricLayoutOptions extends LayoutOptions {
    includeLoops?: boolean;
  }
  export interface ElementDefinition {
    data: { [key: string]: any };
    group?: 'nodes' | 'edges';
    removed?: boolean;
    selected?: boolean;
    selectable?: boolean;
    locked?: boolean;
    grabbable?: boolean;
    pannable?: boolean;
    classes?: string | string[];
    position?: { x: number; y: number };
  }

  export interface EventObject {
    cy: Core;
    target: Singular;
    type: string;
    position: { x: number; y: number };
    renderedPosition: { x: number; y: number };
    originalEvent: Event;
    [key: string]: any;
  }

  export interface Singular {
    data: (key?: string, value?: any) => any;
    connectedEdges: () => EdgeSingular[];
    addClass: (classes: string) => this;
    removeClass: (classes: string) => this;
  }

  export interface NodeSingular extends Singular {
    position: (pos?: { x: number; y: number }) => { x: number; y: number };
    degree: (includeLoops?: boolean) => number;
  }

  export interface EdgeSingular extends Singular {
    midpoint: () => { x: number; y: number };
  }

  export interface Core {
    container: () => HTMLElement;
    elements: (selector?: string) => Singular[];
    on: (
      events: string | string[],
      selector: string | null,
      handler: (event: EventObject) => void,
      useCapture?: boolean
    ) => this;
    remove: (selector?: string) => this;
    add: (eles: ElementDefinition[]) => this;
    layout: (options: LayoutOptions) => Layouts;
    center: (eles?: Singular[]) => this;
    destroy: () => void;
    [key: string]: any;
  }

  export interface LayoutOptions {
    name: string;
    [key: string]: any;
  }

  export interface Layouts {
    run: () => void;
    stop: () => void;
  }

  const cytoscape: (options?: any) => Core;
  export = cytoscape;
}
