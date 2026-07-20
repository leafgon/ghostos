import { describe, expect, it, vi } from "vitest";

import {
  REDACTED,
  REDACTED_SIGNED_URL,
  createSafeLogger,
  pickSafeTraceFields,
  redactValue,
} from "./safeLogging.js";

const assertNoSecretLeak = (value) => {
  const serialized = JSON.stringify(value);
  expect(serialized).not.toContain("secret-token");
  expect(serialized).not.toContain("Bearer abc123");
  expect(serialized).not.toContain("sessionid=abc");
  expect(serialized).not.toContain("raw-password");
  expect(serialized).not.toContain("x-amz-signature");
  expect(serialized).not.toContain("signature=deadbeef");
};

describe("runtime safe logging", () => {
  it("recursively redacts sensitive object keys inside objects and arrays", () => {
    const input = {
      eventId: "evt-1",
      nodeId: "node-1",
      nested: [
        {
          token: "secret-token",
          apiKey: "secret-token",
          password: "raw-password",
          privateKey: "-----BEGIN PRIVATE KEY-----secret-token",
        },
      ],
    };

    const redacted = redactValue(input);

    expect(redacted.eventId).toBe("evt-1");
    expect(redacted.nodeId).toBe("node-1");
    expect(redacted.nested[0].token).toBe(REDACTED);
    expect(redacted.nested[0].apiKey).toBe(REDACTED);
    expect(redacted.nested[0].password).toBe(REDACTED);
    expect(redacted.nested[0].privateKey).toBe(REDACTED);
    assertNoSecretLeak(redacted);
  });

  it("redacts sensitive headers and auth schemes", () => {
    const headers = new Headers({
      Authorization: "Bearer abc123",
      Cookie: "sessionid=abc",
      "Set-Cookie": "sessionid=abc",
      "X-CSRF-Token": "secret-token",
      "X-Request-ID": "req-1",
    });

    const redacted = redactValue({
      headers,
      fallback: "Bearer abc123",
    });

    expect(redacted.headers.authorization).toBe(REDACTED);
    expect(redacted.headers.cookie).toBe(REDACTED);
    expect(redacted.headers["set-cookie"]).toBe(REDACTED);
    expect(redacted.headers["x-csrf-token"]).toBe(REDACTED);
    expect(redacted.headers["x-request-id"]).toBe("req-1");
    expect(redacted.fallback).toBe(`Bearer ${REDACTED}`);
    assertNoSecretLeak(redacted);
  });

  it("redacts credential query parameters while preserving correlation fields", () => {
    const redacted = redactValue(
      "https://example.test/callback?access_token=secret-token&correlationId=corr-1&retryCount=2",
    );

    expect(redacted).toContain("access_token=%5Bredacted%5D");
    expect(redacted).toContain("correlationId=corr-1");
    expect(redacted).toContain("retryCount=2");
    expect(redacted).not.toContain("secret-token");
  });

  it("redacts full signed URL query strings", () => {
    const redacted = redactValue(
      "https://assets.example.test/file.txt?X-Amz-Credential=cred&X-Amz-Signature=deadbeef&eventId=evt-1",
    );

    expect(redacted).toBe(`https://assets.example.test/file.txt?${REDACTED_SIGNED_URL}`);
    expect(redacted).not.toContain("deadbeef");
    expect(redacted).not.toContain("eventId=evt-1");
  });

  it("redacts response-like objects and thrown errors", () => {
    const error = new Error("request failed for https://example.test/a?token=secret-token");
    error.status = 401;
    error.response = {
      status: 401,
      headers: {
        authorization: "Bearer abc123",
        "x-request-id": "req-1",
      },
      data: {
        access_token: "secret-token",
        statusCode: 401,
      },
    };
    error.config = {
      url: "https://example.test/a?signature=deadbeef",
      headers: {
        cookie: "sessionid=abc",
      },
    };

    const redacted = redactValue(error);

    expect(redacted.name).toBe("Error");
    expect(redacted.status).toBe(401);
    expect(redacted.response.status).toBe(401);
    expect(redacted.response.headers.authorization).toBe(REDACTED);
    expect(redacted.response.headers["x-request-id"]).toBe("req-1");
    expect(redacted.response.data.access_token).toBe(REDACTED);
    expect(redacted.response.data.statusCode).toBe(401);
    assertNoSecretLeak(redacted);
  });

  it("preserves safe trace correlation fields and drops raw payload fields", () => {
    const trace = pickSafeTraceFields({
      eventId: "evt-1",
      nodeId: "node-1",
      statusCode: 202,
      retryCount: 3,
      attemptId: "attempt-1",
      hashPrefix: "abc12345",
      payload: { token: "secret-token" },
      headers: { authorization: "Bearer abc123" },
    });

    expect(trace).toEqual({
      eventId: "evt-1",
      nodeId: "node-1",
      statusCode: 202,
      retryCount: 3,
      attemptId: "attempt-1",
      hashPrefix: "abc12345",
    });
    assertNoSecretLeak(trace);
  });

  it("emits only redacted values through the safe logger", () => {
    const sink = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };
    const logger = createSafeLogger({ component: "test", enabled: true, sink });

    logger.info("request", {
      authorization: "Bearer abc123",
      cookie: "sessionid=abc",
      url: "https://example.test/a?access_token=secret-token&eventId=evt-1",
    });

    expect(sink.info).toHaveBeenCalledTimes(1);
    const serialized = JSON.stringify(sink.info.mock.calls);
    expect(serialized).toContain("evt-1");
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("Bearer abc123");
    expect(serialized).not.toContain("sessionid=abc");
  });

  it("is a no-op when logging is disabled", () => {
    const sink = { info: vi.fn() };
    const logger = createSafeLogger({ enabled: false, sink });

    logger.info({ token: "secret-token" });

    expect(sink.info).not.toHaveBeenCalled();
  });
});
