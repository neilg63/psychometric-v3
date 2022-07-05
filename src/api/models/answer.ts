export class Answer {
  key = "";
  value = 0;
  domain = "";
  facet = 0;

  constructor(inData: any = null) {
    if (inData instanceof Object) {
      Object.entries(inData).forEach(([k, v]) => {
        if (typeof v === "number") {
          if (k === "value") {
            this.value = v;
          } else if (["facet", "subdomain"].includes(k)) {
            this.facet = v;
          }
        } else if (typeof v === "string") {
          if (["domain"].includes(k)) {
            this.domain = v;
          } else if (["key"].includes(k)) {
            this.key = v;
          }
        }
      });
    }
  }
}
