export const defaultSurveyOptions = [
  {
    key: "faceted_personality_options",
    title: "Big 5",
    type: "faceted",
    mode: "big5",
  },
  {
    key: "jungian_options",
    title: "Jungian",
    type: "jungian",
    mode: "jungian",
  },
];

export const defaultViewOptions = [
  {
    key: "survey",
    title: "Survey Questions",
    show: "all",
    icon: "pi-th-large",
  },
  {
    key: "results",
    title: "Results",
    icon: "pi-chart-bar",
    show: "completed",
  },
  {
    key: "user",
    title: "User details",
    icon: "pi-user-edit",
    show: "all",
  },
];

export const big5Categories = [
  {
    key: "O",
    title: "Openness to experience",
    facets: [
      { num: 1, title: "Imagination" },
      { num: 2, title: "Artistic Interests" },
      { num: 3, title: "Emotionality" },
      { num: 4, title: "Adventurousness" },
      { num: 5, title: "Intellect" },
      { num: 6, title: "Liberalism" },
    ],
  },
  {
    key: "C",
    title: "Conscientiousness",
    facets: [
      { num: 1, title: "Self-Efficacy" },
      { num: 2, title: "Orderliness" },
      { num: 3, title: "Dutifulness" },
      { num: 4, title: "Achievement-Striving" },
      { num: 5, title: "Self-Discipline" },
      { num: 6, title: "Cautiousness" },
    ],
  },
  {
    key: "E",
    title: "Extroversion",
    facets: [
      { num: 1, title: "Friendliness" },
      { num: 2, title: "Gregariousness" },
      { num: 3, title: "Assertiveness" },
      { num: 4, title: "Activity Level" },
      { num: 5, title: "Excitement-Seeking" },
      { num: 6, title: "Cheerfulness" },
    ],
  },
  {
    key: "A",
    title: "Agreeableness",
    facets: [
      { num: 1, title: "Trust" },
      { num: 2, title: "Morality" },
      { num: 3, title: "Altruism" },
      { num: 4, title: "Cooperation" },
      { num: 5, title: "Modesty" },
      { num: 6, title: "Sympathy" },
    ],
  },
  {
    key: "N",
    title: "Neuroticism",
    facets: [
      { num: 1, title: "Anxiety" },
      { num: 2, title: "Anger" },
      { num: 3, title: "Depression" },
      { num: 4, title: "Self-Consciousness" },
      { num: 5, title: "Immoderation" },
      { num: 6, title: "Vulnerability" },
    ],
  },
];

export const jungianCategories = [
  { key: "IE", title: "Introversion - Extroversion" },
  { key: "SN", title: "Sensing – Intuition" },
  { key: "FT", title: "Feeling – Thinking" },
  { key: "JP", title: "Judging – Perceiving" },
];

export const defaultGraphPropSet = {
  label: "",
  backgroundColor: "rgba(179,181,198,0.2)",
  borderColor: "rgba(179,181,198,1)",
  pointBackgroundColor: "rgba(179,181,198,1)",
  pointBorderColor: "#fff",
  pointHoverBackgroundColor: "#fff",
  pointHoverBorderColor: "rgba(179,181,198,1)",
};

export const defaultBarPropSet = {
  label: "",
  barPercentage: 15,
  barThickness: 50,
  maxBarThickness: 100,
  minBarLength: 2,
  backgroundColor: ["rgba(102,102,102, 0.5)"],
};

export const defaultGenderOptions = [
  {
    key: "f",
    title: "Female",
  },
  {
    key: "m",
    title: "Male",
  },
  {
    key: "o",
    title: "Other",
  },
];

export const graphColours = [
  "rgba(204,0,0, 0.5)",
  "rgba(0,204,0, 0.5)",
  "rgba(0,0,204, 0.5)",
  "rgba(153,153,0, 0.5)",
  "rgba(153,0,153, 0.5)",
  "rgba(0,153,153, 0.5)",
];

export const matchGraphColour = (index = 0) => {
  const targetIndex = index >= 0 ? index % graphColours.length : 0;
  return graphColours[targetIndex];
};
