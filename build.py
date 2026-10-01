"""Regenerate the self-contained game after editing data.txt or index.template.html."""
from pathlib import Path
import json

root = Path(__file__).resolve().parent
words = []
level = 0
for line in (root / 'data.txt').read_text().splitlines():
    if not line.strip():
        continue
    if line.startswith('['):
        level += 1
        continue
    word, picture, definition, template = line.split('|')
    allowed = ['picture'] if level <= 2 else ['meaning', 'blank']
    if level in (3, 4) and word != 'river':
        allowed.append('picture')
    if level == 5 and word in ('happy', 'sad', 'angry', 'tired', 'surprised'):
        allowed.append('picture')
    if level == 6 and word in ('run', 'jump', 'swim', 'write', 'draw', 'clap'):
        allowed.append('picture')
    if level >= 7 and word.isalpha() and 3 <= len(word) <= 7:
        allowed.append('spell')
    words.append(dict(id=f'l{level}-{word}', level=level, word=word,
                      picture=picture, scene='Picture clue: ' + definition,
                      definition=definition, template=template, allowed=allowed,
                      opposite=None))
pairs = [('hot', 'cold'), ('big', 'small'), ('fast', 'slow'), ('open', 'closed'),
         ('full', 'empty'), ('wet', 'dry'), ('near', 'far'), ('day', 'night')]
for a, b in pairs:
    for w in words:
        if w['level'] == 8 and w['word'] in (a, b):
            w['opposite'] = 'l8-' + (b if w['word'] == a else a)
assert len(words) == 120
assert len(set(w['word'] for w in words)) == 120
source = (root / 'index.template.html').read_text()
game = source.replace('__WORDS__', json.dumps(words, ensure_ascii=False, separators=(',', ':')))
assert '__WORDS__' not in game
(root / 'index.html').write_text(game)
print(f'Built index.html: {len(game.encode())} bytes, {len(words)} words')
