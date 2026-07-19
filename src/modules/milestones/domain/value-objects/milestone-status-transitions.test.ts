import { describe, it, expect } from "vitest";
import { MilestoneStatusTransitions } from "./milestone-status.js";
import { MilestoneStatus } from "./milestone-status.js";

describe("MilestoneStatusTransitions", () => {
  it("allows open -> closed (the only forward transition per spec)", () => {
    const from = new MilestoneStatus("open");
    const to = new MilestoneStatus("closed");
    expect(() => MilestoneStatusTransitions.assertCanTransition(from, to)).not.toThrow();
  });

  it("allows closed -> archived (soft delete via status)", () => {
    const from = new MilestoneStatus("closed");
    const to = new MilestoneStatus("archived");
    expect(() => MilestoneStatusTransitions.assertCanTransition(from, to)).not.toThrow();
  });

  it("allows open -> archived (archive from open is also permitted)", () => {
    // Reachable via the soft-delete endpoint regardless of whether the
    // milestone has been closed first. Archive is treated as a separate
    // one-way state, never re-openable.
    const from = new MilestoneStatus("open");
    const to = new MilestoneStatus("archived");
    expect(() => MilestoneStatusTransitions.assertCanTransition(from, to)).not.toThrow();
  });

  it("allows closed -> closed (no-op status update is a 200)", () => {
    const from = new MilestoneStatus("closed");
    const to = new MilestoneStatus("closed");
    expect(() => MilestoneStatusTransitions.assertCanTransition(from, to)).not.toThrow();
  });

  it("allows open -> open (no-op status update is a 200)", () => {
    const from = new MilestoneStatus("open");
    const to = new MilestoneStatus("open");
    expect(() => MilestoneStatusTransitions.assertCanTransition(from, to)).not.toThrow();
  });

  it("rejects closed -> open (no reopen — out of scope per spec)", () => {
    const from = new MilestoneStatus("closed");
    const to = new MilestoneStatus("open");
    expect(() => MilestoneStatusTransitions.assertCanTransition(from, to)).toThrow(
      /Cannot reopen/i,
    );
  });

  it("rejects archived -> open (archived is terminal)", () => {
    const from = new MilestoneStatus("archived");
    const to = new MilestoneStatus("open");
    expect(() => MilestoneStatusTransitions.assertCanTransition(from, to)).toThrow(
      /archived is terminal|Cannot reopen/i,
    );
  });

  it("rejects archived -> closed (archived is terminal)", () => {
    const from = new MilestoneStatus("archived");
    const to = new MilestoneStatus("closed");
    expect(() =>
      MilestoneStatusTransitions.assertCanTransition(from, to),
    ).toThrow(/archived is terminal/i);
  });

  it("rejects closed -> archived when target status is already archived (no-op is fine here)", () => {
    // Repeated archive is allowed — the controller treats it as idempotent.
    const from = new MilestoneStatus("archived");
    const to = new MilestoneStatus("archived");
    expect(() => MilestoneStatusTransitions.assertCanTransition(from, to)).not.toThrow();
  });
});