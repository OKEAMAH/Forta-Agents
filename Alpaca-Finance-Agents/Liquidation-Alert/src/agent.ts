import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
} from 'forta-agent';

const VAULT_ADDRESSES: string[] = [
  "0x7C9e73d4C71dae564d41F78d56439bB4ba87592f".toLowerCase(), // BUSD
  "0xbfF4a34A4644a113E8200D7F1D79b3555f723AfE".toLowerCase(), // ETH
  "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7".toLowerCase(), // BTCB
  "0x08FC9Ba2cAc74742177e0afC3dC8Aed6961c24e7".toLowerCase(), // USDT
  "0xf1bE8ecC990cBcb90e166b71E368299f0116d421".toLowerCase(), // ALPACA
  "0x3282d2a151ca00BfE7ed17Aa16E42880248CD3Cd".toLowerCase()  // TUSD
]

const killEventAbi: string = "event Kill(uint256 indexed id, address indexed killer, address owner, uint256 posVal, uint256 debt, uint256 prize, uint256 left)";

const createAgentThreeFinding = (
  posId: number,
  killer: string,
  posOwner: string,
  posVal: number,
  debt: number,
  prize: number,
  left: number,
  vaultAddress: string
): Finding => {
  const finding: Finding = Finding.fromObject({
    name: "Liquidation Event",
    description: "Liquidation Has Occurred",
    alertId: "ALPACA-3",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata:{
      positionId: posId.toString(),
      positionkiller: killer,
      positionOwner: posOwner,
      positionValue: posVal.toString(),
      debt: debt.toString(),
      prize: prize.toString(),
      left: left.toString(),
      vault: vaultAddress
    },
  })
  return finding;
}

const createAgentFourFinding = (
  posId: number,
  killer: string,
  posOwner: string,
  posVal: number,
  debt: number,
  prize: number,
  left: number,
  vaultAddress: string
): Finding => {
  const finding: Finding = Finding.fromObject({
    name: "Bad Debt Event",
    description: "Target position has 0 'left'",
    alertId: "ALPACA-4",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata:{
      positionId: posId.toString(),
      positionkiller: killer,
      positionOwner: posOwner,
      positionValue: posVal.toString(),
      debt: debt.toString(),
      prize: prize.toString(),
      left: left.toString(),
      vault: vaultAddress
    },
  });
  return finding;
}

export function provideHandleTransaction(
  addresses: string[]
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const killEvents = txEvent.filterLog(killEventAbi);

    for(let i = 0; i < killEvents.length; i++) {
      if(addresses.includes(killEvents[i].address)) {
        const newAgentThreeFinding: Finding = createAgentThreeFinding(
          killEvents[i].args["id"],
          killEvents[i].args["killer"],
          killEvents[i].args["owner"],
          killEvents[i].args["posVal"],
          killEvents[i].args["debt"],
          killEvents[i].args["prize"],
          killEvents[i].args["left"],
          killEvents[i].address
        );
        findings.push(newAgentThreeFinding);

        if(Number(killEvents[i].args["left"]) === 0) {
          const newAgentFourFinding: Finding = createAgentFourFinding(
            killEvents[i].args["id"],
            killEvents[i].args["killer"],
            killEvents[i].args["owner"],
            killEvents[i].args["posVal"],
            killEvents[i].args["debt"],
            killEvents[i].args["prize"],
            killEvents[i].args["left"],
            killEvents[i].address
          );
          findings.push(newAgentFourFinding);
        }
      }
    }

    return findings
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    VAULT_ADDRESSES
  )
};