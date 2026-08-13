import { Icon } from "./Icon";

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

/** Ventana de páginas alrededor de la actual, con elipsis y primera/última. */
function buildPages(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const items: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);

  if (start > 2) items.push("gap");
  for (let current = start; current <= end; current++) items.push(current);
  if (end < pages - 1) items.push("gap");

  items.push(pages);
  return items;
}

export function Pagination({ page, pages, onChange }: PaginationProps) {
  if (pages <= 1) return null;

  const items = buildPages(page, pages);

  return (
    <nav className="bb-pagination" aria-label="Paginación de productos">
      <button
        type="button"
        className="bb-pagination__page"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <Icon name="chevron-left" size={18} />
      </button>

      {items.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="bb-pagination__gap" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className="bb-pagination__page"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={
              item === page ? `Página ${item}, página actual` : `Ir a la página ${item}`
            }
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className="bb-pagination__page"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Página siguiente"
      >
        <Icon name="chevron-right" size={18} />
      </button>
    </nav>
  );
}
