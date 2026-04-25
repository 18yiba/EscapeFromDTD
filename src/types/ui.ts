/**
 * UI/交互层类型：仅服务于视图与 store 的 UI 状态，不进入 engine。
 */

export type Scene = "landing" | "inGame" | "result";

export type ToastLevel = "info" | "error";

export interface ToastState {
  open: boolean;
  level: ToastLevel;
  message: string;
}

export interface RuleFeedback {
  playerId: "red" | "blue";
  connectedCount: number;
  threshold: number;
  formedAfterPlacement: boolean;
}

