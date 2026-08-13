import { useState } from "react";
import type { FormEvent } from "react";

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
import { useProducts } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { formatNumber, formatPrice } from "../../lib/format";
import type { Category, Product, ProductPayload } from "../../types";

const PAGE_SIZE = 20;

/* --- Formulario --------------------------------------------------------------- */

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

interface FieldErrors {
  name?: string;
  category_id?: string;
  price?: string;
  stock?: string;
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    } else if (!Number.isInteger(stockValue) || stockValue < 0) {
      found.stock = "El stock debe ser un entero de 0 o más.";
    }

    return found;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload: ProductPayload = {
      name: name.trim(),
      description: description.trim() === "" ? null : description.trim(),
      category_id: Number(categoryId),
      price: Number(price),
      stock: Number(stock),
    };

    setSaving(true);
    setFormError(null);

    try {
      if (product) {
        await updateProduct(product.id, payload);
        onSaved(`Se actualizó “${payload.name}”.`);
      } else {
        await createProduct(payload);
        onSaved(`Se creó “${payload.name}”.`);
      }
    } catch (cause: unknown) {
      setFormError(
        cause instanceof Error ? cause.message : "No pudimos guardar el producto.",
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? `Editar producto #${product.id}` : "Nuevo producto"}
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
            onChange={(event) => setCategoryId(event.target.value)}
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
        </div>
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

  function onSaved(message: string) {
    setFormOpen(false);
    notify(message);
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
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="bb-muted">{product.id}</td>
                    <td style={{ whiteSpace: "normal", maxWidth: 320 }}>
                      <strong>{product.name}</strong>
                    </td>
                    <td>{categoryById.get(product.category_id)?.name ?? "—"}</td>
                    <td className="bb-table__num">{formatPrice(product.price)}</td>
                    <td className="bb-table__num">{formatNumber(product.stock)}</td>
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
