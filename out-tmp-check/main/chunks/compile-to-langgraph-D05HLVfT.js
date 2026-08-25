"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const langgraph = require("@langchain/langgraph");
const index = require("../index.js");
require("electron");
require("fs");
require("path");
require("@langchain/core/messages");
require("child_process");
require("util");
require("crypto");
require("@langchain/openai");
require("node:async_hooks");
require("@langchain/core/callbacks/base");
require("@langchain/core/tools");
require("playwright");
require("stream/promises");
require("stream");
require("module");
require("langchain");
require("url");
function prepareWorkflowRun(runId, fromStart) {
  return index.__graphApi_prepareWorkflowRun(runId, fromStart);
}
async function executeTopLevelNodeForGraph(sessionId, node, run, statusMap, specs, session, signal) {
  return index.__graphApi_executeTopLevelNode(
    sessionId,
    node,
    run,
    statusMap,
    specs,
    session,
    signal
  );
}
function finalizeWorkflowRun(runId, sessionId, outcome, errorMessage) {
  index.__graphApi_finalizeWorkflowRun(runId, sessionId, outcome, errorMessage);
}
const workflowCheckpointer = new langgraph.MemorySaver();
async function executeWorkflowWithLangGraph(runId, fromStart) {
  const prepared = prepareWorkflowRun(runId, fromStart);
  if (!prepared) return;
  const { workflow, session, run, specs, statusMap, startIndex, signal } = prepared;
  const graph = compileDefinitionToGraph({
    workflow,
    session,
    specs,
    signal
  });
  const config = {
    configurable: { thread_id: runId },
    recursionLimit: Math.max(50, workflow.nodes.length * 4),
    signal
  };
  let input = {
    sessionId: session.id,
    runId: run.id,
    workflowId: workflow.id,
    context: { ...run.context },
    nodeIndex: startIndex,
    statusMap: Object.fromEntries(statusMap),
    messages: []
  };
  try {
    while (true) {
      if (signal.aborted) {
        finalizeWorkflowRun(runId, session.id, "aborted");
        return;
      }
      try {
        const stream = await graph.stream(input, {
          ...config,
          streamMode: "values"
        });
        let needResume = false;
        for await (const chunk of stream) {
          if (signal.aborted) {
            finalizeWorkflowRun(runId, session.id, "aborted");
            return;
          }
          if (langgraph.isInterrupted(chunk)) {
            const reason = extractReasonFromInterrupted(chunk) || "等待用户确认";
            const { queryWorkflowRun, postWorkflowRun } = await Promise.resolve().then(() => require("../index.js")).then((n) => n.workflowRuns);
            const live = queryWorkflowRun(runId);
            if (live) {
              postWorkflowRun({
                ...live,
                status: "awaiting_user",
                updatedAt: Date.now()
              });
            }
            const continueResult = await index.waitForGraphUserContinue(session.id, reason, {
              skipPlaceholder: true
            });
            if (signal.aborted) {
              finalizeWorkflowRun(runId, session.id, "aborted");
              return;
            }
            needResume = true;
            input = new langgraph.Command({ resume: index.queryGraphResumePayload(session.id, continueResult) });
            break;
          }
        }
        if (needResume) {
          continue;
        }
      } catch (e) {
        if (langgraph.isGraphInterrupt(e)) {
          const reason = extractReason(e) || "等待用户确认";
          const { queryWorkflowRun, postWorkflowRun } = await Promise.resolve().then(() => require("../index.js")).then((n) => n.workflowRuns);
          const live = queryWorkflowRun(runId);
          if (live) {
            postWorkflowRun({
              ...live,
              status: "awaiting_user",
              updatedAt: Date.now()
            });
          }
          const continueResult = await index.waitForGraphUserContinue(session.id, reason, {
            skipPlaceholder: true
          });
          if (signal.aborted) {
            finalizeWorkflowRun(runId, session.id, "aborted");
            return;
          }
          input = new langgraph.Command({ resume: index.queryGraphResumePayload(session.id, continueResult) });
          continue;
        }
        throw e;
      }
      const snap = await graph.getState(config);
      if (hasInterrupt(snap)) {
        const reason = extractReasonFromState(snap) || "等待用户确认";
        const continueResult = await index.waitForGraphUserContinue(session.id, reason, {
          skipPlaceholder: true
        });
        if (signal.aborted) {
          finalizeWorkflowRun(runId, session.id, "aborted");
          return;
        }
        input = new langgraph.Command({ resume: index.queryGraphResumePayload(session.id, continueResult) });
        continue;
      }
      finalizeWorkflowRun(runId, session.id, "success");
      return;
    }
  } catch (e) {
    if (e instanceof Error && e.message === "__aborted__") {
      finalizeWorkflowRun(runId, session.id, "aborted");
      return;
    }
    const message = e instanceof Error ? e.message : String(e);
    finalizeWorkflowRun(runId, session.id, "failed", message);
  }
}
function compileDefinitionToGraph(params) {
  const { workflow, session, specs, signal } = params;
  async function advanceNode(state) {
    if (signal.aborted) throw new Error("__aborted__");
    const idx = state.nodeIndex;
    if (idx >= workflow.nodes.length) {
      return state;
    }
    const node = workflow.nodes[idx];
    const statusMap = new Map(
      Object.entries(state.statusMap)
    );
    const { queryWorkflowRun } = await Promise.resolve().then(() => require("../index.js")).then((n) => n.workflowRuns);
    let run = queryWorkflowRun(state.runId);
    if (!run) throw new Error("运行实例不存在");
    run = await executeTopLevelNodeForGraph(
      session.id,
      node,
      run,
      statusMap,
      specs,
      session,
      signal
    );
    return {
      context: { ...run.context },
      nodeIndex: idx + 1,
      statusMap: Object.fromEntries(statusMap),
      sessionId: state.sessionId,
      runId: state.runId,
      workflowId: state.workflowId
    };
  }
  function routeAfterAdvance(state) {
    if (state.nodeIndex >= workflow.nodes.length) return langgraph.END;
    return "advance";
  }
  return new langgraph.StateGraph(index.WorkflowGraphAnnotation).addNode("advance", advanceNode).addEdge(langgraph.START, "advance").addConditionalEdges("advance", routeAfterAdvance, {
    advance: "advance",
    [langgraph.END]: langgraph.END
  }).compile({ checkpointer: workflowCheckpointer });
}
function extractReason(err) {
  if (!langgraph.isGraphInterrupt(err)) return null;
  const interrupts = err.interrupts ?? [];
  for (const item of interrupts) {
    const v = item?.value;
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && typeof v.reason === "string") return v.reason;
  }
  return null;
}
function extractReasonFromInterrupted(chunk) {
  if (!langgraph.isInterrupted(chunk)) return null;
  const list = chunk[langgraph.INTERRUPT] ?? [];
  for (const item of list) {
    const v = item?.value;
    if (typeof v === "string") return v;
    if (v && typeof v === "object" && typeof v.reason === "string") return v.reason;
  }
  return null;
}
function hasInterrupt(state) {
  if (langgraph.isInterrupted(state.values)) return true;
  return (state.tasks ?? []).some((t) => (t.interrupts?.length ?? 0) > 0);
}
function extractReasonFromState(state) {
  const fromChunk = extractReasonFromInterrupted(state.values);
  if (fromChunk) return fromChunk;
  for (const task of state.tasks ?? []) {
    for (const item of task.interrupts ?? []) {
      const v = item?.value;
      if (typeof v === "string") return v;
      if (v && typeof v === "object" && typeof v.reason === "string") return v.reason;
    }
  }
  return null;
}
exports.executeWorkflowWithLangGraph = executeWorkflowWithLangGraph;
