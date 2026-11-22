"""Shades sonic logo, round 5: new instruments, new notes, new rooms.

Every earlier round played F#, B and C# and came to rest on the same B chord in the same hall,
so they ran together. Here each idea has its own instrument, its own key and its own space;
no felt piano, no B chord. Three stay near what the Owner liked (the mouth, the desk, the body)
and the rest go somewhere new. Every source is synthesised here.

    .venv/bin/python round5.py            # all of them
    .venv/bin/python round5.py water      # only those
"""

import numpy as np
from scipy.signal import butter, sosfilt

from ideas import cents, env, finish, human, pink, ring, run, snap, stage
from render import RNG, SR, hz, place
from round4 import contact, modes

T = lambda dur: np.arange(int(dur * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x)


def additive(freq, dur, amps):
    """A tone from a pitch contour (array or number) and harmonic amplitudes, band-limited."""
    t = T(dur)
    f = np.broadcast_to(np.asarray(freq, float), t.shape)
    phase = 2 * np.pi * np.cumsum(f) / SR
    out = np.zeros_like(t)
    for k, a in enumerate(amps, 1):
        if a:
            out += a * np.sin(k * phase + RNG.random() * 6.28) * (f * k < 12000)
    return out


# ---- sources -------------------------------------------------------------------

def tongue_clock(f):
    """The tongue pulled off the roof of the mouth: a hollow 'clop', pitched by the mouth's shape."""
    n = int(0.15 * SR)
    t = T(0.15)
    body = np.sin(2 * np.pi * f * (1 - 0.1 * t / 0.15) * t) * np.exp(-t / 0.018)
    return body + contact(0.4, f * 2.6, 4, n) * 0.4


def hum_voice(contour, dur, end, rel, vel=1.0):
    """A closed-mouth hum: a glottal buzz through the nose, so mostly warm low harmonics."""
    buzz = additive(contour, dur, [1 / k ** 1.1 for k in range(1, 30)])
    nose = lp(buzz, 1800) * 0.8 + ring(buzz, 260, 2) * 0.8 + ring(buzz, 1100, 3) * 0.6 + ring(buzz, 2600, 5) * 0.35
    air = ring(pink(int(dur * SR)), 1500, 1) * 0.02
    return (nose + air) * env(int(dur * SR), 0.03, end, rel) * vel


def type_key(vel):
    """A typewriter key: the typebar slapping the platen, then the carriage catch."""
    n = int(0.12 * SR)
    t = T(0.12)
    slap = contact(0.5, 3100, 3, n) + contact(0.8, 1200, 2, n) * 0.6
    thunk = np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.02) * 0.5
    catch = np.roll(contact(0.3, 4500, 8, n), int(0.016 * SR)) * 0.25
    return (slap + thunk + catch) * vel


def carriage(dur=0.32):
    """The carriage slid back: a fast ratchet over a metal slide."""
    n = int(dur * SR)
    out = ring(pink(n), 2200, 1.5) * 0.15 * np.sin(np.pi * T(dur) / dur)
    at = 0.0
    while at < dur - 0.02:
        place_mono(out, contact(0.25, 3800, 6, int(0.01 * SR)) * 0.5, at)
        at += 0.022 * (1 - 0.5 * at / dur)
    return out


def place_mono(track, sig, at):
    i = int(at * SR)
    m = min(sig.size, track.size - i)
    track[i:i + m] += sig[:m]


def clarinet(contour, dur, end, rel, vel=1.0):
    """A clarinet: odd harmonics strong, even ones weak, a little breath, a slow-ish tongue."""
    t = T(dur)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5.1 * t) * np.clip((t - 0.35) / 0.4, 0, 1)
    tone = additive(np.asarray(contour) * vib, dur, [1 / k if k % 2 else 0.12 / k for k in range(1, 24)])
    tone = lp(tone, 5000)
    breath_ = ring(pink(t.size), 1800, 1.5) * 0.04
    return (tone + breath_) * env(t.size, 0.05, end, rel) * vel


def drop(f, vel):
    """A water drop: the bubble it traps rings and rises in pitch as it shrinks."""
    t = T(0.25)
    rise = f * (1 + 0.45 * (1 - np.exp(-t / 0.03)))
    body = np.sin(2 * np.pi * np.cumsum(rise) / SR) * np.exp(-t / 0.05)
    tick = contact(0.3, 5000, 2, t.size) * 0.15
    return (body + tick) * (1 - np.exp(-t / 0.002)) * vel


def bubbles(dur, start_f=900):
    """Small bubbles rising after the plunge, thinning out."""
    out = np.zeros(int(dur * SR))
    at = 0.0
    while at < dur - 0.25:
        f = start_f * RNG.uniform(0.8, 2.2)
        place_mono(out, drop(f, RNG.uniform(0.05, 0.2) * np.exp(-at / 0.6)), at)
        at += RNG.exponential(0.05) + 0.015
    return out


MEMBRANE = (1.0, 1.59, 2.14, 2.3, 2.65)  # a circular drum head's first modes


def talking_drum(bend, dur, vel):
    """An hourglass drum squeezed under the arm: the head's pitch follows the squeeze."""
    t = T(dur)
    f = np.broadcast_to(np.asarray(bend, float), t.shape)
    phase = 2 * np.pi * np.cumsum(f) / SR
    out = sum(a * np.sin(r * phase + RNG.random() * 6.28) * np.exp(-t / d)
              for r, a, d in zip(MEMBRANE, (1, 0.5, 0.35, 0.25, 0.15), (0.35, 0.18, 0.12, 0.08, 0.06)))
    slap = contact(1.2, 2200, 1.2, t.size) * 1.1 + contact(4, 400, 1, t.size) * 0.4
    return np.tanh((out + slap) * 1.6) * vel


def bend(f0, f1, dur, k=0.08):
    t = T(dur)
    return f1 + (f0 - f1) * np.exp(-t / k)


def shaker(vel, dur=0.09):
    n = int(dur * SR)
    return hp(RNG.standard_normal(n), 5000) * np.exp(-T(dur) / 0.02) * vel


def handpan(note, dur, vel, end, rel):
    """A steel handpan note: three tuned partials (note, octave, fifth above), two hammered
    sides beating slowly, and the soft thump of a fingertip."""
    f = hz(note)
    t = T(dur)
    out = np.zeros_like(t)
    for side in (-1.2, 1.2):
        out += modes((cents(f, side), cents(2 * f, side), cents(3 * f, side)), (2.4, 1.4, 0.8), (1, 0.8, 0.5), dur)
    thump = lp(contact(3, f, 1, t.size), 500) * 0.4
    return (out + thump) * vel * env(t.size, 0.001, end, rel)


def clap(vel, hands=4):
    """A clap: several hands a few ms apart, each a burst through the cupped palm, then a short room."""
    n = int(0.25 * SR)
    out = np.zeros(n)
    for h in range(hands):
        place_mono(out, contact(1.2, RNG.uniform(1000, 1600), 1.5, int(0.03 * SR)), h * 0.009 + RNG.uniform(0, 0.003))
    tail = ring(RNG.standard_normal(n), 1300, 1) * np.exp(-T(0.25) / 0.05) * 0.25
    return (out + tail) * vel


def reed(notes, dur, vel, end, rel, attack=0.04):
    """Harmonica: free reeds, bright and buzzy, through the player's cupped hands."""
    t = T(dur)
    out = np.zeros_like(t)
    for n in notes:
        f = hz(n) * (1 + 0.002 * np.sin(2 * np.pi * 4.6 * t + RNG.random() * 6))
        out += additive(f, dur, [1 / k ** 0.8 for k in range(1, 20)])
    hands = 0.6 + 0.4 * np.sin(2 * np.pi * 4.6 * t) * np.clip((t - 0.25) / 0.3, 0, 1)
    tone = lp(out, 1200) * (1 - hands) + lp(out, 3600) * hands  # the hands open and close
    breath_ = ring(pink(t.size), 1400, 1.2) * 0.06
    return (tone / len(notes) + breath_) * env(t.size, attack, end, rel) * vel


def stomp(vel):
    """A foot on a wooden stage: the floor's low boom, the board's ring and the heel's crack."""
    n = int(0.45 * SR)
    t = T(0.45)
    boom = np.sin(2 * np.pi * np.cumsum(70 * (1 + 0.6 * np.exp(-t / 0.015))) / SR) * np.exp(-t / 0.12)
    board = modes((260, 540, 930), (0.08, 0.04, 0.02), (0.5, 0.3, 0.15), 0.45)
    heel = contact(1.5, 1500, 1.5, n) * 0.4
    return (boom * 0.15 + board * 1.8 + heel * 1.2) * vel


# ---- the ideas -------------------------------------------------------------------

def mm_hm():
    """Mm-hm: three tongue clocks, then the hummed 'mm-hm' everyone means as yes. Key of D."""
    x = stage(3.2)
    for f, at, s, pan in ((hz("A5"), 0.0, 1.0, -0.2), (hz("D6"), 0.14, 0.75, 0.2), (hz("E6"), 0.3, 0.5, 0.0)):
        place(x, tongue_clock(cents(f, RNG.normal(0, 10))) * s * 1.6, human(at, 5), pan)
    d1, d2 = 0.32, 1.9
    place(x, hum_voice(hz("A4"), d1, d1 - 0.1, 0.08, 0.8), 0.62, -0.05)
    t = T(d2)
    second = hz("D5") * (1 + 0.04 * np.exp(-t / 0.06)) * (1 - 0.06 * np.clip((t - 0.25) / 0.6, 0, 1))
    place(x, hum_voice(second, d2, 0.7, 0.9), 1.0, 0.05)
    return finish(x, wet=0.08, hall=0.9, close=0.22, sat=0.3, mud=-1.0, air=0.5)


def typewriter():
    """Typewriter: three keys at the bars' strengths, the carriage back, a clarinet answers A to E."""
    x = stage(3.4)
    for i, (at, s) in enumerate(((0.0, 1.0), (0.12, 0.75), (0.24, 0.5))):
        place(x, type_key(s), human(at, 4), (i - 1) * 0.25)
    place(x, carriage() * 0.8, 0.42, 0.4)
    d = 2.4
    t = T(d)
    line = np.where(t < 0.28, hz("A4"), hz("E5"))
    line = lp(line, 30, 1)  # the slur between the two notes
    place(x, clarinet(line, d, 1.5, 0.7, 0.9), 0.78, -0.1)
    return finish(x, wet=0.14, hall=1.1, close=0.25, sat=0.4, mud=-1.5, air=0.8)


def water():
    """Water: three drops rise through E major into a bowl, then one deep plunge and its bubbles."""
    x = stage(3.0)
    for (n, at, s), pan in zip((("E5", 0.0, 1.0), ("G#5", 0.22, 0.75), ("B5", 0.44, 0.5)), (-0.35, 0.35, 0.0)):
        place(x, drop(cents(hz(n), RNG.normal(0, 6)), s), human(at, 6), pan)
    place(x, drop(hz("E4"), 1.2) + lp(contact(6, 200, 1, int(0.25 * SR)), 400) * 0.5, 0.82, 0.0)
    b = bubbles(1.8)
    place(x, b * 0.9, 0.9, -0.3)
    place(x, np.roll(b, 900) * 0.6, 0.95, 0.3)
    return finish(x, wet=0.2, hall=1.4, damp=7000, close=0.3, sat=0.15, air=1.5)


def talking():
    """Talking drum: up, a quick tap, then a long squeeze down home to D. A shaker keeps time."""
    x = stage(3.0)
    place(x, talking_drum(bend(hz("D4"), hz("G4"), 0.5), 0.5, 1.0), 0.0, -0.1)
    place(x, talking_drum(hz("A4"), 0.3, 0.6), 0.2, 0.15)
    long_ = bend(hz("A4"), hz("D4"), 1.4, 0.35)
    place(x, talking_drum(long_, 1.4, 1.0) * env(int(1.4 * SR), 0.001, 1.0, 0.35), 0.38, 0.0)
    for i, at in enumerate((0.1, 0.29, 0.48)):
        place(x, shaker((0.25, 0.15, 0.2)[i]), human(at, 4), 0.5)
    return finish(x, wet=0.1, hall=0.8, close=0.2, sat=0.45, mud=-1.0)


def handpan_roll():
    """Handpan: the low centre note, then a roll up D minor; the last note rings and is damped."""
    x = stage(3.6)
    place(x, handpan("D3", 3.2, 0.8, 2.3, 0.7), 0.0, 0.0)
    for i, (n, s) in enumerate((("A3", 0.7), ("D4", 0.8), ("F4", 0.75), ("A4", 1.0))):
        a = human(0.32 + i * 0.12, 5)
        place(x, handpan(n, 3.2 - a, s, 2.3 - a, 0.7), a, (-0.3, 0.3, -0.15, 0.15)[i])
    return finish(x, wet=0.3, hall=2.2, damp=6000, close=0.15, sat=0.25)


def harmonica():
    """Harmonica: blow, draw, then blow again and hold with the hands opening. C major."""
    x = stage(3.2)
    place(x, reed(("C4", "E4", "G4"), 0.32, 0.8, 0.24, 0.06, 0.02), 0.0, -0.1)
    place(x, reed(("D4", "F4", "A4"), 0.3, 0.7, 0.22, 0.06, 0.02), 0.32, 0.1)
    place(x, reed(("C4", "E4", "G4", "C5"), 2.2, 1.0, 1.4, 0.7, 0.03), 0.64, 0.0)
    return finish(x, wet=0.12, hall=1.0, close=0.2, sat=0.35, presence=0.5)


def snap_clap_stomp():
    """Snap, clap, stomp: one body getting heavier, small to big, then the stage rings out."""
    x = stage(2.6)
    place(x, snap() * 1.0, 0.0, 0.25)
    place(x, clap(0.8, hands=1) * 2.4, human(0.2, 4), -0.15)
    place(x, stomp(1.0), human(0.46, 5), 0.0)
    return finish(x, wet=0.26, hall=1.6, damp=4000, close=0.3, sat=0.4, mud=-0.5)


IDEAS = {"s1-mm-hm": mm_hm, "s2-typewriter": typewriter, "s3-water": water, "s4-talking-drum": talking,
         "s5-handpan": handpan_roll, "s6-harmonica": harmonica,
         "s7-snap-clap-stomp": snap_clap_stomp}

if __name__ == "__main__":
    run(IDEAS)
