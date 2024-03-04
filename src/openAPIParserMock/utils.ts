function isObject(obj) {
  return !!obj && typeof obj === 'object';
}

function objectify(thing) {
  if (!isObject(thing)) return {};
  return thing;
}

function get(entity: any, path: (string | number)[]) {
  let current = entity;

  for (let i = 0; i < path.length; i += 1) {
    if (current === null || current === undefined) {
      return undefined;
    }

    current = current[path[i]];
  }

  return current;
}

function normalizeArray(arr) {
  if (Array.isArray(arr)) return arr;
  return [arr];
}

function isFunc(thing) {
  return typeof thing === 'function';
}

function inferSchema(thing) {
  if (thing.schema) {
    return thing.schema;
  }

  if (thing.properties) {
    return {
      ...thing,
      type: 'object',
    };
  }

  return thing;
}

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

export { isObject, get, objectify, isFunc, inferSchema, normalizeArray, getRandomInt };
