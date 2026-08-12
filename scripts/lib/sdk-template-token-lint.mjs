import { parse } from 'parse5';

const SDK_TEMPLATE_TOKEN_SOURCE = String.raw`\{(?:(?:item|line|discount|property)\.[A-Za-z0-9_]+|subtotal|total|shipping|shippingName|shippingCode|shippingOriginal|shippingDiscountAmount|shippingDiscountPercentage|totalDiscount|totalDiscountPercentage|discounts|currency|isCalculating|isEmpty|itemCount|totalQuantity|isFreeShipping|hasShippingDiscount|hasDiscounts|tax)\}`;

function preserveLines(match) {
  return '\n'.repeat(match.split('\n').length - 1);
}

function blankLiquidComments(content) {
  return content.replace(
    /\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\}/gi,
    preserveLines,
  );
}

function tokensIn(value) {
  return [...value.matchAll(new RegExp(SDK_TEMPLATE_TOKEN_SOURCE, 'gi'))];
}

export function findLiveSdkTemplateTokens(content) {
  const source = blankLiquidComments(content);
  const document = parse(source, { sourceCodeLocationInfo: true });
  const violations = [];

  function visit(node) {
    if (node.tagName === 'template' || node.tagName === 'script' || node.tagName === 'style') {
      return;
    }

    if (node.nodeName === '#text') {
      for (const match of tokensIn(node.value)) {
        const prefix = node.value.slice(0, match.index);
        violations.push({
          token: match[0],
          line: (node.sourceCodeLocation?.startLine ?? 1) + prefix.split('\n').length - 1,
        });
      }
    }

    for (const attribute of node.attrs ?? []) {
      for (const match of tokensIn(attribute.value)) {
        violations.push({
          token: match[0],
          line: node.sourceCodeLocation?.attrs?.[attribute.name]?.startLine
            ?? node.sourceCodeLocation?.startLine
            ?? 1,
        });
      }
    }

    for (const child of node.childNodes ?? []) visit(child);
  }

  visit(document);
  return violations;
}
