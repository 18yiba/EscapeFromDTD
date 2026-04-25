/**
 * Small image wrapper with text fallback for missing public assets.
 */

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Rotation } from "../types";

export function CardImage({
  src,
  alt,
  fallback,
  rotation = 0,
  className = "",
  imageClassName = "",
}: {
  src?: string;
  alt: string;
  fallback: ReactNode;
  rotation?: Rotation;
  className?: string;
  imageClassName?: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={className}>
      <img
        src={src}
        alt={alt}
        className={["h-full w-full object-contain transition-transform duration-150", imageClassName].join(" ")}
        style={{ transform: `rotate(${rotation * 90}deg)` }}
        draggable={false}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
