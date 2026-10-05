export const sounds = [
  { name: 'Hello, human', color: '#ff9138', lightColor: '#de6515', pose: 'hello' },
  { name: 'Feed me', color: '#ffdb24', lightColor: '#b78400', pose: 'food' },
  { name: 'A little chirp', color: '#86ef32', lightColor: '#4b9c0a', pose: 'chirp' },
  { name: 'Excuse me?', color: '#22e6bc', lightColor: '#009a7b', pose: 'question' },
  { name: 'Big opinion', color: '#39b8ff', lightColor: '#007bdd', pose: 'long' },
  { name: 'Tiny protest', color: '#a27aff', lightColor: '#773be4', pose: 'protest' },
  { name: 'More, please', color: '#ff4cb2', lightColor: '#dc188b', pose: 'please' },
  { name: 'Serious business', color: '#ff6557', lightColor: '#de3e31', pose: 'serious' },
  { name: 'Goodnight', color: '#43e1f4', lightColor: '#0099ba', pose: 'sleep' },
].map((sound, i) => ({ ...sound, id: i + 1, src: null }));
