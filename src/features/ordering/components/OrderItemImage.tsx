import { useEffect, useState } from "react";
import { apiClient } from "../../../shared/api/apiClient";
import { useAuth } from "../../../shared/auth/authStore";

type OrderItemImageProps = {
  imageUrl?: string | null;
  alt: string;
};

export function OrderItemImage({ imageUrl, alt }: OrderItemImageProps) {
  const { accessToken } = useAuth();

  if (!imageUrl || !accessToken) {
    return <ImagePlaceholder label="No image" />;
  }

  return (
    <OrderItemImageLoader
      key={imageUrl}
      accessToken={accessToken}
      alt={alt}
      imageUrl={imageUrl}
    />
  );
}

type OrderItemImageLoaderProps = {
  accessToken: string;
  alt: string;
  imageUrl: string;
};

function OrderItemImageLoader({
  accessToken,
  alt,
  imageUrl,
}: OrderItemImageLoaderProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;
    let createdObjectUrl: string | null = null;

    apiClient
      .getBlob(imageUrl, { accessToken })
      .then((blob) => {
        const nextObjectUrl = URL.createObjectURL(blob);

        if (!isActive) {
          URL.revokeObjectURL(nextObjectUrl);
          return;
        }

        createdObjectUrl = nextObjectUrl;
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (isActive) {
          setHasError(true);
        }
      });

    return () => {
      isActive = false;

      if (createdObjectUrl) {
        URL.revokeObjectURL(createdObjectUrl);
      }
    };
  }, [accessToken, imageUrl]);

  if (hasError) {
    return <ImagePlaceholder label="No image" />;
  }

  if (!objectUrl) {
    return <ImagePlaceholder label="Loading image" pulse />;
  }

  return (
    <img
      alt={alt}
      className="h-16 w-16 rounded-md border border-slate-200 object-cover"
      src={objectUrl}
    />
  );
}

function ImagePlaceholder({
  label,
  pulse = false,
}: {
  label: string;
  pulse?: boolean;
}) {
  return (
    <div
      aria-label={label}
      className={`flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-medium text-slate-400 ${
        pulse ? "animate-pulse" : ""
      }`}
    >
      Image
    </div>
  );
}
