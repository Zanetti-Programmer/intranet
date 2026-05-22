import PocketBase from "pocketbase";

const PB_URL = process.env.NEXT_PUBLIC_PB_URL ?? "http://localhost:8090";

let pb: PocketBase;

export function getPocketBase(): PocketBase {
  if (!pb) {
    pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);
  }
  return pb;
}

export default getPocketBase;
