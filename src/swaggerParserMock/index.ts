/* eslint-disable no-continue */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
const memoizee = require('memoizee');

const utils = require('./utils');
const primitives = require('./primitives');

function primitive(schemaParams) {
  const schema = utils.objectify(schemaParams);

  const { type, format } = schema;
  const value = primitives[`${type}_${format}`] || primitives[type];

  if (typeof schema.example === 'undefined') {
    return value || `Unknown Type: ${schema.type}`;
  }

  return schema.example;
}

function sampleFromSchema(schema) {
  const localSchema = utils.objectify(schema);

  let { type } = localSchema;
  const { properties } = localSchema;
  const { additionalProperties } = localSchema;
  const { items } = localSchema;

  if (!type) {
    if (properties) {
      type = 'object';
    } else if (items) {
      type = 'array';
    } else {
      return null;
    }
  }

  if (type === 'object') {
    const props = utils.objectify(properties);
    const obj: Record<string, any> = {};
    for (const name in props) {
      obj[name] = sampleFromSchema(props[name]);
    }

    if (additionalProperties === true) {
      obj.additionalProp1 = {};
      return obj;
    }
    if (additionalProperties) {
      const additionalProps = utils.objectify(additionalProperties);
      const additionalPropVal = sampleFromSchema(additionalProps);

      for (let i = 1; i < 4; i += 1) {
        obj[`additionalProp${i}`] = additionalPropVal;
      }
    }
    return obj;
  }

  if (type === 'array') {
    return [sampleFromSchema(items)];
  }

  if (localSchema.enum) {
    if (localSchema.default) return localSchema.default;
    return utils.normalizeArray(localSchema.enum)[0];
  }

  if (type === 'file') {
    return null;
  }

  return primitive(localSchema);
}

const memoizedSampleFromSchema = memoizee(sampleFromSchema);

function getSampleSchema(schema) {
  return JSON.stringify(memoizedSampleFromSchema(schema), null, 2);
}

const parser = (spec) => {
  const isOAS3 = spec.openapi && spec.openapi === '3.0.0';
  for (const path in spec.paths) {
    for (const method in spec.paths[path]) {
      const api = spec.paths[path][method];
      let schema;
      for (const code in api.responses) {
        const response = api.responses[code];
        if (isOAS3) {
          schema =
            response.content &&
            response.content['application/json'] &&
            utils.inferSchema(response.content['application/json']);
          response.example = schema ? getSampleSchema(schema) : null;
        } else {
          schema = utils.inferSchema(response);
          response.example = schema ? getSampleSchema(schema) : null;
        }
      }
      if (!api.parameters) continue;
      for (const parameter of api.parameters) {
        schema = utils.inferSchema(parameter);
        parameter.example = schema ? getSampleSchema(schema) : null;
      }
    }
  }
  return spec;
};

export default parser;
