// Hourly backstop for check-ins already on main. The hook URL is read
// from the environment at run time and is never logged.

export const HOOK_ENV = 'CHECKIN_REBUILD_HOOK_URL';

export async function triggerCheckinRebuild({
  env = process.env,
  fetchImpl = fetch,
  log = console
} = {}) {
  const hook = env[HOOK_ENV];
  if (typeof hook !== 'string' || hook.trim() === '') {
    log.warn(`[checkins:rebuild] ${HOOK_ENV} is not set, so this run does not rebuild.`);
    return {ok: false, skipped: true};
  }

  const url = hook.trim();

  try {
    const response = await fetchImpl(url, {method: 'POST'});
    if (!response.ok) {
      log.warn(`[checkins:rebuild] the build hook responded ${response.status}.`);
      return {ok: false, skipped: false, status: response.status};
    }
    return {ok: true, skipped: false, status: response.status};
  } catch {
    // Fetch errors include the URL. Log a fixed line instead.
    log.warn('[checkins:rebuild] the build hook request failed.');
    return {ok: false, skipped: false};
  }
}

export default async function checkinRebuild() {
  const result = await triggerCheckinRebuild();
  const status = result.ok || result.skipped ? 200 : 502;
  return new Response(null, {status});
}
