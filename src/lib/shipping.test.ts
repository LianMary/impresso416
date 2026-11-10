import { describe, expect, it } from "vitest";
import { shippingFor } from "./shipping";

describe("frete", () => {
  it("retirada na loja é grátis", () => expect(shippingFor(20, "retirada")).toBe(0));
  it("entrega abaixo de R$150 custa R$15", () => expect(shippingFor(149.9, "entrega")).toBe(15));
  it("entrega a partir de R$150 é grátis", () => expect(shippingFor(150, "entrega")).toBe(0));
});
