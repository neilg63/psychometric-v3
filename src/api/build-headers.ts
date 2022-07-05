import { api } from "../.config";

const randChar = (chars: string[]) => {
  const len = chars.length;
  const randIndex = Math.floor(Math.random() * len * 0.9999999);
  return chars[randIndex];
};

const randInt36 = (power = 3) => {
  const randInt = Math.floor(
    Math.random() * Math.pow(10, power) * 0.9999999999
  );
  return randInt.toString(36);
};

export const toDynamicKey = (): string => {
  const { key, suffixSplitChars } = api;
  const ts = new Date().getTime();
  const tsList = ts.toString(36).split("").reverse();
  const offset = (parseInt(tsList[0], 36) % 6) + 1;
  const mergedList = tsList.map((ch, index) =>
    index === offset ? ch + key : ch
  );
  const baseStr = [mergedList.join(""), randInt36(3)].join(
    randChar(suffixSplitChars)
  );
  return btoa(baseStr);
};

export const buildOptions: any = (isFormData = false, callback: any = null) => {
  const { key } = api;
  const options: any = {};
  const headers: any = {};

  if (isFormData) {
    headers["X-Requested-With"] = "XMLHttpRequest";
    headers["Content-Type"] = "multipart/form-data";
    if (callback instanceof Function) {
      options.onUploadProgress = callback;
    }
  }

  if (key) {
    if (key.length > 1) {
      headers.apikey = key;
      headers.token = toDynamicKey();
    }
  }
  options.headers = headers;
  return options;
};
