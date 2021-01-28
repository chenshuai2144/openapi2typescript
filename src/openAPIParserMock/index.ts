/* eslint-disable no-continue */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
import memoizee from 'memoizee';

import * as utils from './utils';
import primitives from './primitives';

const getDateByName = (name: string[] | string, parentsKey?: string[]) => {
  if (!name || name.length < 1) {
    return 'string';
  }
  if (Array.isArray(name)) {
    return getDateByName([...name].pop(), name);
  }
  if (['nickname', 'name'].includes(name)) {
    return 'cname';
  }
  if (['owner', 'firstName', 'lastName', 'username'].includes(name)) {
    return 'name';
  }
  if (['avatar'].includes(name)) {
    return 'avatar';
  }

  if (['group'].includes(name)) {
    return 'group';
  }

  if (name.toLocaleLowerCase().endsWith('id')) {
    return 'uuid';
  }

  if (
    name.toLocaleLowerCase().endsWith('type') ||
    name.toLocaleLowerCase().endsWith('key') ||
    ['key'].includes(name)
  ) {
    return 'id';
  }

  if (name.toLocaleLowerCase().endsWith('label') || ['label'].includes(name)) {
    const newParents = [...parentsKey];
    newParents.pop();
    const newType = getDateByName(newParents);
    if (newType !== 'string' && newType !== 'csentence') {
      return newType;
    }

    return 'label';
  }

  if (['email'].includes(name)) {
    return 'email';
  }
  if (['password'].includes(name)) {
    return 'string(16)';
  }
  if (['phone'].includes(name)) {
    return 'phone';
  }
  if (['province'].includes(name)) {
    return 'province';
  }
  if (['city'].includes(name)) {
    return 'city';
  }
  if (['addr', 'address'].includes(name)) {
    return 'county';
  }

  if (['country'].includes(name)) {
    return 'country';
  }

  if (
    ['url', 'imageUrl', 'href'].includes(name) ||
    name.toLocaleLowerCase().endsWith('url') ||
    name.toLocaleLowerCase().endsWith('urls') ||
    name.toLocaleLowerCase().endsWith('image') ||
    name.toLocaleLowerCase().endsWith('link')
  ) {
    return 'href';
  }

  if (name.toLocaleLowerCase().endsWith('errorcode')) {
    return 'errorCode';
  }

  if (
    ['type', 'status'].includes(name) ||
    name.toLocaleLowerCase().endsWith('status') ||
    name.toLocaleLowerCase().endsWith('type')
  ) {
    return 'status';
  }

  if (name.toLocaleLowerCase().endsWith('authority')) {
    return 'authority';
  }

  return 'csentence';
};

function primitive(schemaParams, propsName) {
  const schema = utils.objectify(schemaParams);
  const { type, format } = schema;
  const value = primitives[`${type}_${format || getDateByName(propsName)}`] || primitives[type];

  if (typeof schema.example === 'undefined') {
    return value || `Unknown Type: ${schema.type}`;
  }
  return schema.example;
}

class OpenAPIGeneratorMockJs {
  protected openAPI: any;
  constructor(openAPI) {
    this.openAPI = openAPI;
    this.sampleFromSchema = memoizee(this.sampleFromSchema);
  }

  sampleFromSchema = (schema: any, propsName?: string[]) => {
    const localSchema = schema.$ref
      ? utils.get(this.openAPI, schema.$ref.replace('#/', '').split('/'))
      : utils.objectify(schema);

    let { type } = localSchema;
    const { properties, additionalProperties, items } = localSchema;

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
        obj[name] = this.sampleFromSchema(props[name], [...(propsName || []), name]);
      }

      if (additionalProperties === true) {
        obj.additionalProp1 = {};
        return obj;
      }
      if (additionalProperties) {
        const additionalProps = utils.objectify(additionalProperties);
        const additionalPropVal = this.sampleFromSchema(additionalProps, propsName);

        for (let i = 1; i < 4; i += 1) {
          obj[`additionalProp${i}`] = additionalPropVal;
        }
      }
      return obj;
    }

    if (type === 'array') {
      const item = this.sampleFromSchema(items, propsName);
      return new Array(parseInt((Math.random() * 20).toFixed(0), 10)).fill(item);
    }

    if (localSchema.enum) {
      if (localSchema.default) return localSchema.default;
      return utils.normalizeArray(localSchema.enum)[0];
    }

    if (type === 'file') {
      return null;
    }
    return primitive(localSchema, propsName);
  };

  parser = () => {
    const openAPI = {
      ...this.openAPI,
    };
    for (const path in openAPI.paths) {
      for (const method in openAPI.paths[path]) {
        const api = openAPI.paths[path][method];
        for (const code in api.responses) {
          const response = api.responses[code];
          const schema =
            response.content &&
            response.content['application/json'] &&
            utils.inferSchema(response.content['application/json']);

          if (schema) {
            response.example = schema ? this.sampleFromSchema(schema) : null;
          }
        }
        if (!api.parameters) continue;
        for (const parameter of api.parameters) {
          const schema = utils.inferSchema(parameter);
          parameter.example = schema ? this.sampleFromSchema(schema) : null;
        }
      }
    }
    return openAPI;
  };
}

export default OpenAPIGeneratorMockJs;
