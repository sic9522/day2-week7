// ponytail: placeholder feed content, no post creation/BE endpoint requested yet.
import npe from '../assets/jokes/npe.svg'
import equality from '../assets/jokes/equality.svg'
import build from '../assets/jokes/build.svg'
import nan from '../assets/jokes/nan.svg'
import gc from '../assets/jokes/gc.svg'

export const mockPosts = [
  {
    id: 'p1',
    author: 'Giulia Rossi',
    time: '2 h fa',
    text: 'Oggi ho scoperto il vero significato di NullPointerException.',
    image: npe,
    likes: 42,
    comments: 7,
  },
  {
    id: 'p2',
    author: 'Marco Bianchi',
    time: '4 h fa',
    text: 'JavaScript continua a stupirmi ogni giorno.',
    image: equality,
    likes: 31,
    comments: 12,
  },
  {
    id: 'p3',
    author: 'Team Progetto',
    time: '6 h fa',
    text: 'La build è verde, siamo tutti fieri di noi.',
    image: build,
    likes: 25,
    comments: 4,
  },
  {
    id: 'p4',
    author: 'Giulia Rossi',
    time: 'Ieri',
    text: 'Chiesto scusa a NaN per anni. Non serviva a niente.',
    image: nan,
    likes: 18,
    comments: 3,
  },
  {
    id: 'p5',
    author: 'Marco Bianchi',
    time: 'Ieri',
    text: 'La gentilezza non paga sempre, nemmeno con la JVM.',
    image: gc,
    likes: 20,
    comments: 5,
  },
]
