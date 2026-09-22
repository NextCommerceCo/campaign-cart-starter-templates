#!/usr/bin/env node

/**
 * Generates the /preview/ wrapper pages into _site/.
 *
 * One wrapper per template in templates.json, at _site/preview/[slug]/index.html.
 * The wrapper embeds the built template in an iframe and adds a template
 * switcher, a page switcher and desktop/mobile viewport buttons.
 *
 * Runs after campaign-build, because the build engine only emits pages whose
 * top folder is a campaign slug in _data/campaigns.json
 * (node_modules/next-campaign-page-kit/lib/engine/build.js:55-62).
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const site = join(root, '_site');

// A missing priority would make the subtraction NaN, which a comparator treats
// as 0 and silently leaves the list unsorted. /preview/ redirects to the first
// entry, so an unsorted list points the landing page at the wrong template.
const priority = (template) => (typeof template.priority === 'number' ? template.priority : 0);
const templates = readJson('templates.json').templates
  .filter((template) => !template.hidden && !template.deprecated)
  .sort((a, b) => priority(b) - priority(a));

// Entry page per template, and query strings the README previews rely on.
const ENTRY = {
  'olympus-mv-two-step': 'select',
  'shop-three-step': 'information',
  'landing': '',
};
const QUERY = {
  'shop-single-step': '?forcePackageId=1:1',
  'shop-three-step': '?forcePackageId=1:1',
};
const LABELS = {
  'checkout': 'Checkout',
  'information': 'Information',
  'shipping': 'Shipping',
  'billing': 'Billing',
  'select': 'Select',
  'landing': 'Landing',
  'presell': 'Presell',
  'receipt': 'Receipt',
  'variant-picker': 'Variant picker',
  'upsell-mv': 'Upsell multi-variant',
  'upsell-bundle-stepper': 'Upsell stepper',
  'upsell-bundle-tier-pills': 'Upsell tier pills',
  'upsell-bundle-tier-cards': 'Upsell tier cards',
  'upsell-single': 'Upsell single offer',
};
const ORDER = Object.keys(LABELS);
const REPO_URL = 'https://github.com/NextCommerceCo/campaign-cart-starter-templates';
const DOCS_URL = 'https://developers.nextcommerce.com/docs/campaigns/templates';

// Canonical NEXT logo, white wordmark for the black bar. Copied from
// next-ui/brand/next-white.svg, the brand source whose next-dark.svg is
// byte-identical to the one scripts/lint-next-logo-sync.mjs enforces across
// template surfaces. The white and dark variants differ in a few path
// coordinates, so this is not a recolour of next-dark.svg. Inlined so the
// wrapper ships no asset of its own, which also means no linter covers it.
const LOGO = `<svg class="h-6 w-auto" viewBox="0 0 451 148" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Next Commerce">
<path d="M104.893 81.8346L102.955 80.5593L48.6035 44.7975C47.8986 44.3777 47.2106 44.1521 46.5957 44.152C44.6173 44.152 43.008 45.7606 43.0078 47.7389V101.117C43.0079 103.095 44.6173 104.704 46.5957 104.704H50.4307V117.046H46.5957C37.8153 117.046 30.75 109.98 30.75 101.2V47.8229C30.75 39.0426 37.8153 31.9772 46.5957 31.9772C49.6698 31.9773 52.752 32.8804 55.3037 34.612H55.3047L104.346 67.9733L104.893 68.3454V81.8346Z" fill="#3C7DFF" stroke="#3C7DFF" stroke-width="2.5"/>
<path d="M111.568 31.9772C120.349 31.9772 127.414 39.0426 127.414 47.8229V101.2C127.414 109.98 120.349 117.046 111.568 117.046C108.494 117.046 105.412 116.142 102.86 114.411H102.859L53.8184 81.0495L53.2715 80.6774V67.1911L55.207 68.4626L109.552 104.136C110.26 104.56 110.951 104.788 111.568 104.788C113.547 104.788 115.156 103.178 115.156 101.2V47.8229C115.156 45.8444 113.547 44.235 111.568 44.235H107.733V31.9772H111.568Z" fill="#3C7DFF" stroke="#3C7DFF" stroke-width="2.5"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M369.22 56.1629V115.796H393.789V56.1629H418.88V32.3098L383.452 32.3079L369.22 56.1629ZM369.22 56.1629L383.452 32.3079L368.105 32.3098L352.65 55.7335L369.22 56.1629Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M279.292 115.486L307.796 72.6695L282.035 32L309.943 32.0019L337.612 70.9998L304.75 115.488L279.292 115.486ZM323.974 93.9863L339.089 115.488L364.236 115.486L339.089 74.4328L323.974 93.9863ZM339.089 67.9248L325.856 49.4455L337.612 32.0019L363.731 32L339.089 67.9248Z" fill="white"/>
<path d="M227.824 115.79V32.304H277.438L292.154 56.157H252.392V63.3129H277.438V84.7807H252.392V91.9366H290.845L274.778 115.792L227.824 115.79Z" fill="white"/>
<path d="M149.164 115.792V32.3059H177.191L199.971 72.2598V32.3059H223.824V115.792H198.897L173.017 71.4249V115.792H149.164Z" fill="white"/>
</svg>`;

// The same two mark paths from LOGO, with the viewBox cropped to just the mark.
// The wordmark is dropped below sm, where it only repeats the template name and
// costs the labels about 50px.
const LOGO_MARK = `<svg class="h-6 w-auto" viewBox="28 28 102 92" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Next Commerce">
<path d="M104.893 81.8346L102.955 80.5593L48.6035 44.7975C47.8986 44.3777 47.2106 44.1521 46.5957 44.152C44.6173 44.152 43.008 45.7606 43.0078 47.7389V101.117C43.0079 103.095 44.6173 104.704 46.5957 104.704H50.4307V117.046H46.5957C37.8153 117.046 30.75 109.98 30.75 101.2V47.8229C30.75 39.0426 37.8153 31.9772 46.5957 31.9772C49.6698 31.9773 52.752 32.8804 55.3037 34.612H55.3047L104.346 67.9733L104.893 68.3454V81.8346Z" fill="#3C7DFF" stroke="#3C7DFF" stroke-width="2.5"/>
<path d="M111.568 31.9772C120.349 31.9772 127.414 39.0426 127.414 47.8229V101.2C127.414 109.98 120.349 117.046 111.568 117.046C108.494 117.046 105.412 116.142 102.86 114.411H102.859L53.8184 81.0495L53.2715 80.6774V67.1911L55.207 68.4626L109.552 104.136C110.26 104.56 110.951 104.788 111.568 104.788C113.547 104.788 115.156 103.178 115.156 101.2V47.8229C115.156 45.8444 113.547 44.235 111.568 44.235H107.733V31.9772H111.568Z" fill="#3C7DFF" stroke="#3C7DFF" stroke-width="2.5"/>
</svg>`;

const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Pages are read from the built output, so the switcher can never list a page
// that did not build.
function pagesFor(slug) {
  const dir = join(site, slug);
  if (!existsSync(dir)) return [];
  // withFileTypes avoids a statSync that throws on a dangling symlink.
  const pages = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(dir, name, 'index.html')))
    .filter((name) => !['css', 'js', 'images', 'assets'].includes(name));
  if (existsSync(join(dir, 'index.html'))) pages.push('');
  // The index page ('') is not in ORDER, so it needs an explicit rank of -1 to
  // sort first instead of falling to the back with the unknown pages.
  const rank = (name) => {
    if (name === '') return -1;
    const i = ORDER.indexOf(name);
    return i === -1 ? ORDER.length : i;
  };
  return pages.sort((a, b) => rank(a) - rank(b));
}

function label(page) {
  if (!page) return 'Index';
  return LABELS[page] || page.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

function render(template, pages, siblings) {
  const { slug, name, description } = template;
  const entry = ENTRY[slug] ?? (pages.includes('checkout') ? 'checkout' : pages[0] ?? '');
  const query = QUERY[slug] ?? '';

  const switcher = siblings.map((item) => `
              <a class="block px-3 py-2 rounded-lg text-sm ${item.slug === slug ? 'bg-neutral-700 text-white font-medium' : 'text-neutral-300 hover:bg-neutral-700/60'}" href="/preview/${item.slug}/">
                <span class="block">${escape(item.name)}</span>
                <span class="block text-xs text-neutral-500">${escape(item.description)}</span>
              </a>`).join('');

  const pageOptions = pages.map((page) => `
              <button type="button" class="preview-page block w-full text-left px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-neutral-700/60 data-[active=true]:bg-neutral-700 data-[active=true]:text-white data-[active=true]:font-medium" data-page="${escape(page)}" data-active="${page === entry}">${escape(label(page))}</button>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(name)} preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: { extend: { fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] } } }
    }
  </script>
</head>
<body class="h-full font-sans bg-slate-100">
  <main class="h-screen flex flex-col overflow-hidden">
    <div class="shrink-0 bg-black px-4 py-2.5">
      <div class="flex items-center gap-3">
        <a class="shrink-0" href="/preview/" aria-label="Next Commerce"><span class="hidden sm:block">${LOGO}</span><span class="block sm:hidden">${LOGO_MARK}</span></a>
        <div class="flex items-center gap-x-2 min-w-0 flex-1">
          <div class="relative inline-flex min-w-0 shrink-[2]">
            <button id="preview-template-toggle" type="button" class="flex items-center min-w-0 shrink gap-x-1.5 px-2.5 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-neutral-800" aria-expanded="false">
              <span class="truncate">${escape(name)}</span>
              <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div id="preview-template-menu" class="hidden absolute top-full left-0 z-20 mt-2 w-80 max-h-96 overflow-y-auto p-1.5 bg-neutral-800 rounded-xl border border-neutral-700 shadow-xl">${switcher}
            </div>
          </div>
          <span class="shrink-0 text-neutral-600" aria-hidden="true">/</span>
          <div class="relative inline-flex min-w-0 shrink">
            <button id="preview-page-toggle" type="button" class="flex items-center min-w-0 shrink gap-x-1.5 px-2.5 py-1.5 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white" aria-expanded="false">
              <span id="preview-page-label" class="truncate">${escape(label(entry))}</span>
              <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div id="preview-page-menu" class="hidden absolute top-full left-0 z-20 mt-2 w-56 max-h-96 overflow-y-auto p-1.5 bg-neutral-800 rounded-xl border border-neutral-700 shadow-xl">${pageOptions}
            </div>
          </div>
        </div>
        <div class="flex items-center shrink-0 gap-x-1 ml-auto">
          <button id="preview-debug" type="button" class="hidden sm:inline-flex size-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white data-[active=true]:bg-neutral-800 data-[active=true]:text-white" data-active="false" aria-pressed="false" aria-label="Toggle debug panel">
            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>
          </button>
          <button type="button" class="preview-size hidden sm:inline-flex size-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white data-[active=true]:bg-neutral-800 data-[active=true]:text-white" data-size="mobile" data-active="false" aria-label="Mobile preview">
            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
          </button>
          <button type="button" class="preview-size hidden sm:inline-flex size-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white data-[active=true]:bg-neutral-800 data-[active=true]:text-white" data-size="desktop" data-active="true" aria-label="Desktop preview">
            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
          </button>
          <button id="preview-new-tab" type="button" class="inline-flex size-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white" aria-label="Open in new tab">
            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
          </button>
          <span class="block w-px h-5 bg-neutral-700 mx-1" aria-hidden="true"></span>
          <a class="inline-flex size-9 sm:size-auto items-center justify-center sm:px-2.5 sm:py-1.5 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white" href="${DOCS_URL}" target="_blank" rel="noopener" aria-label="Templates documentation">
            <svg class="shrink-0 size-4 sm:hidden" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/></svg>
            <span class="hidden sm:block">Docs</span>
          </a>
          <a class="inline-flex size-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white" href="${REPO_URL}" target="_blank" rel="noopener" aria-label="View repository on GitHub">
            <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.3v3.3c0 .3.1.7.8.6A12 12 0 0 0 12 .3"/></svg>
          </a>
        </div>
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-hidden p-3">
      <div id="preview-frame-shell" class="mx-auto w-full h-full max-w-full overflow-hidden rounded-2xl border border-slate-300 shadow-sm">
        <iframe id="preview-iframe" class="block size-full bg-white" data-allowed-prefix="/${escape(slug)}/" data-entry="${escape(entry)}" data-query="${escape(query)}"></iframe>
      </div>
    </div>
  </main>
  <script>
    (function () {
      const frame = document.getElementById('preview-iframe');
      const frameShell = document.getElementById('preview-frame-shell');
      const sizeButtons = document.querySelectorAll('.preview-size');
      const pageButtons = document.querySelectorAll('.preview-page');
      const templateToggle = document.getElementById('preview-template-toggle');
      const templateMenu = document.getElementById('preview-template-menu');
      const pageToggle = document.getElementById('preview-page-toggle');
      const pageMenu = document.getElementById('preview-page-menu');
      const pageLabel = document.getElementById('preview-page-label');
      const PAGES = ${JSON.stringify(pages)};
      const debugButton = document.getElementById('preview-debug');
      let debugOn = new URLSearchParams(window.location.search).get('debugger') === 'true';
      const prefix = frame.dataset.allowedPrefix;
      const entry = frame.dataset.entry;
      const query = frame.dataset.query;
      const viewports = { mobile: 'max-w-[430px]', desktop: 'max-w-full' };
      // Menu visibility and aria-expanded move together, so no toggle can be
      // left announcing "expanded" after its menu was hidden by another one.
      const setMenu = (menu, toggle, open) => {
        menu.classList.toggle('hidden', !open);
        toggle.setAttribute('aria-expanded', String(open));
      };
      const closeMenus = () => {
        setMenu(pageMenu, pageToggle, false);
        setMenu(templateMenu, templateToggle, false);
      };
      // ?debugger=true opens the SDK's own overlay, so there is nothing to build
      // here. It has to be reapplied on every page change, or moving through the
      // funnel silently drops it.
      const frameUrl = (page) => {
        const base = prefix + (page ? page + '/' : '') + query;
        if (!debugOn) return base;
        return base + (base.includes('?') ? '&' : '?') + 'debugger=true';
      };
      const relativePath = (href) => {
        try {
          const pathname = new URL(href, window.location.href).pathname;
          return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : null;
        } catch {
          return null;
        }
      };
      const setViewport = (size) => {
        frameShell.classList.remove(viewports.mobile, viewports.desktop);
        frameShell.classList.add(viewports[size]);
        sizeButtons.forEach((button) => { button.dataset.active = String(button.dataset.size === size); });
      };
      const syncUrl = (href) => {
        const relPath = relativePath(href);
        if (relPath === null) return;
        const page = relPath.replace(/\\/$/, '');
        const url = new URL(window.location.href);
        if (page === entry) url.searchParams.delete('page');
        else url.searchParams.set('page', page);
        history.replaceState(null, '', url.toString());
        let matched = null;
        pageButtons.forEach((button) => {
          const active = button.dataset.page === page;
          button.dataset.active = String(active);
          if (active) matched = button.textContent;
        });
        // A page with no button (a permalink, or one the build filtered out)
        // would otherwise leave the header naming the previous page.
        pageLabel.textContent = matched ?? (page || 'Index');
      };
      sizeButtons.forEach((button) => button.addEventListener('click', () => setViewport(button.dataset.size)));
      pageButtons.forEach((button) => button.addEventListener('click', () => {
        const page = button.dataset.page;
        frame.src = frameUrl(page);
        closeMenus();
      }));
      pageToggle.addEventListener('click', () => {
        const wasOpen = !pageMenu.classList.contains('hidden');
        closeMenus();
        if (!wasOpen) setMenu(pageMenu, pageToggle, true);
      });
      templateToggle.addEventListener('click', () => {
        const wasOpen = !templateMenu.classList.contains('hidden');
        closeMenus();
        if (!wasOpen) setMenu(templateMenu, templateToggle, true);
      });
      document.addEventListener('click', (event) => {
        const inMenu = [pageMenu, pageToggle, templateMenu, templateToggle].some((el) => el.contains(event.target));
        if (!inMenu) closeMenus();
      });
      // A click inside the iframe never reaches this document, so Escape is the
      // only way to dismiss a menu without clicking the toolbar.
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenus();
      });
      debugButton.addEventListener('click', () => {
        debugOn = !debugOn;
        debugButton.dataset.active = String(debugOn);
        debugButton.setAttribute('aria-pressed', String(debugOn));
        // Reload the page currently shown, not the entry page.
        const current = relativePath(frame.contentWindow?.location?.href || frame.src);
        frame.src = frameUrl(current === null ? entry : current.replace(/\\/$/, '').split('?')[0]);
        const url = new URL(window.location.href);
        if (debugOn) url.searchParams.set('debugger', 'true');
        else url.searchParams.delete('debugger');
        history.replaceState(null, '', url.toString());
      });
      document.getElementById('preview-new-tab').addEventListener('click', () => {
        const href = frame.contentWindow?.location?.href || frame.src;
        window.open(href, '_blank');
      });
      // The SDK redirects with window.location.href, so funnel navigation stays
      // in the frame. A destination outside the template (a payment gateway from
      // payment_complete_url) breaks out to a full page instead.
      frame.addEventListener('load', () => {
        let href;
        try {
          href = frame.contentWindow.location.href;
        } catch {
          return;
        }
        if (relativePath(href) === null) {
          window.location.href = href;
          return;
        }
        syncUrl(href);
      });
      debugButton.dataset.active = String(debugOn);
      debugButton.setAttribute('aria-pressed', String(debugOn));

      const requested = new URLSearchParams(window.location.search).get('page');
      const page = requested === null ? null : requested.replace(/^\\/|\\/$/g, '');
      // The iframe ships with no src, so the deep-linked page is the only page
      // it ever loads. Baking the entry page into the markup instead would make
      // a deep link load two pages, and the first one boots the SDK before the
      // swap lands.
      //
      // Only a page this template actually built may reach frame.src. An
      // unchecked value such as "../.." resolves outside the template prefix,
      // and the load handler above then navigates the whole page to it.
      frame.src = frameUrl(page !== null && PAGES.includes(page) ? page : entry);
      setViewport('desktop');
    })();
  </script>
</body>
</html>
`;
}

// Runs independently of `npm run build`, so the template output it wraps may
// not exist yet.
if (!existsSync(site)) {
  console.error('No _site/ directory. Run `npm run build` first, then `npm run build:preview`.');
  process.exit(1);
}

// Two passes: discover what built, so the switcher only lists templates whose
// pages exist.
const built = [];
for (const template of templates) {
  const pages = pagesFor(template.slug);
  if (!pages.length) {
    console.warn(`Skipping ${template.slug}, no built pages found in _site/`);
    continue;
  }
  built.push({ template, pages });
}

if (!built.length) {
  console.error('No built templates found in _site/. Run `npm run build` first, then `npm run build:preview`.');
  process.exit(1);
}

// Wipe first: a template that has since been hidden or removed would otherwise
// keep serving its old wrapper, advertising templates that no longer exist.
rmSync(join(site, 'preview'), { recursive: true, force: true });

const siblings = built.map((item) => item.template);
for (const { template, pages } of built) {
  const dir = join(site, 'preview', template.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), render(template, pages, siblings), 'utf8');
}
const written = built.length;

// /preview/ lands on the highest-priority template that actually built.
writeFileSync(
  join(site, 'preview', 'index.html'),
  `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta http-equiv="refresh" content="0; url=/preview/${siblings[0].slug}/">\n<link rel="canonical" href="/preview/${siblings[0].slug}/">\n</head>\n<body></body>\n</html>\n`,
  'utf8'
);

console.log(`Built ${written} preview wrapper${written === 1 ? '' : 's'}`);
