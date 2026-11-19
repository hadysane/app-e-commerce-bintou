import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Product photo, or a neutral placeholder when the product has none yet. */
export function ProductImage({
  src,
  alt,
  className,
  loading,
}: {
  src: string | null;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
      >
        <ImageOff className="size-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      width={768}
      height={1024}
      className={cn("object-cover", className)}
    />
  );
}
