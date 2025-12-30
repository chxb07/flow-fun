export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'source' | 'sink' | 'regular';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  capacity: number;
  flow: number;
  isInCut?: boolean;
  isInPath?: boolean;
}

export interface FlowResult {
  maxFlow: number;
  minCut: {
    edges: string[];
    sourceSet: string[];
    sinkSet: string[];
  };
  augmentingPaths: AugmentingPath[];
}

export interface AugmentingPath {
  path: string[];
  flow: number;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string | null;
  sink: string | null;
}
