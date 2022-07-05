export class Question {
  key = "";
  prompt = "";
  domain = "";
  subdomain = 0;
  inverted = false;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(([k, v]) => {
        if (typeof v === "string") {
          switch (k) {
            case "key":
            case "prompt":
            case "domain":
              this[k] = v;
              break;
          }
        } else if (typeof v === "number" && k === "subdomain") {
          this.subdomain = v;
        } else if (typeof v === "boolean" && k === "inverted") {
          this.inverted = v;
        }
      });
    }
  }

  get seqNum() {
    return this.subdomain;
  }
}
