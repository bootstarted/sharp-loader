import jsonify from 'fast-json-stable-stringify';
import {createHash} from 'crypto';

export const hashOptions = (v: any): string => {
  return createHash('sha1').update(jsonify(v)).digest('base64');
};
