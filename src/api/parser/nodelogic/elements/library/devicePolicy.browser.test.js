import { describe, expect, it, vi } from "vitest";
import { Subject } from "rxjs";

import {
  createControlEnvelope,
  createRuntimeEnvelopeFactory,
  unwrapRuntimeEnvelope,
} from "../../../runtime/eventEnvelope.js";
import { resolveLeafElementRuntimeClassification } from "../../../runtime/nodeClassification.js";
import { createInMemoryRuntimeSinks } from "../../../runtime/runtimeOptions.js";
import { createDeterministicIdFactory } from "../../../runtime/sideEffectMigrationHarness.js";
import {
  DeviceAdapterPolicyError,
  applyDeviceLifecycleControl,
  createBrowserLocalCommandGuard,
  driveDeviceCommandByRuntimePolicy,
  executeDeviceCommand,
  normalizeDeviceSourceRecord,
  resolveDeviceAdapterPolicy,
} from "./devicePolicy.js";

const flow = () => ({ _stream: new Subject() });

const controlFlow = () => ({ _stream: new Subject(), _config: {} });

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
};

describe("device media adapter policies", () => {
  it("classifies media input, MIDI, and sound lifecycle/source/command semantics", () => {
    expect(resolveLeafElementRuntimeClassification("mediainput")).toMatchObject({
      trigger: "control",
      device: {
        lifecycleTrigger: "control",
        lifecycleIntents: ["start", "stop", "pause", "resume"],
        sourceRecords: {
          emitsDataEvents: true,
          identity: "browser-best-effort",
        },
      },
    });
    expect(resolveLeafElementRuntimeClassification("midi")).toMatchObject({
      trigger: "control",
      device: {
        sourceRecords: {
          emitsDataEvents: true,
          identity: "device-message-id-or-sequence",
        },
        outboundCommands: {
          trigger: "data",
          commandIdentityRequired: true,
          duplicateSuppression: "browser-local",
        },
      },
    });
    expect(resolveLeafElementRuntimeClassification("sound")).toMatchObject({
      trigger: "data",
      device: {
        outboundCommands: {
          trigger: "data",
          commandIdentityRequired: true,
        },
        browserLocalIdempotency: "best-effort-session",
      },
    });
    expect(resolveDeviceAdapterPolicy("midi")).toMatchObject({
      runtimeTargetKey: "leafelement:midi",
      commandCapability: "sendMidi",
    });
  });

  it("applies typed lifecycle controls through fake hosts and rejects unsupported capabilities", () => {
    const sinks = createInMemoryRuntimeSinks();
    const mediaHost = {
      start: vi.fn(() => ({ streamId: "camera-1", token: "secret-token" })),
      stop: vi.fn(() => ({ closed: true })),
      pause: vi.fn(),
      resume: vi.fn(),
    };
    const start = createControlEnvelope({
      eventId: "media-start",
      graphInstanceId: "device-policy",
      sourceNodeId: "runtime",
      intent: "start",
    });

    expect(
      applyDeviceLifecycleControl({
        adapterName: "mediainput",
        host: mediaHost,
        control: start,
        traceSink: sinks.traceSink,
      }),
    ).toMatchObject({
      adapterName: "mediainput",
      intent: "start",
      status: "applied",
    });
    expect(mediaHost.start).toHaveBeenCalledTimes(1);
    expect(() =>
      applyDeviceLifecycleControl({
        adapterName: "midi",
        host: {},
        control: createControlEnvelope({
          eventId: "midi-start",
          graphInstanceId: "device-policy",
          sourceNodeId: "runtime",
          intent: "start",
        }),
      }),
    ).toThrow(DeviceAdapterPolicyError);
    assertNoSecretLeak(sinks.snapshot());
  });

  it("normalizes source records as data envelopes with stable source identity", () => {
    const midiRecord = normalizeDeviceSourceRecord({
      adapterName: "midi",
      record: {
        messageId: "device-1:note-1",
        payload: {
          noteNumber: 64,
          velocity: 100,
        },
      },
      graphInstanceId: "device-policy",
      sourceNodeId: "midi-device-1",
      sequence: 7,
      parentEventIds: ["lifecycle-start"],
    });

    expect(midiRecord).toMatchObject({
      eventId: "midi:device-1:note-1",
      eventKind: "data",
      sourceNodeId: "midi-device-1",
      graphInstanceId: "device-policy",
      sequence: 7,
      payload: {
        adapterName: "midi",
        sourceIdentity: "device-message-id-or-sequence",
        recordId: "device-1:note-1",
        payload: {
          noteNumber: 64,
          velocity: 100,
        },
      },
      trace: {
        parentEventIds: ["lifecycle-start"],
        trigger: "data",
      },
    });
  });

  it("executes outbound commands from data events and suppresses control/config replay", () => {
    const graphInstanceId = "device-command-policy";
    const eventFactory = createRuntimeEnvelopeFactory({
      graphInstanceId,
      idFactory: createDeterministicIdFactory(),
    });
    const dataInput = flow();
    const control = controlFlow();
    const metaCtrl$ = new Subject();
    const sinks = createInMemoryRuntimeSinks();
    const host = {
      executeSoundCommand: vi.fn((command) => ({
        ok: true,
        commandId: command.commandId,
        authorization: "Bearer abc123",
      })),
    };
    const outputs = [];
    const driver = driveDeviceCommandByRuntimePolicy({
      adapterName: "sound",
      host,
      inflowCtrlObj: control,
      dataInflowObjArr: [dataInput],
      metaCtrl$,
      context: {
        nodeId: "sound-node",
        runtimeTargetKey: "leafelement:sound",
      },
      observability: {
        traceSink: sinks.traceSink,
      },
    });
    driver._stream.subscribe((event) => outputs.push(event));

    dataInput._stream.next(
      eventFactory.data(
        {
          commandId: "play-1",
          action: "play",
          token: "secret-token",
        },
        { eventId: "sound-command-1", sourceNodeId: "sound-source" },
      ),
    );
    control._stream.next(
      eventFactory.control({
        eventId: "sound-control",
        sourceNodeId: "runtime",
        targetNodeId: "sound-node",
        intent: "legacy_tick",
      }),
    );
    metaCtrl$.next(
      eventFactory.control({
        eventId: "sound-config",
        sourceNodeId: "runtime",
        targetNodeId: "sound-node",
        intent: "refresh_config",
      }),
    );
    dataInput._stream.next(
      eventFactory.data(
        {
          commandId: "play-1",
          action: "play",
        },
        { eventId: "sound-command-duplicate", sourceNodeId: "sound-source" },
      ),
    );

    expect(host.executeSoundCommand).toHaveBeenCalledTimes(1);
    expect(outputs.map((event) => unwrapRuntimeEnvelope(event))).toMatchObject([
      {
        adapterName: "sound",
        commandId: "play-1",
        status: "executed",
      },
      {
        adapterName: "sound",
        commandId: "play-1",
        status: "duplicate_suppressed",
      },
    ]);
    expect(outputs[0].trace.parentEventIds).toEqual(["sound-command-1"]);
    expect(
      sinks
        .snapshot()
        .traces.filter((event) => event.event === "policy_driver_decision")
        .map((event) => [event.decision, event.reason, event.eventKind]),
    ).toEqual([
      ["execute", "data", "data"],
      ["skip", "not_meaningful_data", "control"],
      ["skip", "not_meaningful_data", "control"],
      ["execute", "data", "data"],
    ]);
    assertNoSecretLeak(sinks.snapshot());
  });

  it("requires command identity and host capabilities for device side effects", () => {
    const commandGuard = createBrowserLocalCommandGuard();
    const midiHost = {
      sendMidi: vi.fn((command) => ({ sent: command.bytes.length })),
    };

    expect(
      executeDeviceCommand({
        adapterName: "midi",
        command: { commandId: "midi-1", bytes: [144, 64, 100] },
        host: midiHost,
        commandGuard,
      }),
    ).toMatchObject({
      adapterName: "midi",
      commandId: "midi-1",
      status: "executed",
    });
    expect(
      executeDeviceCommand({
        adapterName: "midi",
        command: { commandId: "midi-1", bytes: [144, 64, 100] },
        host: midiHost,
        commandGuard,
      }),
    ).toMatchObject({
      status: "duplicate_suppressed",
    });
    expect(midiHost.sendMidi).toHaveBeenCalledTimes(1);
    expect(() =>
      executeDeviceCommand({
        adapterName: "midi",
        command: { bytes: [144, 64, 100] },
        host: midiHost,
      }),
    ).toThrow(DeviceAdapterPolicyError);
    expect(() =>
      executeDeviceCommand({
        adapterName: "sound",
        command: { commandId: "sound-missing-capability" },
        host: {},
      }),
    ).toThrow(DeviceAdapterPolicyError);
  });
});
