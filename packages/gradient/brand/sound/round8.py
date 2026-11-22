"""Shades sonic logo, round 8: ten worlds, as far apart as they go.

Round 7 kept one core (a heartbeat and the warm chord in D-flat) and the Owner liked it only
because it was the only thing on offer. Round 8 drops the core. Every take has its own sound
world, instrument family, key, mode, length and shape, so no two sound alike.

    .venv/bin/python round8.py            # all of them
    .venv/bin/python round8.py v3         # only those
"""

import numpy as np

from ideas import cheek_pop, env, felt_piano, finish, human, pink, ring, run, snap, stage
from render import RNG, SR, csound, hz, place
from round4 import DRY, KEYS, PAD, STRINGS, contact, modes, thump
from round5 import additive, hum_voice, lp

BRASS = 2


def T(dur):
    return np.arange(int(dur * SR)) / SR


def tone(contour, dur, amps, attack, end, rel, decay=60.0):
    return additive(contour, dur, amps) * env(int(dur * SR), attack, end, rel, decay)


def slide(f0, f1, dur, at, time):
    """A pitch contour that holds f0, then slides to f1 from `at` over `time` seconds."""
    k = np.clip((T(dur) - at) / time, 0, 1)
    k = k * k * (3 - 2 * k)
    return np.exp(np.log(f0) + (np.log(f1) - np.log(f0)) * k)


SAW = [1 / k for k in range(1, 24)]


# ---- the ten takes ---------------------------------------------------------------------

def stamp():
    """Print: a rubber stamp pressed twice on paper, then a bright piano answers on an open fifth. A."""
    end, rel, dur = 1.8, 0.9, 3.0

    def press(vel):
        n = int(0.25 * SR)
        body = modes((118, 262, 415), (0.045, 0.02, 0.01), (1, 0.45, 0.2), 0.25)
        return (body + contact(2.5, 1100, 0.9, n) * 0.9 + contact(0.6, 3600, 2, n) * 0.25) * vel

    x = stage(dur)
    place(x, press(1.0), 0.0, -0.05)
    place(x, press(0.8), human(0.3, 3), 0.05)
    for n, at, v, p in (("A4", 0.62, 0.9, -0.2), ("E5", 0.64, 0.8, 0.2), ("A5", 0.66, 0.45, 0.0)):
        place(x, felt_piano(n, dur - at, v, end - at, 0.6), human(at, 2), p)
    return finish(x, wet=0.2, hall=1.6, close=0.14, sat=0.3, mud=-1.5, air=2.5)


def split():
    """One pure note splits into a wide chord: four voices glide apart across the speakers. F-sharp."""
    end, rel, dur = 2.4, 1.0, 3.6
    x = stage(dur)
    start = hz("C#5")
    for note, pan, v in (("F#3", -0.15, 0.8), ("C#4", -0.6, 0.7), ("A#4", 0.6, 0.7), ("C#5", 0.0, 0.8), ("F#5", 0.3, 0.45)):
        f = slide(start, hz(note), dur, 0.55, 0.7)
        voice = tone(f, dur, [1, 0.32, 0.14, 0.07, 0.03], 0.25, end, rel)
        pans = np.clip(np.linspace(0, 1, voice.size) * 3, 0, 1) * pan  # all from the centre outwards
        x[:, 0] += voice * v * np.sqrt((1 - pans) / 2)
        x[:, 1] += voice * v * np.sqrt((1 + pans) / 2)
    return finish(x, wet=0.3, hall=2.4, close=0.1, sat=0.3, mud=-1.0)


def braam():
    """Cinema: one low hit of brass and saws, the floor dropping under it, then a minor third on top. C minor."""
    end, rel, dur = 1.9, 1.3, 3.5
    x = stage(dur)
    drop = slide(hz("C3"), hz("C1"), dur, 0.0, 0.9)
    place(x, tone(drop, dur, [1, 0.5, 0.25], 0.005, end, rel) * 0.18, 0.0)
    place(x, thump(64, 0.6), 0.0)
    score = []
    for note, amp in (("C2", 0.1), ("G2", 0.16), ("C3", 0.26), ("G3", 0.26), ("C4", 0.2)):
        for c in (-9, 0, 9):
            score.append((PAD, 0.0, dur, (note, c), amp, 0.5 + c / 25, end, rel, 0.0, 0.12, 0.01))
    for note, at in (("D#4", 0.8), ("G4", 0.8), ("C5", 0.95)):
        score.append((PAD, at, dur - at, note, 0.3, 0.5, end, rel, at, 0.6, 0.25))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.32, hall=2.6, close=0.1, drive=2.2, sat=0.5, mud=-3.0, presence=3.0)


def organ():
    """Church and soul: a drawbar organ through a spinning speaker plays amen, four to one. G."""
    end, rel, dur = 2.6, 0.9, 3.6
    x = stage(dur)
    bars = [0.35, 1.0, 0.7, 0.7, 0.0, 0.5, 0.0, 0.4, 0, 0, 0, 0.2]  # per harmonic of the sub-octave: 16', 8', 5 1/3', 4' ...
    t = T(dur)
    for chord, at, length in ((("C3", "E4", "G4", "C5"), 0.0, 1.15), (("G2", "D4", "G4", "B4"), 1.1, dur - 1.1)):
        for i, n in enumerate(chord):
            f = hz(n) / 2 * (1 + 0.0025 * np.sin(2 * np.pi * 6.2 * t[: int(length * SR)] + i))  # the speaker turning
            e = end - at if at else length - 0.05
            v = tone(f, length, bars, 0.008, e, rel if at else 0.08) * (1 + 0.18 * np.sin(2 * np.pi * 6.2 * t[: int(length * SR)] + i * 1.7))
            v += contact(0.4, 2600, 3, v.size) * 0.15  # key click
            place(x, v * (0.8 if i else 0.9), at, (-0.3, 0.3, -0.1, 0.15)[i])
    return finish(x, wet=0.28, hall=2.2, close=0.18, drive=2.0, sat=0.5, mud=-3.0, presence=2.5)


def plain_piano():
    """Nothing but a piano: three notes you can sing, a step down then up a fourth, and the chord. C."""
    end, rel, dur = 2.3, 0.9, 3.4
    x = stage(dur)
    for n, at, v in (("E5", 0.0, 0.9), ("D5", 0.32, 0.75), ("G5", 0.5, 1.0)):
        a = human(at, 4)
        place(x, felt_piano(n, dur - a, v, end - a, 0.7), a, 0.1)
    for n, v in (("C3", 0.7), ("G3", 0.6), ("E4", 0.5)):
        a = human(0.5, 3)
        place(x, felt_piano(n, dur - a, v, end - a, 0.7), a, -0.15)
    return finish(x, wet=0.22, hall=1.8, close=0.16, sat=0.25, mud=-1.5, air=1.5)


def beatbox():
    """The mouth as a band: a kick, a pop, a 'pf', and a hum that lands the bar. D."""
    end, rel, dur = 1.4, 0.6, 2.2
    x = stage(dur)

    def kick(vel):
        n = int(0.25 * SR)
        return thump(90, vel)[:n] * 0.6 + contact(1.0, 1800, 2, n) * 1.0 * vel

    def pf(vel):
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        return ring(pink(n), 2400, 1.2) * np.exp(-t / 0.03) * (1 - np.exp(-t / 0.002)) * vel * 1.6

    beat = 0.14  # one sixteenth at 107 bpm
    place(x, kick(1.0), 0.0)
    place(x, cheek_pop(hz("D5")) * 1.2, human(2 * beat, 3), 0.25)
    place(x, kick(0.8), human(3 * beat, 3))
    place(x, pf(0.9), human(4 * beat, 3), -0.2)
    hum = hum_voice(slide(hz("A3"), hz("D4"), dur - 6 * beat, 0.05, 0.12), dur - 6 * beat, end - 6 * beat, rel, 1.0)
    place(x, hum * 1.1, 6 * beat)
    place(x, kick(0.9), 6 * beat)
    return finish(x, wet=0.12, hall=1.2, close=0.2, sat=0.45, mud=-4.0, presence=4.0)


def horns():
    """A short fanfare: two pickup notes on the horn, then an open fifth held by the section. B-flat."""
    end, rel, dur = 2.2, 1.0, 3.4
    score = []
    for note, at, length, amp, pan in (("F4", 0.0, 0.17, 0.6, 0.45), ("F4", 0.2, 0.17, 0.55, 0.5)):
        score.append((BRASS, at, length, note, amp, pan, at + length - 0.04, 0.04, at, 0.05, 0.015))
    for note, amp, pan in (("A#2", 0.15, 0.5), ("A#3", 0.3, 0.35), ("F4", 0.35, 0.65), ("A#4", 0.45, 0.5), ("F5", 0.2, 0.55)):
        for c in (-5, 5):
            score.append((BRASS, 0.42, dur - 0.42, (note, c), amp * 0.75, pan + c / 40, end, rel, 0.45, 0.7, 0.03))
    x = csound(score, dur, room=DRY)
    return finish(x, wet=0.3, hall=2.4, close=0.14, sat=0.35, mud=-3.5, presence=3.0)


def tape_stop():
    """A trick from the studio: a warm electric piano chord, then the tape is stopped and the pitch sinks. E-flat."""
    dur = 2.6
    score = []
    for at, chord in ((0.0, ("D#3", "A#3", "D4", "G4")), (0.42, ("D#3", "G3", "A#3", "D#4", "F4"))):
        for i, n in enumerate(chord):
            score.append((KEYS, human(at + i * 0.012, 2), dur, n, 0.5, 0.3 + 0.1 * i, dur, 0.3, at, 0.4, 0.004))
    x = csound(score, dur, room=DRY)
    stop_at, stop = 1.35, 0.75
    rate = np.ones(x.shape[0])
    u = np.clip((T(dur) - stop_at) / stop, 0, 1)
    rate = (1 - u) ** 1.6  # the reel slows to a halt
    pos = np.cumsum(rate)
    x = np.stack([np.interp(pos, np.arange(x.shape[0]), x[:, c]) for c in (0, 1)], axis=1)
    x *= np.clip(1 - (u - 0.85) / 0.15, 0, 1)[:, None]  # the last of it is too slow to hear
    return finish(x, wet=0.16, hall=1.5, close=0.12, sat=0.45, wow=6, mud=-1.0)


def bass_slide():
    """Groove: a round synth bass slides up an octave, a snap, and a bright chord on the off-beat. E."""
    end, rel, dur = 1.6, 0.7, 2.6
    x = stage(dur)
    f = slide(hz("E2"), hz("E3"), dur, 0.28, 0.09)
    bass = lp(tone(f, dur, SAW, 0.006, end, rel, decay=1.6), 2200, 2) * 0.7
    place(x, bass, 0.0)
    place(x, snap() * 0.9, human(0.56, 3), 0.25)
    score = []
    for i, n in enumerate(("G#4", "B4", "E5")):
        score.append((KEYS, human(0.56, 2), dur - 0.56, n, 0.7, 0.35 + 0.15 * i, end, rel, 0.56, 0.3, 0.004))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.16, hall=1.4, close=0.16, sat=0.45, mud=-2.5, presence=2.0)


def cello():
    """Close and quiet: one bowed cello, two long notes a sixth apart. D."""
    end, rel, dur = 3.0, 1.0, 4.2
    score = [(STRINGS, 0.0, 1.5, "D3", 0.55, 0.45, 1.25, 0.35, 0.1, 0.8, 0.18),
             (STRINGS, 1.3, dur - 1.3, "B3", 0.55, 0.55, end, rel, 1.35, 1.0, 0.12)]
    x = csound(score, dur, room=DRY)
    place(x, contact(3, 900, 1.5, int(0.05 * SR)) * 0.05, 0.0)  # rosin as the bow bites
    return finish(x, wet=0.26, hall=2.2, close=0.2, sat=0.3, mud=-0.5, air=1.0)


IDEAS = {"v1-stamp": stamp, "v2-split": split, "v3-braam": braam, "v4-organ": organ,
         "v5-plain-piano": plain_piano, "v6-beatbox": beatbox, "v7-horns": horns,
         "v8-tape-stop": tape_stop, "v9-bass-slide": bass_slide, "v10-cello": cello}

if __name__ == "__main__":
    run(IDEAS)
