import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Play, Scissors, RotateCcw, CircleDot, ArrowRight } from 'lucide-react';
import { GraphNode, GraphEdge } from '@/types/graph';
import neuralIcon from '@/assets/neural.png';

interface ControlPanelProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: string | null;
  onAddNode: (label: string) => void;
  onAddEdge: (source: string, target: string, capacity: number) => void;
  onSetNodeType: (nodeId: string, type: 'source' | 'sink' | 'regular') => void;
  onRunMaxFlow: () => void;
  onShowMinCut: () => void;
  onReset: () => void;
  hasResult: boolean;
  showingCut: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  nodes,
  edges,
  selectedNode,
  onAddNode,
  onAddEdge,
  onSetNodeType,
  onRunMaxFlow,
  onShowMinCut,
  onReset,
  hasResult,
  showingCut,
}) => {
  const [nodeLabel, setNodeLabel] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeCapacity, setEdgeCapacity] = useState('');

  const handleAddNode = () => {
    if (nodeLabel.trim()) {
      onAddNode(nodeLabel.trim());
      setNodeLabel('');
    }
  };

  const handleAddEdge = () => {
    const capacity = parseInt(edgeCapacity);
    if (edgeSource && edgeTarget && capacity > 0) {
      onAddEdge(edgeSource, edgeTarget, capacity);
      setEdgeSource('');
      setEdgeTarget('');
      setEdgeCapacity('');
    }
  };

  const source = nodes.find(n => n.type === 'source');
  const sink = nodes.find(n => n.type === 'sink');
  const canRunFlow = source && sink && edges.length > 0;

  return (
    <div className="w-80 h-full bg-card border-r border-border p-4 overflow-y-auto space-y-4 flex flex-col">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <img src={neuralIcon} alt="Network Flow" className="w-8 h-8 invert" />
          <h1 className="text-xl font-bold text-gradient">Network Flow</h1>
        </div>
        <p className="text-xs text-muted-foreground">Ford-Fulkerson Algorithm Visualizer</p>
      </div>

      <Separator className="bg-border" />

      {/* Add Node Section */}
      <Card className="bg-secondary/30 border-border">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-primary" />
            Add Node
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Label (e.g., A)"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
              className="bg-background/50 border-border text-sm h-9"
            />
            <Button onClick={handleAddNode} size="sm" variant="glow">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Or click on the canvas to add a node
          </p>
        </CardContent>
      </Card>

      {/* Set Node Type */}
      {selectedNode && (
        <Card className="bg-secondary/30 border-border">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-medium">
              Selected: {nodes.find(n => n.id === selectedNode)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex gap-2">
              <Button
                onClick={() => onSetNodeType(selectedNode, 'source')}
                size="sm"
                variant={nodes.find(n => n.id === selectedNode)?.type === 'source' ? 'success' : 'outline'}
                className="flex-1 text-xs"
              >
                Source
              </Button>
              <Button
                onClick={() => onSetNodeType(selectedNode, 'sink')}
                size="sm"
                variant={nodes.find(n => n.id === selectedNode)?.type === 'sink' ? 'destructive' : 'outline'}
                className="flex-1 text-xs"
              >
                Sink
              </Button>
              <Button
                onClick={() => onSetNodeType(selectedNode, 'regular')}
                size="sm"
                variant={nodes.find(n => n.id === selectedNode)?.type === 'regular' ? 'default' : 'outline'}
                className="flex-1 text-xs"
              >
                Regular
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Edge Section */}
      <Card className="bg-secondary/30 border-border">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            Add Edge
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <select
                value={edgeSource}
                onChange={(e) => setEdgeSource(e.target.value)}
                className="w-full h-9 rounded-md bg-background/50 border border-border text-sm px-2"
              >
                <option value="">Select</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <select
                value={edgeTarget}
                onChange={(e) => setEdgeTarget(e.target.value)}
                className="w-full h-9 rounded-md bg-background/50 border border-border text-sm px-2"
              >
                <option value="">Select</option>
                {nodes.filter(n => n.id !== edgeSource).map(node => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Capacity</Label>
              <Input
                type="number"
                min="1"
                placeholder="10"
                value={edgeCapacity}
                onChange={(e) => setEdgeCapacity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEdge()}
                className="bg-background/50 border-border text-sm h-9"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddEdge} size="sm" variant="glow">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-border" />

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={onRunMaxFlow}
          disabled={!canRunFlow}
          className="w-full"
          variant="glow"
        >
          <Play className="w-4 h-4 mr-2" />
          Calculate Max Flow
        </Button>

        <Button
          onClick={onShowMinCut}
          disabled={!hasResult}
          variant={showingCut ? 'destructive' : 'secondary'}
          className="w-full"
        >
          <Scissors className="w-4 h-4 mr-2" />
          {showingCut ? 'Hide Min Cut' : 'Show Min Cut'}
        </Button>

        <Button onClick={onReset} variant="outline" className="w-full">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Graph
        </Button>
      </div>

      {/* Graph Info */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nodes:</span>
              <span className="font-mono text-foreground">{nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Edges:</span>
              <span className="font-mono text-foreground">{edges.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <span className="font-mono text-success">{source?.label || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sink:</span>
              <span className="font-mono text-destructive">{sink?.label || '—'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!canRunFlow && nodes.length > 0 && (
        <p className="text-xs text-warning text-center">
          {!source && !sink && 'Set a source and sink node'}
          {source && !sink && 'Set a sink node'}
          {!source && sink && 'Set a source node'}
          {source && sink && edges.length === 0 && 'Add at least one edge'}
        </p>
      )}

      <div className="mt-auto pt-4">
        <p className="text-xs text-muted-foreground text-center">
          Made by Cherif Bourechache
        </p>
      </div>
    </div>
  );
};
