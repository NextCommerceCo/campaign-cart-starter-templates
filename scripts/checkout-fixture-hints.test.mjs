import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'parse5';

const require = createRequire(import.meta.url);
const kitRequire = createRequire(require.resolve('next-campaign-page-kit/package.json'));
const matter = kitRequire('gray-matter');
const { createEngine, renderPage } = kitRequire('./lib/engine/render.js');
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(repoRoot, 'src');
const campaignData = JSON.parse(readFileSync(join(repoRoot, '_data/campaigns.json'), 'utf8'));

function findNodes(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes || []).flatMap(child => findNodes(child, predicate)),
  ];
}

const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const route = (family, filename) => `/${family}/${filename.replace(/\.html$/, '')}/`;

// Exercise the copyable hints through Page Kit's real renderer, without loading
// the generated HTML in a browser or executing any SDK/merchant requests.
for (const [family, fixture] of [
  ['shop-three-step', 'shop-three-step-dynamic-shipping.json'],
  ['olympus-mv-two-step', 'olympus-mv-two-step-configurable.json'],
]) {
  test(`${family}: checkout hints keep form navigation separate from payment success`, async () => {
    const spec = JSON.parse(readFileSync(join(repoRoot, 'docs/fixtures/campaign-specs', fixture), 'utf8'));
    const engine = createEngine(srcRoot);
    for (const funnel of spec.funnels) {
      const payments = funnel.pages.filter(page => page.type === 'checkout');
      assert.equal(payments.length, 1, 'these template fixtures describe one payment path per funnel');
      const successUrl = payments[0].success_url || payments[0].next_page;
      let stepNumber = 0;
      for (const page of [...funnel.pages].sort((a, b) => a.order - b.order)) {
        if (!['select', 'checkout_step', 'checkout'].includes(page.type)) continue;
        const hints = page.sdk_hints.frontmatter;
        const { data, content } = matter(readFileSync(join(repoRoot, page.template), 'utf8'));
        assert.equal(hints.next_url, successUrl, `${page.id}: express payment must use the post-purchase destination`);
        assert.equal(data.next_url, successUrl, `${page.id}: template must agree with the fixture`);
        const html = await renderPage(engine, {
          body: content,
          frontmatter: { ...data, ...hints },
          campaign: { ...campaignData[family], slug: family },
          pageData: { url: page.page_url, inputPath: join(repoRoot, page.template) },
          layoutSrc: readFileSync(join(srcRoot, family, '_layouts/base.html'), 'utf8'),
          environment: 'development',
        });
        const document = parse(html);
        const successMeta = findNodes(document, node => node.tagName === 'meta' && attr(node, 'name') === 'next-success-url');
        assert.equal(successMeta.length, 1, `${page.id}: one payment-success destination`);
        assert.equal(attr(successMeta[0], 'content'), route(family, successUrl));
        const forms = findNodes(document, node => node.tagName === 'form' && attr(node, 'data-next-checkout') === 'form');

        if (page.type === 'checkout') {
          assert.equal(hints.next_step, undefined, `${page.id}: payment has no next form`);
          assert.equal(hints.step_number, undefined, `${page.id}: payment is not a Checkout Step`);
          assert.equal(data.next_step, undefined);
          assert.equal(forms.length, 1);
          assert.equal(attr(forms[0], 'data-next-checkout-step'), undefined);
          assert.equal(attr(forms[0], 'data-next-step-number'), undefined);
        } else {
          assert.equal(hints.next_step, page.next_page, `${page.id}: hint must identify the next form/link`);
          assert.equal(data.next_step, page.next_page, `${page.id}: template must agree with the fixture`);
          if (page.type === 'checkout_step') {
            stepNumber += 1;
            assert.equal(hints.step_number, stepNumber, `${page.id}: Checkout Step ordinal`);
            assert.equal(forms.length, 1);
            assert.equal(attr(forms[0], 'data-next-checkout-step'), route(family, page.next_page));
            assert.equal(attr(forms[0], 'data-next-step-number'), String(stepNumber));
          } else {
            assert.equal(hints.step_number, undefined, 'Select is a link, not a checkout form step');
            assert.equal(forms.length, 0);
            const links = findNodes(document, node => node.tagName === 'a' && attr(node, 'data-next-action') === 'checkout');
            assert.ok(links.length > 0, 'Select must link to checkout');
            for (const link of links) assert.equal(attr(link, 'href'), route(family, page.next_page));
          }
        }
      }
    }
  });
}
