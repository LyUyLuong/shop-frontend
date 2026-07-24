import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AdminProductFormPage } from "./AdminProductFormPage";

const catalogMocks = vi.hoisted(() => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  uploadProductImage: vi.fn(),
}));

vi.mock("../api/catalogQueries", () => ({
  useAdminProduct: () => ({
    data: undefined,
    error: null,
    isLoading: false,
  }),
  useCreateProduct: () => ({
    error: null,
    isPending: false,
    mutateAsync: catalogMocks.createProduct,
  }),
  useUpdateProduct: () => ({
    error: null,
    isPending: false,
    mutateAsync: catalogMocks.updateProduct,
  }),
  useUploadProductImage: () => ({
    error: null,
    isPending: false,
    mutateAsync: catalogMocks.uploadProductImage,
  }),
}));

describe("AdminProductFormPage", () => {
  beforeEach(() => {
    catalogMocks.createProduct.mockReset();
    catalogMocks.updateProduct.mockReset();
    catalogMocks.uploadProductImage.mockReset();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:product-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("creates the product before uploading the selected image", async () => {
    const user = userEvent.setup();
    const imageFile = new File(["image"], "product.png", {
      type: "image/png",
    });

    catalogMocks.createProduct.mockResolvedValue({ id: "product-1" });
    catalogMocks.uploadProductImage.mockResolvedValue({ id: "product-1" });

    renderCreatePage();
    await completeProductForm(user, imageFile);

    await user.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => {
      expect(catalogMocks.uploadProductImage).toHaveBeenCalledWith({
        productId: "product-1",
        file: imageFile,
      });
    });

    expect(catalogMocks.createProduct).toHaveBeenCalledWith({
      sku: "SKU-001",
      name: "Product one",
      description: "Description",
      price: 125000,
      stockQuantity: 8,
    });
    expect(
      catalogMocks.createProduct.mock.invocationCallOrder[0],
    ).toBeLessThan(catalogMocks.uploadProductImage.mock.invocationCallOrder[0]);
    expect(await screen.findByText("Edit product destination")).toBeInTheDocument();
  });

  it("continues from edit mode when image upload fails after creation", async () => {
    const user = userEvent.setup();
    const imageFile = new File(["image"], "product.png", {
      type: "image/png",
    });

    catalogMocks.createProduct.mockResolvedValue({ id: "product-1" });
    catalogMocks.uploadProductImage.mockRejectedValue(
      new Error("Image upload failed"),
    );

    renderCreatePage();
    await completeProductForm(user, imageFile);

    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(await screen.findByText("Edit product destination")).toBeInTheDocument();
    expect(catalogMocks.createProduct).toHaveBeenCalledTimes(1);
    expect(catalogMocks.uploadProductImage).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Image upload failed: true")).toBeInTheDocument();
  });
});

function renderCreatePage() {
  render(
    <MemoryRouter initialEntries={["/admin/products/new"]}>
      <Routes>
        <Route
          path="/admin/products/new"
          element={<AdminProductFormPage />}
        />
        <Route
          path="/admin/products/:productId"
          element={<EditProductDestination />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function EditProductDestination() {
  const location = useLocation();
  const imageUploadFailed =
    (
      location.state as {
        imageUploadFailed?: boolean;
      } | null
    )?.imageUploadFailed === true;

  return (
    <div>
      <p>Edit product destination</p>
      <p>Image upload failed: {String(imageUploadFailed)}</p>
    </div>
  );
}

async function completeProductForm(
  user: ReturnType<typeof userEvent.setup>,
  imageFile: File,
) {
  await user.type(screen.getByLabelText("SKU"), "SKU-001");
  await user.type(screen.getByLabelText("Product name"), "Product one");
  await user.type(screen.getByLabelText("Description"), "Description");
  await user.type(screen.getByLabelText("Price"), "125000");
  await user.clear(screen.getByLabelText("Stock quantity"));
  await user.type(screen.getByLabelText("Stock quantity"), "8");
  await user.upload(screen.getByLabelText("Image file"), imageFile);
}
