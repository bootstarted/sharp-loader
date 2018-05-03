// @flow
const hashOptions = (v: *): string => {
  switch (typeof v) {
    case 'object':
      if (!v) {
        return '!null!';
      }
      if (Array.isArray(v)) {
        return v.map(hashOptions).join('|');
      }
      return Object.keys(v)
        .sort()
        .map((k) => {
          return k + hashOptions(v[k]);
        })
        .join('|');
    case 'string':
    case 'boolean':
    case 'number':
    case 'function':
      return v.toString();
    default:
      return '';
  }
};

export default hashOptions;
