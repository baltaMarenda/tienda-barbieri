import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { mediaUrl } from "../../api/client";
import { deleteImage, getAllImages, invalidateImagesCache, uploadImages } from "../../api/images";
import { createProduct, deleteProduct, updateProduct } from "../../api/products";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Modal } from "../../components/ui/Dialog";
import { SelectField, TextareaField, TextField } from "../../components/ui/Field";
import { Alert, EmptyState, Spinner } from "../../components/ui/Feedback";
import { Icon } from "../../components/ui/Icon";
import { Pagination } from "../../components/ui/Pagination";
import { SearchInput } from "../../components/ui/SearchInput";
import { useCategories } from "../../hooks/useCategories";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { usePendingImages } from "../../hooks/usePendingImages";
import type { PendingImage } from "../../hooks/usePendingImages";
import { useProducts } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { formatNumber } from "../../lib/format";
import { formatQuantity, formatUnitPrice, isCeramicCategory } from "../../lib/units";
import type { Category, Product, ProductImage, ProductPayload, SaleUnit } from "../../types";

const PAGE_SIZE = 20;

/* --- Formulario --------------------------------------------------------------- */

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string, tone?: "success" | "error") => void;
}

interface FieldErrors {
  name?: string;
  category_id?: string;
  price?: string;
  stock?: string;
  m2_per_box?: string;
  images?: string;
}

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";
/** Mismo tope que el backend (app/core/media.py). */
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * Imágenes del formulario: las ya guardadas (que se pueden marcar para borrar)
 * y las nuevas elegidas del disco. Nada se envía hasta que se guarda el
 * producto, así "Cancelar" no deja cambios a medias.
 */
function ImagePicker({
  existing,
  removed,
  onToggleRemoved,
  pending,
  onAdd,
  onRemovePending,
  loading,
  error,
}: {
  existing: ProductImage[];
  removed: Set<number>;
  onToggleRemoved: (id: number) => void;
  pending: PendingImage[];
  onAdd: (files: File[]) => void;
  onRemovePending: (index: number) => void;
  loading: boolean;
  error?: string;
}) {
  const kept = existing.filter((image) => !removed.has(image.id));

  return (
    <div className="bb-field">
      <span className="bb-label">
        Imágenes <span className="bb-label__optional"> (opcional)</span>
      </span>

      {loading ? (
        <Spinner />
      ) : (
        <ul className="bb-image-picker">
          {existing.map((image) => {
            const isRemoved = removed.has(image.id);
            return (
              <li
                key={`saved-${image.id}`}
                className="bb-image-picker__item"
                data-removed={isRemoved || undefined}
              >
                <img src={mediaUrl(image.url)} alt={image.alt} loading="lazy" decoding="async" />
                {kept[0]?.id === image.id ? (
                  <span className="bb-image-picker__tag">Principal</span>
                ) : null}
                <button
                  type="button"
                  className="bb-icon-btn bb-image-picker__action"
                  onClick={() => onToggleRemoved(image.id)}
                  aria-label={isRemoved ? "Conservar imagen" : "Quitar imagen"}
                  title={isRemoved ? "Conservar" : "Quitar"}
                >
                  <Icon name={isRemoved ? "refresh" : "trash"} size={16} />
                </button>
              </li>
            );
          })}

          {pending.map((item, index) => (
            <li key={item.preview} className="bb-image-picker__item">
              <img src={item.preview} alt={`Nueva imagen: ${item.file.name}`} />
              {kept.length === 0 && index === 0 ? (
                <span className="bb-image-picker__tag">Principal</span>
              ) : (
                <span className="bb-image-picker__tag bb-image-picker__tag--new">Nueva</span>
              )}
              <button
                type="button"
                className="bb-icon-btn bb-image-picker__action"
                onClick={() => onRemovePending(index)}
                aria-label={`Descartar ${item.file.name}`}
                title="Descartar"
              >
                <Icon name="x" size={16} />
              </button>
            </li>
          ))}

          <li>
            <label className="bb-image-picker__add">
              <Icon name="plus" size={22} />
              <span>Agregar</span>
              <input
                type="file"
                accept={ACCEPTED_IMAGES}
                multiple
                className="bb-sr-only"
                onChange={(event) => {
                  onAdd(Array.from(event.target.files ?? []));
                  event.target.value = ""; // permite volver a elegir el mismo archivo
                }}
              />
            </label>
          </li>
        </ul>
      )}

      {error ? (
        <span className="bb-error">
          <Icon name="alert-circle" size={16} />
          {error}
        </span>
      ) : (
        <span className="bb-hint">
          JPG, PNG o WebP de hasta 15 MB. Se comprimen al guardar. La primera es la que
          se ve en el catálogo.
        </span>
      )}
    </div>
  );
}

/**
 * El formulario se monta sólo cuando el modal está abierto y con `key`, así que
 * el estado nace ya inicializado con el producto a editar: no hace falta un
 * efecto que sincronice props a estado.
 */
function ProductForm({ product, categories, onClose, onSaved }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(
    product ? String(product.category_id) : "",
  );
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "");
  const [priceUnit, setPriceUnit] = useState<SaleUnit>(product?.price_unit ?? "unit");
  const [stockUnit, setStockUnit] = useState<SaleUnit>(product?.stock_unit ?? "unit");
  const [m2PerBox, setM2PerBox] = useState(
    product?.m2_per_box ? String(product.m2_per_box) : "",
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(product !== null);
  const [removedImages, setRemovedImages] = useState<Set<number>>(() => new Set());
  const {
    pending: pendingImages,
    add: addPendingImages,
    remove: removePendingImage,
  } = usePendingImages();

  const selectedCategory = categories.find((category) => String(category.id) === categoryId);
  const ceramic = isCeramicCategory(selectedCategory?.name);
  /* Fuera de los rubros cerámicos todo se maneja por unidad, sin importar lo
     que haya quedado elegido antes de cambiar de rubro. */
  const effectivePriceUnit: SaleUnit = ceramic ? priceUnit : "unit";
  const effectiveStockUnit: SaleUnit = ceramic ? stockUnit : "unit";
  const unitsDiffer = effectivePriceUnit !== effectiveStockUnit;

  /* GET /images/ no filtra por producto: se trae todo y se filtra acá. */
  useEffect(() => {
    if (!product) return;
    let active = true;
    invalidateImagesCache();

    getAllImages()
      .then((images) => {
        if (!active) return;
        setExistingImages(
          images
            .filter((image) => image.product_id === product.id)
            .sort((a, b) => a.order - b.order),
        );
      })
      .catch(() => {
        if (active) setErrors((current) => ({ ...current, images: "No pudimos cargar las imágenes actuales." }));
      })
      .finally(() => {
        if (active) setImagesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [product]);

  function onCategoryChange(value: string) {
    setCategoryId(value);
    const next = categories.find((category) => String(category.id) === value);
    // Al pasar a un rubro cerámico se sugiere lo habitual: precio por m², stock en cajas.
    if (isCeramicCategory(next?.name) && priceUnit === "unit" && stockUnit === "unit") {
      setPriceUnit("m2");
      setStockUnit("box");
    }
  }

  function addImages(files: File[]) {
    const tooBig = files.filter((file) => file.size > MAX_IMAGE_BYTES);
    const valid = files.filter(
      (file) => file.size <= MAX_IMAGE_BYTES && file.type.startsWith("image/"),
    );

    setErrors((current) => ({
      ...current,
      images:
        tooBig.length > 0
          ? `${tooBig.map((file) => file.name).join(", ")} supera los 15 MB.`
          : valid.length < files.length
            ? "Algunos archivos no son imágenes y se descartaron."
            : undefined,
    }));

    addPendingImages(valid);
  }

  function toggleRemovedImage(id: number) {
    setRemovedImages((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function validate(): FieldErrors {
    const found: FieldErrors = {};

    if (name.trim() === "") found.name = "Poné un nombre de producto.";
    if (categoryId === "") found.category_id = "Elegí un rubro.";

    const priceValue = Number(price);
    if (price.trim() === "" || Number.isNaN(priceValue)) {
      found.price = "Ingresá un precio válido.";
    } else if (priceValue < 0) {
      found.price = "El precio no puede ser negativo.";
    }

    const stockValue = Number(stock);
    if (stock.trim() === "" || Number.isNaN(stockValue)) {
      found.stock = "Ingresá el stock disponible.";
    } else if (stockValue < 0) {
      found.stock = "El stock no puede ser negativo.";
    } else if (effectiveStockUnit !== "m2" && !Number.isInteger(stockValue)) {
      // Sólo los m² admiten decimales; unidades y cajas se cuentan enteras.
      found.stock = `El stock en ${effectiveStockUnit === "box" ? "cajas" : "unidades"} debe ser un número entero.`;
    }

    if (ceramic) {
      const m2Value = Number(m2PerBox);
      if (m2PerBox.trim() === "") {
        if (unitsDiffer) {
          found.m2_per_box = "Indicá cuántos m² trae cada caja para convertir precio y stock.";
        }
      } else if (Number.isNaN(m2Value) || m2Value <= 0) {
        found.m2_per_box = "Ingresá un valor mayor a 0.";
      }
    }

    return found;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    const payload: ProductPayload = {
      name: name.trim(),
      description: description.trim() === "" ? null : description.trim(),
      category_id: Number(categoryId),
      price: Number(price),
      price_unit: effectivePriceUnit,
      stock: Number(stock),
      stock_unit: effectiveStockUnit,
      m2_per_box: ceramic && m2PerBox.trim() !== "" ? Number(m2PerBox) : null,
    };

    setSaving(true);
    setFormError(null);

    let saved: Product;
    try {
      saved = product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload);
    } catch (cause: unknown) {
      setFormError(
        cause instanceof Error ? cause.message : "No pudimos guardar el producto.",
      );
      setSaving(false);
      return;
    }

    const message = product
      ? `Se actualizó “${payload.name}”.`
      : `Se creó “${payload.name}”.`;

    /* El producto ya quedó guardado: si fallan las imágenes se avisa, pero no
       se reintenta desde este formulario (en un alta duplicaría el producto). */
    try {
      for (const id of removedImages) await deleteImage(id);
      if (pendingImages.length > 0) {
        await uploadImages(
          saved.id,
          pendingImages.map((item) => item.file),
        );
      }
    } catch (cause: unknown) {
      const detail = cause instanceof Error ? ` (${cause.message})` : "";
      onSaved(
        `${message} Pero no pudimos guardar todas las imágenes${detail}. Revisalas desde la sección Imágenes.`,
        "error",
      );
      return;
    }

    onSaved(message);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? `Editar producto “${product.name}”` : "Nuevo producto"}
      footer={
        <>
          <button
            type="button"
            className="bb-btn bb-btn--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="product-form"
            className="bb-btn bb-btn--primary"
            disabled={saving}
          >
            {saving ? <Spinner /> : <Icon name="check-circle" size={18} />}
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="bb-stack" noValidate>
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <TextField
          label="Nombre"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          required
        />

        <TextareaField
          label="Descripción"
          optional
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          hint="Medidas, presentación, marca o cualquier dato útil en el mostrador."
        />

        <div className="bb-form-grid">
          <SelectField
            label="Rubro"
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            error={errors.category_id}
            required
          >
            <option value="">Elegir rubro…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>

          {!ceramic ? (
            <>
              <TextField
                label="Precio"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                error={errors.price}
                required
              />

              <TextField
                label="Stock"
                type="number"
                inputMode="numeric"
                min={0}
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                error={errors.stock}
                required
              />
            </>
          ) : null}
        </div>

        {ceramic ? (
          <fieldset className="bb-fieldset">
            <legend className="bb-label">Venta por caja o por m²</legend>

            <div className="bb-form-grid">
              <TextField
                label={priceUnit === "m2" ? "Precio por m²" : "Precio por caja"}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                error={errors.price}
                required
              />

              <SelectField
                label="El precio es"
                value={priceUnit}
                onChange={(event) => setPriceUnit(event.target.value as SaleUnit)}
              >
                <option value="m2">Por metro cuadrado</option>
                <option value="box">Por caja</option>
              </SelectField>

              <TextField
                label={stockUnit === "m2" ? "Stock en m²" : "Stock en cajas"}
                type="number"
                inputMode={stockUnit === "m2" ? "decimal" : "numeric"}
                min={0}
                step={stockUnit === "m2" ? "0.01" : "1"}
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                error={errors.stock}
                required
              />

              <SelectField
                label="El stock se cuenta en"
                value={stockUnit}
                onChange={(event) => setStockUnit(event.target.value as SaleUnit)}
              >
                <option value="box">Cajas</option>
                <option value="m2">Metros cuadrados</option>
              </SelectField>

              <TextField
                label="m² por caja"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={m2PerBox}
                onChange={(event) => setM2PerBox(event.target.value)}
                error={errors.m2_per_box}
                optional={!unitsDiffer}
                required={unitsDiffer}
                hint={
                  unitsDiffer
                    ? "Necesario para convertir entre cajas y m²."
                    : "Si lo cargás, la tienda vende por cajas completas y muestra los m² que cubren."
                }
              />
            </div>
          </fieldset>
        ) : null}

        <ImagePicker
          existing={existingImages}
          removed={removedImages}
          onToggleRemoved={toggleRemovedImage}
          pending={pendingImages}
          onAdd={addImages}
          onRemovePending={removePendingImage}
          loading={imagesLoading}
          error={errors.images}
        />
      </form>
    </Modal>
  );
}

/* --- Página -------------------------------------------------------------------- */

export function AdminProducts() {
  const { categories, categoryById } = useCategories();
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebouncedValue(term, 350);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [removing, setRemoving] = useState(false);

  const { data, loading, error, reload } = useProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedTerm.trim() || null,
  });

  const products = data?.items ?? [];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  function onSaved(message: string, tone?: "success" | "error") {
    setFormOpen(false);
    notify(message, tone);
    reload();
  }

  async function confirmDelete() {
    if (!deleting) return;

    setRemoving(true);
    try {
      await deleteProduct(deleting.id);
      notify(`Se eliminó “${deleting.name}”.`);
      setDeleting(null);
      reload();
    } catch (cause: unknown) {
      notify(
        cause instanceof Error ? cause.message : "No pudimos eliminar el producto.",
        "error",
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <div className="bb-admin__head">
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Productos</h1>
          <p className="bb-muted" style={{ fontSize: "var(--text-sm)" }}>
            {data ? `${formatNumber(data.total)} en total` : "Cargando…"}
          </p>
        </div>

        <button
          type="button"
          className="bb-btn bb-btn--primary"
          onClick={openCreate}
          disabled={categories.length === 0}
        >
          <Icon name="plus" size={18} />
          Nuevo producto
        </button>
      </div>

      {categories.length === 0 ? (
        <Alert tone="info" title="Primero cargá un rubro">
          Un producto necesita una categoría existente. Creá al menos una en la
          sección <strong>Rubros</strong>.
        </Alert>
      ) : null}

      <div className="bb-admin__toolbar">
        <SearchInput
          value={term}
          onChange={(value) => {
            setTerm(value);
            setPage(1); // una búsqueda nueva siempre empieza en la página 1
          }}
          label="Buscar productos por nombre"
          placeholder="Buscar por nombre…"
        />
      </div>

      {error ? (
        <Alert
          tone="error"
          title="No pudimos cargar los productos"
          action={
            <button type="button" className="bb-btn bb-btn--secondary" onClick={reload}>
              <Icon name="refresh" size={18} />
              Reintentar
            </button>
          }
        >
          {error}
        </Alert>
      ) : loading ? (
        <div style={{ display: "grid", placeItems: "center", padding: "var(--space-8)" }}>
          <Spinner large />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title={
            debouncedTerm ? `Sin resultados para “${debouncedTerm}”` : "Todavía no hay productos"
          }
          description={
            debouncedTerm
              ? "Probá con otro nombre o limpiá la búsqueda."
              : "Cargá el primero para que aparezca en la tienda."
          }
          action={
            <button
              type="button"
              className="bb-btn bb-btn--primary"
              onClick={openCreate}
              disabled={categories.length === 0}
            >
              <Icon name="plus" size={18} />
              Nuevo producto
            </button>
          }
        />
      ) : (
        <>
          <div className="bb-table-wrap">
            <table className="bb-table">
              <caption className="bb-sr-only">Listado de productos</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">Rubro</th>
                  <th scope="col" className="bb-table__num">
                    Precio
                  </th>
                  <th scope="col" className="bb-table__num">
                    Stock
                  </th>
                  <th scope="col">
                    <span className="bb-sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id}>
                    <td className="bb-muted">{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td style={{ whiteSpace: "normal", maxWidth: 320 }}>
                      <strong>{product.name}</strong>
                    </td>
                    <td>{categoryById.get(product.category_id)?.name ?? "—"}</td>
                    <td className="bb-table__num">
                      {formatUnitPrice(product.price, product.price_unit)}
                    </td>
                    <td className="bb-table__num">
                      {product.stock_unit === "unit"
                        ? formatNumber(product.stock)
                        : formatQuantity(product.stock, product.stock_unit)}
                    </td>
                    <td>
                      <div className="bb-table__actions">
                        <button
                          type="button"
                          className="bb-icon-btn"
                          onClick={() => openEdit(product)}
                          aria-label={`Editar ${product.name}`}
                        >
                          <Icon name="pencil" size={18} />
                        </button>
                        <button
                          type="button"
                          className="bb-icon-btn"
                          onClick={() => setDeleting(product)}
                          aria-label={`Eliminar ${product.name}`}
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={data?.pages ?? 1} onChange={setPage} />
        </>
      )}

      {formOpen ? (
        <ProductForm
          key={editing?.id ?? "nuevo"}
          product={editing}
          categories={categories}
          onClose={() => setFormOpen(false)}
          onSaved={onSaved}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar producto"
        description={`Se va a borrar “${deleting?.name ?? ""}” junto con sus imágenes. Esta acción no se puede deshacer.`}
        busy={removing}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
