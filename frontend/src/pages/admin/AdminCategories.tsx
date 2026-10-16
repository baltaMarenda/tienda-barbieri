import { useState } from "react";
import type { FormEvent } from "react";

import { createCategory, deleteCategory, updateCategory } from "../../api/categories";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Modal } from "../../components/ui/Dialog";
import { TextField } from "../../components/ui/Field";
import { Alert, EmptyState, Spinner } from "../../components/ui/Feedback";
import { Icon } from "../../components/ui/Icon";
import { useCategories } from "../../hooks/useCategories";
import { useToast } from "../../hooks/useToast";
import type { Category } from "../../types";

/* --- Formulario --------------------------------------------------------------- */

interface CategoryFormProps {
  category: Category | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** Se monta con `key` al abrir, así el estado nace con el rubro a editar. */
function CategoryForm({ category, onClose, onSaved }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const value = name.trim();
    if (value === "") {
      setFieldError("Poné un nombre de rubro.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (category) {
        await updateCategory(category.id, value);
        onSaved(`Se actualizó el rubro “${value}”.`);
      } else {
        await createCategory(value);
        onSaved(`Se creó el rubro “${value}”.`);
      }
    } catch (cause: unknown) {
      setFormError(
        cause instanceof Error ? cause.message : "No pudimos guardar el rubro.",
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? `Editar rubro “${category.name}”` : "Nuevo rubro"}
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
            form="category-form"
            className="bb-btn bb-btn--primary"
            disabled={saving}
          >
            {saving ? <Spinner /> : <Icon name="check-circle" size={18} />}
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={onSubmit} className="bb-stack" noValidate>
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <TextField
          label="Nombre del rubro"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          error={fieldError}
          hint="Por ejemplo: Aberturas, Pinturas, Sanitarios."
          required
        />
      </form>
    </Modal>
  );
}

/* --- Página -------------------------------------------------------------------- */

export function AdminCategories() {
  const { categories, loading, error, reload } = useCategories();
  const { notify } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [removing, setRemoving] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
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
      await deleteCategory(deleting.id);
      notify(`Se eliminó el rubro “${deleting.name}”.`);
      setDeleting(null);
      reload();
    } catch (cause: unknown) {
      notify(
        cause instanceof Error ? cause.message : "No pudimos eliminar el rubro.",
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
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Rubros</h1>
          <p className="bb-muted" style={{ fontSize: "var(--text-sm)" }}>
            Las categorías que agrupan el catálogo y arman el menú de la tienda.
          </p>
        </div>

        <button type="button" className="bb-btn bb-btn--primary" onClick={openCreate}>
          <Icon name="plus" size={18} />
          Nuevo rubro
        </button>
      </div>

      {error ? (
        <Alert
          tone="error"
          title="No pudimos cargar los rubros"
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
      ) : categories.length === 0 ? (
        <EmptyState
          icon="layers"
          title="Todavía no hay rubros"
          description="Creá el primero para poder cargar productos: cada producto tiene que pertenecer a un rubro."
          action={
            <button type="button" className="bb-btn bb-btn--primary" onClick={openCreate}>
              <Icon name="plus" size={18} />
              Nuevo rubro
            </button>
          }
        />
      ) : (
        <div className="bb-table-wrap">
          <table className="bb-table">
            <caption className="bb-sr-only">Listado de rubros</caption>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Nombre</th>
                <th scope="col">
                  <span className="bb-sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category.id}>
                  <td className="bb-muted">{index + 1}</td>
                  <td>
                    <strong>{category.name}</strong>
                  </td>
                  <td>
                    <div className="bb-table__actions">
                      <button
                        type="button"
                        className="bb-icon-btn"
                        onClick={() => openEdit(category)}
                        aria-label={`Editar ${category.name}`}
                      >
                        <Icon name="pencil" size={18} />
                      </button>
                      <button
                        type="button"
                        className="bb-icon-btn"
                        onClick={() => setDeleting(category)}
                        aria-label={`Eliminar ${category.name}`}
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
        <CategoryForm
          key={editing?.id ?? "nuevo"}
          category={editing}
          onClose={() => setFormOpen(false)}
          onSaved={onSaved}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Eliminar rubro"
        description={`Se va a borrar el rubro “${deleting?.name ?? ""}”. Si tiene productos asociados, el backend puede rechazar la operación.`}
        busy={removing}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
