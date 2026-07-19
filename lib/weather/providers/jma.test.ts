import { afterEach, describe, expect, it, vi } from "vitest";
import { JmaWeatherProvider } from "./jma";

describe("JmaWeatherProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("latest_time.txtとmapエンドポイントを正しい形式で呼び出し、temp/humidityを取り出す", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/latest_time.txt")) {
        return {
          ok: true,
          text: async () => "2026-07-19T12:10:00+09:00\n",
        } as Response;
      }
      if (url.includes("/data/map/")) {
        // 分単位・秒は常に00のファイル名になっていることを確認
        expect(url).toBe("https://www.jma.go.jp/bosai/amedas/data/map/20260719121000.json");
        return {
          ok: true,
          json: async () => ({
            "44132": { temp: [29.5, 0], humidity: [62, 0] },
          }),
        } as Response;
      }
      throw new Error(`unexpected url: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = new JmaWeatherProvider();
    const result = await provider.fetchCurrentWeather("44132");

    expect(result.temp).toBe(29.5);
    expect(result.humidity).toBe(62);
    expect(result.fetchedAt.toISOString()).toBe(new Date("2026-07-19T12:10:00+09:00").toISOString());
  });

  it("該当する観測所コードのデータがない場合はエラーを投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/latest_time.txt")) {
          return { ok: true, text: async () => "2026-07-19T12:10:00+09:00" } as Response;
        }
        return { ok: true, json: async () => ({}) } as Response;
      }),
    );

    const provider = new JmaWeatherProvider();
    await expect(provider.fetchCurrentWeather("99999")).rejects.toThrow(/not found/);
  });

  it("latest_time.txtの取得に失敗したらエラーを投げる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 }) as Response),
    );

    const provider = new JmaWeatherProvider();
    await expect(provider.fetchCurrentWeather("44132")).rejects.toThrow(/latest_time/);
  });
});
