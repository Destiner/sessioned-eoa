import { send as sendOp } from "./utils/send_op.js";

const hash = await sendOp([
  {
    target: "0x0000000000000000000000000000000000000001",
    value: 1n,
    callData: "0x",
  },
  {
    target: "0x0000000000000000000000000000000000000002",
    value: 2n,
    callData: "0x",
  },
]);
console.log("Transaction Hash:", hash);
