/*
 * The reference js implementation of the LEAF language specification, codenamed breezyforest
 * This library is a part of the reference js implementation of ghostos
 * to define various common methods that can be programmatically envokable
 * at runtime with respect to each leaf node.
 *
 * author: spark@leautomaton.com
 * date: 8 Jan 2023
 *
 * copyright: LE Automaton Ltd
 *
 *
 */

const _common_methods =
  (lambdactrl) =>
  async ({ refnode, refnodedata, nodelambda, contextuallambda } = {}) => {
    return {
      version: "breezyforest",
      nodequery: (flowinput$obj) => {
        return flowinput$obj;
      },
      nodemethod: (flowinput$obj) => {
        return {};
      },
    };
  };

export { _common_methods };
