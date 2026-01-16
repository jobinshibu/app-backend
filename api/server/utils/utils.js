import { createRequire } from 'module'; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const enums = require('../constant/enums.json');

export const dataParse = (data) => {
  return data ? JSON.parse(JSON.stringify(data)) : data;
};

export default enums;
