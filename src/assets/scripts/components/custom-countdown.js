class CustomCountdown extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const target = this.getAttribute('target');
    if (!target) return;

    const targetDate = new Date(target + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const days = Math.round((targetDate - today) / msPerDay);

    let text;
    if (days > 1) {
      text = `${days} days away`;
    } else if (days === 1) {
      text = '1 day away';
    } else if (days === 0) {
      text = 'That\'s today!';
    } else {
      text = 'Done!';
    }

    this.setAttribute('aria-live', 'polite');
    this.textContent = text;
  }
}

customElements.define('custom-countdown', CustomCountdown);
