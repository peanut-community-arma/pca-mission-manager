// Taken from: https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_pick
// License is MIT/Expat

export default function pick(object, keys) {
  return keys.reduce((obj, key) => {
     if (object && Object.prototype.hasOwnProperty.call(object, key)) {
        obj[key] = object[key];
     }
     return obj;
   }, {});
}
