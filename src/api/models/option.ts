import { smartCastInt } from "../converters";

export class Option {
  value = 0;
  title = "";

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(([k, v]) => {
        if (typeof v === "number" && k === "value") {
          this.value = v;
        } else if (typeof v === "string" && k === "key") {
          this.value = smartCastInt(v);
        } else if (typeof v === "string") {
          if (["title", "name"].includes(k)) {
            this.title = v;
          }
        }
      });
    }
  }

  get key() {
    return ["option", this.value].join("-");
  }

  itemKey(context = "") {
    return [this.key, context].join("-");
  }
}
