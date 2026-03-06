function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return fallback;
}

function getTrashRetentionDays() {
  return parsePositiveInt(process.env.TRASH_PROJECT_RETENTION_DAYS, 30);
}

function getTrashRetentionMs() {
  return getTrashRetentionDays() * 24 * 60 * 60 * 1000;
}

module.exports = {
  getTrashRetentionDays,
  getTrashRetentionMs,
};
