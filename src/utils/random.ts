/**
 * 与业务无关的随机/集合工具。
 */

export function shuffle<T>(arr: T[]): T[] {
  const list = arr.slice();
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export function randomId() {
  return Math.random().toString(16).slice(2, 10);
}

