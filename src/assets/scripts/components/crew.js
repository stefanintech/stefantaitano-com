// Mounts the crew avatars on /ai. The cards are server-rendered; this only adds the pictures.
// Needs /assets/scripts/vendor/open-bot-avatar.js loaded first (window.OpenBotAvatar).

const mountCrew = () => {
  const lib = window.OpenBotAvatar;
  const hosts = [...document.querySelectorAll('[data-crew-avatar]')];
  if (!lib || hosts.length === 0) return;

  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOptions = () => ({followPointer: !reducedQuery.matches, reducedMotion: reducedQuery.matches});

  const avatars = [];
  for (const host of hosts) {
    let definition;
    try {
      definition = JSON.parse(host.dataset.crewAvatar);
    } catch {
      continue;
    }
    const result = lib.validateAvatar(definition);
    if (!result.ok) continue;

    host.hidden = false;
    avatars.push(
      lib.mountAvatar(host, {
        definition: result.value,
        color: 'var(--accent)',
        state: host.dataset.state,
        mood: host.dataset.mood,
        // The card's visible h3 names the bot, so the picture is decorative (aria-hidden).
        label: '',
        ...motionOptions()
      })
    );
  }

  reducedQuery.addEventListener('change', () => {
    for (const avatar of avatars) avatar.update(motionOptions());
  });

  // A still avatar does not repaint on its own, so a theme switch has to ask for a frame.
  const repaint = () => {
    for (const avatar of avatars) avatar.update({color: 'var(--accent)'});
  };
  new MutationObserver(repaint).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaint);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountCrew);
} else {
  mountCrew();
}
