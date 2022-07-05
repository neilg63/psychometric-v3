export const randomInt = (min = 1, max = 5) => {
  const absMax = max - min + 1;
  return Math.floor(Math.random() * absMax * 0.999999) + min;
};
