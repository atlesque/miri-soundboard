export const sounds = [
  { name: 'Hello, human', color: '#ffad77', pose: 'hello' },
  { name: 'Feed me', color: '#f0cc65', pose: 'food' },
  { name: 'A little chirp', color: '#b6da7a', pose: 'chirp' },
  { name: 'Excuse me?', color: '#80dfce', pose: 'question' },
  { name: 'Big opinion', color: '#7eb9fb', pose: 'long' },
  { name: 'Tiny protest', color: '#b5a0f5', pose: 'protest' },
  { name: 'More, please', color: '#ec9cc4', pose: 'please' },
  { name: 'Serious business', color: '#f18d85', pose: 'serious' },
  { name: 'Goodnight', color: '#cad1e4', pose: 'sleep' },
].map((sound, i) => ({ ...sound, id: i + 1, src: null }));
