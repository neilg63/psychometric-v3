import { big5Categories, jungianCategories } from "../setings";
import { notEmptyString } from "../validators";

export class FeedbackItem {
  lang = "en";
  text = "";
  constructor(inData: any = null) {
    if (inData instanceof Object) {
      const { lang, text } = inData;
      if (notEmptyString(lang)) {
        this.lang = lang;
      }
      if (notEmptyString(text)) {
        this.text = text;
      }
    }
  }
}

const matchFeedback = (lang = "", fbs: FeedbackItem[] = []): string => {
  const parts = lang.split("-");
  const matchLongLang = parts.length > 1;
  const baseLang = parts[0];
  let bestIndex = 0;
  const fbItems = fbs.filter(
    (item) => item.lang.split("-").shift() === baseLang
  );
  if (matchLongLang && fbItems.length > 0) {
    const mIndex = fbItems.findIndex((item) => item.lang === lang);
    if (mIndex >= 0) {
      bestIndex = mIndex;
    }
  }
  return fbItems.length > 0
    ? fbItems[bestIndex].text
    : fbs.length > 0
    ? fbs[0].text
    : "";
};

export class FacetSet {
  num = 0;
  title = "";
  count = 0;
  score = 0;
  max = 5;
  result = "";
  feedback: FeedbackItem[] = [];

  constructor(inData: any = null, mode = "facet") {
    if (inData !== null && inData instanceof Object) {
      Object.entries(inData).forEach(([k, v]) => {
        if (typeof v === "string") {
          switch (k) {
            case "title":
            case "result":
              this[k] = v;
              break;
          }
        } else if (typeof v === "number") {
          switch (k) {
            case "count":
            case "score":
            case "num":
              this[k] = v;
              break;
          }
        } else if (v instanceof Array && k == "feedback" && mode === "facet") {
          this.feedback = v.map((item) => new FeedbackItem(item));
        }
      });
    }
  }

  get key() {
    return ["facet", this.num].join("-");
  }

  get pc() {
    return this.percent(0);
  }

  get pcZero() {
    return this.percent(1);
  }

  get pcZeroStr() {
    return `${Math.round(this.pcZero)}%`;
  }

  get pcZeroStr3() {
    return `${this.pcZero}%`;
  }

  percent(offset = 0) {
    const maxVal = this.max - offset;
    const scoreVal = this.score - offset * this.count;
    const frac = scoreVal / (this.count * maxVal);
    return Math.round(frac * 100 * 1000) / 1000;
  }

  get total() {
    return this.count * this.max;
  }

  feedbackText(lang = "en") {
    return matchFeedback(lang, this.feedback);
  }
}

export class DomainSet extends FacetSet {
  domain = "";
  facets: FacetSet[] = [];
  feedback2: FeedbackItem[] = [];

  constructor(inData: any = null, domainKey = "") {
    super(inData, "domain");
    this.domain = domainKey;
    if (inData !== null && inData instanceof Object) {
      const keys = Object.keys(inData);
      if (keys.includes("facets") && inData.facets instanceof Array) {
        this.facets = inData.facets.map((fc: any) => new FacetSet(fc));
      }
      if (keys.includes("feedback") && inData.feedback instanceof Array) {
        this.feedback = inData.feedback.map(
          (item: any) => new FeedbackItem(item)
        );
      }
      if (keys.includes("feedback2") && inData.feedback2 instanceof Array) {
        this.feedback2 = inData.feedback2.map(
          (item: any) => new FeedbackItem(item)
        );
      }
    }
  }

  get key() {
    return ["domain", this.domain.toLowerCase()].join("-");
  }

  get positive() {
    return this.pcZero >= 50;
  }

  get pcPoled() {
    const pc = this.percent(1);
    return pc >= 50 ? (pc - 50) * 2 : (50 - pc) * 2;
  }

  get pcPoledStr() {
    return `${Math.round(this.pcPoled)}%`;
  }

  get pcPoledStr3() {
    return `${this.pcPoled}%`;
  }

  get poleLabel() {
    const parts = this.title.split(/\s*[–-]+\s*/);
    return this.positive ? (parts.length > 1 ? parts[1] : parts[0]) : parts[0];
  }

  get poleLetter() {
    const parts = this.domain.split("");
    return this.positive ? (parts.length > 1 ? parts[1] : parts[0]) : parts[0];
  }

  feedbackText(lang = "en") {
    return matchFeedback(lang, this.feedback);
  }

  feedbackText2(lang = "en") {
    return matchFeedback(lang, this.feedback2);
  }
}

export class AnalysisSet {
  key = "";
  domainMap: Map<string, any> = new Map();
  name = "";

  constructor(key = "", inData: any = null, name = "") {
    this.key = key;
    const trName = name.trim();
    if (notEmptyString(trName)) {
      this.name = trName;
    }
    if (inData instanceof Object) {
      this.domainMap = new Map(Object.entries(inData));
    }
  }

  get hasName() {
    return notEmptyString(this.name);
  }

  getDomainSets(): DomainSet[] {
    const rows: DomainSet[] = [];
    big5Categories.forEach((ct) => {
      if (this.domainMap.has(ct.key)) {
        const itemData = this.domainMap.get(ct.key);
        if (itemData instanceof Object) {
          rows.push(new DomainSet(itemData, ct.key));
        }
      }
    });
    return rows;
  }

  getPolaritySets(): DomainSet[] {
    const rows: DomainSet[] = [];
    jungianCategories.forEach((ct) => {
      if (this.domainMap.has(ct.key)) {
        const itemData = this.domainMap.get(ct.key);
        if (itemData instanceof Object) {
          rows.push(new DomainSet(itemData, ct.key));
        }
      }
    });
    return rows;
  }

  getPolarityData() {
    const rowsLower: any[] = [];
    const rowsHigher: any[] = [];
    jungianCategories.forEach((ct) => {
      if (this.domainMap.has(ct.key)) {
        const itemData = this.domainMap.get(ct.key);
        if (itemData instanceof Object) {
          const keyLetters = ct.key.split("");
          const names = ct.title.split(/\s*[–-]\s*/).map((s) => s.trim());
          keyLetters.forEach((letter, li) => {
            const pc = li < 1 ? 100 - itemData.pc : itemData.pc;
            const title = names[li];
            const row = {
              key: letter,
              title,
              pc,
            };
            if (li < 1) {
              rowsLower.push(row);
            } else {
              rowsHigher.push(row);
            }
          });
        }
      }
    });
    return [...rowsHigher, ...rowsLower];
  }
}
