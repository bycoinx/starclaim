import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import 'fast-text-encoding';

global.Buffer = Buffer;

if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString('binary');
  };
}

process.env.NODE_DEBUG = undefined;
