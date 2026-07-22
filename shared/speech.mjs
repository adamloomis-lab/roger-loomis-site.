// ONE set of pronunciation rules, shared by the live /api/tts function and the
// narration pre-generator, so the chat's Listen button and the pre-generated
// page audio can never say the same string two different ways.
//
// Order matters: money and grouped numerals are spelled out first (ElevenLabs
// reads "$24,310" as "twenty four, three hundred ten"), then phone numbers,
// then clock times, then abbreviations.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numberToWords(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numberToWords(n % 100) : '');
  if (n < 1000000) return numberToWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  return numberToWords(Math.floor(n / 1000000)) + ' million' + (n % 1000000 ? ' ' + numberToWords(n % 1000000) : '');
}

const money = (whole, cents) => {
  const w = numberToWords(whole);
  const head = `${w} ${Number(whole) === 1 ? 'dollar' : 'dollars'}`;
  if (!cents) return head;
  const c = Number(cents);
  return `${head} and ${numberToWords(c)} ${c === 1 ? 'cent' : 'cents'}`;
};

export function expandForSpeech(t) {
  return String(t)
    // Money first: "$24,310" and "$14.50" both read wrong as numerals.
    .replace(/\$\s?(\d[\d,]*)(?:\.(\d{2}))?/g, (_, whole, cents) => money(whole.replace(/,/g, ''), cents))
    // Bare grouped numerals ("58,281 names") hit the same comma-as-pause bug.
    .replace(/\b\d{1,3}(?:,\d{3})+\b/g, (m) => numberToWords(m.replace(/,/g, '')))
    // Phone numbers read digit by digit; the commas become natural pauses.
    .replace(/\(?(\d{3})\)?[ .-]?(\d{3})[-.](\d{4})\b/g, (_, a, b, c) =>
      [a, b, c].map((g) => g.split('').join(' ')).join(', '))
    // Clock times: "8:00 AM" must not become "eight hundred".
    .replace(/\b(\d{1,2}):00\b/g, '$1')
    .replace(/\b(\d{1,2}):(\d{2})\b/g, '$1 $2')
    // Abbreviations this site's own copy actually uses.
    .replace(/\bBlvd\.?\b/g, 'Boulevard')
    .replace(/\bAve\.?\b/g, 'Avenue')
    .replace(/\bRd\.?\b/g, 'Road')
    .replace(/\bSt\.\s/g, 'Saint ')
    .replace(/\bRev\.\s/g, 'Reverend ')
    .replace(/\bDr\.\s/g, 'Doctor ')
    .replace(/\bPh\.?D\.?\b/g, 'P H D')
    .replace(/\bE4\b/g, 'E four')            // the E4 Ministry Network
    .replace(/\bNIV\b/g, 'N I V')
    .replace(/\bKJV\b/g, 'K J V')
    .replace(/\bOH\b/g, 'Ohio')
    .replace(/&/g, ' and ')
    // ZIP codes, anchored to the state so ordinary five-figure numbers survive.
    .replace(/\bOhio\s(\d{5})\b/g, (_, z) => 'Ohio ' + z.split('').join(' '));
}

export default expandForSpeech;
