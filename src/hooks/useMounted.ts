/**
 * hooks/
 * 自定义 React Hooks（封装可复用的状态/副作用逻辑），避免散落在页面与组件里。
 */

import { useEffect, useState } from "react";

/**
 * 示例：用于区分 SSR/CSR 或需要等到挂载后再执行的逻辑。
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

