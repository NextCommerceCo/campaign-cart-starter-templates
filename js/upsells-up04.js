// JavaScript extracted from templates/upsells/up04.html

// Accordion
class PBAccordion {
  constructor() {
    this.cleanupInitialState();
    this.init();
  }
  cleanupInitialState() {
    document.querySelectorAll('[pb-component="accordion"]').forEach(accordion => {
      const group = accordion.querySelector('[data-accordion="group"]');
      if (!group) return;
      const items = group.querySelectorAll('[data-accordion="accordion"]');
      items.forEach(item => {
        const content = item.querySelector('[data-accordion="content"]');
        const trigger = item.querySelector('[data-accordion="trigger"]');
        const arrow = item.querySelector('[data-accordion="arrow"]');
        const plus = item.querySelector('[data-accordion="plus"]');
        if (content) {
          content.style.maxHeight = '0';
          content.style.opacity = '0';
          content.style.visibility = 'hidden';
          content.style.display = 'none';
        }
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        item.classList.remove('is-active-accordion');
        content?.classList.remove('is-active-accordion');
        if (arrow) arrow.classList.remove('is-active-accordion');
        if (plus) plus.classList.remove('is-active-accordion');
      });
      const initial = group.getAttribute('data-accordion-initial');
      if (initial && initial !== 'none') {
        const initialItem = items[parseInt(initial) - 1];
        if (initialItem) this.openAccordion(initialItem);
      }
    });
  }
  init() {
    document.querySelectorAll('[pb-component="accordion"]').forEach(accordion => {
      const group = accordion.querySelector('[data-accordion="group"]');
      if (!group) return;
      group.addEventListener('click', (e) => this.handleClick(e, group));
    });
  }
  handleClick(event, group) {
    const accordionItem = event.target.closest('[data-accordion="accordion"]');
    if (!accordionItem) return;
    const isOpen = accordionItem.classList.contains('is-active-accordion');
    const isSingle = group.getAttribute('data-accordion-single') === 'true';
    if (isSingle) {
      group.querySelectorAll('[data-accordion="accordion"]').forEach(item => {
        if (item !== accordionItem && item.classList.contains('is-active-accordion')) {
          this.closeAccordion(item);
        }
      });
    }
    isOpen ? this.closeAccordion(accordionItem) : this.openAccordion(accordionItem);
  }
  openAccordion(item) {
    const trigger = item.querySelector('[data-accordion="trigger"]');
    const content = item.querySelector('[data-accordion="content"]');
    const arrow = item.querySelector('[data-accordion="arrow"]');
    const plus = item.querySelector('[data-accordion="plus"]');
    content.style.visibility = 'visible';
    content.style.display = 'block';
    content.offsetHeight;
    const contentHeight = content.scrollHeight;
    requestAnimationFrame(() => {
      content.style.maxHeight = `${contentHeight}px`;
      content.style.opacity = '1';
      trigger.setAttribute('aria-expanded', 'true');
      item.classList.add('is-active-accordion');
      content.classList.add('is-active-accordion');
      if (arrow) arrow.classList.add('is-active-accordion');
      if (plus) plus.classList.add('is-active-accordion');
    });
    content.addEventListener('transitionend', () => {
      if (item.classList.contains('is-active-accordion')) content.style.maxHeight = 'none';
    }, { once: true });
  }
  closeAccordion(item) {
    const trigger = item.querySelector('[data-accordion="trigger"]');
    const content = item.querySelector('[data-accordion="content"]');
    const arrow = item.querySelector('[data-accordion="arrow"]');
    const plus = item.querySelector('[data-accordion="plus"]');
    content.style.maxHeight = `${content.scrollHeight}px`;
    content.style.display = 'block';
    content.offsetHeight;
    requestAnimationFrame(() => {
      content.style.maxHeight = '0';
      content.style.opacity = '0';
      trigger.setAttribute('aria-expanded', 'false');
      item.classList.remove('is-active-accordion');
      content.classList.remove('is-active-accordion');
      if (arrow) arrow.classList.remove('is-active-accordion');
      if (plus) plus.classList.remove('is-active-accordion');
    });
    content.addEventListener('transitionend', () => {
      if (!item.classList.contains('is-active-accordion')) {
        content.style.visibility = 'hidden';
        content.style.display = 'none';
      }
    }, { once: true });
  }
}
new PBAccordion();