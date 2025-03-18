import { Joint } from "./io";
import { Offset } from "./utils";

export default class Wire {
  constructor(public from: Joint, public to: Joint, public path: Offset[] = []) {
    this.from.connect(this.to)
  }
}