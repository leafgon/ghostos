// This is extracted from an npm package "graphology-components"
// as the npm package only supports CommonJS, not ESM.
// This copy provides an ESM alternative of the same functionalities, in particular "connectedComponents"

// Minimal isGraph utility (from graphology-utils/is-graph)
function isGraph(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.addUndirectedEdgeWithKey === "function" &&
    typeof value.dropNode === "function" &&
    typeof value.multi === "boolean"
  );
}

// Minimal DFSStack (from graphology-indices/dfs-stack)
class DFSStack {
  constructor(graph) {
    this.graph = graph;
    this.stack = new Array(graph.order);
    this.seen = new Set();
    this.size = 0;
  }
  hasAlreadySeenEverything() {
    return this.seen.size === this.graph.order;
  }
  countUnseenNodes() {
    return this.graph.order - this.seen.size;
  }
  forEachNodeYetUnseen(callback) {
    const seen = this.seen;
    const graph = this.graph;
    graph.someNode(function (node, attr) {
      if (seen.size === graph.order) return true;
      if (seen.has(node)) return false;
      const shouldBreak = callback(node, attr);
      if (shouldBreak) return true;
      return false;
    });
  }
  has(node) {
    return this.seen.has(node);
  }
  push(node) {
    const seenSizeBefore = this.seen.size;
    this.seen.add(node);
    if (seenSizeBefore === this.seen.size) return false;
    this.stack[this.size++] = node;
    return true;
  }
  pop() {
    if (this.size === 0) return;
    return this.stack[--this.size];
  }
}

// The actual connectedComponents function
export function connectedComponents(graph) {
  if (!isGraph(graph))
    throw new Error("connectedComponents: the given graph is not a valid graphology instance.");

  if (!graph.order) return [];

  const stack = new DFSStack(graph);
  const push = stack.push.bind(stack);

  const components = [];

  stack.forEachNodeYetUnseen(function (node) {
    const component = [];
    stack.push(node);
    let source;
    while (stack.size !== 0) {
      source = stack.pop();
      component.push(source);
      graph.forEachNeighbor(source, push);
    }
    components.push(component);
  });

  return components;
}
