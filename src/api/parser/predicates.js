
// a bunch of component predicates defined

/*
 * @component: is a list of uuids for the nodes comprising the component
 * @leafgraph: an object returned by reconstructLEAFGraph() in leaf.js, structured in the following format,
 *  providing information just enough to parse any LEAF logical constructs in the given leaf graph:
 * {
 *  graph: {lambda: lambdagraph, dataflow: dataflowgraph}, 
 *  spelldefs: spelldefnodes, 
 *  edges: {
 *      data: {sources: datasources, targets: datatargets}, 
 *      lambda: {sources: lambdasources, targets: lambdatargets, sourcelut: lambdasourcelut}, 
 *      anchor: {targets: anchortargets}
 *  }
 * }
 * Some examples of logical analysis done by this predicate module: 
 * a LEAF component is a runtime LEAF component if none of its nodes is part of lambdasources.
 * a LEAF component is a lambda LEAF component if any of its nodes is part of lambdasources.
 * a LEAF component is an anchored LEAF component if any of its nodes is part of anchortargets.
 */
const isAnchoredComponent = (component, leafgraph) => {
    return component.some((nodeuuid) => {
        const isanchored = leafgraph.edges.anchor.targets.has(nodeuuid);
        if (!isanchored) {
            const leafnode = leafgraph.graph.lambda.getNodeAttributes(nodeuuid).leafnode;
            const isanchornode = 'leafanchor' === leafnode.data.leaf.logic.type;
            return isanchornode;
        }
        return isanchored;
    });
};
const isRuntimeComponent = (component, leafgraph) => {
    return (
        component.every((nodeuuid) => { // all nodes in the component not be a lambda source
            return (!leafgraph.edges.lambda.sources.has(nodeuuid));
        }) && 
        component.every((nodeuuid) => { // all nodes in the component either a dataflow source or a dataflow target
            return (leafgraph.edges.data.sources.has(nodeuuid) || leafgraph.edges.data.targets.has(nodeuuid));
        })
    );
};
const traceUpstreamAnchor = (nodeuuid) => {

}

const isLambdaComponent = (component, leafgraph) => {
    // [1, 2, 3].some(function(el) {
//console.log(el);
//  return el === 2;
//});
    return component.some((nodeuuid) => {
        if (nodeuuid.slice(0,4) === '36cd')
            console.log(nodeuuid);
        return leafgraph.edges.lambda.sources.has(nodeuuid);
    });
};

/*
    * a graph (component) g_c is defined to be lambda-plane-scoped with respect to a lambda target,
    * if it is a lambda component and its single member node, that is a source of a lambda edge, 
    * is NOT connected to any dataflow ports within g_c.
    */
const isLambdaPlaneScoped = (component, leafgraph) => {
    return ((component.length === 1) && component.every((nodeuuid) => {
        const leafnode = leafgraph.graph.lambda.getNodeAttributes(nodeuuid).leafnode;
        return (!['leafinflowport', 'leafoutflowport'].includes(leafnode.data.leaf.logic.type));
    }));
};

/*
    * a graph (component) g_c is defined to be dataflow-plane-scoped with respect to a lambda target,
    * if it is a lambda component and at least one of its member nodes, that is a source of a lambda edge
    * to the target, is connected to either leafinflowport or leafoutflowport via dataflow edges within the 
    * lambda graph component of interest (g_c).
    */
const isDataflowPlaneScoped = (component, leafgraph) => {
    return (component.length > 1);
    //return component.some((nodeuuid) => {
    //    const leafnode = leafgraph.graph.lambda.getNodeAttributes(nodeuuid).leafnode;
    //    return (['leafinflowport', 'leafoutflowport'].includes(leafnode.data.leaf.logic.type));
    //});
}

/*
    * true if any member node is of type 'leaflambdagraph'
    */
const hasLambdaGraphNode = (component, leafgraph) => {

}

const isSpellDefComponent = (component , leafgraph) => {
    const spelldefnode = component.filter(nodeuuid => {
        const leafnode = leafgraph.graph.lambda.getNodeAttributes(nodeuuid).leafnode;
        return (leafnode.data.leaf.logic.type === 'leafspelldef')
    });

    //const thespadeuuid = leafgraph.thespade.uuid;
    //return (leafnode.data.leaf.logic.type === 'leafspellnode' && leafgraph.graph.lambda.neighbors(leafnode.uuid).includes(thespadeuuid));
    return spelldefnode.length > 0;
};

const isLEAFConfigComponent = (component , leafgraph) => {
    const leafconfignode = component.filter(nodeuuid => {
        const leafnode = leafgraph.graph.lambda.getNodeAttributes(nodeuuid).leafnode;
        return (leafnode.data.leaf.logic.type === 'leafconfig')
    });

    //const thespadeuuid = leafgraph.thespade.uuid;
    //return (leafnode.data.leaf.logic.type === 'leafspellnode' && leafgraph.graph.lambda.neighbors(leafnode.uuid).includes(thespadeuuid));
    return leafconfignode.length > 0;
};

// spark_dev_note: isBottle should check if _data is a bottle, not a crate.
// a bottle is an object, with a specific set of data entries including _value, _label
const isBottle = (_data) => (typeof _data === 'object' && !Array.isArray(_data) && _data !== null && '_bname' in _data); // _bname can be ''
const isCrate = (_data) => (typeof _data === 'object' && !Array.isArray(_data) && _data !== null && '_crate' in _data); // _cmeta is optional

const isEmptyBottle = (_data) => (isBottle(_data) && ((_data._bname === "empty_bottle" && _data._content === "empty_data") || _data._content === undefined)); // _bname can be ''
const isErrorBottle = (_data) => (isBottle(_data) && _data._bname === "error"); // _bname can be ''


// as per https://www.geeksforgeeks.org/how-to-check-if-the-value-is-primitive-or-not-in-javascript/
const isPrimitiveType = (val) => {
    if(val === Object(val)){
      console.log(false)
    }else{
      console.log(true)
    }
};

const isPositiveWholeNumberStr = (value) => {
    return /^\d+$/.test(value);
}

const isWholeNumberStr = (value) => {
    return /^-?\d+$/.test(value);
}

export { isSpellDefComponent, isLEAFConfigComponent, hasLambdaGraphNode, isDataflowPlaneScoped, isLambdaPlaneScoped, isLambdaComponent, isRuntimeComponent, isAnchoredComponent, isBottle, isEmptyBottle, isErrorBottle, isCrate, isPrimitiveType, isPositiveWholeNumberStr, isWholeNumberStr };