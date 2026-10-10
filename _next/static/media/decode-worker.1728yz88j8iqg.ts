/**
 * Mesh decoding off the main thread: one frame in (transferred), one decoded mesh out (its typed
 * arrays transferred back). Decoding is a header parse plus typed-array views, so what the worker
 * saves the UI thread is mostly the structured clone of large frames arriving in bursts.
 */
import { decodeMesh } from "@buildos/protocol";

export interface DecodeRequest {
  id: number;
  buffer: ArrayBuffer;
}

export interface DecodeResponse {
  id: number;
  meshId?: string;
  vertexCount?: number;
  indexCount?: number;
  groups?: { start: number; count: number; slot: number }[];
  positions?: Float32Array;
  normals?: Float32Array;
  indices?: Uint32Array;
  error?: string;
}

self.onmessage = (e: MessageEvent<DecodeRequest>) => {
  const { id, buffer } = e.data;
  try {
    const m = decodeMesh(buffer);
    const out: DecodeResponse = { id, meshId: m.meshId, vertexCount: m.vertexCount, indexCount: m.indexCount, groups: m.groups, positions: m.positions, normals: m.normals, indices: m.indices };
    // The views share the frame's buffer; transferring it once moves all three.
    (self as unknown as Worker).postMessage(out, [buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, error: String(err) } satisfies DecodeResponse);
  }
};
