import { GraphNode, GraphEdge, FlowResult, AugmentingPath } from '@/types/graph';

interface ResidualEdge {
  to: string;
  capacity: number;
  flow: number;
  original: boolean;
  edgeId: string;
}

export function fordFulkerson(
  nodes: GraphNode[],
  edges: GraphEdge[],
  source: string,
  sink: string
): FlowResult {
  // Build residual graph
  const residual: Map<string, ResidualEdge[]> = new Map();
  
  nodes.forEach(node => {
    residual.set(node.id, []);
  });

  edges.forEach(edge => {
    // Forward edge
    residual.get(edge.source)?.push({
      to: edge.target,
      capacity: edge.capacity,
      flow: 0,
      original: true,
      edgeId: edge.id,
    });
    // Backward edge (for residual)
    residual.get(edge.target)?.push({
      to: edge.source,
      capacity: 0,
      flow: 0,
      original: false,
      edgeId: edge.id,
    });
  });

  const augmentingPaths: AugmentingPath[] = [];
  let maxFlow = 0;

  // BFS to find augmenting path
  const bfs = (): { path: string[]; bottleneck: number } | null => {
    const parent: Map<string, { node: string; edgeIndex: number }> = new Map();
    const visited = new Set<string>();
    const queue: string[] = [source];
    visited.add(source);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === sink) {
        // Reconstruct path and find bottleneck
        const path: string[] = [sink];
        let bottleneck = Infinity;
        let node = sink;

        while (node !== source) {
          const parentInfo = parent.get(node)!;
          const edge = residual.get(parentInfo.node)![parentInfo.edgeIndex];
          bottleneck = Math.min(bottleneck, edge.capacity - edge.flow);
          path.unshift(parentInfo.node);
          node = parentInfo.node;
        }

        return { path, bottleneck };
      }

      const neighbors = residual.get(current) || [];
      neighbors.forEach((edge, index) => {
        if (!visited.has(edge.to) && edge.capacity - edge.flow > 0) {
          visited.add(edge.to);
          parent.set(edge.to, { node: current, edgeIndex: index });
          queue.push(edge.to);
        }
      });
    }

    return null;
  };

  // Find augmenting paths until none exist
  let result = bfs();
  while (result) {
    const { path, bottleneck } = result;
    augmentingPaths.push({ path, flow: bottleneck });
    maxFlow += bottleneck;

    // Update residual graph
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      // Update forward edge
      const forwardEdges = residual.get(from)!;
      const forwardEdge = forwardEdges.find(e => e.to === to)!;
      forwardEdge.flow += bottleneck;

      // Update backward edge
      const backwardEdges = residual.get(to)!;
      const backwardEdge = backwardEdges.find(e => e.to === from)!;
      backwardEdge.flow -= bottleneck;
    }

    result = bfs();
  }

  // Find minimum cut using BFS from source in residual graph
  const sourceSet = new Set<string>();
  const queue = [source];
  sourceSet.add(source);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = residual.get(current) || [];
    
    neighbors.forEach(edge => {
      if (!sourceSet.has(edge.to) && edge.capacity - edge.flow > 0) {
        sourceSet.add(edge.to);
        queue.push(edge.to);
      }
    });
  }

  const sinkSet = new Set<string>();
  nodes.forEach(node => {
    if (!sourceSet.has(node.id)) {
      sinkSet.add(node.id);
    }
  });

  // Find cut edges (edges from source set to sink set in original graph)
  const cutEdges: string[] = [];
  edges.forEach(edge => {
    if (sourceSet.has(edge.source) && sinkSet.has(edge.target)) {
      cutEdges.push(edge.id);
    }
  });

  return {
    maxFlow,
    minCut: {
      edges: cutEdges,
      sourceSet: Array.from(sourceSet),
      sinkSet: Array.from(sinkSet),
    },
    augmentingPaths,
  };
}
