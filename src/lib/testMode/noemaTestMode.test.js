import { describe, expect, it } from "vitest";
import { parseUI, stripUI } from "../../utils/helpers";
import {
  advanceNoemaTestJourney,
  createNoemaSeededJourney,
  isNoemaTestAuthorized,
  NOEMA_TEST_COMMANDS,
  NOEMA_TEST_MAX_MESSAGES,
  parseAllowedNoemaTestEmails,
  parseNoemaTestCommand,
  startNoemaTestJourney,
} from "./noemaTestMode";

describe("noemaTestMode", () => {
  it("parses the internal slash commands exactly", () => {
    expect(parseNoemaTestCommand(`  ${NOEMA_TEST_COMMANDS.start}  `)).toEqual({
      type: "start",
      command: NOEMA_TEST_COMMANDS.start,
    });
    expect(parseNoemaTestCommand(NOEMA_TEST_COMMANDS.seed)).toEqual({
      type: "seed",
      command: NOEMA_TEST_COMMANDS.seed,
    });
    expect(parseNoemaTestCommand(NOEMA_TEST_COMMANDS.stop)).toEqual({
      type: "stop",
      command: NOEMA_TEST_COMMANDS.stop,
    });
    expect(parseNoemaTestCommand("/noema-test extra")).toBeNull();
  });

  it("authorizes test mode in dev or for allowlisted emails", () => {
    const allowedEmails = parseAllowedNoemaTestEmails("admin@example.com, qa@example.com");

    expect(isNoemaTestAuthorized({ isDev: true, allowedEmails })).toBe(true);
    expect(isNoemaTestAuthorized({ email: "qa@example.com", isDev: false, allowedEmails })).toBe(true);
    expect(isNoemaTestAuthorized({ email: "user@example.com", isDev: false, allowedEmails })).toBe(false);
  });

  it("builds the opening accelerated test reply with parseable UI metadata", () => {
    const response = startNoemaTestJourney();
    const ui = parseUI(response.raw);

    expect(stripUI(response.raw)).toContain("Mode test active.");
    expect(ui).toMatchObject({
      step: 0,
      session_index: 2,
      session_stage: "simulation interne",
      ikigai_revealed: false,
      messages_today: 0,
      messages_remaining: NOEMA_TEST_MAX_MESSAGES,
    });
    expect(ui.forces).toEqual([]);
  });

  it("advances toward a full synthetic journey with blocages and mission reveal", () => {
    const blocageStage = advanceNoemaTestJourney({ testMessageCount: 5 });
    const blocageUi = parseUI(blocageStage.raw);
    const missionStage = advanceNoemaTestJourney({ testMessageCount: 7 });
    const missionUi = parseUI(missionStage.raw);

    expect(blocageUi.blocages).toEqual({
      racine: "peur du jugement",
      entretien: "evitement de l'exposition",
      visible: "difficulte a passer a l'action",
    });
    expect(blocageUi.contradictions).toHaveLength(2);
    expect(missionUi.ikigai_revealed).toBe(true);
    expect(missionUi.ikigai.mission).toContain("retrouver de la clarte");
  });

  it("creates a seeded UI payload with coherent fake data", () => {
    const response = createNoemaSeededJourney();
    const ui = parseUI(response.raw);

    expect(ui).toMatchObject({
      step: 5,
      session_index: 8,
      ikigai_revealed: true,
      next_action: expect.stringContaining("version volontairement imparfaite"),
    });
    expect(ui.forces).toHaveLength(4);
    expect(ui.contradictions).toHaveLength(2);
    expect(ui.ikigai.mission).toContain("blocages et de leurs forces");
  });
});
