import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge, FlowResult } from '@/types/graph';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  flowResult: FlowResult | null;
  showMinCut: boolean;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onNodeClick: (nodeId: string) => void;
  onCanvasClick: (x: number, y: number) => void;
  selectedNode: string | null;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  flowResult,
  showMinCut,
  onNodeDrag,
  onNodeClick,
  onCanvasClick,
  selectedNode,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getNodeColor = useCallback((node: GraphNode) => {
    if (node.type === 'source') return 'hsl(145, 70%, 45%)';
    if (node.type === 'sink') return 'hsl(0, 70%, 55%)';
    return 'hsl(175, 80%, 50%)';
  }, []);

  const getEdgeColor = useCallback((edge: GraphEdge) => {
    if (showMinCut && flowResult?.minCut.edges.includes(edge.id)) {
      return 'hsl(0, 70%, 55%)';
    }
    if (edge.isInPath) {
      return 'hsl(175, 80%, 50%)';
    }
    return 'hsl(215, 20%, 45%)';
  }, [showMinCut, flowResult]);

  const getEdgeWidth = useCallback((edge: GraphEdge) => {
    if (showMinCut && flowResult?.minCut.edges.includes(edge.id)) {
      return 4;
    }
    if (edge.isInPath) {
      return 3;
    }
    return 2;
  }, [showMinCut, flowResult]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('width', width).attr('height', height);

    // Clear previous content
    svg.selectAll('*').remove();

    // Add defs for arrow markers
    const defs = svg.append('defs');
    
    // Default arrow
    defs.append('marker')
      .attr('id', 'arrowhead-default')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', 'hsl(215, 20%, 45%)');

    // Cut arrow
    defs.append('marker')
      .attr('id', 'arrowhead-cut')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', 'hsl(0, 70%, 55%)');

    // Flow arrow
    defs.append('marker')
      .attr('id', 'arrowhead-flow')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', 'hsl(175, 80%, 50%)');

    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Canvas click handler
    svg.on('click', (event) => {
      if (event.target === svgRef.current) {
        const [x, y] = d3.pointer(event);
        onCanvasClick(x, y);
      }
    });

    // Draw edges
    const edgeGroup = svg.append('g').attr('class', 'edges');
    
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;

      const isCut = showMinCut && flowResult?.minCut.edges.includes(edge.id);
      const isPath = edge.isInPath;
      const markerId = isCut ? 'arrowhead-cut' : isPath ? 'arrowhead-flow' : 'arrowhead-default';

      // Draw edge line
      edgeGroup.append('line')
        .attr('x1', sourceNode.x)
        .attr('y1', sourceNode.y)
        .attr('x2', targetNode.x)
        .attr('y2', targetNode.y)
        .attr('stroke', getEdgeColor(edge))
        .attr('stroke-width', getEdgeWidth(edge))
        .attr('marker-end', `url(#${markerId})`)
        .style('filter', isCut || isPath ? 'url(#glow)' : 'none')
        .style('transition', 'all 0.3s ease');

      // Calculate label position
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;
      
      // Offset label perpendicular to edge
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const offsetX = -dy / len * 15;
      const offsetY = dx / len * 15;

      // Draw capacity/flow label background
      const labelText = flowResult 
        ? `${edge.flow}/${edge.capacity}` 
        : `${edge.capacity}`;

      edgeGroup.append('rect')
        .attr('x', midX + offsetX - 20)
        .attr('y', midY + offsetY - 10)
        .attr('width', 40)
        .attr('height', 20)
        .attr('rx', 4)
        .attr('fill', 'hsl(220, 18%, 13%)')
        .attr('stroke', getEdgeColor(edge))
        .attr('stroke-width', 1);

      edgeGroup.append('text')
        .attr('x', midX + offsetX)
        .attr('y', midY + offsetY + 4)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '11px')
        .attr('fill', 'hsl(210, 40%, 96%)')
        .text(labelText);
    });

    // Draw nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    nodes.forEach(node => {
      const g = nodeGroup.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .call(d3.drag<SVGGElement, unknown>()
          .on('drag', (event) => {
            const newX = Math.max(30, Math.min(width - 30, event.x));
            const newY = Math.max(30, Math.min(height - 30, event.y));
            onNodeDrag(node.id, newX, newY);
          }) as any
        )
        .on('click', (event) => {
          event.stopPropagation();
          onNodeClick(node.id);
        });

      // Node glow effect
      g.append('circle')
        .attr('r', 28)
        .attr('fill', getNodeColor(node))
        .attr('opacity', 0.2)
        .style('filter', 'url(#glow)');

      // Node circle
      g.append('circle')
        .attr('r', 24)
        .attr('fill', 'hsl(220, 18%, 13%)')
        .attr('stroke', getNodeColor(node))
        .attr('stroke-width', selectedNode === node.id ? 3 : 2)
        .style('transition', 'all 0.2s ease');

      // Node label
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', getNodeColor(node))
        .text(node.label);

      // Type indicator
      if (node.type !== 'regular') {
        g.append('text')
          .attr('y', 38)
          .attr('text-anchor', 'middle')
          .attr('font-family', 'Inter, sans-serif')
          .attr('font-size', '10px')
          .attr('fill', 'hsl(215, 20%, 55%)')
          .text(node.type === 'source' ? 'SOURCE' : 'SINK');
      }
    });

  }, [nodes, edges, flowResult, showMinCut, selectedNode, onNodeDrag, onNodeClick, onCanvasClick, getNodeColor, getEdgeColor, getEdgeWidth]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-background rounded-lg border border-border overflow-hidden"
      style={{ 
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(220 15% 22%) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
    >
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
