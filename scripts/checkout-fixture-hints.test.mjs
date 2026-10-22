import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
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

// This fixture dialect uses local template filenames. Full CampaignSpec route
// normalization/validation still belongs to Campaigns OS.
function assertFixtureRoutes(funnel, family) {
  for (const page of funnel.pages) {
    const hints = page.sdk_hints?.frontmatter || {};
    for (const [key, target] of Object.entries({
      next_page: page.next_page,
      success_url: page.success_url,
      on_accept: page.on_accept,
      on_decline: page.on_decline,
      'frontmatter.next_url': hints.next_url,
      'frontmatter.next_step': hints.next_step,
    })) {
      if (target === undefined) continue;
      const destination = funnel.pages.find(candidate => candidate.template === `src/${family}/${target}`);
      assert.ok(destination && existsSync(join(repoRoot, destination.template)), `${page.id}: ${key} ${JSON.stringify(target)} must resolve to a template in the same funnel for this self-contained local fixture`);
    }
  }
}

function assertShopGuard(document, page) {
  if (!['shipping', 'billing'].includes(page.id)) return;
  const scripts = findNodes(document, node => node.tagName === 'script');
  const guardUrl = '/shop-three-step/js/checkout-shop-three-billing.js';
  const guardScripts = scripts.filter(script => attr(script, 'src') === guardUrl);
  assert.equal(guardScripts.length, 1, `${page.id}: page must load the expected checkout guard ${guardUrl}`);
  const configScript = scripts.map(script => script.childNodes.map(node => node.value || '').join(''))
    .find(source => source.includes('window.CHECKOUT_CONFIG ='));
  assert.ok(configScript, `${page.id}: expected the Shop guard configuration`);
  const configWindow = {};
  runInNewContext(configScript, { window: configWindow }, { timeout: 1000 });
  const config = configWindow.CHECKOUT_CONFIG;
  assert.equal(config.currentStep, page.id === 'shipping' ? 2 : 3);
  if (page.id === 'shipping') {
    const forms = findNodes(document, node => node.tagName === 'form' && attr(node, 'data-next-checkout') === 'form');
    assert.equal(forms.length, 1, `${page.id}: exactly one checkout form must carry the step ordinal`);
    assert.equal(config.currentStep, Number(attr(forms[0], 'data-next-step-number')), `${page.id}: guard and form ordinals must agree`);
  }
  for (const [index, name] of ['information', 'shipping', 'billing'].entries()) {
    assert.equal(config.stepUrls[index + 1], route('shop-three-step', `${name}.html`));
  }
  const guardAsset = attr(guardScripts[0], 'src').slice('/shop-three-step/'.length);
  const guard = readFileSync(join(srcRoot, 'shop-three-step/assets', guardAsset), 'utf8');
  const funnelMeta = findNodes(document, node => node.tagName === 'meta' && attr(node, 'name') === 'next-funnel');
  assert.equal(funnelMeta.length, 1, `${page.id}: scoped storage needs the rendered funnel identity`);
  const funnelName = attr(funnelMeta[0], 'content');
  assert.ok(funnelName, `${page.id}: funnel identity must be nonempty`);
  const storage = (entries) => ({
    length: Object.keys(entries).length,
    key: index => Object.keys(entries)[index] ?? null,
    getItem: key => entries[key] ?? null,
  });
  for (const storageMode of ['legacy', 'scoped-session-metadata', 'scoped-local-metadata', 'scoped-unmatched', 'empty']) {
    const scenarios = ['scoped-unmatched', 'empty'].includes(storageMode) ? [
      [3, route('shop-three-step', 'information.html'), false],
    ] : [
      [1, route('shop-three-step', 'information.html'), false],
      [2, page.id === 'billing' ? route('shop-three-step', 'shipping.html') : undefined, false],
      [3, undefined, false],
      [3, route('shop-three-step', 'information.html'), true],
    ];
    for (const [step, destination, missingData] of scenarios) {
      const redirects = [];
      const errors = [];
      const formData = missingData ? {} : { email: 'fixture@example.test', fname: 'Fixture', lname: 'Buyer', country: 'US', address1: '1 Example St', city: 'Example' };
      const store = JSON.stringify({ state: { step, formData } });
      const sessionEntries = storageMode === 'empty' ? {} : storageMode === 'legacy' ? { 'next-checkout-store': store } : {
        // The unrelated campaign is deliberately first: a guard that takes the
        // first scoped store could incorrectly allow an incomplete checkout.
        'next-checkout-store__other': JSON.stringify({ state: { step: 3, formData: { ...formData, email: 'other@example.test' } } }),
        'next_funnel_name__other': 'Unrelated fixture campaign',
        'next-checkout-store__fixture': store,
      };
      const localEntries = {};
      if (storageMode === 'scoped-session-metadata') sessionEntries.next_funnel_name__fixture = funnelName;
      if (storageMode === 'scoped-local-metadata') localEntries.next_funnel_name__fixture = funnelName;
      if (storageMode === 'scoped-unmatched') sessionEntries.next_funnel_name__fixture = 'Another fixture campaign';
      runInNewContext(guard, {
        window: { CHECKOUT_CONFIG: config, location: { replace: url => redirects.push(url) } },
        sessionStorage: storage(sessionEntries),
        localStorage: storage(localEntries),
        document: { querySelector: selector => selector === 'meta[name="next-funnel"]' ? { getAttribute: name => name === 'content' ? funnelName : null } : null },
        console: { log() {}, warn() {}, error: (...args) => errors.push(args.map(String).join(' ')) },
      }, { timeout: 1000 });
      const label = `${page.id}: ${storageMode}, stored step ${step}, missingData=${missingData}`;
      assert.deepEqual(errors, [], `${label}: guard must not swallow a storage/sandbox error`);
      assert.deepEqual(redirects, destination ? [destination] : [], `${label}: guard behavior`);
    }
  }
}

async function renderTemplate(engine, family, page, frontmatter, content) {
  try {
    return parse(await renderPage(engine, {
      body: content,
      frontmatter,
      campaign: { ...campaignData[family], slug: family },
      pageData: { url: page.page_url, inputPath: join(repoRoot, page.template) },
      layoutSrc: readFileSync(join(srcRoot, family, '_layouts/base.html'), 'utf8'),
      environment: 'development',
    }));
  } catch (error) {
    throw new Error(`${family}/${page.id}: failed to render ${page.template}`, { cause: error });
  }
}

// Exercise the copyable hints through Page Kit's real renderer, without loading
// the generated HTML in a browser or executing any SDK/merchant requests.
for (const [family, fixture] of [
  ['shop-three-step', 'shop-three-step-dynamic-shipping.json'],
  ['olympus-mv-two-step', 'olympus-mv-two-step-configurable.json'],
]) {
  const originalSpec = JSON.parse(readFileSync(join(repoRoot, 'docs/fixtures/campaign-specs', fixture), 'utf8'));
  test(`${family}: dangling fixture routes are rejected`, () => {
    for (const target of ['next_page', 'next_url', 'next_step']) {
      const funnel = structuredClone(originalSpec.funnels[0]);
      const page = funnel.pages.find(page => ['select', 'checkout_step'].includes(page.type));
      assert.ok(page?.sdk_hints?.frontmatter, `${family}: fixture funnel[0] needs a Select/Checkout Step with frontmatter to mutate`);
      (target === 'next_page' ? page : page.sdk_hints.frontmatter)[target] = 'missing.html';
      assert.throws(() => assertFixtureRoutes(funnel, family), /must resolve to a template in the same funnel/);
    }
  });
  for (const successField of ['next_page', 'success_url']) {
    test(`${family}: checkout routing using ${successField}`, async (t) => {
      const spec = structuredClone(originalSpec);
      if (successField === 'success_url') {
        for (const funnel of spec.funnels) {
          const payment = funnel.pages.find(page => page.type === 'checkout');
          payment.success_url = payment.next_page;
          delete payment.next_page;
        }
      }
      const engine = createEngine(srcRoot);
      for (const funnel of spec.funnels) {
        assertFixtureRoutes(funnel, family);
        const payments = funnel.pages.filter(page => page.type === 'checkout');
        assert.equal(payments.length, 1, 'these template fixtures describe one payment path per funnel');
        const successUrl = payments[0].success_url || payments[0].next_page;
        let stepNumber = 0;
        for (const page of [...funnel.pages].sort((a, b) => a.order - b.order)) {
          if (!['select', 'checkout_step', 'checkout'].includes(page.type)) continue;
          if (page.type === 'checkout_step') stepNumber += 1;
          await t.test(page.id, async () => {
            const hints = page.sdk_hints.frontmatter;
            const { data, content } = matter(readFileSync(join(repoRoot, page.template), 'utf8'));
            assert.equal(hints.next_url, successUrl, `${page.id}: express payment must use the post-purchase destination`);
            assert.equal(data.next_url, successUrl, `${page.id}: template must agree with the fixture`);
            const document = await renderTemplate(engine, family, page, data, content);
            const successMeta = findNodes(document, node => node.tagName === 'meta' && attr(node, 'name') === 'next-success-url');
            assert.equal(successMeta.length, 1, `${page.id}: one payment-success destination`);
            assert.equal(attr(successMeta[0], 'content'), route(family, successUrl));
            const forms = findNodes(document, node => node.tagName === 'form' && attr(node, 'data-next-checkout') === 'form');
            if (family === 'shop-three-step') assertShopGuard(document, page);

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
                assert.equal(hints.step_number, undefined, `${page.id}: fixed Shop ordinals are not a frontmatter knob`);
                assert.equal(data.step_number, undefined, `${page.id}: no unsupported step_number override`);
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
          });
        }
      }
    });
  }
}
