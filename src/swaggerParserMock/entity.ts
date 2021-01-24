/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
const utils = require('./utils');

function flatSchema(schemaParams, models) {
  const schema = utils.objectify(schemaParams);

  let { type } = schema;
  const { properties } = schema;
  const { additionalProperties } = schema;
  const { items } = schema;
  const { $$ref } = schema;

  if (!type) {
    if (properties) {
      type = 'object';
    } else if (items) {
      type = 'array';
    } else {
      return;
    }
  }

  if ($$ref) {
    models.push(schema);
  }

  if (type === 'object') {
    const props = utils.objectify(properties);

    for (const name in props) {
      flatSchema(props[name], models);
    }

    if (additionalProperties && additionalProperties !== true) {
      const additionalProps = utils.objectify(additionalProperties);
      flatSchema(additionalProps, models);
    }
  }

  if (type === 'array') {
    flatSchema(items, models);
  }
}

function getClassName(schema) {
  const ref = schema.$$ref;
  return ref ? ref.replace(/.*\//g, '') : 'Demo';
}

function getValueByJS(prop) {
  let { type } = prop;
  const { properties } = prop;
  const { items } = prop;

  if (!type) {
    if (properties) {
      type = 'object';
    } else if (items) {
      type = 'array';
    }
  }

  switch (type) {
    case 'integer':
    case 'number':
      return 0;
    case 'array':
      return `[${getValueByJS(items)}]`;
    case 'boolean':
      return false;
    case 'object':
      return getClassName(prop);
    default:
      return "''";
  }
}

function getValueByOC(key, prop) {
  let value;
  switch (prop.type) {
    case 'integer':
    case 'number':
      value = `@property (nonatomic, strong) NSNumber *${key};`;
      break;
    case 'array':
      value = `@property (nonatomic, copy) NSArray *${key};`;
      break;
    case 'boolean':
      value = `@property (nonatomic, assign) BOOL ${key};`;
      break;
    default:
      value = `@property (nonatomic, copy) NSString *${key};`;
      break;
  }
  return `${value}\n`;
}

function getEntities(docsParams, type) {
  const docs = (docsParams.content && docsParams.content['application/json']) || docsParams;

  const models = [];
  const schema = utils.inferSchema(docs);

  if (schema) {
    flatSchema(schema, models);
  }

  return models.map((model) => {
    const { properties } = model;
    const props = [];
    let propName;

    if (type === 'js') {
      for (propName in properties) {
        props.push(`this.${propName} = ${getValueByJS(properties[propName])};`);
      }
      return `class ${getClassName(model)} {constructor() {${props.join('')}}}`;
    }

    for (propName in properties) {
      props.push(getValueByOC(propName, properties[propName]));
    }
    return `@interface ${getClassName(model)} : NSObject\n\n${props.join('')}\n@end`;
  });
}

module.exports = {
  getJavaScriptEntities(docs) {
    return getEntities(docs, 'js');
  },
  getObjectiveCEntities(docs) {
    return getEntities(docs, 'oc');
  },
};
