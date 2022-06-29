import { HandleTransaction, ethers } from "forta-agent";
import { TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";

import { NEW_RANDOM_GENERATOR_FINDING, randomGenerator } from "./bot.test.constants";

import bot from "./new.random.generator";
import { EVENTS, PANCAKE_SWAP_LOTTERY_ADDRESS } from "./bot.config";

describe("PancakeSwap Lottery", () => {
  let handleTransaction: HandleTransaction;
  let mockTxEvent: TestTransactionEvent;
  let eventInterface: ethers.utils.Interface;

  beforeEach(() => {
    mockTxEvent = new TestTransactionEvent();
  });

  beforeAll(() => {
    handleTransaction = bot.handleTransaction;
    eventInterface = new ethers.utils.Interface([EVENTS.NewRandomGenerator]);
  });

  describe("NewRandomGenerator handleTransaction", () => {
    it("returns no findings if there are no NewRandomGenerator events emitted ", async () => {
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns findings if there are NewRandomGenerator events emitted ", async () => {
      const eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("NewRandomGenerator"), [randomGenerator]);

      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([NEW_RANDOM_GENERATOR_FINDING]);
    });

    it("returns findings if there are multiple NewRandomGenerator events emitted ", async () => {
      const eventLog = eventInterface.encodeEventLog(eventInterface.getEvent("NewRandomGenerator"), [randomGenerator]);

      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        NEW_RANDOM_GENERATOR_FINDING,
        NEW_RANDOM_GENERATOR_FINDING,
        NEW_RANDOM_GENERATOR_FINDING,
      ]);
    });

    it("returns no findings if the event emitted is not the correct one ", async () => {
      let wrongEventInterface = new ethers.utils.Interface(["event WrongEvent(uint256 x)"]);

      const eventLog = wrongEventInterface.encodeEventLog(wrongEventInterface.getEvent("WrongEvent"), [120]);
      mockTxEvent.addAnonymousEventLog(PANCAKE_SWAP_LOTTERY_ADDRESS, eventLog.data, ...eventLog.topics);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });
  });
});
