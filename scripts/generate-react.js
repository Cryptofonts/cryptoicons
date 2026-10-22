const fs = require('node:fs');
const path = require('node:path');
const {
  identifier,
  jsxAttribute,
  jsxExpressionContainer,
  jsxIdentifier,
  objectExpression,
  objectProperty,
  templateElement,
  templateLiteral,
} = require('@babel/types');
const { transform } = require('@svgr/core');

const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'assets');
const outputDir = path.join(root, 'packages/react/src/generated');

function toPascalCase(filename) {
  const stem = path.basename(filename, '.svg');
  const normalized = stem
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\$/g, ' Dollar ')
    .replace(/\+/g, ' Plus ')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const name = words.map((word) => word[0].toUpperCase() + word.slice(1)).join('');
  return `Icon${name || 'Asset'}`;
}

function makeBlackFillsColorable(svg) {
  const black = '(?:#000(?:000)?|black|rgb\\(\\s*0\\s*,\\s*0\\s*,\\s*0\\s*\\))';
  return svg
    .replace(/<sodipodi:namedview\b[^>]*(?:\/>|>[\s\S]*?<\/sodipodi:namedview\s*>)/gi, '')
    .replace(/<\/?a\b[^>]*>/gi, '')
    .replace(/\s+(?!(?:xml:space|xlink:href|xmlns:xlink)\s*=)[A-Za-z_][\w.-]*:[A-Za-z_][\w.-]*\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\s+enable-background\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/enable-background\s*:\s*[^;}"']+;?/gi, '')
    .replace(new RegExp(`(\\bfill\\s*=\\s*["'])${black}(["'])`, 'gi'), '$1currentColor$2')
    .replace(new RegExp(`(\\bfill\\s*:\\s*)${black}(?=\\s*(?:;|["']))`, 'gi'), '$1currentColor');
}

function template({ componentName, jsx }, { tpl }) {
  const idPrefix = `${componentName.toLowerCase()}-`;

  function replaceIds(node) {
    if (!node || typeof node !== 'object') return node;
    if (node.type === 'JSXAttribute' && node.value?.type === 'StringLiteral') {
      const value = node.value.value;
      if (value.includes(idPrefix)) {
        node.value = jsxExpressionContainer(makeDynamicId(value, idPrefix));
      }
    }
    if (node.type === 'StringLiteral' && node.value.includes(idPrefix)) {
      return makeDynamicId(node.value, idPrefix);
    }
    for (const [key, value] of Object.entries(node)) {
      if (Array.isArray(value)) {
        node[key] = value.map(replaceIds);
      } else if (value && typeof value === 'object') {
        node[key] = replaceIds(value);
      }
    }
    return node;
  }

  function makeDynamicId(value, prefix) {
    const parts = value.split(prefix);
    return templateLiteral(
      parts.map((part, index) => templateElement(
        { raw: part, cooked: part },
        index === parts.length - 1,
      )),
      Array.from({ length: parts.length - 1 }, () => identifier('uniqueId')),
    );
  }

  replaceIds(jsx);
  const styleAttribute = jsx.openingElement.attributes.find(
    (attribute) => attribute.type === 'JSXAttribute' && attribute.name.name === 'style',
  );
  const existingStyle = styleAttribute?.value?.type === 'JSXExpressionContainer'
    && styleAttribute.value.expression.type === 'ObjectExpression'
    ? styleAttribute.value.expression.properties
    : [];
  const sizeStyle = objectExpression([
    objectProperty(identifier('width'), identifier('size')),
    objectProperty(identifier('height'), identifier('size')),
    ...existingStyle,
  ]);

  if (styleAttribute) {
    styleAttribute.value = jsxExpressionContainer(sizeStyle);
  } else {
    jsx.openingElement.attributes.unshift(
      jsxAttribute(jsxIdentifier('style'), jsxExpressionContainer(sizeStyle)),
    );
  }

  return tpl`
import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

const ${componentName} = ({ size, ...props }: IconProps) => {
  const uniqueId = React.useId().replace(/:/g, '');
  return ${jsx};
};

export default ${componentName};
`;
}

const files = fs.readdirSync(assetsDir)
  .filter((file) => file.endsWith('.svg'))
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

const components = new Map();
const exportNames = new Map();
for (const file of files) {
  const componentName = toPascalCase(file);
  const previousFile = components.get(componentName);
  if (previousFile) {
    throw new Error(
      `Icon filenames "${previousFile}" and "${file}" both map to ${componentName}.`,
    );
  }
  components.set(componentName, file);

  const baseAlias = componentName.slice(4);
  const iconAlias = `${/^[A-Za-z_$]/.test(baseAlias) ? '' : 'Icon'}${baseAlias}Icon`;
  for (const exportName of [componentName, iconAlias]) {
    const previousExport = exportNames.get(exportName);
    if (previousExport) {
      throw new Error(
        `Icon filenames "${previousExport}" and "${file}" both export ${exportName}.`,
      );
    }
    exportNames.set(exportName, file);
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const barrelExports = [];
const loaders = [];

for (const [componentName, file] of components) {
  const symbol = path.basename(file, '.svg');
  const source = makeBlackFillsColorable(fs.readFileSync(path.join(assetsDir, file), 'utf8'));
  const generated = transform.sync(
    source,
    {
      typescript: true,
      dimensions: false,
      expandProps: 'end',
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
            params: { overrides: { removeViewBox: false } },
          },
          'removeDimensions',
          {
            name: 'prefixIds',
            params: { prefix: componentName.toLowerCase(), delim: '-' },
          },
        ],
      },
      template,
    },
    { componentName },
  );

  fs.writeFileSync(path.join(outputDir, `${componentName}.tsx`), generated);
  const baseAlias = componentName.slice(4);
  const iconAlias = `${/^[A-Za-z_$]/.test(baseAlias) ? '' : 'Icon'}${baseAlias}Icon`;
  barrelExports.push(`export { default as ${componentName}, default as ${iconAlias} } from './${componentName}';`);
  loaders.push(`  '${symbol.toLowerCase()}': () => import('./${componentName}'),`);
}

fs.writeFileSync(path.join(outputDir, 'index.ts'), `${barrelExports.join('\n')}\n`);
fs.writeFileSync(
  path.join(outputDir, 'registry.ts'),
  `import type { ComponentType } from 'react';\n` +
    `import type { IconProps } from './${components.keys().next().value || 'IconAsset'}';\n\n` +
    `type IconModule = { default: ComponentType<IconProps> };\n` +
    `export const iconLoaders: Record<string, () => Promise<IconModule>> = {\n` +
    `${loaders.join('\n')}\n` +
    `};\n`,
);
