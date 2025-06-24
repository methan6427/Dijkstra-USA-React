import React, { useState } from 'react';
import Card from './components/ui/card';
import Button from './components/ui/button';
import Input from './components/ui/input';
import Label from './components/ui/label';
import './App.css';

function DijkstraMapApp() {
  const [graph, setGraph] = useState({});
  const [vertices, setVertices] = useState([]);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [shortestPath, setShortestPath] = useState([]);
  const [distances, setDistances] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        parseMapData(e.target.result);
        setFileLoaded(true);
      } catch (err) {
        setError('Error parsing file');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const parseMapData = (data) => {
    try {
      const lines = data.trim().split('\n');
      const [vCount] = lines[0].split(/\s+/).map(Number);
      const v = [];
      const g = {};

      for (let i = 1; i <= vCount; i++) {
        const [id, x, y] = lines[i].trim().split(/\s+/).map(Number);
        v.push({ id, x, y });
        g[id] = [];
      }

      for (let i = vCount + 1; i < lines.length; i++) {
        const [from, to] = lines[i].trim().split(/\s+/).map(Number);
        const fromVertex = v.find((vertex) => vertex.id === from);
        const toVertex = v.find((vertex) => vertex.id === to);

        if (fromVertex && toVertex) {
          const weight = Math.sqrt(
              Math.pow(fromVertex.x - toVertex.x, 2) +
              Math.pow(fromVertex.y - toVertex.y, 2)
          );
          g[from].push({ to, weight });
          g[to].push({ to: from, weight });
        }
      }

      setVertices(v);
      setGraph(g);
      setSource(v[0]?.id || '');
      setTarget(v[1]?.id || '');
    } catch (err) {
      throw new Error('Error parsing map data');
    }
  };

  const validateInput = (vertexId) => {
    return graph.hasOwnProperty(vertexId);
  };

  const findShortestPath = () => {
    if (!validateInput(source) || !validateInput(target)) {
      setError(`Invalid vertices. Valid range: ${vertices[0]?.id} to ${vertices[vertices.length-1]?.id}`);
      return;
    }

    setIsCalculating(true);
    setError(null);

    setTimeout(() => {
      try {
        const dist = {};
        const prev = {};
        const pq = new Set(Object.keys(graph).map(Number));

        Object.keys(graph).forEach((v) => (dist[v] = Infinity));
        dist[source] = 0;

        while (pq.size > 0) {
          const u = [...pq].reduce((min, v) => (dist[v] < dist[min] ? v : min), [...pq][0]);
          pq.delete(Number(u));
          if (Number(u) === Number(target)) break;

          for (let { to, weight } of graph[u]) {
            const alt = dist[u] + weight;
            if (alt < dist[to]) {
              dist[to] = alt;
              prev[to] = u;
            }
          }
        }

        const path = [];
        let current = target;
        while (current !== undefined) {
          path.unshift(Number(current));
          current = prev[current];
        }

        setShortestPath(path);
        setDistances(dist);
      } catch (err) {
        setError('Error calculating path');
      } finally {
        setIsCalculating(false);
      }
    }, 0);
  };

  return (
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Dijkstra's Algorithm Path Finder</h1>

        {!fileLoaded ? (
            <Card className="p-6 mb-6 text-center">
              <input
                  type="file"
                  id="mapFile"
                  accept=".txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
              />
              <Button
                  onClick={() => document.getElementById('mapFile').click()}
                  disabled={isLoading}
                  className={isLoading ? "opacity-50 cursor-not-allowed" : ""}
              >
                {isLoading ? "Loading..." : "Load Map Data"}
              </Button>
              {error && <div className="mt-4 text-red-600">{error}</div>}
            </Card>
        ) : (
            <>
              <Card className="p-6 mb-6">
                <div className="grid gap-6">
                  <div>
                    <Label htmlFor="source">Source Vertex ID</Label>
                    <Input
                        id="source"
                        type="number"
                        value={source}
                        onChange={(e) => setSource(Number(e.target.value))}
                        min={vertices[0]?.id}
                        max={vertices[vertices.length-1]?.id}
                    />
                  </div>
                  <div>
                    <Label htmlFor="target">Target Vertex ID</Label>
                    <Input
                        id="target"
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(Number(e.target.value))}
                        min={vertices[0]?.id}
                        max={vertices[vertices.length-1]?.id}
                    />
                  </div>
                  <Button
                      onClick={findShortestPath}
                      disabled={isCalculating}
                  >
                    {isCalculating ? "Calculating..." : "Find Shortest Path"}
                  </Button>
                </div>
              </Card>

              {shortestPath.length > 0 && (
                  <Card className="p-6">
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Results</h2>
                      <div>
                        <h3 className="font-semibold mb-1">Shortest Path</h3>
                        <div className="path-display">
                          {shortestPath.join(" → ")}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Total Distance</h3>
                        <div className="distance-display">
                          {distances[target]?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </Card>
              )}
            </>
        )}

        {error && fileLoaded && (
            <Card className="bg-red-50 border border-red-200 p-4 mt-4">
              <div className="text-red-600">{error}</div>
            </Card>
        )}
      </div>
  );
}

export default DijkstraMapApp;