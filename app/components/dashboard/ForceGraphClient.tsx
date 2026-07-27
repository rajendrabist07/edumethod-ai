"use client";

import { useEffect, useRef } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";

interface ForceGraphClientProps {
  data: {
    nodes: { id: string; name: string; val: number }[];
    links: { source: string; target: string }[];
  };
}

export default function ForceGraphClient({ data }: ForceGraphClientProps) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  useEffect(() => {
    // Make the graph fit the container nicely on load
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50);
    }
  }, [data]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={data}
      nodeLabel="name"
      nodeColor={(node: any) => {
        // Red = low mastery, yellow = med, green = high
        if (node.val < 50) return "#ef4444";
        if (node.val < 80) return "#eab308";
        return "#22c55e";
      }}
      nodeRelSize={6}
      linkColor={() => "rgba(255,255,255,0.2)"}
      backgroundColor="transparent"
    />
  );
}
