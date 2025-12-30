import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FlowResult, GraphNode } from '@/types/graph';
import { Zap, Scissors, Route } from 'lucide-react';

interface ResultsPanelProps {
  result: FlowResult | null;
  nodes: GraphNode[];
  showMinCut: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  result,
  nodes,
  showMinCut,
}) => {
  if (!result) return null;

  const getNodeLabel = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId)?.label || nodeId;
  };

  return (
    <div className="absolute top-4 right-4 w-72 space-y-3">
      {/* Max Flow Result */}
      <Card className="bg-card/95 backdrop-blur border-primary/30 shadow-lg shadow-primary/10">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Maximum Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-4xl font-bold font-mono text-gradient">
            {result.maxFlow}
          </div>
        </CardContent>
      </Card>

      {/* Min Cut Info */}
      {showMinCut && (
        <Card className="bg-card/95 backdrop-blur border-destructive/30 shadow-lg shadow-destructive/10">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scissors className="w-4 h-4 text-destructive" />
              Minimum Cut
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Source Side (S)</p>
              <div className="flex flex-wrap gap-1">
                {result.minCut.sourceSet.map(nodeId => (
                  <Badge key={nodeId} variant="outline" className="text-xs border-success text-success">
                    {getNodeLabel(nodeId)}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator className="bg-border" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sink Side (T)</p>
              <div className="flex flex-wrap gap-1">
                {result.minCut.sinkSet.map(nodeId => (
                  <Badge key={nodeId} variant="outline" className="text-xs border-destructive text-destructive">
                    {getNodeLabel(nodeId)}
                  </Badge>
                ))}
              </div>
            </div>
            <Separator className="bg-border" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cut Edges ({result.minCut.edges.length})</p>
              <p className="text-xs text-destructive font-mono">
                Highlighted in red on graph
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Augmenting Paths */}
      <Card className="bg-card/95 backdrop-blur border-border max-h-64 overflow-hidden">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Route className="w-4 h-4 text-primary" />
            Augmenting Paths ({result.augmentingPaths.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 overflow-y-auto max-h-40 space-y-2">
          {result.augmentingPaths.map((path, index) => (
            <div key={index} className="text-xs bg-secondary/50 rounded p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted-foreground">Path {index + 1}</span>
                <Badge variant="secondary" className="text-xs">
                  +{path.flow}
                </Badge>
              </div>
              <div className="font-mono text-primary">
                {path.path.map(nodeId => getNodeLabel(nodeId)).join(' → ')}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
