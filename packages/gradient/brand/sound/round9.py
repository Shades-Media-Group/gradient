"""Shades sonic logo, round 9: the desk, heard up close.

The Owner scored four takes 10 of 10: Ink and paper (i6), Three taps (r2), Three beats (u1) and
Heart, sung (u2). What they share: one small physical sound you can name, made by a hand on
a desk, then a warm piano or chord. Round 8's ten far-apart worlds were all rejected.
Round 9 joins Three beats and Ink and paper (w1), then makes nine new takes from that family.
Each starts from a different object and none borrows another logo's shape.

    .venv/bin/python round9.py            # all of them
    .venv/bin/python round9.py w3         # only those
"""

import numpy as np

from ideas import felt_piano, finish, human, paper_swish, pen_click, pink, ring, run, stage
from render import RNG, SR, STRENGTH, csound, glide, place
from round4 import DRY, contact, knock, modes, thump, wood_tap
from round5 import hum_voice, lp
from round7 import pad


def T(dur):
    return np.arange(int(dur * SR)) / SR


def piano(x, notes, at, dur, end, rel=0.6, spread=0.045, swell=0.0):
    """Felt piano notes rolled from `at`, low to high, across the speakers. `swell` fades each
    note in over that many seconds, like strings waking in sympathy instead of being struck."""
    for i, (n, v) in enumerate(notes):
        a = human(at + i * spread, 4)
        s = felt_piano(n, dur - a, v, end - a, rel)
        if swell:
            s = s * (1 - np.exp(-T(dur - a)[: s.size] / swell))
        place(x, s, a, (i / (len(notes) - 1) - 0.5) * 0.5 if len(notes) > 1 else 0.0)


def stroke(dur, vel=1.0):
    """A pencil drawn across paper: graphite grain in a narrow band, rough in amplitude."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    grain = lp(np.abs(RNG.standard_normal(n)), 180) * 4
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
    return (ring(pink(n), 3200, 2.2) * 0.8 + ring(pink(n), 1400, 3) * 0.4) * shape * grain * vel * 0.5


def book(vel=1.0):
    """A hardback closed on a desk: the boards meet, a puff of air escapes, the desk answers."""
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    body = modes((96, 205, 340), (0.05, 0.025, 0.012), (1, 0.5, 0.25), 0.35)
    puff = lp(RNG.standard_normal(n), 700) * np.exp(-t / 0.035) * (1 - np.exp(-t / 0.004)) * 1.5
    return (body + puff + contact(1.5, 1600, 1.2, n) * 0.6) * vel


def cardboard(vel=1.0):
    """A fingertip on a cardboard box: dull, short and hollow."""
    n = int(0.2 * SR)
    return (modes((150, 340, 620), (0.03, 0.014, 0.007), (1, 0.45, 0.2), 0.2) + contact(3, 900, 1.0, n) * 0.6) * vel


def tick(vel=1.0):
    """One page leaving the thumb as a stack is riffled."""
    n = int(0.05 * SR)
    return (contact(0.5, 2600, 2.5, n) + contact(1.2, 1200, 2, n) * 0.4) * vel


def heartbeats(x, at=0.0, gap=0.24, f=54):
    """Three beats at the bars' strengths, 100, 75 and 50 %."""
    for i, s in enumerate(STRENGTH):
        place(x, thump(f + i * 3, s), human(at + i * gap, 3))


# ---- the ten takes ---------------------------------------------------------------------

def ink_and_beats(end=2.7, rel=1.0, dur=4.0, hall=1.6):
    """The two tens joined: the sheet slides, three heartbeats at the bars' strengths, the pen
    clicks, then the felt piano rolls the chord and the warm synth opens under it. B."""
    x = stage(dur)
    place(x, paper_swish() * 0.35, 0.0, -0.3)
    heartbeats(x, 0.38)
    place(x, pen_click() * 0.5, 1.02, 0.25)
    piano(x, (("B2", 0.3), ("F#4", 1.0), ("B4", 0.75), ("C#5", 0.5)), 1.1, dur, end)
    score = []
    pad(score, 1.15, dur, end, rel, notes=("F#3", "B3", "D#4", "F#4"), amp=0.14, bass="B1")
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.2, hall=hall, close=0.2, sat=0.4, mud=-1.5, air=1.0)


def ink_and_beats_short():
    """Ink and beats with the same opening, note for note; the chord lets go a second sooner."""
    return ink_and_beats(end=1.85, rel=0.6, dur=2.9)


def three_strokes():
    """A signature: a pencil makes three strokes, long, shorter, shortest, and each leaves a
    piano note behind it. E-flat."""
    end, rel, dur = 2.5, 0.9, 3.7
    x = stage(dur)
    for (at, length), (n, v), pan in zip(((0.0, 0.28), (0.34, 0.2), (0.6, 0.13)),
                                         (("A#4", 1.0), ("D#5", 0.8), ("G5", 0.6)), (-0.3, 0.0, 0.3)):
        place(x, stroke(length, STRENGTH[["A#4", "D#5", "G5"].index(n)]), human(at, 3), pan)
        a = human(at + length, 3)
        place(x, felt_piano(n, dur - a, v, end - a, 0.7), a, pan)
    piano(x, (("D#3", 0.5), ("A#3", 0.4)), 0.78, dur, end)
    return finish(x, wet=0.2, hall=1.7, close=0.18, sat=0.35, mud=-1.5, air=1.0)


def book_closed():
    """A hardback closes on the desk, and a low piano chord answers out of the wood. F."""
    end, rel, dur = 2.3, 0.9, 3.4
    x = stage(dur)
    place(x, book(1.0), 0.0)
    piano(x, (("F2", 0.45), ("C4", 0.7), ("F4", 0.85), ("A4", 0.7), ("C5", 0.5)), 0.32, dur, end, spread=0.03)
    return finish(x, wet=0.2, hall=1.7, close=0.22, sat=0.4, mud=-2.0, presence=2.0)


def wood_tune():
    """The tune played on the desk: three tuned taps on hollow wood, then someone hums it back. A."""
    end, rel, dur = 2.6, 0.9, 3.8
    x = stage(dur)
    tune = (("A4", 0.0), ("B4", 0.2), ("E5", 0.4))
    for i, (n, at) in enumerate(tune):
        place(x, wood_tap(n, STRENGTH[i]) * 1.4, human(at, 3), (-0.25, 0.0, 0.25)[i])
    hum_len = dur - 0.8
    steps = [(0.0, "A3"), (0.2, "B3"), (0.4, "E4")]
    place(x, hum_voice(glide(steps, hum_len, 60), hum_len, end - 0.8, rel, 0.55), 0.8, -0.1)
    piano(x, (("A2", 0.2), ("E4", 0.55)), 1.2, dur, end)
    return finish(x, wet=0.2, hall=1.6, close=0.2, sat=0.4, mud=-4.0, presence=3.0)


def page_turn():
    """A page turns, and the sweep of the paper carries straight into the warm synth. B-flat."""
    end, rel, dur = 2.6, 1.0, 3.8
    x = stage(dur)
    place(x, paper_swish(0.55) * 0.45, 0.0, -0.4)
    place(x, contact(1.0, 1800, 1.5, int(0.05 * SR)) * 0.5, 0.52, 0.35)  # the page lands
    score = []
    pad(score, 0.4, dur, end, rel, notes=("D4", "F4", "A#4", "D5"), amp=0.2, opens=0.8, bass="A#1",
        times=[0.4, 0.45, 0.5, 0.56])
    x += csound(score, dur, room=DRY)
    piano(x, (("F5", 0.5),), 0.56, dur, end)
    return finish(x, wet=0.24, hall=2.0, close=0.14, sat=0.35, mud=-1.5)


def piano_heartbeat():
    """The piano is the heart: its lowest notes play the beat, soft, felted, then the chord. D."""
    end, rel, dur = 2.6, 0.9, 3.8
    x = stage(dur)
    for i, (at, v) in enumerate(((0.0, 1.0), (0.24, 0.7), (0.86, 1.0), (1.1, 0.7))):
        place(x, felt_piano("D2", 0.5, v, 0.18, 0.12) * 1.3, human(at, 3))
        if i % 2 == 0:
            place(x, thump(52, 0.5 * v), human(at, 2))
    piano(x, (("A3", 0.5), ("D4", 0.8), ("F#4", 0.7), ("A4", 0.9), ("E5", 0.5)), 1.1, dur, end)
    return finish(x, wet=0.2, hall=1.8, close=0.2, sat=0.4, mud=-2.0, presence=1.5)


def lid_wakes():
    """A knuckle on the piano's lid, and the strings inside wake in sympathy: no hammer, only
    the chord swelling out of the wood. G."""
    end, rel, dur = 2.6, 1.0, 3.6
    x = stage(dur)
    place(x, knock(175, 1.0) * 1.6, 0.0, -0.1)
    piano(x, (("G2", 0.4), ("D4", 0.8), ("G4", 0.9), ("B4", 0.7), ("D5", 0.5)), 0.05, dur, end,
          spread=0.02, swell=0.35)
    place(x, knock(168, 0.7) * 1.4, human(0.2, 3), 0.1)
    return finish(x, wet=0.26, hall=2.0, close=0.18, sat=0.35, mud=-2.0, presence=2.0)


def parcel():
    """Two fingertips on a cardboard parcel, then the warm synth and a high piano note. E."""
    end, rel, dur = 2.5, 1.0, 3.7
    x = stage(dur)
    place(x, cardboard(1.0) * 1.3, 0.0, -0.15)
    place(x, cardboard(0.7) * 1.3, human(0.15, 3), 0.15)
    score = []
    pad(score, 0.5, dur, end, rel, notes=("G#3", "B3", "E4", "G#4"), amp=0.2, opens=0.9, bass="E2")
    x += csound(score, dur, room=DRY)
    piano(x, (("B5", 0.55), ("E5", 0.45)), 0.52, dur, end, spread=0.18)
    return finish(x, wet=0.22, hall=1.9, close=0.16, sat=0.4, mud=-1.5)


def knock_room():
    """Two knocks, and the door opens on a room: the space grows around a held chord. F-sharp."""
    end, rel, dur = 2.8, 1.1, 4.0
    x = stage(dur)
    place(x, knock(200, 1.0) * 1.8, 0.0, -0.15)
    place(x, knock(192, 0.75) * 1.8, human(0.16, 4), 0.1)
    score = []
    pad(score, 0.55, dur, end, rel, notes=("C#4", "F#4", "A#4", "C#5"), amp=0.18, opens=1.6, bass="F#2",
        times=[0.55, 0.6, 0.7, 0.85], spread=10)
    x += csound(score, dur, room=DRY)
    piano(x, (("F#3", 0.5), ("C#5", 0.6)), 0.6, dur, end, spread=0.12)
    return finish(x, wet=0.34, hall=2.6, close=0.12, sat=0.35, mud=-1.5)


def riffle():
    """A thumb riffles a stack of pages, slowing to a stop, and the piano lands where it stops. C."""
    end, rel, dur = 2.4, 0.9, 3.6
    x = stage(dur)
    at, gap = 0.0, 0.022
    while gap < 0.075:
        place(x, tick(0.5 + RNG.random() * 0.4) * 0.9, at, RNG.uniform(-0.3, 0.3))
        at += gap
        gap *= 1.11
    place(x, tick(1.0) * 1.2, at, 0.0)
    piano(x, (("C3", 0.45), ("G3", 0.5), ("E4", 0.75), ("G4", 0.85), ("D5", 0.55)), at + 0.06, dur, end, spread=0.035)
    return finish(x, wet=0.2, hall=1.7, close=0.2, sat=0.35, mud=-2.0, presence=1.5)


IDEAS = {"w1-ink-and-beats": ink_and_beats, "w1b-ink-and-beats-short": ink_and_beats_short,
         "w2-three-strokes": three_strokes, "w3-book-closed": book_closed,
         "w4-wood-tune": wood_tune, "w5-page-turn": page_turn, "w6-piano-heartbeat": piano_heartbeat,
         "w7-lid-wakes": lid_wakes, "w8-parcel": parcel, "w9-knock-room": knock_room, "w10-riffle": riffle}

if __name__ == "__main__":
    run(IDEAS)
