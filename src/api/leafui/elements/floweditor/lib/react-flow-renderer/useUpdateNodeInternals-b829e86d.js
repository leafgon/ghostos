import { useCallback } from 'react';
import { b as useStore } from './index-1cfd0ffe.js';

var selector = function selector(state) {
  return state.updateNodeDimensions;
};

function useUpdateNodeInternals() {
  var updateNodeDimensions = useStore(selector);
  return useCallback(function (id) {
    var nodeElement = document.querySelector(".react-flow__node[data-id=\"".concat(id, "\"]"));

    if (nodeElement) {
      updateNodeDimensions([{
        id: id,
        nodeElement: nodeElement,
        forceUpdate: true
      }]);
    }
  }, []);
}

export { useUpdateNodeInternals as u };
//# sourceMappingURL=useUpdateNodeInternals-b829e86d.js.map
