export const sounds = [
  { name: 'Hello, human', color: '#ff9138', lightColor: '#de6515' },
  { name: 'Feed me', color: '#ffdb24', lightColor: '#b78400' },
  { name: 'A little chirp', color: '#86ef32', lightColor: '#4b9c0a' },
  { name: 'Excuse me?', color: '#22e6bc', lightColor: '#009a7b' },
  { name: 'Big opinion', color: '#39b8ff', lightColor: '#007bdd' },
  { name: 'Tiny protest', color: '#a27aff', lightColor: '#773be4' },
  { name: 'More, please', color: '#ff4cb2', lightColor: '#dc188b' },
  { name: 'Serious business', color: '#ff6557', lightColor: '#de3e31' },
  { name: 'Goodnight', color: '#43e1f4', lightColor: '#0099ba' },
].map((sound, i) => ({ ...sound, id: i + 1, src: null }));

const newNames = ['Double take', 'Stairway chat', 'Little question', 'Shelf supervisor', 'Long story', 'Open the door', 'Another word', 'Doorway duet', 'Curtain call'];
export const soundPages = [
  sounds.map((sound, i) => ({ ...sound, id: i + 10, name: newNames[i] })),
  sounds,
];
export const allSounds = soundPages.flat();
