function parseMapData(data) {
    const lines = data.trim().split('\n');
    const [vCount] = lines[0].split(/\s+/).map(Number);
    const vertices = [];
    const graph = {};
    const vertexMap = new Map();

    // Process vertices in chunks to prevent UI freeze
    const vertexChunkSize = 5000;
    for (let i = 1; i <= vCount; i += vertexChunkSize) {
        const chunkEnd = Math.min(i + vertexChunkSize, vCount + 1);
        for (let j = i; j < chunkEnd; j++) {
            const [id, x, y] = lines[j].trim().split(/\s+/).map(Number);
            vertices.push({ id, x, y: -y });
            vertexMap.set(id, { x, y: -y });
            graph[id] = [];
        }
        // Send progress updates
        // eslint-disable-next-line no-restricted-globals
        self.postMessage({
            type: 'progress',
            progress: Math.floor((chunkEnd / vCount) * 50) // 50% for vertices
        });
    }

    // Process edges in chunks
    const edgeChunkSize = 10000;
    for (let i = vCount + 1; i < lines.length; i += edgeChunkSize) {
        const chunkEnd = Math.min(i + edgeChunkSize, lines.length);
        for (let j = i; j < chunkEnd; j++) {
            const [from, to] = lines[j].trim().split(/\s+/).map(Number);
            const fromVertex = vertexMap.get(from);
            const toVertex = vertexMap.get(to);
            if (fromVertex && toVertex) {
                const weight = Math.hypot(fromVertex.x - toVertex.x, fromVertex.y - toVertex.y);
                graph[from].push({ to, weight });
                graph[to].push({ to: from, weight });
            }
        }
        // Send progress updates
        // eslint-disable-next-line no-restricted-globals
        self.postMessage({
            type: 'progress',
            progress: 50 + Math.floor(((chunkEnd - vCount) / (lines.length - vCount)) * 50)
        });
    }

    return { vertices, graph };
}

// eslint-disable-next-line no-restricted-globals
self.onmessage = async (e) => {
    if (e.data.action === 'loadMapData') {
        try {
            const response = await fetch('/usa.txt');
            if (!response.ok) throw new Error('Failed to load map data');
            const text = await response.text();
            const { vertices, graph } = parseMapData(text);
            // eslint-disable-next-line no-restricted-globals
            self.postMessage({ type: 'complete', vertices, graph });
        } catch (err) {
            // eslint-disable-next-line no-restricted-globals
            self.postMessage({ type: 'error', error: err.message });
        }
    }
};