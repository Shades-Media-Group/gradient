"""Shades sonic logo, round 7: what makes a sound logo iconic, in the sounds the Owner chose.

He scored "Heart, opening" (t8) 10 of 10: one heartbeat, then a warm synth opens on a chord.
The sound logos people remember share a few habits: one sound you can name with your eyes
shut, a short rest, then a bloom; a tune short enough to hum; low weight under a bright top;
one signature trick; and under about three seconds before the tail. Round 7 keeps t8's core
and tries those habits one at a time, so each take answers one question.

    .venv/bin/python round7.py            # all of them
    .venv/bin/python round7.py u3         # only those
"""

import numpy as np

from ideas import cheek_pop, cents, felt_piano, finish, human, run, stage
from render import RNG, SR, STRENGTH, csound, hz, mix, place
from round4 import PAD, add, knock, thump
from round6 import DRY, hummed

CHORD = ("G#3", "C#4", "F4", "G#4")  # t8's D-flat chord
TUNE = ("C#5", "G#5", "F5")  # up a fifth, then settles down a third onto the chord


def pad(score, at, dur, end, rel, notes=CHORD, amp=0.22, opens=1.2, bass="C#2", times=None, spread=6):
    """t8's bloom: each note three detuned saws whose filter opens from dark to warm."""
    times = times or [at, at, at + 0.12, at + 0.28]
    for note, t, s in zip(notes, times, (0.7, 1.0, 0.8, 0.55)):
        for c in (-spread, 0, spread):
            score.append((PAD, t, dur - t, (note, c), amp * s, 0.5 + c / 20, end, rel, t + 0.15, opens, 0.02))
    if bass:
        score.append((PAD, at, dur - at, (bass, 0), 0.2, 0.5, end, rel, at + 0.2, opens, 0.15))


def heartbeat(x, at=0.0, f=54, gap=0.26, vel=1.0):
    place(x, thump(f, vel), at)
    place(x, thump(f + 7, 0.6 * vel), human(at + gap, 3))


# ---- the ten takes ---------------------------------------------------------------------

def three_beats():
    """The mark, felt: three beats at the bars' strengths, 100, 75 and 50 %, then the chord opens."""
    end, rel, dur = 2.4, 1.1, 3.8
    x = stage(dur)
    for i, s in enumerate(STRENGTH):
        place(x, thump(54 + i * 3, s), human(i * 0.24, 3))
    score = []
    pad(score, 0.86, dur, end, rel)
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.26, hall=2.1, close=0.12, sat=0.4, mud=-1.0)


def heart_sung():
    """A tune on top: the heartbeat, the chord, and a hummed three-note tune you can sing back."""
    end, rel, dur = 2.5, 1.1, 3.9
    x = stage(dur)
    heartbeat(x)
    score = []
    pad(score, 0.62, dur, end, rel, amp=0.17)
    for n, at in zip(TUNE, (0.7, 0.92, 1.14)):
        hummed(score, (n,), at, dur, end, rel, 0.3)
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.26, hall=2.0, close=0.14, sat=0.4, mud=-1.0)


def heart_short():
    """The sting: the same idea in two and a half seconds, for an app opening or the end of a reel."""
    end, rel, dur = 1.5, 0.8, 2.6
    x = stage(dur)
    heartbeat(x, gap=0.2)
    score = []
    pad(score, 0.42, dur, end, rel, opens=0.7, times=[0.42, 0.42, 0.48, 0.56])
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.22, hall=1.6, close=0.12, sat=0.4, mud=-1.0)


def knock_opens():
    """A different first sound: two knocks on a door, and the warm chord opens behind it. E-flat."""
    end, rel, dur = 2.4, 1.1, 3.8
    x = stage(dur)
    place(x, knock(190, 1.0) * 1.8, 0.0, -0.15)
    place(x, knock(182, 0.75) * 1.8, human(0.17, 4), 0.1)
    score = []
    pad(score, 0.6, dur, end, rel, notes=("A#3", "D#4", "G4", "A#4"), bass="D#2")
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.26, hall=2.0, close=0.18, sat=0.4, mud=-1.0)


def fingers_open():
    """Fingers on the table, then the warm chord instead of the piano. E."""
    end, rel, dur = 2.4, 1.1, 3.8
    x = stage(dur)
    for i, (at, v) in enumerate(((0.0, 0.5), (0.07, 0.6), (0.13, 0.75), (0.18, 1.0))):
        place(x, knock(230 + i * 6, v) * 1.2, human(at, 3), -0.3 + i * 0.2)
    score = []
    pad(score, 0.48, dur, end, rel, notes=("B3", "E4", "G#4", "B4"), bass="E2")
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.24, hall=1.9, close=0.18, sat=0.4, mud=-1.0)


def heart_and_piano():
    """The tune on the felt piano: heartbeat, then the piano plays the three notes over the chord."""
    end, rel, dur = 2.5, 1.0, 3.9
    x = stage(dur)
    heartbeat(x)
    for n, at, v in zip(TUNE, (0.62, 0.82, 1.02), (0.8, 0.9, 1.0)):
        a = human(at, 4)
        place(x, felt_piano(n, dur - a, v, end - a, 0.6), a, (-0.15, 0.15, 0.0)[TUNE.index(n)])
    score = []
    pad(score, 0.62, dur, end, rel, amp=0.18)
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.25, hall=2.0, close=0.14, sat=0.4, mud=-1.0, air=1.0)


def one_strike():
    """One gesture: a single beat and the whole chord land together, struck like one big note."""
    end, rel, dur = 1.9, 1.0, 3.1
    x = stage(dur)
    place(x, thump(50, 1.1), 0.0)
    for i, (n, v) in enumerate((("G#3", 0.5), ("F4", 0.8), ("C#5", 0.9), ("G#5", 0.4))):
        place(x, felt_piano(n, dur, v, end, 0.6), human(0.005, 2), (i - 1.5) * 0.2)
    score = []
    pad(score, 0.0, dur, end, rel, opens=0.9, times=[0.0, 0.0, 0.02, 0.04], bass=None)
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.26, hall=2.0, close=0.12, sat=0.4, mud=-1.0)


def drawn_in():
    """A signature trick: the chord's own echo, played backwards, draws in to the heartbeat,
    and the chord opens forwards out of it."""
    lead, end, rel, dur = 0.8, 2.9, 1.0, 4.0
    swell = []
    pad(swell, 0.0, 1.2, 0.3, 0.6, opens=0.3, times=[0.0] * 4, bass=None)
    y = mix(csound(swell, 1.2, room=DRY), 1.4, 2.6, 4000)[::-1]
    y = y[-int(lead * SR):] * np.linspace(0, 1, int(lead * SR))[:, None] ** 2 * 0.6
    x = stage(dur)
    add(x, y, 0.0)
    heartbeat(x, at=lead)
    score = []
    pad(score, lead + 0.4, dur, end, rel)
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.24, hall=2.0, close=0.12, sat=0.4, mud=-1.0)


def pops_open():
    """The mouth leads: three cheek pops on the tune, then the warm chord opens."""
    end, rel, dur = 2.4, 1.1, 3.8
    x = stage(dur)
    for i, n in enumerate(TUNE):
        place(x, cheek_pop(cents(hz(n), RNG.normal(0, 8))) * STRENGTH[i], human(i * 0.15, 4), (-0.2, 0.0, 0.2)[i])
    score = []
    pad(score, 0.62, dur, end, rel)
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.26, hall=1.9, close=0.15, sat=0.35, mud=-1.0)


def heart_wide():
    """The colour travels: the heartbeat, then the chord opens slowly from dark blue to warm orange
    and moves from the left speaker to the right, over a low floor."""
    end, rel, dur = 2.8, 1.2, 4.2
    x = stage(dur)
    heartbeat(x)
    score = []
    for i, (note, s) in enumerate(zip(CHORD, (0.7, 1.0, 0.8, 0.55))):
        t = 0.62 + i * 0.1
        for c in (-8, 0, 8):
            score.append((PAD, t, dur - t, (note, c), 0.22 * s, 0.15 + i * 0.23, end, rel, t + 0.2, 1.8, 0.03))
    score.append((PAD, 0.6, dur - 0.6, ("C#2", 0), 0.22, 0.5, end, rel, 0.8, 1.8, 0.2))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.28, hall=2.3, close=0.12, sat=0.4, mud=-1.0)


IDEAS = {"u1-three-beats": three_beats, "u2-heart-sung": heart_sung, "u3-heart-short": heart_short,
         "u4-knock-opens": knock_opens, "u5-fingers-open": fingers_open, "u6-heart-piano": heart_and_piano,
         "u7-one-strike": one_strike, "u8-drawn-in": drawn_in, "u9-pops-open": pops_open,
         "u10-heart-wide": heart_wide}

if __name__ == "__main__":
    run(IDEAS)
