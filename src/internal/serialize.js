// @flow

export class Serializable {
  render: () => string;
  constructor(render: () => string) {
    this.render = render;
  }
}

const UNICODE_CHARS = {
  '"': '\\"',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '<': '\\u003C',
  '>': '\\u003E',
  '/': '\\u002F',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

const safeString = (str) => {
  return str.replace(/[\r\n\t<>\u2028\u2029"/]/, (unsafeChar) => {
    return UNICODE_CHARS[unsafeChar];
  });
};

const serialize = (source: *) => {
  if (source instanceof Serializable) {
    return source.render();
  }
  if (source === null) {
    return 'null';
  } else if (Array.isArray(source)) {
    const tmp = source.map((item) => {
      return serialize(item);
    });
    return `[${tmp.join(',')}]`;
  } else if (typeof source === 'object') {
    const tmp = Object.keys(source).map((key) => {
      // TODO: FIXME: Anything better for flow?
      // $ExpectError
      return `"${safeString(key)}": ${serialize(source[key])}`;
    });
    return `{${tmp.join(',')}}`;
  } else if (typeof source === 'string') {
    return `"${safeString(source)}"`;
  }
  return `${source}`;
};

export default serialize;
