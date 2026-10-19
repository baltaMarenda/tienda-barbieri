import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { mediaUrl } from "../../api/client";
import {
  deleteImage,
  getAllImages,
  invalidateImagesCache,
  updateImage,
  uploadImages,
} from "../../api/images";
import { getAllProducts } from "../../api/products";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Modal } from "../../components/ui/Dialog";
import { SelectField, TextField } from "../../components/ui/Field";
import { Alert, EmptyState, Spinner } from "../../components/ui/Feedback";
import { Icon } from "../../components/ui/Icon";
import { usePendingImages } from "../../hooks/usePendingImages";
import { useToast } from "../../hooks/useToast";
import type { ImagePayload, Product, ProductImage } from "../../types";

interface FieldErrors {
  product_id?: string;
  files?: string;
  alt?: string;
  order?: string;
}

/** Mismo tope que el backend (app/core/media.py). */
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/* --- Formulario --------------------------------------------------------------- */

interface ImageFormProps {
  image: ProductImage | null;
  products: Product[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

/**
 * Alta: se eligen uno o más archivos del disco y el backend los comprime y los
 * agrega al final de la galería del producto. Edición: el archivo no cambia;
 * se ajustan producto, texto alternativo, orden y visibilidad.
 */
function ImageForm({ image, products, onClose, onSaved }: ImageFormProps) {
  const [productId, setProductId] = useState(image ? String(image.product_id) : "");
  const { pending, add: addFiles, remove: removeFile } = usePendingImages();
  const files = pending.map((item) => item.file);
  const [alt, setAlt] = useState(image?.alt ?? "");
  const [order, setOrder] = useState(image ? String(image.order) : "0");
  const [isActive, setIsActive] = useState(image ? image.is_active : true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const found: FieldErrors = {};
    if (productId === "") found.product_id = "Elegí a qué producto pertenece.";

    if (image) {
      if (alt.trim() === "") {
        found.alt =
          "El texto alternativo es obligatorio: describe la imagen para lectores de pantalla.";
      }
      const orderValue = Number(order);
      if (order.trim() === "" || !Number.isInteger(orderValue) || orderValue < 0) {
        found.order = "El orden debe ser un entero de 0 o más.";
      }
    } else if (files.length === 0) {
      found.files = "Elegí al menos una imagen.";
    } else if (files.some((file) => file.size > MAX_IMAGE_BYTES)) {
      found.files = "Cada imagen puede pesar hasta 15 MB.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setFormError(null);

    try {
      if (image) {
        const payload: ImagePayload = {
          product_id: Number(productId),
          url: image.url,
          alt: alt.trim(),
          order: Number(order),
          is_active: isActive,
        };
        await updateImage(image.id, payload);
        onSaved("Se actualizó la imagen.");
      } else {
        await uploadImages(Number(productId), files, alt.trim() || undefined);
        onSaved(files.length === 1 ? "Se cargó la imagen." : `Se cargaron ${files.length} imágenes.`);
      }
    } catch (cause: unknown) {
      setFormError(
        cause instanceof Error ? cause.message : "No pudimos guardar la imagen.",
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={image ? "Editar imagen" : "Subir imágenes"}
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
            form="image-form"
            className="bb-btn bb-btn--primary"
            disabled={saving}
          >
            {saving ? <Spinner /> : <Icon name="check-circle" size={18} />}
            {saving ? (image ? "Guardando…" : "Subiendo…") : "Guardar"}
          </button>
        </>
      }
    >
      <form id="image-form" onSubmit={onSubmit} className="bb-stack" noValidate>
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <SelectField
          label="Producto"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          error={errors.product_id}
          required
        >
          <option value="">Elegir producto…</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </SelectField>

        {image ? (
          <div className="bb-gallery__main" style={{ maxWidth: 260 }}>
            <img src={mediaUrl(image.url)} alt="Vista previa de la imagen" />
          </div>
        ) : (
          <div className="bb-field">
            <span className="bb-label">Archivos</span>
            <ul className="bb-image-picker">
              {pending.map((item, index) => (
                <li key={item.preview} className="bb-image-picker__item">
                  <img src={item.preview} alt={`Nueva imagen: ${item.file.name}`} />
                  <button
                    type="button"
                    className="bb-icon-btn bb-image-picker__action"
                    onClick={() => removeFile(index)}
                    aria-label={`Descartar ${item.file.name}`}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </li>
              ))}
              <li>
                <label className="bb-image-picker__add">
                  <Icon name="plus" size={22} />
                  <span>Elegir</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                    multiple
                    className="bb-sr-only"
                    onChange={(event) => {
                      addFiles(Array.from(event.target.files ?? []));
                      event.target.value = "";
                    }}
                  />
                </label>
              </li>
            </ul>
            {errors.files ? (
              <span className="bb-error">
                <Icon name="alert-circle" size={16} />
                {errors.files}
              </span>
            ) : (
              <span className="bb-hint">
                JPG, PNG o WebP de hasta 15 MB. Se comprimen y se guardan en el sitio.
              </span>
            )}
          </div>
        )}

        <TextField
          label="Texto alternativo"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          error={errors.alt}
          optional={!image}
          hint={
            image
              ? "Describí lo que se ve, por ejemplo: “Ventana corrediza de aluminio blanco”."
              : "Si lo dejás vacío se usa el nombre del producto."
          }
          required={image !== null}
        />

        {image ? (
          <div className="bb-form-grid">
            <TextField
              label="Orden"
              type="number"
              inputMode="numeric"
              min={0}
              step="1"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              error={errors.order}
              hint="0 es la principal."
              required
            />

            <div className="bb-field">
              <span className="bb-label">Visibilidad</span>
              <label className="bb-row" style={{ minHeight: 44 }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                Mostrar en la tienda
              </label>
            </div>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

/* --- Página -------------------------------------------------------------------- */

interface Snapshot {
  nonce: number;
  images: ProductImage[];
  products: Product[];
  error: string | null;
}

const NO_IMAGES: ProductImage[] = [];
const NO_PRODUCTS: Product[] = [];

export function AdminImages() {
  const { notify } = useToast();

  const [nonce, setNonce] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const [filterProduct, setFilterProduct] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductImage | null>(null);
  const [deleting, setDeleting] = useState<ProductImage | null>(null);
  const [removing, setRemoving] = useState(false);

  /* GET /images/ no filtra por producto: se trae el listado entero y se ordena
     por producto y por `order`, que es como se muestra en la ficha. */
  useEffect(() => {
    let active = true;
    invalidateImagesCache();

    Promise.all([getAllImages(), getAllProducts()])
      .then(([imageList, productList]) => {
        if (!active) return;
        setSnapshot({
          nonce,
          images: [...imageList].sort(
            (a, b) => a.product_id - b.product_id || a.order - b.order,
          ),
          products: productList,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setSnapshot({
          nonce,
          images: NO_IMAGES,
          products: NO_PRODUCTS,
          error:
            cause instanceof Error ? cause.message : "No pudimos cargar las imágenes.",
        });
      });

    return () => {
      active = false;
    };
  }, [nonce]);

  const current = snapshot && snapshot.nonce === nonce ? snapshot : null;
  const loading = current === null;
  const error = current?.error ?? null;
  const images = current?.images ?? NO_IMAGES;
  const products = current?.products ?? NO_PRODUCTS;

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  const productName = (id: number) =>
    products.find((product) => product.id === id)?.name ?? `#${id}`;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(image: ProductImage) {
    setEditing(image);
    setFormOpen(true);
  }

  function onSaved(message: string) {
    setFormOpen(false);
    notify(message);
    reload();
  }

  async function confirmDelete() {
    if (!deleting) return;

    setRemoving(true);
    try {
      await deleteImage(deleting.id);
      notify("Se eliminó la imagen.");
      setDeleting(null);
      reload();
    } catch (cause: unknown) {
      notify(
        cause instanceof Error ? cause.message : "No pudimos eliminar la imagen.",
        "error",
      );
    } finally {
      setRemoving(false);
    }
  }

  const visible = filterProduct
    ? images.filter((image) => String(image.product_id) === filterProduct)
    : images;

  return (
    <>
      <div className="bb-admin__head">
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Imágenes</h1>
          <p className="bb-muted" style={{ fontSize: "var(--text-sm)" }}>
            La imagen de menor <code>orden</code> es la que se muestra en la tarjeta
            del catálogo.
          </p>
        </div>

        <button
          type="button"
          className="bb-btn bb-btn--primary"
          onClick={openCreate}
          disabled={products.length === 0}
        >
          <Icon name="plus" size={18} />
          Subir imágenes
        </button>
      </div>

      {products.length === 0 && !loading && !error ? (
        <Alert tone="info" title="Primero cargá un producto">
          Una imagen se asocia a un producto existente. Creá uno en la sección{" "}
          <strong>Productos</strong>.
        </Alert>
      ) : null}

      {products.length > 0 ? (
        <div className="bb-admin__toolbar">
          <div className="bb-field" style={{ minWidth: 240 }}>
            <label className="bb-label" htmlFor="filter-product">
              Filtrar por producto
            </label>
            <select
              id="filter-product"
              className="bb-select"
              value={filterProduct}
              onChange={(event) => setFilterProduct(event.target.value)}
            >
              <option value="">Todos los productos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {error ? (
        <Alert
          tone="error"
          title="No pudimos cargar las imágenes"
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
      ) : visible.length === 0 ? (
        <EmptyState
          icon="image"
          title={
            filterProduct ? "Este producto no tiene imágenes" : "Todavía no hay imágenes"
          }
          description="Subí fotos desde tu computadora o celular y asocialas a un producto."
          action={
            <button
              type="button"
              className="bb-btn bb-btn--primary"
              onClick={openCreate}
              disabled={products.length === 0}
            >
              <Icon name="plus" size={18} />
              Subir imágenes
            </button>
          }
        />
      ) : (
        <div className="bb-table-wrap">
          <table className="bb-table">
            <caption className="bb-sr-only">Listado de imágenes</caption>
            <thead>
              <tr>
                <th scope="col">Vista</th>
                <th scope="col">Producto</th>
                <th scope="col">Texto alternativo</th>
                <th scope="col" className="bb-table__num">
                  Orden
                </th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="bb-sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((image) => (
                <tr key={image.id}>
                  <td>
                    <span
                      className="bb-cart-line__media"
                      style={{ display: "block", width: 48 }}
                    >
                      <img src={mediaUrl(image.url)} alt="" loading="lazy" decoding="async" />
                    </span>
                  </td>
                  <td>{productName(image.product_id)}</td>
                  <td style={{ whiteSpace: "normal", maxWidth: 260 }}>{image.alt}</td>
                  <td className="bb-table__num">{image.order}</td>
                  <td>
                    <span
                      className={
                        image.is_active
                          ? "bb-badge bb-badge--success"
                          : "bb-badge bb-badge--neutral"
                      }
                    >
                      <span className="bb-badge__dot" />
                      {image.is_active ? "Visible" : "Oculta"}
                    </span>
                  </td>
                  <td>
                    <div className="bb-table__actions">
                      <button
                        type="button"
                        className="bb-icon-btn"
                        onClick={() => openEdit(image)}
                        aria-label={`Editar imagen ${image.id}`}
                      >
                        <Icon name="pencil" size={18} />
                      </button>
                      <button
                        type="button"
                        className="bb-icon-btn"
                        onClick={() => setDeleting(image)}
                        aria-label={`Eliminar imagen ${image.id}`}
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
      )}

      {formOpen ? (
        <ImageForm
          key={editing?.id ?? "nueva"}
          image={editing}
          products={products}
          onClose={() => setFormOpen(false)}
          onSaved={onSaved}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar imagen"
        description="Se va a borrar esta imagen del producto. Esta acción no se puede deshacer."
        busy={removing}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
