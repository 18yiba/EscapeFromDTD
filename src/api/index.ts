/**
 * api/
 * 未来对接后端或第三方服务（例如：AI、埋点、存档服务等）的统一出口。
 * MVP 阶段不实现真实请求，只保留结构与调用方式示例，避免业务逻辑散落在组件中。
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * 示例：未来可在此封装 fetch/axios，并统一做错误处理、重试、鉴权等。
 */
export async function examplePing(): Promise<ApiResult<{ ts: number }>> {
  return { ok: true, data: { ts: Date.now() } };
}

