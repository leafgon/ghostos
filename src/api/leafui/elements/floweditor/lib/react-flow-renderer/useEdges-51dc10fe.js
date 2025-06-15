import { b as useStore } from './index-612ea0fa.js';

var edgesSelector = function edgesSelector(state) {
  return state.edges;
};

function useEdges() {
  var edges = useStore(edgesSelector);
  return edges;
}

export { useEdges as u };
//# sourceMappingURL=useEdges-51dc10fe.js.map
