import { describe, expect, it } from "vitest";
import { defaultScenario, simulate, verdictFor } from "./calc";

describe("regras de viabilidade", () => {
  it("margem >= 30% é Excelente Negócio", () => expect(verdictFor(30)).toBe("excelente"));
  it("margem entre 10% e 30% é Risco Moderado", () => expect(verdictFor(15)).toBe("moderado"));
  it("margem abaixo de 10% é Inviável", () => expect(verdictFor(9.9)).toBe("inviavel"));
  it("imóvel ocupado assume 12 meses de desocupação", () =>
    expect(defaultScenario(100000, "Ocupado").meses).toBe(12));
  it("desocupação slider vai de 3 meses para imóvel livre", () =>
    expect(defaultScenario(100000, "Desocupado").meses).toBe(3));
  it("custo total soma lance, taxas, carregamento, reforma e honorários", () => {
    const r = simulate({ preco: 100000, meses: 10, reforma: 10000, honorarios: 5000 });
    // 100000 + 5000 + 180000*0.005*10 + 10000 + 5000
    expect(r.custoTotal).toBe(129000);
  });
});
