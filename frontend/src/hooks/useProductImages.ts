import { useEffect, useState } from "react";

import { getAllImages, groupActiveImages } from "../api/images";
import type { ProductImage } from "../types";

const EMPTY = new Map<number, ProductImage[]>();

/**
 * Devuelve las imágenes activas agrupadas por producto. Si el pedido falla no
 * se propaga el error: la ficha cae al placeholder y el catálogo sigue usable.
 */
export function useProductImages(): Map<number, ProductImage[]> {
  const [byProduct, setByProduct] = useState<Map<number, ProductImage[]>>(EMPTY);

  useEffect(() => {
    let active = true;

    getAllImages()
      .then((images) => {
        if (!active) return;
        setByProduct(groupActiveImages(images));
      })
      .catch(() => {
        if (!active) return;
        setByProduct(EMPTY);
      });

    return () => {
      active = false;
    };
  }, []);

  return byProduct;
}
