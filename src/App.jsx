import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

class OptimizedMinHeap {
  constructor() {
    this.heap = [];
    this.nodePositions = new Map();
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  insert(node, distance) {
    this.heap.push({ node, distance });
    this.nodePositions.set(node, this.heap.length - 1);
    this.bubbleUp(this.heap.length - 1);
  }

  extractMin() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.nodePositions.set(last.node, 0);
      this.sinkDown(0);
    }
    this.nodePositions.delete(min.node);
    return min.node;
  }

  decreaseKey(node, newDistance) {
    const index = this.nodePositions.get(node);
    if (index === undefined || this.heap[index].distance <= newDistance) return;
    this.heap[index].distance = newDistance;
    this.bubbleUp(index);
  }

  bubbleUp(index) {
    const node = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (node.distance >= parent.distance) break;
      this.heap[parentIndex] = node;
      this.heap[index] = parent;
      this.nodePositions.set(node.node, parentIndex);
      this.nodePositions.set(parent.node, index);
      index = parentIndex;
    }
  }

  sinkDown(index) {
    const length = this.heap.length;
    const node = this.heap[index];
    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let swapIndex = null;
      let leftChild, rightChild;

      if (leftChildIndex < length) {
        leftChild = this.heap[leftChildIndex];
        if (leftChild.distance < node.distance) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        rightChild = this.heap[rightChildIndex];
        if (
            (swapIndex === null && rightChild.distance < node.distance) ||
            (swapIndex !== null && rightChild.distance < leftChild.distance)
        ) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;
      this.heap[index] = this.heap[swapIndex];
      this.heap[swapIndex] = node;
      this.nodePositions.set(node.node, swapIndex);
      this.nodePositions.set(this.heap[index].node, index);
      index = swapIndex;
    }
  }
}

function DijkstraMapApp() {
  const [graph, setGraph] = useState({});
  const [vertices, setVertices] = useState([]);
  const [source, setSource] = useState(null);
  const [target, setTarget] = useState(null);
  const [shortestPath, setShortestPath] = useState([]);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewConfig, setViewConfig] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

  const mapBounds = useMemo(() => {
    if (vertices.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const v of vertices) {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
    }
    return {
      minX, maxX, minY, maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [vertices]);

  useEffect(() => {
    if (mapBounds) {
      const baseScale = Math.min(800 / mapBounds.width, 600 / mapBounds.height) * 0.9;
      const fineTunedScale = baseScale * 1.2 * 1.2; // simulate two zoom-ins
      const fineTunedOffsetX = -mapBounds.centerX * fineTunedScale + 400 - 50; // simulate one left pan
      const fineTunedOffsetY = mapBounds.centerY * fineTunedScale + 700;
      setViewConfig({
        scale: fineTunedScale,
        offsetX: fineTunedOffsetX,
        offsetY: fineTunedOffsetY
      });
    }
  }, [mapBounds]);

  const vertexOptions = useMemo(() => {
    return vertices.map(v => (
        <option key={v.id} value={v.id}>
          {v.id} ({v.x.toFixed(0)}, {v.y.toFixed(0)})
        </option>
    ));
  }, [vertices]);

  const findShortestPath = useCallback(() => {
    if (!source || !target || source === target) {
      setError(source === target ? 'Source and target must be different' : 'Invalid source or target');
      return;
    }

    setIsCalculating(true);
    setError(null);

    setTimeout(() => {
      const dist = {};
      const prev = {};
      const heap = new OptimizedMinHeap();
      dist[source] = 0;
      heap.insert(source, 0);
      for (const vertex of vertices) {
        if (vertex.id !== source) dist[vertex.id] = Infinity;
      }

      while (!heap.isEmpty()) {
        const u = heap.extractMin();
        if (u === target) break;
        const edges = graph[u] || [];
        for (let i = 0; i < edges.length; i++) {
          const { to, weight } = edges[i];
          const alt = dist[u] + weight;
          if (alt < dist[to]) {
            dist[to] = alt;
            prev[to] = u;
            if (heap.nodePositions.has(to)) {
              heap.decreaseKey(to, alt);
            } else {
              heap.insert(to, alt);
            }
          }
        }
      }

      const path = [];
      let current = target;
      while (current !== undefined && current !== null) {
        path.unshift(current);
        current = prev[current];
      }

      setShortestPath(path);
      setDistance(dist[target] ?? null);
      setIsCalculating(false);
    }, 0);
  }, [graph, source, target, vertices]);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/usa.txt`);
        if (!response.ok) throw new Error('Failed to load map data');
        const text = await response.text();
        const lines = text.trim().split('\n');
        const [vCount] = lines[0].split(/\s+/).map(Number);

        const v = [];
        const g = {};
        const vertexMap = new Map();

        for (let i = 1; i <= vCount; i++) {
          const [id, x, y] = lines[i].trim().split(/\s+/).map(Number);
          v.push({ id, x, y: -y });
          vertexMap.set(id, { x, y: -y });
          g[id] = [];
          if (i % 1000 === 0) await new Promise(resolve => setTimeout(resolve, 0));
        }

        for (let i = vCount + 1; i < lines.length; i++) {
          const [from, to] = lines[i].trim().split(/\s+/).map(Number);
          const fromVertex = vertexMap.get(from);
          const toVertex = vertexMap.get(to);
          if (fromVertex && toVertex) {
            const weight = Math.hypot(fromVertex.x - toVertex.x, fromVertex.y - toVertex.y);
            g[from].push({ to, weight });
            g[to].push({ to: from, weight });
          }
        }

        setVertices(v);
        setGraph(g);
        if (v.length > 1) {
          setSource(v[0].id);
          setTarget(v[Math.floor(v.length / 2)].id);
        }
      } catch (err) {
        setError('Error loading map data: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  const handleVertexClick = (id) => {
    if (!source) setSource(id);
    else if (!target && id !== source) setTarget(id);
    else {
      setSource(id);
      setTarget(null);
    }
    setShortestPath([]);
    setDistance(null);
  };

  const handleSourceChange = (e) => {
    setSource(Number(e.target.value));
    setShortestPath([]);
    setDistance(null);
  };

  const handleTargetChange = (e) => {
    setTarget(Number(e.target.value));
    setShortestPath([]);
    setDistance(null);
  };

  const renderVertices = useMemo(() => {
    return vertices.map((v) => {
      const x = v.x * viewConfig.scale + viewConfig.offsetX;
      const y = v.y * viewConfig.scale + viewConfig.offsetY;
      const isSource = v.id === source;
      const isTarget = v.id === target;
      const isInPath = shortestPath.includes(v.id);

      let fill, radius;
      if (isSource) {
        fill = '#10b981';
        radius = 6;
      } else if (isTarget) {
        fill = '#ef4444';
        radius = 6;
      } else if (isInPath) {
        fill = '#f59e0b';
        radius = 4;
      } else {
        fill = '#3b82f6';
        radius = viewConfig.scale > 0.5 ? 2 : 1;
      }

      return (
          <circle
              key={`v-${v.id}`}
              cx={x}
              cy={y}
              r={radius}
              fill={fill}
              onClick={() => handleVertexClick(v.id)}
              style={{ cursor: 'pointer' }}
          />
      );
    });
  }, [vertices, source, target, shortestPath, viewConfig]);

  const renderPath = useMemo(() => {
    if (shortestPath.length < 2) return null;
    return shortestPath.slice(0, -1).map((id, i) => {
      const from = vertices.find(v => v.id === id);
      const to = vertices.find(v => v.id === shortestPath[i + 1]);
      if (!from || !to) return null;
      return (
          <line
              key={`path-${i}`}
              x1={from.x * viewConfig.scale + viewConfig.offsetX}
              y1={from.y * viewConfig.scale + viewConfig.offsetY}
              x2={to.x * viewConfig.scale + viewConfig.offsetX}
              y2={to.y * viewConfig.scale + viewConfig.offsetY}
              stroke="red"
              strokeWidth={3}
              strokeLinecap="round"
          />
      );
    });
  }, [shortestPath, vertices, viewConfig]);

  if (isLoading) {
    return (
        <div className="loading-screen">
          <div className="loading-content">
            <h2>Loading USA Map Data...</h2>
            <div className="loading-progress">
              <div className="loading-bar"></div>
            </div>
            <p>Processing {vertices.length > 0 ? `${vertices.length} vertices and ` : ''}87,575 vertices & 121,961 edges...</p>
            <p>This may take a moment for the large dataset</p>
          </div>
        </div>
    );
  }

  return (
      <div className="app-container">
        <h1 className="text-xl font-bold mb-4 text-center">Dijkstra's Algorithm Visual Map</h1>

        <div className="card">
          <div className="selection-controls">
            <div className="input-container">
              <label htmlFor="source-select">Source Vertex:</label>
              <select id="source-select" value={source || ''} onChange={handleSourceChange}>
                <option value="">Select source vertex</option>
                {vertexOptions}
              </select>
            </div>

            <div className="input-container">
              <label htmlFor="target-select">Target Vertex:</label>
              <select id="target-select" value={target || ''} onChange={handleTargetChange}>
                <option value="">Select target vertex</option>
                {vertexOptions}
              </select>
            </div>
          </div>

          <div className="selection-info">
            <p><strong>Selected:</strong> {source ? `Source: ${source}` : 'Click a point to select source'}</p>
            <p><strong>Selected:</strong> {target ? `Target: ${target}` : 'Click a point to select target'}</p>
          </div>

          <button
              className="button-85 mt-4"
              onClick={findShortestPath}
              disabled={isCalculating || !source || !target}
          >
            {isCalculating ? 'Calculating...' : 'Find Shortest Path'}
          </button>
        </div>

        <div className="map-container">
          <svg width="100%" height="600" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" style={{ background: '#f8fafc' }}>
            <image href={`${process.env.PUBLIC_URL}/map.svg`} x="-95" y="28" width="960" height="500" opacity="0.3"/>
            {renderVertices}
            {renderPath}
          </svg>
        </div>

        {distance !== null && (
            <div className="card mt-4">
              <h2 className="text-xl font-bold">Results</h2>
              <div className="path-display">
                <strong>Path:</strong> {shortestPath.join(" → ")}
              </div>
              <div className="distance-display">
                <strong>Distance:</strong> {distance.toFixed(2)} units
              </div>
            </div>
        )}

        {error && (
            <div className="card mt-4 error-card">
              <p>{error}</p>
            </div>
        )}
      </div>
  );
}

export default DijkstraMapApp;
