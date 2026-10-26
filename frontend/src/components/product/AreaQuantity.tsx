import { useId, useState } from "react";

import { formatPrice } from "../../lib/format";
import { formatQuantity } from "../../lib/units";
import { Icon } from "../ui/Icon";

type BuyBy = "box" | "m2";

interface AreaQuantityProps {
  /** Cajas elegidas; 0 mientras los m² ingresados no son válidos. */
  boxes: number;
  onChange: (boxes: number) => void;
  m2PerBox: number;
  /** Cajas disponibles. */
  available: number;
  boxPrice: number;
}

/** "12,5" o "12.5" → 12.5; null si no es un número positivo. */
function parseArea(value: string): number | null {
  const area = Number(value.replace(",", "."));
  return Number.isFinite(area) && area > 0 ? area : null;
}

/** Cajas completas necesarias para cubrir `area` m². */
function boxesFor(area: number, m2PerBox: number): number {
  // El epsilon evita que 14,4 m² / 1,44 m² por caja dé 10,000…1 → 11 cajas.
  return Math.ceil(area / m2PerBox - 1e-9);
}

/**
 * Cantidad de cerámicos: se elige por cajas o por m², y una calculadora
 * muestra la equivalencia. Siempre se compran cajas completas.
 */
export function AreaQuantity({ boxes, onChange, m2PerBox, available, boxPrice }: AreaQuantityProps) {
  const labelId = useId();
  const areaId = useId();
  const [buyBy, setBuyBy] = useState<BuyBy>("box");
  const [areaInput, setAreaInput] = useState("");

  const area = parseArea(areaInput);
  const needed = area === null ? 0 : boxesFor(area, m2PerBox);
  const exceeds = needed > available;

  function switchTo(next: BuyBy) {
    if (next === buyBy) return;
    setBuyBy(next);
    if (next === "m2") {
      // Se redondea a centímetros para no mostrar 4,3199999 m².
      const area = Math.round(boxes * m2PerBox * 100) / 100;
      setAreaInput(boxes > 0 ? String(area).replace(".", ",") : "");
    } else {
      onChange(Math.max(1, boxes));
    }
  }

  function changeArea(value: string) {
    setAreaInput(value);
    const parsed = parseArea(value);
    onChange(parsed === null ? 0 : Math.min(boxesFor(parsed, m2PerBox), available));
  }

  return (
    <div className="bb-area-qty">
      <span className="bb-label" id={labelId}>
        Comprar por
      </span>

      <div className="bb-segmented" role="group" aria-labelledby={labelId}>
        <button type="button" aria-pressed={buyBy === "box"} onClick={() => switchTo("box")}>
          Caja
        </button>
        <button type="button" aria-pressed={buyBy === "m2"} onClick={() => switchTo("m2")}>
          m²
        </button>
      </div>

      {buyBy === "box" ? (
        <div className="bb-pdp__qty">
          <span className="bb-label" id={`${labelId}-boxes`}>
            Cantidad (cajas)
          </span>

          <div className="bb-qty" role="group" aria-labelledby={`${labelId}-boxes`}>
            <button
              type="button"
              onClick={() => onChange(Math.max(1, boxes - 1))}
              disabled={boxes <= 1}
              aria-label="Restar una caja"
            >
              <Icon name="minus" size={16} />
            </button>

            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={available}
              value={boxes}
              aria-label="Cajas a agregar"
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isNaN(next)) return;
                onChange(Math.min(Math.max(1, Math.trunc(next)), available));
              }}
            />

            <button
              type="button"
              onClick={() => onChange(Math.min(available, boxes + 1))}
              disabled={boxes >= available}
              aria-label="Sumar una caja"
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bb-pdp__qty">
          <label className="bb-label" htmlFor={areaId}>
            Superficie a cubrir
          </label>

          <div className="bb-area-qty__input">
            <input
              id={areaId}
              className="bb-input"
              type="text"
              inputMode="decimal"
              placeholder="Ej: 12,5"
              value={areaInput}
              onChange={(event) => changeArea(event.target.value)}
            />
            <span aria-hidden="true">m²</span>
          </div>
        </div>
      )}

      <p className="bb-area-qty__result" aria-live="polite">
        {buyBy === "box" ? (
          <>
            {formatQuantity(boxes, "box")} {boxes === 1 ? "cubre" : "cubren"}{" "}
            <strong>{formatQuantity(boxes * m2PerBox, "m2")}</strong>.
          </>
        ) : area === null ? (
          <>Ingresá los m² y calculamos cuántas cajas necesitás ({formatQuantity(m2PerBox, "m2")} por caja).</>
        ) : exceeds ? (
          <>
            Para {formatQuantity(area, "m2")} hacen falta {formatQuantity(needed, "box")}, pero hay{" "}
            {formatQuantity(available, "box")} disponibles ({formatQuantity(available * m2PerBox, "m2")}).
          </>
        ) : (
          <>
            Para {formatQuantity(area, "m2")} necesitás <strong>{formatQuantity(needed, "box")}</strong>{" "}
            ({formatQuantity(needed * m2PerBox, "m2")}) · {formatPrice(needed * boxPrice)}.
          </>
        )}
      </p>
    </div>
  );
}
