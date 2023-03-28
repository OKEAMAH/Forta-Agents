export interface NetworkData {
  threshold: string;
}

export type AgentConfig = Record<number, NetworkData>;

export type Transfer = Record<string, string[]>;

export const BALANCEOF_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
];

export const updateRecord = async (from: string, to: string, transferObj: Transfer) => {
  /**
   * Logic is to persist data into transferObj as shown below
   *
   *  {
   *    attacker1: [victim1, victim2..]
   *    attacker2: [victim1, victim2, victim3..]
   *    ...
   *  }
   */

  // if the attacker is already in transferObj and the victim is not, push the new victim address
  if (transferObj[to] && !transferObj[to].includes(from)) {
    transferObj[to].push(from);
  }

  // if the attacker is not in db, append it
  else if (!transferObj[to]) {
    transferObj[to] = [from];
  }
};
