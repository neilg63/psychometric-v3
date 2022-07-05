import axios from "axios";
import { notEmptyString } from "./validators";
import { api } from "../.config";
import { buildOptions } from "./build-headers";
import { User } from "./models/user";
import { KeyValue } from "./interfaces";
import { fromLocal } from "./localstore";

const extractDataObj = (res: any) => {
  if (res instanceof Object) {
    const { data } = res;
    if (data instanceof Object || data instanceof Array) {
      return data;
    }
  }
};

const postData = async (
  path: string,
  params: any = null,
  callback: any = null,
  putMode = false
) => {
  let result: any = {};
  const isFormData = params instanceof FormData;
  const func = putMode !== true ? axios.post : axios.put;
  await func(`${api.base}${path}`, params, buildOptions(isFormData, callback))
    .then((res) => {
      result = res;
    })
    .catch((e) => {
      result.error = e;
    });
  return result;
};

/* const putData = async (path: string, params = null, callback: any = null) => {
  return postData(path, params, callback, true);
}; */

const fetchData = async (path: string, deleteMode = false, userId = "") => {
  let result: any = {};
  const func = deleteMode !== true ? axios.get : axios.delete;
  await func(`${api.base}${path}`, buildOptions(false, null, userId))
    .then((res) => {
      result = res;
    })
    .catch((e) => {
      result.error = e;
    });
  return result;
};

const fetchContent = async (path = "", userId = "") => {
  return fetchData(path, false, userId);
};

/* const buildQueryString = (criteria: any = null, literal = false) => {
  let str = "";
  if (criteria instanceof Object) {
    const parts: Array<string> = [];
    Object.entries(criteria).forEach((entry) => {
      const [key, val] = entry;
      let paramVal = val;
      if (typeof val === "string") {
        paramVal = literal ? val : encodeURIComponent(val);
      } else if (typeof val === "number" || typeof val === "boolean") {
        paramVal = val.toString();
      } else if (val instanceof Array) {
        paramVal = val.join(",");
      }
      parts.push(key + "=" + paramVal);
    });
    if (parts.length > 0) {
      str = "?" + parts.join("&");
    }
  }
  return str;
}; */

export const getData = async (path: string) => {
  let data = { valid: false };
  await fetchContent(path).then((response) => {
    if (response.data) {
      data = response.data;
      data.valid = true;
    }
  });
  return data;
};

export const fetchDataObject = async (
  path: string,
  userId = ""
): Promise<any> => {
  let data: any = { valid: false };
  await fetchContent(path, userId).then((res) => {
    const result = extractDataObj(res);
    if (result instanceof Object) {
      data = result;
    }
  });
  return data;
};

export const fetchPreferenceOptions = async (
  survey = "preference_options",
  refresh = false
): Promise<any> => {
  const surveyKey = notEmptyString(survey, 4) ? survey : "preference_options";
  const parts = ["user/preferences", surveyKey];
  if (refresh) {
    parts.push("1");
  }
  const path = parts.join("/");
  return await fetchDataObject(path);
};

export const testFacetedSurveyAnswers = async (
  type = "faceted",
  items: any[] = [],
  refresh = false
): Promise<any> => {
  const parts = ["user", "test-surveys", type];
  if (refresh) {
    parts.push("1");
  }
  if (items instanceof Array && items.length > 0) {
    const response = await postData(parts.join("/"), items);
    if (response instanceof Object) {
      const { data } = response;
      if (data instanceof Object) {
        return { ...data, valid: true };
      }
    }
  }
  return { valid: false };
};

export const savePublicUser = async (
  user: User,
  responses: KeyValue[] = [],
  type = ""
): Promise<any> => {
  const parts = ["user", "public-save"];
  let preferences: KeyValue[] = [];
  if (
    responses instanceof Array &&
    responses.length > 0 &&
    notEmptyString(type)
  ) {
    preferences = responses
      .filter((r) => r instanceof Object)
      .map((r) => {
        return { ...r, type };
      });
  }
  const payload = { ...user, preferences };
  const response = await postData(parts.join("/"), payload);
  if (response instanceof Object) {
    const { data } = response;
    if (data instanceof Object) {
      return { ...data, valid: true };
    }
  }
  return { valid: false };
};

export const fetchSetting = async (key: string): Promise<any> => {
  const path = "setting/by-key/" + key;
  return await fetchDataObject(path);
};

export const fetchSessionUser = () => {
  const storedUser = fromLocal("publicuser", 7 * 24 * 60 * 60);
  const userData = storedUser.expired ? null : storedUser.data;
  return new User(userData);
};
