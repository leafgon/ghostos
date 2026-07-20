import { Subject } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { createRuntimeEnvelopeFactory } from "./eventEnvelope.js";
import { driveNodeByRuntimePolicy } from "./policyExecution.js";
import { createInMemoryRuntimeSinks } from "./runtimeOptions.js";
import { redactValue } from "./safeLogging.js";
import {
  createDeterministicIdFactory,
  createSideEffectAdapterMigrationHarness,
} from "./sideEffectMigrationHarness.js";

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const createMultiInputWorkflow = ({
  joinPolicy,
  executeAction = vi.fn(({ command, attempt }) => ({
    ok: true,
    attemptId: attempt.attemptId,
    command,
    authorization: "Bearer abc123",
  })),
} = {}) => {
  const graphInstanceId = "multi-input-workflow";
  const eventFactory = createRuntimeEnvelopeFactory({
    graphInstanceId,
    idFactory: createDeterministicIdFactory(),
  });
  const dataInputs = [flow(), flow()];
  const control = controlFlow();
  const metaCtrl$ = new Subject();
  const joinSinks = createInMemoryRuntimeSinks();
  const joinOutputs = [];
  const joinDecisions = [];
  const actionResults = [];
  const pendingActions = [];
  let commandIndex = 0;

  const action = createSideEffectAdapterMigrationHarness({
    adapterName: "multi-input-action",
    runtimeTargetKey: "leafelement:multi-input-action",
    graphInstanceId,
    nodeId: "multi-input-action-node",
    executeSideEffect: executeAction,
    idFactory: createDeterministicIdFactory(),
    eventIdFactory: createDeterministicIdFactory(),
  });

  const join = driveNodeByRuntimePolicy({
    inflowCtrlObj: control,
    dataInflowObjArr: dataInputs,
    metaCtrl$,
    context: {
      nodeId: "join-node",
      runtimeTargetKey: "node:generic-join",
    },
    policy: joinPolicy,
    transformation: {
      leaflogic: (values, _controlValue, runtime) => {
        commandIndex += 1;
        const inputParentEventIds = values.map((value) => value.eventId).filter(Boolean);
        const command = {
          domainCommandId: `join-command-${commandIndex}`,
          payload: {
            laneValues: values.map((value) => value.value),
            laneIds: values.map((value) => value.laneId),
            causeLaneIndex: runtime.event.payload?.laneIndex,
            causeEventId: runtime.event.eventId,
            token: runtime.event.payload?.token,
            authorization: runtime.event.payload?.authorization,
            cookie: runtime.event.payload?.cookie,
          },
          parentEventIds: inputParentEventIds,
          joinEventId: runtime.event.eventId,
        };
        joinOutputs.push(redactValue(command));
        const actionPromise = action
          .sendDataCommand(command, {
            eventId: `action:${runtime.event.eventId}`,
            sourceNodeId: "join-node",
            graphInstanceId,
            parentEventIds: inputParentEventIds,
            trigger: runtime.decision.reason,
            trace: {
              laneIndex: runtime.event.payload?.laneIndex,
            },
          })
          .then((result) => {
            actionResults.push(redactValue(result));
            return result;
          });
        pendingActions.push(actionPromise);
        return command;
      },
    },
    observability: {
      traceSink: joinSinks.traceSink,
    },
  });

  join._control._stream.subscribe((event) => {
    joinDecisions.push(redactValue(event));
  });
  join._stream.subscribe(() => {});

  const flush = async () => Promise.all(pendingActions);

  const sendLane = async (
    laneIndex,
    value,
    { eventId = `lane-${laneIndex}-${value}`, token, authorization, cookie } = {},
  ) => {
    dataInputs[laneIndex]._stream.next(
      eventFactory.data(
        {
          laneIndex,
          laneId: laneIndex === 0 ? "source_a" : "source_b",
          value,
          eventId,
          token,
          authorization,
          cookie,
        },
        {
          eventId,
          sourceNodeId: laneIndex === 0 ? "source-a" : "source-b",
          trigger: "data",
        },
      ),
    );
    await flush();
  };

  const sendControlTick = async ({ eventId = "control-1" } = {}) => {
    control._stream.next(
      eventFactory.control({
        eventId,
        sourceNodeId: "runtime",
        targetNodeId: "join-node",
        intent: "legacy_tick",
      }),
    );
    await flush();
  };

  const sendConfigRefresh = async ({ eventId = "config-1" } = {}) => {
    metaCtrl$.next(
      eventFactory.control({
        eventId,
        sourceNodeId: "runtime",
        targetNodeId: "join-node",
        intent: "refresh_config",
        legacyControlPayload: {
          configVersion: eventId,
        },
      }),
    );
    await flush();
  };

  const snapshot = () =>
    redactValue({
      joinOutputs,
      joinDecisions,
      joinObservability: joinSinks.snapshot(),
      actionResults,
      action: action.snapshot(),
    });

  return {
    action,
    executeAction,
    joinOutputs,
    joinDecisions,
    actionResults,
    sendLane,
    sendControlTick,
    sendConfigRefresh,
    snapshot,
  };
};

describe("generic source_a + source_b -> join -> transform -> action workflow", () => {
  it("waits for fresh all-input sets, suppresses control/config ticks, and preserves parent IDs", async () => {
    const workflow = createMultiInputWorkflow({
      joinPolicy: {
        mode: "policy",
        trigger: "all-inputs",
        join: {
          mode: "all-inputs",
        },
      },
    });

    await workflow.sendLane(0, "a1", {
      eventId: "a1",
      token: "secret-token",
      authorization: "Bearer abc123",
      cookie: "sessionid=abc",
    });
    await workflow.sendControlTick({ eventId: "control-after-a1" });
    await workflow.sendConfigRefresh({ eventId: "config-after-a1" });
    await workflow.sendLane(1, "b1", { eventId: "b1" });
    await workflow.sendLane(0, "a2", { eventId: "a2" });
    await workflow.sendLane(1, "b2", { eventId: "b2" });

    expect(workflow.executeAction).toHaveBeenCalledTimes(2);
    expect(workflow.joinOutputs).toMatchObject([
      {
        payload: {
          laneValues: ["a1", "b1"],
          laneIds: ["source_a", "source_b"],
          causeLaneIndex: 1,
          causeEventId: "b1",
        },
        parentEventIds: ["a1", "b1"],
      },
      {
        payload: {
          laneValues: ["a2", "b2"],
          causeLaneIndex: 1,
          causeEventId: "b2",
        },
        parentEventIds: ["a2", "b2"],
      },
    ]);
    expect(workflow.joinDecisions.map((event) => [event.decision, event.reason])).toEqual([
      ["skip", "waiting_for_all_inputs"],
      ["skip", "waiting_for_all_inputs"],
      ["skip", "waiting_for_all_inputs"],
      ["execute", "all-inputs"],
      ["skip", "waiting_for_all_inputs"],
      ["execute", "all-inputs"],
    ]);
    expect(workflow.actionResults[0].executions[0]).toMatchObject({
      result: {
        outcome: "succeeded",
        eventId: "action:b1",
        attempts: [
          {
            eventId: "action:b1",
          },
        ],
      },
    });
    expect(
      workflow
        .snapshot()
        .joinObservability.traces.filter((event) => event.event === "policy_driver_decision")
        .map((event) => event.laneIndex),
    ).toEqual([0, 0, 0, 1, 0, 1]);
    assertNoSecretLeak(workflow.snapshot());
  });

  it("executes primary-input joins only on the primary lane once required context exists", async () => {
    const workflow = createMultiInputWorkflow({
      joinPolicy: {
        mode: "policy",
        trigger: "primary-input",
        join: {
          mode: "latest-context",
          primaryInputIndex: 0,
          requiredInputIndexes: [1],
        },
      },
    });

    await workflow.sendLane(0, "a-before-context", { eventId: "a-before-context" });
    await workflow.sendLane(1, "b-context-1", { eventId: "b-context-1" });
    await workflow.sendLane(1, "b-context-2", { eventId: "b-context-2" });
    await workflow.sendLane(0, "a-primary-1", { eventId: "a-primary-1" });
    await workflow.sendLane(0, "a-primary-2", { eventId: "a-primary-2" });

    expect(workflow.executeAction).toHaveBeenCalledTimes(2);
    expect(workflow.joinOutputs.map((output) => output.payload.laneValues)).toEqual([
      ["a-primary-1", "b-context-2"],
      ["a-primary-2", "b-context-2"],
    ]);
    expect(workflow.joinDecisions.map((event) => [event.decision, event.reason])).toEqual([
      ["skip", "waiting_for_required_inputs"],
      ["skip", "not_primary_input"],
      ["skip", "not_primary_input"],
      ["execute", "primary-input"],
      ["execute", "primary-input"],
    ]);
    expect(workflow.joinOutputs[0].parentEventIds).toEqual(["a-primary-1", "b-context-2"]);
    expect(workflow.joinOutputs[1].parentEventIds).toEqual(["a-primary-2", "b-context-2"]);
  });

  it("records any-input lane causes and keeps reordered all-input sequences deterministic", async () => {
    const anyInputWorkflow = createMultiInputWorkflow({
      joinPolicy: {
        mode: "policy",
        trigger: "any-input",
        join: {
          mode: "any-input",
        },
      },
    });

    await anyInputWorkflow.sendLane(0, "a", { eventId: "any-a" });
    await anyInputWorkflow.sendLane(1, "b", { eventId: "any-b" });

    expect(anyInputWorkflow.executeAction).toHaveBeenCalledTimes(2);
    expect(
      anyInputWorkflow
        .snapshot()
        .joinObservability.traces.filter(
          (event) => event.event === "policy_driver_decision" && event.actualExecute,
        )
        .map((event) => [event.reason, event.laneIndex]),
    ).toEqual([
      ["any-input", 0],
      ["any-input", 1],
    ]);

    const createAllInputs = () =>
      createMultiInputWorkflow({
        joinPolicy: {
          mode: "policy",
          trigger: "all-inputs",
          join: {
            mode: "all-inputs",
          },
        },
      });
    const leftFirst = createAllInputs();
    await leftFirst.sendLane(0, "a1", { eventId: "left-a1" });
    await leftFirst.sendLane(1, "b1", { eventId: "left-b1" });
    await leftFirst.sendLane(0, "a2", { eventId: "left-a2" });
    await leftFirst.sendLane(1, "b2", { eventId: "left-b2" });

    const rightFirst = createAllInputs();
    await rightFirst.sendLane(1, "b1", { eventId: "right-b1" });
    await rightFirst.sendLane(0, "a1", { eventId: "right-a1" });
    await rightFirst.sendLane(1, "b2", { eventId: "right-b2" });
    await rightFirst.sendLane(0, "a2", { eventId: "right-a2" });

    expect(leftFirst.joinOutputs.map((output) => output.payload.laneValues)).toEqual([
      ["a1", "b1"],
      ["a2", "b2"],
    ]);
    expect(rightFirst.joinOutputs.map((output) => output.payload.laneValues)).toEqual([
      ["a1", "b1"],
      ["a2", "b2"],
    ]);
  });
});
