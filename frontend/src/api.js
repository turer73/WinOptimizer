const base = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),

  // Profiles
  listProfiles: () => request('/profiles'),
  applyProfile: (id, { dryRun = true } = {}) =>
    request(`/profiles/${id}/apply`, { method: 'POST', body: JSON.stringify({ dryRun }) }),

  // Backup
  exportState: () => request('/backup/export', { method: 'POST' }),
  checkpoint: (description) =>
    request('/backup/checkpoint', { method: 'POST', body: JSON.stringify({ description }) }),
  listBackups: () => request('/backup/list'),
  restore: (folder, dryRun = true) =>
    request('/backup/restore', { method: 'POST', body: JSON.stringify({ folder, dryRun }) }),
  importReg: (folder, file, dryRun = true) =>
    request('/backup/import-reg', { method: 'POST', body: JSON.stringify({ folder, file, dryRun }) }),

  // Privacy
  listPrivacy: () => request('/privacy'),
  runPrivacy: (action, dryRun = true) =>
    request(`/privacy/${action}`, { method: 'POST', body: JSON.stringify({ dryRun }) }),

  // Bloatware
  listInstalled: () => request('/bloatware/installed'),
  removeApps: (apps, dryRun = true) =>
    request('/bloatware/remove', { method: 'POST', body: JSON.stringify({ apps, dryRun }) }),

  // Services
  listServices: () => request('/services'),
  disableServices: (services, dryRun = true) =>
    request('/services/disable', { method: 'POST', body: JSON.stringify({ services, dryRun }) }),

  // Network
  listNetwork: () => request('/network'),
  runNetwork: (action, dryRun = true) =>
    request(`/network/${action}`, { method: 'POST', body: JSON.stringify({ dryRun }) }),

  // Performance
  listPerformance: () => request('/performance'),
  runPerformance: (action, dryRun = true) =>
    request(`/performance/${action}`, { method: 'POST', body: JSON.stringify({ dryRun }) }),

  // Logs
  listLogs: () => request('/logs'),
  getLog: (file) => request(`/logs/${file}`),
};
