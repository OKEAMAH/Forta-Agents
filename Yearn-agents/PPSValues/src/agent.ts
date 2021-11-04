import BigNumber from "bignumber.js";
import {
  BlockEvent,
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";
import Web3 from "web3";
import { vaultAbi, getYearnVaults } from "./utils";

const web3 = new Web3(getJsonRpcUrl());

export const createFinding = (
  pps: string,
  tracker: string,
  reason: string,
  id: number
) => {
  return Finding.fromObject({
    name: "Yearn PPS Agent",
    description: `Year PPS value: ${reason}`,
    alertId: `Yearn-8-${id}`,
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      pps,
      tracker,
    },
  });
};

interface Tracker {
  [key: string]: BigNumber;
}

const provideHandleFunction = (web3: Web3): HandleBlock => {
  const threshold = 0.1;
  let tracker: Tracker = {};

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const blockNumber = blockEvent.blockNumber;
    const vaults = await getYearnVaults(web3, blockNumber);

    let promises = [];

    for (let i of vaults) {
      const vault = new web3.eth.Contract(vaultAbi as any, i);

      promises.push(vault.methods.getPricePerFullShare().call({}, blockNumber));
    }

    promises = await Promise.all(promises);

    console.log(promises);

    promises.forEach((pps, index) => {
      const vaultAddress = vaults[index];
      const vaultPrevValue = tracker[vaultAddress];
      console.log(vaultAddress, vaultPrevValue, tracker);

      // pps should increase only
      if (pps.isLessThan(vaultPrevValue)) {
        findings.push(
          createFinding(
            pps.toString(),
            vaultPrevValue.toString(),
            "Decrease in PPS",
            1
          )
        );
      }

      // swift change in pps
      if (
        Math.abs(
          pps.minus(vaultPrevValue).dividedBy(vaultPrevValue).toNumber()
        ) > threshold
      ) {
        findings.push(
          createFinding(
            pps.toString(),
            vaultPrevValue.toString(),
            "Very Swift change",
            2
          )
        );
      }

      tracker[vaultAddress] = pps;
    });

    return findings;
  };
};

export default {
  handleBlock: provideHandleFunction(web3),
  provideHandleFunction,
};
