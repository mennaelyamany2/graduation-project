// filter the request body when updating a document

module.exports = (obj, ...notAllowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (!notAllowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
