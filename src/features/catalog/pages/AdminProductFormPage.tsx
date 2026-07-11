import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "../../../shared/api/apiError";
import { formatVnd, shortId } from "../../../shared/utils/format";
import {
  useAdminProduct,
  useCreateProduct,
  useUpdateProduct,
  useUploadProductImage,
} from "../api/catalogQueries";
import type {
  ProductResponse,
  UpsertProductRequest,
} from "../api/catalogTypes";
import { productImageSrc } from "../utils/productImage";

type FormState = {
  sku: string;
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
};

type SelectedImage = {
  file: File;
  previewUrl: string;
};

const initialForm: FormState = {
  sku: "",
  name: "",
  description: "",
  price: "",
  stockQuantity: "0",
};

export function AdminProductFormPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);

  const productQuery = useAdminProduct(productId);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImage = useUploadProductImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const selectedFilePreviewUrl = selectedImage?.previewUrl ?? null;

  useEffect(() => {
    if (!selectedFilePreviewUrl) {
      return;
    }

    return () => URL.revokeObjectURL(selectedFilePreviewUrl);
  }, [selectedFilePreviewUrl]);

  const mutationError = createProduct.error ?? updateProduct.error ?? uploadImage.error;

  async function saveProduct(request: UpsertProductRequest) {
    if (isEditMode && productId) {
      const product = await updateProduct.mutateAsync({ productId, request });
      navigate(`/admin/products/${product.id}`);
      return;
    }

    const product = await createProduct.mutateAsync(request);
    navigate(`/admin/products/${product.id}`);
  }

  function selectImage(file: File | null) {
    setSelectedImage(
      file
        ? {
            file,
            previewUrl: URL.createObjectURL(file),
          }
        : null,
    );
  }

  async function handleUploadImage() {
    if (!productId || !selectedImage) {
      return;
    }

    try {
      await uploadImage.mutateAsync({
        productId,
        file: selectedImage.file,
      });

      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      return;
    }
  }

  if (isEditMode && productQuery.isLoading) {
    return <Panel>Loading product...</Panel>;
  }

  if (isEditMode && productQuery.error) {
    return (
      <Panel>
        <p className="text-sm text-red-700">
          {isApiError(productQuery.error)
            ? productQuery.error.userMessage
            : "Could not load product."}
        </p>
      </Panel>
    );
  }

  const product = productQuery.data;
  const imageSrc = product ? productImageSrc(product) : undefined;
  const isSaving = createProduct.isPending || updateProduct.isPending;
  const isUploading = uploadImage.isPending;

  return (
    <section className="space-y-5">
      <Link className="text-sm font-medium text-teal-700" to="/admin/products">
        Back to products
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase text-teal-700">
              Catalog management
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {isEditMode ? "Edit product" : "Create product"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Keep product information clear for customers before changing stock
              or images.
            </p>
          </div>

          {product && (
            <div className="text-right text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                {product.status === "ACTIVE" ? "Visible" : "Inactive"}
              </span>
              <p className="mt-2 text-xs text-slate-500">Ref #{shortId(product.id)}</p>
            </div>
          )}
        </div>

        {mutationError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {isApiError(mutationError)
              ? mutationError.userMessage
              : "Could not save product."}
          </div>
        )}

        <ProductDetailsForm
          key={product?.id ?? "new-product"}
          initialValue={product ? toFormState(product) : initialForm}
          isEditMode={isEditMode}
          isSaving={isSaving}
          onSubmit={saveProduct}
        />
      </div>

      {isEditMode && productId && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Product image</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload a clear product image. Existing orders keep their own order
            item image snapshot after checkout.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ImagePreview
              label="Current image"
              imageSrc={imageSrc}
              alt={product?.name ?? "Product image"}
            />
            <ImagePreview
              label="Selected image preview"
              imageSrc={selectedFilePreviewUrl ?? undefined}
              alt="Selected product image preview"
              helper={
                selectedImage
                  ? `${selectedImage.file.name} - ${formatFileSize(selectedImage.file.size)}`
                  : undefined
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="text-sm"
              type="file"
              onChange={(event) => selectImage(event.target.files?.[0] ?? null)}
            />

            <button
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300"
              type="button"
              disabled={!selectedImage || isUploading}
              onClick={handleUploadImage}
            >
              {isUploading ? "Uploading..." : "Upload image"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

type ProductDetailsFormProps = {
  initialValue: FormState;
  isEditMode: boolean;
  isSaving: boolean;
  onSubmit: (request: UpsertProductRequest) => Promise<void>;
};

function ProductDetailsForm({
  initialValue,
  isEditMode,
  isSaving,
  onSubmit,
}: ProductDetailsFormProps) {
  const [form, setForm] = useState<FormState>(initialValue);
  const previewPrice = Number(form.price);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onSubmit(toRequest(form));
    } catch {
      return;
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        SKU
        <input
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          value={form.sku}
          onChange={(event) =>
            setForm((current) => ({ ...current, sku: event.target.value }))
          }
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Product name
        <input
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          value={form.name}
          onChange={(event) =>
            setForm((current) => ({ ...current, name: event.target.value }))
          }
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea
          className="mt-1 min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          value={form.description}
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Price
          <input
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            min="0"
            step="0.01"
            type="number"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
          />
          {!Number.isNaN(previewPrice) && previewPrice > 0 && (
            <span className="mt-1 block text-xs text-slate-500">
              Displayed as {formatVnd(previewPrice)}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Stock quantity
          <input
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            min="0"
            step="1"
            type="number"
            value={form.stockQuantity}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                stockQuantity: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <button
        className="w-fit rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:bg-slate-300"
        type="submit"
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : isEditMode ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}

function ImagePreview({
  alt,
  helper,
  imageSrc,
  label,
}: {
  alt: string;
  helper?: string;
  imageSrc?: string;
  label: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="mt-3 h-40 w-40 overflow-hidden rounded-md bg-white">
        {imageSrc ? (
          <img alt={alt} className="h-full w-full object-cover" src={imageSrc} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            No image
          </div>
        )}
      </div>
      {helper && <p className="mt-2 text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toFormState(product: ProductResponse): FormState {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? "",
    price: String(product.price),
    stockQuantity: String(product.stockQuantity),
  };
}

function toRequest(form: FormState): UpsertProductRequest {
  return {
    sku: form.sku.trim(),
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    price: Number(form.price),
    stockQuantity: Number(form.stockQuantity),
  };
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </section>
  );
}
