import React, { useState, useCallback } from 'react';
import { GraphCanvas } from '@/components/GraphCanvas';
import { ControlPanel } from '@/components/ControlPanel';
import { ResultsPanel } from '@/components/ResultsPanel';
import { GraphNode, GraphEdge, FlowResult } from '@/types/graph';
import { fordFulkerson } from '@/lib/fordFulkerson';
import { toast } from 'sonner';

const Index = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [flowResult, setFlowResult] = useState<FlowResult | null>(null);
  const [showMinCut, setShowMinCut] = useState(false);
  const [nodeCounter, setNodeCounter] = useState(0);

  const handleAddNode = useCallback((label: string) => {
    const existingLabels = nodes.map(n => n.label);
    if (existingLabels.includes(label)) {
      toast.error(`Node "${label}" already exists`);
      return;
    }

    const newNode: GraphNode = {
      id: `node-${nodeCounter}`,
      label,
      x: 150 + Math.random() * 400,
      y: 150 + Math.random() * 300,
      type: 'regular',
    };

    setNodes(prev => [...prev, newNode]);
    setNodeCounter(prev => prev + 1);
    setFlowResult(null);
    setShowMinCut(false);
    toast.success(`Node "${label}" added`);
  }, [nodes, nodeCounter]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const existingLabels = new Set(nodes.map(n => n.label));
    
    let label = '';
    for (let i = 0; i < letters.length; i++) {
      if (!existingLabels.has(letters[i])) {
        label = letters[i];
        break;
      }
    }
    
    if (!label) {
      label = `N${nodeCounter}`;
    }

    const newNode: GraphNode = {
      id: `node-${nodeCounter}`,
      label,
      x,
      y,
      type: 'regular',
    };

    setNodes(prev => [...prev, newNode]);
    setNodeCounter(prev => prev + 1);
    setFlowResult(null);
    setShowMinCut(false);
    toast.success(`Node "${label}" added`);
  }, [nodes, nodeCounter]);

  const handleAddEdge = useCallback((source: string, target: string, capacity: number) => {
    const existingEdge = edges.find(e => e.source === source && e.target === target);
    if (existingEdge) {
      toast.error('Edge already exists');
      return;
    }

    const newEdge: GraphEdge = {
      id: `edge-${source}-${target}`,
      source,
      target,
      capacity,
      flow: 0,
    };

    setEdges(prev => [...prev, newEdge]);
    setFlowResult(null);
    setShowMinCut(false);

    const sourceLabel = nodes.find(n => n.id === source)?.label;
    const targetLabel = nodes.find(n => n.id === target)?.label;
    toast.success(`Edge ${sourceLabel} → ${targetLabel} (${capacity}) added`);
  }, [edges, nodes]);

  const handleNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, x, y } : node
    ));
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(prev => prev === nodeId ? null : nodeId);
  }, []);

  const handleSetNodeType = useCallback((nodeId: string, type: 'source' | 'sink' | 'regular') => {
    setNodes(prev => {
      // If setting source/sink, clear existing
      if (type === 'source' || type === 'sink') {
        return prev.map(node => {
          if (node.id === nodeId) {
            return { ...node, type };
          }
          if (node.type === type) {
            return { ...node, type: 'regular' };
          }
          return node;
        });
      }
      return prev.map(node => 
        node.id === nodeId ? { ...node, type } : node
      );
    });
    setFlowResult(null);
    setShowMinCut(false);
  }, []);

  const handleRunMaxFlow = useCallback(() => {
    const source = nodes.find(n => n.type === 'source');
    const sink = nodes.find(n => n.type === 'sink');

    if (!source || !sink) {
      toast.error('Please set both source and sink nodes');
      return;
    }

    // Reset edge flows
    const resetEdges = edges.map(e => ({ ...e, flow: 0, isInPath: false, isInCut: false }));
    
    const result = fordFulkerson(nodes, resetEdges, source.id, sink.id);
    
    // Update edges with flow values
    const updatedEdges = resetEdges.map(edge => {
      const isInCut = result.minCut.edges.includes(edge.id);
      return { ...edge, isInCut };
    });

    // Calculate actual flows from augmenting paths
    const flowMap = new Map<string, number>();
    result.augmentingPaths.forEach(path => {
      for (let i = 0; i < path.path.length - 1; i++) {
        const edgeId = `edge-${path.path[i]}-${path.path[i + 1]}`;
        flowMap.set(edgeId, (flowMap.get(edgeId) || 0) + path.flow);
      }
    });

    const finalEdges = updatedEdges.map(edge => ({
      ...edge,
      flow: flowMap.get(edge.id) || 0,
    }));

    setEdges(finalEdges);
    setFlowResult(result);
    setShowMinCut(false);
    toast.success(`Maximum flow: ${result.maxFlow}`);
  }, [nodes, edges]);

  const handleShowMinCut = useCallback(() => {
    setShowMinCut(prev => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setFlowResult(null);
    setShowMinCut(false);
    setNodeCounter(0);
    toast.success('Graph reset');
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <ControlPanel
        nodes={nodes}
        edges={edges}
        selectedNode={selectedNode}
        onAddNode={handleAddNode}
        onAddEdge={handleAddEdge}
        onSetNodeType={handleSetNodeType}
        onRunMaxFlow={handleRunMaxFlow}
        onShowMinCut={handleShowMinCut}
        onReset={handleReset}
        hasResult={!!flowResult}
        showingCut={showMinCut}
      />
      <div className="flex-1 relative">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          flowResult={flowResult}
          showMinCut={showMinCut}
          onNodeDrag={handleNodeDrag}
          onNodeClick={handleNodeClick}
          onCanvasClick={handleCanvasClick}
          selectedNode={selectedNode}
        />
        <ResultsPanel
          result={flowResult}
          nodes={nodes}
          showMinCut={showMinCut}
        />
      </div>
    </div>
  );
};

export default Index;
