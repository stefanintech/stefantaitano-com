// Mounts the crew avatars. The cards are server-rendered; this only adds the pictures.
// Needs /assets/scripts/vendor/open-bot-avatar.js loaded first (window.OpenBotAvatar).
// data-crew-color is the mockup board. /ai leaves it off and stays on the accent.

const colorFor = host => host.dataset.crewColor || 'var(--accent)';

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
    avatars.push({
      host,
      avatar: lib.mountAvatar(host, {
        definition: result.value,
        color: colorFor(host),
        state: host.dataset.state,
        mood: host.dataset.mood,
        // The card's visible h3 names the bot, so the picture is decorative (aria-hidden).
        label: '',
        ...motionOptions()
      })
    });
  }

  reducedQuery.addEventListener('change', () => {
    for (const {avatar} of avatars) avatar.update(motionOptions());
  });

  // A still avatar does not repaint on its own, so a theme switch has to ask for a frame.
  // Passing the same var() makes the library read the theme's computed color again.
  const repaint = () => {
    for (const {host, avatar} of avatars) avatar.update({color: colorFor(host)});
  };
  new MutationObserver(repaint).observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaint);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountCrew);
} else {
  mountCrew();
}
