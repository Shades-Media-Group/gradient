"""Shades sonic logo, round 4: built from what makes the best-known sounds stick.

Each idea follows the same pattern. It opens on one physical sound you could name with your eyes
closed (a knock, a tap, a heartbeat, a match, a shutter), then the chord blooms out of it and rings
away. Few elements, a rest where it helps, and one timbre that stays in the ear. Every source is
synthesised here, and each take gets the same studio finish as round 3.

    .venv/bin/python round4.py            # all of them
    .venv/bin/python round4.py knock      # only those
"""

import numpy as np
from scipy.signal import butter, sosfilt

from ideas import breath, cents, env, felt_piano, finish, human, pink, ring, run, stage
from render import RNG, SR, STRENGTH, VOICE, csound, hz, mix, place

PAD, STRINGS, KEYS = 5, 1, 4  # orchestra.orc instruments
DRY = (0.0, 0.5, 5000)  # csound's own hall off: the finish adds the room


# ---- sources -----------------------------------------------------------------

def modes(freqs, decays, amps, dur):
    """A struck object: a few decaying partials, each with its own random phase."""
    t = np.arange(int(dur * SR)) / SR
    return sum(a * np.sin(2 * np.pi * f * t + RNG.random() * 6.28) * np.exp(-t / d)
               for f, d, a in zip(freqs, decays, amps)) * (1 - np.exp(-t / 0.0006))


def contact(ms, f, q, n):
    """The moment of contact: a very short burst through the material's resonance."""
    t = np.arange(n) / SR
    return ring(RNG.standard_normal(n) * np.exp(-t / (ms / 1000)), f, q)


def knock(f=165, vel=1.0):
    """A knuckle on a wooden cabinet door: panel modes, a dull thud and the click of skin on wood."""
    n = int(0.3 * SR)
    body = modes((f, f * 2.32, f * 3.9, f * 6.1), (0.06, 0.035, 0.02, 0.01), (1, 0.55, 0.3, 0.15), 0.3)
    return (body + contact(1.2, 2300, 2, n) * 0.5 + contact(4, 260, 1.5, n) * 0.6) * vel


def wood_tap(note, vel):
    """A stick on a hollow wooden block, tuned."""
    f = hz(note)
    n = int(0.35 * SR)
    body = modes((f, f * 2.53, f * 4.1), (0.09, 0.03, 0.012), (1, 0.3 * vel, 0.12 * vel), 0.35)
    return (body + contact(0.8, f * 3.3, 3, n) * 0.35) * vel


def thump(f, vel):
    """One beat of a heart, felt through the chest: a falling low thud, with enough body
    above 100 Hz that a phone speaker still carries it."""
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    fall = f * (1 + 0.5 * np.exp(-t / 0.02))
    low = np.sin(2 * np.pi * np.cumsum(fall) / SR) * np.exp(-t / 0.09)
    chest = np.sin(2 * np.pi * np.cumsum(fall * 2.7) / SR) * np.exp(-t / 0.05) * 0.35
    skin = sosfilt(butter(2, 700, fs=SR, output="sos"), contact(6, 300, 0.8, n)) * 0.5
    return (low + chest + skin) * (1 - np.exp(-t / 0.004)) * vel


def match_strike():
    """A match dragged along the box, then the head flares and the flame settles."""
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    drag = (t < 0.09) * np.sin(np.pi * np.clip(t / 0.09, 0, 1))
    grit = (RNG.random(n) > 0.992) * RNG.standard_normal(n) * drag * 3
    scratch = sosfilt(butter(2, 2500, "highpass", fs=SR, output="sos"), pink(n) * drag) + ring(grit, 4200, 3)
    swell = np.clip((t - 0.07) / 0.05, 0, 1) * np.exp(-np.clip(t - 0.12, 0, None) / 0.28)
    flare = ring(pink(n), 1100, 0.6) * swell * 1.4 + ring(pink(n), 240, 0.8) * swell * 0.9
    return scratch * 0.6 + flare


def flame(dur, end, rel):
    """A small flame: a soft, unsteady low rush."""
    n = int(dur * SR)
    flutter = 1 + 0.35 * np.sin(2 * np.pi * 7 * np.arange(n) / SR + RNG.standard_normal())
    return ring(pink(n), 500, 0.9) * flutter * env(n, 0.2, end, rel)


def shutter():
    """A camera shutter: the first curtain, the second 45 ms later with the mirror's thunk,
    and the faint ring of the spring."""
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for at, level, body in ((0.0, 1.0, 0.0), (0.045, 0.85, 1.0)):
        i = int(at * SR)
        b = contact(1.2, 2600, 7, n - i) + contact(1.0, 5200, 5, n - i) * 0.6 + contact(2, 900, 3, n - i) * 0.5
        b += np.sin(2 * np.pi * 140 * t[: n - i]) * np.exp(-t[: n - i] / 0.015) * 0.6 * body
        out[i:] += b * level
    return out + contact(0.5, 7200, 40, n) * 0.15


def static(dur):
    """Tape hiss with a few crackles, the sound of a channel before it tunes in."""
    n = int(dur * SR)
    crackle = (RNG.random(n) > 0.9985) * RNG.standard_normal(n) * 4
    return sosfilt(butter(2, 900, "highpass", fs=SR, output="sos"), pink(n) + crackle)


def reversed_bloom(chord, length, hall=2.6):
    """A chord's own reverb played backwards: it swells up out of nothing into the note that follows."""
    x = stage(length + hall)
    for n, v in chord:
        place(x, felt_piano(n, length + hall, v, length, 0.3), 0.0)
    x = mix(x, 1.2, hall, 4000)[::-1]
    x = x[-int(length * SR):]  # keep only the last part of the swell
    return x * np.linspace(0, 1, x.shape[0])[:, None] ** 1.5


def add(track, stereo, at):
    i = int(at * SR)
    end = min(track.shape[0], i + stereo.shape[0])
    track[i:end] += stereo[: end - i]


# ---- the ideas -------------------------------------------------------------------

CHORD = (("B2", 0.3), ("F#4", 1.0), ("B4", 0.75), ("C#5", 0.5))


def knocked():
    """Knock: two knocks on a wooden door, then the chord swells up backwards out of the wood
    and lands, held, on a felt piano."""
    end, rel, dur, land = 2.3, 0.5, 3.4, 0.62
    x = stage(dur)
    place(x, knock(165, 1.0) * 1.6, 0.0, -0.15)
    place(x, knock(158, 0.7) * 1.6, human(0.13, 4), -0.1)
    add(x, reversed_bloom(CHORD, 0.42) * 0.45, land - 0.42)
    for i, (n, v) in enumerate(CHORD):
        place(x, felt_piano(n, dur - land, v, end - land, rel), land + i * 0.012, (i - 1.5) * 0.22)
    return finish(x, wet=0.2, hall=1.6, close=0.2, sat=0.4, mud=-1.5, air=1.0)


def taps():
    """Three taps: three wooden taps at the mark's strengths, one beat of silence, then an open
    fifth, hummed and played, that holds and fades."""
    end, rel, dur = 2.3, 1.0, 3.5
    x = stage(dur)
    for (n, at, s), pan in zip(zip(("F#5", "B5", "C#6"), (0.0, 0.14, 0.28), STRENGTH), (-0.25, 0.25, 0.0)):
        place(x, wood_tap(n, s), human(at, 3), pan)
    rest = 0.72
    for n, v in (("B2", 0.35), ("F#3", 0.5)):
        place(x, felt_piano(n, dur - rest, v, end - rest, rel), rest)
    score = [(VOICE, rest, dur - rest, ("B3", 0), 0.3, 0.4, end, rel, rest + 0.3, 1.0, 0.1, 0.4),
             (VOICE, rest + 0.02, dur - rest, ("F#4", 3), 0.22, 0.6, end, rel, rest + 0.3, 1.0, 0.1, 0.4)]
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.24, hall=1.8, close=0.18)


def tuned_in():
    """Tuning in: hiss and crackle, as if a channel were searching; the noise narrows onto the
    three notes until it is voices, and the voices hold the chord."""
    end, rel, dur = 2.3, 1.0, 3.6
    n = int(dur * SR)
    t = np.arange(n) / SR
    hiss = static(dur)
    x = stage(dur)
    broad = np.clip(1 - (t - 0.35) / 0.5, 0, 1) * np.clip(t / 0.12, 0, 1)
    place(x, hiss * broad * 0.18, 0.0)
    for (note, s), pan in zip(zip(("F#4", "B4", "C#5"), STRENGTH), (-0.4, 0.4, 0.0)):
        f = hz(note)
        narrow = np.clip((t - 0.15) / 0.35, 0, 1) * np.clip(1 - (t - 0.9) / 0.4, 0, 1)
        sing = np.clip((t - 0.45) / 0.4, 0, 1) * env(n, 0.001, end, rel)
        place(x, (ring(hiss, f, 12) * narrow * 1.5 + ring(hiss, f, 120) * sing * 6) * s, 0.0, pan)
    score = []
    for (note, s), pan in zip(zip(("B3", "F#4", "B4", "C#5"), (0.8, 1.0, 0.75, 0.5)), (0.5, 0.3, 0.7, 0.5)):
        for v in range(2):
            a = human(0.6 + v * 0.04, 15)
            score.append((VOICE, a, dur - a, (note, RNG.normal(0, 6)), 0.3 * s, pan + (v - 0.5) * 0.3,
                          end, rel, 0.9, 1.0, 0.3, 0.6))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.3, hall=2.2, damp=5000)


def heartbeat():
    """Heartbeat: one heartbeat, lub-dub, then the warm synth opens on the three notes
    the way Spectrum does."""
    end, rel, dur = 2.3, 1.1, 3.6
    x = stage(dur)
    place(x, thump(58, 1.0), 0.0)
    place(x, thump(66, 0.6), human(0.24, 3))
    score = []
    for note, at, s in zip(("F#4", "B4", "C#5"), (0.55, 0.69, 0.89), STRENGTH):
        for c in (-6, 0, 6):
            score.append((PAD, at, dur - at, (note, c), 0.24 * s, 0.5 + c / 20, end, rel, at + 0.1, 1.1, 0.02))
    score.append((PAD, 0.55, dur - 0.55, ("B2", 0), 0.18, 0.5, end, rel, 0.7, 1.2, 0.15))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.25, hall=2.0, close=0.12, sat=0.4, mud=-1.0)


def matchlight():
    """Match: a match struck and flaring, and the chord catches like the flame, on bowed strings
    that warm up as the bows press in."""
    end, rel, dur = 2.3, 1.0, 3.5
    x = stage(dur)
    place(x, match_strike() * 1.4, 0.0, 0.15)
    place(x, flame(dur - 0.15, end - 0.15, rel) * 0.07, 0.15, 0.1)
    score = []
    for note, at, s in zip(("B2", "F#3", "B3", "F#4", "C#5"), (0.3, 0.32, 0.34, 0.38, 0.48), (0.6, 0.6, 0.7, 1.0, 0.6)):
        for p in range(2):
            a = at + p * 0.015
            score.append((STRINGS, a, dur - a, (note, (p - 0.5) * 8), 0.42 * s, 0.35 + p * 0.3,
                          end, rel, 0.45, 1.0, 0.12))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.28, hall=2.0, close=0.15, sat=0.35)


def shutter_keys():
    """Shutter: a camera shutter fires, then an electric piano plays the three notes,
    short-short-long, warm from tape."""
    end, rel, dur = 2.1, 0.8, 3.3
    x = stage(dur)
    place(x, shutter() * 2.2, 0.0, -0.1)
    score = [(KEYS, at, dur - at, (n, 0), 0.5 * s, p, end, rel, at, 0.6, 0.004)
             for n, at, s, p in zip(("F#4", "B4", "C#5"), (0.22, 0.36, 0.56), STRENGTH, (0.35, 0.65, 0.5))]
    score.append((KEYS, 0.56, dur - 0.56, ("B2", 0), 0.3, 0.5, end, rel, 0.56, 0.6, 0.004))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.2, hall=1.5, close=0.15, sat=0.45, wow=5, presence=-2.0, air=0.5)


IDEAS = {"r1-knock": knocked, "r2-taps": taps, "r3-tuned-in": tuned_in, "r4-heartbeat": heartbeat,
         "r5-match": matchlight, "r6-shutter": shutter_keys}


if __name__ == "__main__":
    run(IDEAS)
