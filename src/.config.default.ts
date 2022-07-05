import { ApiDetails } from "./config.interfaces";

export const api: ApiDetails = {
  base: "/api/", // path to backend API server
  key: "abc-_123789", // must match server API key
  suffixSplitChars: ["%", ".", ","], // must match server settings
};
