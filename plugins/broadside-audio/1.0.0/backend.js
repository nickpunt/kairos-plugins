async (input, host) => {
  const request=host.request;
  host={request:async(capability,input)=>{const result=await request(capability,input);if(!result.ok)throw Error(result.error);return result.value;}};
  if (!input.action) return host.request('library.read');
  if (input.action !== 'capture') throw Error('Unknown action');
  const hooks = (() => { const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// .../sound-effects/<slug>/<id>/  (also /royalty-free-music/…, /intros/…)
function parseSourceUrl(raw) {
  const u = new URL(raw);
  if (!/(^|\.)hooksounds\.com$/i.test(u.hostname)) throw new Error('not a hooksounds.com URL');
  const parts = u.pathname.split('/').filter(Boolean);
  const id = parts[parts.length - 1];
  const slug = parts[parts.length - 2];
  const section = parts[0] || '';
  const kind = /music/i.test(section) ? 'music' : /intro/i.test(section) ? 'intro' : 'sfx';
  if (!slug || !/^\d+$/.test(id)) throw new Error(`unexpected URL shape: ${u.pathname}`);
  return { canonical: u.toString(), id, slug, kind };
}

// Collect every <script type="application/ld+json"> block as parsed objects.
function extractJsonLd(html) {
  const out = [];
  const rx = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = rx.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] || [parsed];
      for (const n of nodes) out.push(n);
    } catch {
      /* ignore a malformed block */
    }
  }
  return out;
}

const findMusicRecording = (nodes) => nodes.find((n) => n && n['@type'] === 'MusicRecording') || null;

// HookSounds encodes durations like "T00M03S" (minutes before M, seconds before S).
function parseHookDuration(str) {
  if (!str) return null;
  const min = /(\d+)M/.exec(str);
  const sec = /(\d+)S/.exec(str);
  const total = (min ? +min[1] : 0) * 60 + (sec ? +sec[1] : 0);
  return total || null;
}
const fmtDuration = (s) => (s == null ? '' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

// Preview URLs sit inside a double-escaped JSON blob; collapse any run of backslashes before a slash.
const unescapeSlashes = (html) => html.replace(/\\+\//g, '/');

// The page embeds this asset's preview AND its "similar sounds"; pick the one whose filename slug
// matches this asset (the main asset is also first, used as a fallback).
function selectPreview(html, slug) {
  const unesc = unescapeSlashes(html);
  const rx = /https:\/\/static\.hooksounds\.com\/uploads\/preview\/([a-z]+)\/([^"\\?#\s]+?\.mp3)/gi;
  const found = [];
  const seen = new Set();
  let m;
  while ((m = rx.exec(unesc))) {
    const [, type, file] = m;
    if (seen.has(file)) continue;
    seen.add(file);
    found.push({ type, file, url: `https://static.hooksounds.com/uploads/preview/${type}/${file}` });
  }
  if (!found.length) return null;
  const titleSlug = (f) => slugify(f.file.replace(/_[0-9a-f]+\.[0-9]+\.mp3$/i, ''));
  return found.find((f) => titleSlug(f) === slug) || found[0];
}

// Tags + category belong to the main asset only — everything before the "Similar sound effects" block.
const mainAssetHtml = (html) => {
  const cut = html.search(/similar\s+sound\s+effects/i);
  return cut > 0 ? html.slice(0, cut) : html;
};

function extractTags(html) {
  const scope = mainAssetHtml(html);
  const rx = /\/sound-effects\/\?tagId=\d+["'][^>]*>([^<]+)</gi;
  const tags = [];
  const seen = new Set();
  let m;
  while ((m = rx.exec(scope))) {
    const t = m[1].trim();
    const key = t.toLowerCase();
    if (t && !seen.has(key)) {
      seen.add(key);
      tags.push(t);
    }
  }
  return tags;
}

function extractCategory(html) {
  const m = /\/sound-effects\/category\/([a-z0-9-]+)\/([a-z0-9-]+)\//i.exec(mainAssetHtml(html));
  if (!m) return '';
  const cap = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${cap(m[2])} (${cap(m[1])})`;
}


async function scrapeOne(rawUrl, host) {
  const { canonical, id, slug, kind } = parseSourceUrl(rawUrl);
  const html = await host.request('http.read',{url:canonical});
  const ld = findMusicRecording(extractJsonLd(html)) || {};
  const preview = selectPreview(html, slug);
  if (!preview) throw new Error('no preview MP3 found on page');

  const durationSeconds = parseHookDuration(ld.duration);
  const title = (ld.name || '').trim() || slug.replace(/-/g, ' ');

  return {
    provider: 'hooksounds',
    sourceUrl: canonical,
    acquireLicensePage: ld.acquireLicensePage || canonical,
    title,
    id,
    slug,
    type: preview.type || kind,
    durationSeconds,
    durationLabel: fmtDuration(durationSeconds),
    producer: ld.producer?.name || 'HookSounds',
    category: extractCategory(html),
    tags: extractTags(html),
    license: 'premium',
    licenseNote:
      'Preview clip only. The full licensed file requires a HookSounds subscription or single-asset purchase.',
    previewUrl: preview.url,
    capturedAt: new Date().toISOString(),
  };
}

return scrapeOne; })();
  const pro = (() => { function parseSourceUrl(raw) {
  const u = new URL(raw);
  if (!['http:', 'https:'].includes(u.protocol) ||
      !['www.prosoundeffects.com', 'prosoundeffects.com'].includes(u.hostname) ||
      u.username || u.password || u.port) throw new Error('not a prosoundeffects.com URL');
  const match = /^\/sound-effects\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/([a-z0-9-]+)\/?$/.exec(u.pathname);
  if (!match) throw new Error(`unexpected URL shape: ${u.pathname}`);
  const [, libraryId, id, slug] = match;
  return { libraryId, id, slug,
    canonical: `https://www.prosoundeffects.com/sound-effects/${libraryId}/${id}/${slug}` };
}

// Nuxt's JSON payload is an indexed table: object values and array items are references.
// Read only the matching sound's fields, without evaluating scripts or decoding unrelated state.
function extractSound(html, { libraryId, id }) {
  const match = /<script\b[^>]*\bid=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!match) return {};
  const table = JSON.parse(match[1]);
  if (!Array.isArray(table)) throw new Error('unexpected Nuxt payload');
  const sound = table.find((n) => n && !Array.isArray(n) && typeof n === 'object' &&
    table[n.id] === id && table[n.libraryId] === libraryId && 'previewUrl' in n);
  if (!sound) return {};
  const result = {};
  for (const key of ['mp3Url', 'previewUrl', 'durationSeconds', 'artist', 'category',
    'subCategory', 'library', 'description', 'sampleRate', 'bitDepth', 'channelNumber']) {
    result[key] = table[sound[key]];
  }
  const tags = table[sound.tags];
  result.tags = Array.isArray(tags) ? tags.map((i) => table[i]).filter((t) => typeof t === 'string') : [];
  return result;
}

function parsePage(html, source) {
  const nodes = [];
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(m[1]);
      nodes.push(...(Array.isArray(value) ? value : value['@graph'] || [value]));
    } catch { /* Other structured data may be malformed. */ }
  }
  const ld = nodes.find((n) => {
    if (n?.['@type'] !== 'AudioObject') return false;
    try {
      const u = parseSourceUrl(n.url || n['@id']);
      return u.id === source.id && u.libraryId === source.libraryId;
    } catch { return false; }
  }) || {};
  const sound = extractSound(html, source);
  const previewUrl = sound.mp3Url || sound.previewUrl || ld.contentUrl;
  if (!previewUrl) throw new Error('no matching public audio preview found on page');
  const preview = new URL(previewUrl);
  const extension = (preview.pathname.match(/\.[^/.]+$/)?.[0] || '').toLowerCase();
  if (preview.protocol !== 'https:' || preview.hostname !== 'prosoundeffects.blob.core.windows.net' ||
      !['.mp3', '.ogg'].includes(extension) ||
      !decodeURIComponent(preview.pathname).endsWith(`_${source.libraryId}_${source.id}${extension}`)) {
    throw new Error('unexpected preview URL or mismatched sound ID');
  }
  const duration = /^PT(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(ld.duration || '');
  const durationSeconds = sound.durationSeconds ?? (duration ?
    Number(duration[1] || 0) * 3600 + Number(duration[2] || 0) * 60 + Number(duration[3] || 0) : null);
  const seconds = Math.round(durationSeconds || 0);
  return {
    provider: 'prosoundeffects', sourceUrl: source.canonical,
    acquireLicensePage: ld.partOfSeries?.url || source.canonical,
    title: ld.name || source.slug.replace(/-/g, ' '),
    id: source.id, libraryId: source.libraryId, slug: source.slug, type: 'sfx',
    description: sound.description || ld.description || '',
    durationSeconds,
    durationLabel: durationSeconds == null ? '' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    producer: sound.artist || ld.author?.name || 'Pro Sound Effects',
    collection: sound.library || ld.partOfSeries?.name || '',
    category: [sound.category, sound.subCategory].filter(Boolean).join(' / '),
    tags: sound.tags?.length ? sound.tags : String(ld.keywords || '').split(',').map((s) => s.trim()).filter(Boolean),
    license: 'premium',
    licenseNote: 'Public preview only. Obtain the full licensed asset from Pro Sound Effects before use in the game.',
    previewUrl,
    previewExpiresAt: preview.searchParams.get('se') || null,
    localFile: `prosoundeffects/${source.libraryId}_${source.id}_${source.slug}${extension}`,
  };
}


return {parseSourceUrl,parsePage}; })();
  const url = new URL(input.value.trim());
  let record;
  if (['hooksounds.com','www.hooksounds.com'].includes(url.hostname)) record = await hooks(url.href,host);
  else if (['prosoundeffects.com','www.prosoundeffects.com'].includes(url.hostname)) {
    const source=pro.parseSourceUrl(url.href);
    record=pro.parsePage(await host.request('http.read',{url:source.canonical}),source);
  } else throw Error('Use a HookSounds or Pro Sound Effects asset URL');
  const {localFile, ...metadata}=record;
  metadata.id=[record.provider,record.libraryId,record.id].filter(Boolean).join(':');
  metadata.name=record.title;
  metadata.tags=record.tags.join(', ');
  await host.request('library.capture',{record:metadata,mediaUrl:record.previewUrl});
  return host.request('library.read');
}