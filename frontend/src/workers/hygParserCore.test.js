import { parseHygCsv } from "./hygParserCore";
import {
  HYG_WORKER_MESSAGE,
  HYG_WORKER_PROTOCOL_VERSION,
  createHygParseRequest,
  isValidHygWorkerResponse,
  normalizeHygLimit,
} from "./hygWorkerProtocol";

const CSV = [
  "id,proper,ra,dec,dist,mag,absmag,ci,pmra,pmdec",
  '1,"Alpha, Prime",6,0,10,1,2,0.2,1.5,-2.5',
  "1,Duplicate,7,1,11,2,3,0.4,,",
  "2,Invalid,8,2,12,not-a-number,3,0.4,,",
  "3,Vega,18.6156,38.7837,7.68,0.03,0.58,0,,",
].join("\n");

describe("HYG parser core and worker protocol", () => {
  test("parses quoted CSV, canonical coordinates and stable stats", () => {
    const result = parseHygCsv(CSV, 20);
    expect(result.stars).toHaveLength(2);
    expect(result.stars[0]).toEqual(expect.objectContaining({
      id: "1",
      proper: "Alpha, Prime",
      frame: "ICRS",
      epoch: "J2000.0",
      raDegrees: 90,
      distanceParsec: 10,
      x: 0,
      z: -10,
    }));
    expect(result.stats).toEqual(expect.objectContaining({
      totalRows: 4,
      parsedRows: 2,
      skippedRows: 1,
      duplicateRows: 1,
    }));
  });

  test("rejects malformed schemas and clamps requested limits", () => {
    expect(() => parseHygCsv("id,name\n1,Sirius", 10)).toThrow("required headers");
    expect(normalizeHygLimit(-5)).toBe(1);
    expect(normalizeHygLimit(999999)).toBe(120000);
  });

  test("creates and validates correlated versioned messages", () => {
    const request = createHygParseRequest({ requestId: "req-1", text: CSV, limit: 3 });
    expect(request).toEqual(expect.objectContaining({
      version: HYG_WORKER_PROTOCOL_VERSION,
      type: HYG_WORKER_MESSAGE.PARSE,
      requestId: "req-1",
      payload: expect.objectContaining({ limit: 3 }),
    }));
    expect(isValidHygWorkerResponse({
      version: HYG_WORKER_PROTOCOL_VERSION,
      type: HYG_WORKER_MESSAGE.RESULT,
      requestId: "req-1",
    }, "req-1")).toBe(true);
    expect(isValidHygWorkerResponse({ ...request, type: HYG_WORKER_MESSAGE.RESULT }, "other")).toBe(false);
  });
});
