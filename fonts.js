/* Font sets for the whole site (admin sidebar → Edit Font).
   Every set fills the same three roles so each section keeps its look:
     head  = headings (hero headline, section titles, card titles)
     body  = paragraphs, buttons, lists
     label = small uppercase tags, chips, menu tabs, captions
   Loaded in <head> so the saved set applies before the page is drawn. */
(function () {
  var F = function (name, spec, fallback) { return { name: name, spec: spec, stack: "'" + name + "', " + fallback }; };
  var SETS = [
    { id: 'original', name: 'Original', style: 'original', note: 'The default look of this site',
      head: F('Montserrat', 'Montserrat:wght@400;500;600;700;800', 'sans-serif'),
      body: F('Montserrat', 'Montserrat:wght@400;500;600;700;800', 'sans-serif'),
      label: F('JetBrains Mono', 'JetBrains+Mono:wght@400;500;700', 'monospace') },

    // Masculine: strong, structured, technical
    { id: 'steel', name: 'Steel', style: 'masculine', note: 'Tall, bold and confident',
      head: F('Oswald', 'Oswald:wght@400;500;600;700', 'sans-serif'),
      body: F('Source Sans 3', 'Source+Sans+3:wght@400;600;700', 'sans-serif'),
      label: F('IBM Plex Mono', 'IBM+Plex+Mono:wght@400;500;700', 'monospace') },
    { id: 'architect', name: 'Architect', style: 'masculine', note: 'Modern, precise and technical',
      head: F('Space Grotesk', 'Space+Grotesk:wght@400;500;700', 'sans-serif'),
      body: F('Inter', 'Inter:wght@400;500;600;700;800', 'sans-serif'),
      label: F('Space Mono', 'Space+Mono:wght@400;700', 'monospace') },
    { id: 'commander', name: 'Commander', style: 'masculine', note: 'Condensed and powerful',
      head: F('Barlow Condensed', 'Barlow+Condensed:wght@500;600;700;800', 'sans-serif'),
      body: F('Barlow', 'Barlow:wght@400;500;600;700', 'sans-serif'),
      label: F('Roboto Mono', 'Roboto+Mono:wght@400;500;700', 'monospace') },
    { id: 'executive', name: 'Executive', style: 'masculine', note: 'Clean, corporate and sharp',
      head: F('Sora', 'Sora:wght@400;600;700;800', 'sans-serif'),
      body: F('Manrope', 'Manrope:wght@400;500;600;700;800', 'sans-serif'),
      label: F('Fira Code', 'Fira+Code:wght@400;500;700', 'monospace') },
    { id: 'industrial', name: 'Industrial', style: 'masculine', note: 'Angular, futuristic and tech',
      head: F('Chakra Petch', 'Chakra+Petch:wght@400;500;600;700', 'sans-serif'),
      body: F('Titillium Web', 'Titillium+Web:wght@400;600;700', 'sans-serif'),
      label: F('Share Tech Mono', 'Share+Tech+Mono', 'monospace') },

    // Feminine: elegant, soft, graceful
    { id: 'elegance', name: 'Elegance', style: 'feminine', note: 'Classic, refined and editorial',
      head: F('Playfair Display', 'Playfair+Display:wght@400;600;700;800', 'serif'),
      body: F('Lato', 'Lato:wght@400;700', 'sans-serif'),
      label: F('DM Mono', 'DM+Mono:wght@400;500', 'monospace') },
    { id: 'blossom', name: 'Blossom', style: 'feminine', note: 'Delicate, airy and graceful',
      head: F('Cormorant Garamond', 'Cormorant+Garamond:wght@500;600;700', 'serif'),
      body: F('Nunito Sans', 'Nunito+Sans:wght@400;600;700;800', 'sans-serif'),
      label: F('Josefin Sans', 'Josefin+Sans:wght@400;600;700', 'sans-serif') },
    { id: 'grace', name: 'Grace', style: 'feminine', note: 'Warm, friendly and polished',
      head: F('Lora', 'Lora:wght@400;500;600;700', 'serif'),
      body: F('DM Sans', 'DM+Sans:wght@400;500;700', 'sans-serif'),
      label: F('DM Mono', 'DM+Mono:wght@400;500', 'monospace') },
    { id: 'petal', name: 'Petal', style: 'feminine', note: 'Soft, rounded and approachable',
      head: F('Comfortaa', 'Comfortaa:wght@400;600;700', 'sans-serif'),
      body: F('Nunito', 'Nunito:wght@400;600;700;800', 'sans-serif'),
      label: F('Quicksand', 'Quicksand:wght@400;500;600;700', 'sans-serif') },
    { id: 'boutique', name: 'Boutique', style: 'feminine', note: 'Luxurious, fashion-forward and chic',
      head: F('Bodoni Moda', 'Bodoni+Moda:wght@400;600;700;800', 'serif'),
      body: F('Raleway', 'Raleway:wght@400;500;600;700', 'sans-serif'),
      label: F('Josefin Sans', 'Josefin+Sans:wght@400;600;700', 'sans-serif') }
  ];

  // One <link> per font family, so a slow or missing font never blocks the others
  function loadFamily(spec) {
    var id = 'font-' + spec.split(':')[0].replace(/\W+/g, '-').toLowerCase();
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + spec + '&display=swap';
    document.head.appendChild(link);
  }
  function find(id) { for (var i = 0; i < SETS.length; i++) if (SETS[i].id === id) return SETS[i]; return SETS[0]; }
  function load(set) { [set.head, set.body, set.label].forEach(function (f) { loadFamily(f.spec); }); }
  function apply(id) {
    var set = find(id), root = document.documentElement.style;
    load(set);
    root.setProperty('--font-head', set.head.stack);
    root.setProperty('--font-body', set.body.stack);
    root.setProperty('--font-label', set.label.stack);
    return set;
  }
  var saved = 'original';
  try { saved = localStorage.getItem('romelFonts') || 'original'; } catch (e) {}
  window.ROMEL_FONTS = { sets: SETS, find: find, load: load, apply: apply, saved: saved };
  if (saved !== 'original') apply(saved);
})();
