"""Shades sonic logo, round 6: built from what the Owner liked.

He liked a knock, wooden taps, a heartbeat, a hum, mouth pops, a handpan and a felt piano:
warm, close sounds of a hand or a body touching wood, skin or ringing metal. He disliked hiss,
water, flame, machines, reeds, choirs and busy percussion. Round 6 stays in the liked family
and adds three instruments from it (thumb piano, tongue drum, slit drum). Each idea has its
own key, so none share a motif.

    .venv/bin/python round6.py            # all of them
    .venv/bin/python round6.py kalimba    # only those
"""

import numpy as np

from ideas import breath, cents, cheek_pop, env, felt_piano, finish, human, run, stage
from render import RNG, SR, VOICE, csound, hz, place
from round4 import PAD, contact, knock, modes, thump, wood_tap
from round5 import T, handpan, lp

DRY = (0.0, 0.5, 5000)  # csound's own room off: the finish adds the room


# ---- new sources in the liked family -------------------------------------------------

def kalimba(note, dur, vel, end, rel):
    """A thumb piano tine: a strong fundamental, the tine's high inharmonic partials that die
    fast, and the click of the thumbnail leaving the metal."""
    f = hz(note)
    t = T(dur)
    body = modes((f, f * 5.9, f * 2.01), (1.4, 0.12, 0.5), (1, 0.18, 0.12), dur)
    click = lp(contact(0.5, 2600, 3, t.size), 6000) * 0.12
    box = lp(contact(5, f * 0.5, 2, t.size), 600) * 0.25  # the wooden box answering
    return (body + click + box) * vel * env(t.size, 0.001, end, rel)


def tongue_drum(note, dur, vel, end, rel):
    """A steel tongue drum struck with a felt mallet: softer and rounder than the handpan."""
    f = hz(note)
    t = T(dur)
    out = modes((f, cents(f * 2, 4), f * 3.02), (1.9, 0.8, 0.3), (1, 0.35, 0.12), dur)
    mallet = lp(contact(4, f, 1, t.size), 450) * 0.5
    return (out * (1 - np.exp(-t / 0.004)) + mallet) * vel * env(t.size, 0.001, end, rel)


def slit_drum(note, vel):
    """A hollow log with a tongue cut into it, struck with a rubber mallet."""
    f = hz(note)
    n = int(0.9 * SR)
    body = modes((f, f * 1.98, f * 3.4, f * 5.1), (0.38, 0.16, 0.06, 0.02), (1, 0.45, 0.2, 0.08), 0.9)
    return (body + contact(2, f * 2.2, 2, n) * 0.5 + lp(contact(6, 200, 1, n), 400) * 0.08) * vel


def hummed(score, notes, at, dur, end, rel, amp=0.35, pans=(0.4, 0.6)):
    """One person humming the notes, double-tracked."""
    for take, pan in enumerate(pans):
        for i, n in enumerate(notes):
            a = human(at + i * 0.012, 10)
            score.append((VOICE, a, dur - a, (n, RNG.normal(0, 5)), amp / (1 + i * 0.4), pan,
                          end, rel, a + 0.2, 1.1, 0.09, 0.45))


# ---- the ten ideas ---------------------------------------------------------------------

def knock_hum():
    """Knock and answer: two knocks on a door, and someone inside hums back. E-flat."""
    end, rel, dur = 2.3, 1.0, 3.6
    x = stage(dur)
    place(x, knock(190, 1.0) * 1.8, 0.0, -0.2)
    place(x, knock(182, 0.75) * 1.8, human(0.15, 4), -0.15)
    score = []
    hummed(score, ("D#4", "A#4"), 0.55, dur, end, rel, 0.4)
    hummed(score, ("G5",), 0.75, dur, end, rel, 0.22, (0.5,))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.24, hall=1.7, close=0.2, sat=0.4, mud=-1.5)


def heart_handpan():
    """Heart and steel: one heartbeat, and the handpan answers on the next beat. F."""
    end, rel, dur = 2.4, 0.8, 3.7
    x = stage(dur)
    place(x, thump(58, 1.0), 0.0)
    place(x, thump(66, 0.6), human(0.24, 3))
    place(x, handpan("F4", dur - 0.62, 0.7, end - 0.62, rel), 0.62)
    for i, (n, s) in enumerate((("C5", 0.6), ("A5", 0.85))):
        a = human(0.78 + i * 0.13, 4)
        place(x, handpan(n, dur - a, s, end - a, rel), a, (-0.25, 0.25)[i])
    return finish(x, wet=0.28, hall=2.0, damp=6000, close=0.14, sat=0.3)


def thumb_piano():
    """Thumb piano: three tines plucked upward, the last one held while the box hums. G."""
    end, rel, dur = 2.2, 0.9, 3.5
    x = stage(dur)
    for i, (n, s) in enumerate((("D5", 0.75), ("G5", 0.9), ("B5", 1.0))):
        a = human(i * 0.16, 6)
        place(x, kalimba(n, dur - a, s, end - a, rel), a, (-0.3, 0.3, 0.0)[i])
    place(x, kalimba("G4", dur - 0.5, 0.7, end - 0.5, rel), 0.5)
    return finish(x, wet=0.26, hall=1.6, close=0.18, sat=0.35, mud=-1.0, air=1.0)


def tongue():
    """Tongue drum: a felt mallet walks up A minor, a breath of rest, then the low A rings. A."""
    end, rel, dur = 2.4, 0.9, 3.8
    x = stage(dur)
    for i, (n, s) in enumerate((("E4", 0.7), ("A4", 0.85), ("C5", 1.0))):
        a = human(i * 0.14, 5)
        place(x, tongue_drum(n, dur - a, s, end - a, rel), a, (-0.25, 0.25, 0.0)[i])
    place(x, tongue_drum("A3", dur - 0.62, 0.95, end - 0.62, rel), 0.62)
    place(x, tongue_drum("E5", dur - 0.64, 0.35, end - 0.64, rel), 0.64, 0.3)
    return finish(x, wet=0.3, hall=2.1, damp=6000, close=0.14, sat=0.3)


def lid_and_keys():
    """The piano lid: two knuckle taps on the wood of the piano, then the felt piano opens
    a wide A-flat chord underneath."""
    end, rel, dur = 2.2, 0.5, 3.4
    x = stage(dur)
    place(x, wood_tap("D#5", 0.9) * 1.3, 0.0, -0.2)
    place(x, wood_tap("G#5", 1.0) * 1.3, human(0.16, 3), 0.2)
    for i, (n, v) in enumerate((("G#2", 0.35), ("D#4", 0.8), ("C5", 1.0), ("G5", 0.45))):
        a = human(0.5 + i * 0.04, 4)
        place(x, felt_piano(n, dur - a, v, end - a, rel), a, (i - 1.5) * 0.22)
    return finish(x, wet=0.2, hall=1.4, close=0.2, sat=0.4, mud=-1.5, air=1.0)


def pop_and_pan():
    """Mouth and steel: two cheek pops, and a handpan picks up their pitch and rings. C."""
    end, rel, dur = 2.3, 0.8, 3.5
    x = stage(dur)
    place(x, cheek_pop(cents(hz("G5"), RNG.normal(0, 8))), 0.0, -0.2)
    place(x, cheek_pop(cents(hz("C6"), RNG.normal(0, 8))) * 0.85, human(0.15, 4), 0.2)
    place(x, handpan("C4", dur - 0.42, 0.8, end - 0.42, rel), 0.42)
    place(x, handpan("G4", dur - 0.46, 0.55, end - 0.46, rel), 0.46, -0.2)
    place(x, handpan("E4", dur - 0.5, 0.45, end - 0.5, rel), 0.5, 0.2)
    return finish(x, wet=0.26, hall=1.8, damp=6000, close=0.15, sat=0.3)


def log_drum():
    """Log drum: low wood, two tones, then a hummed fifth settles on top. A."""
    end, rel, dur = 2.3, 1.0, 3.5
    x = stage(dur)
    place(x, slit_drum("E5", 1.0) * 1.3, 0.0, -0.15)
    place(x, slit_drum("A4", 1.0) * 1.4, human(0.2, 4), 0.15)
    score = []
    hummed(score, ("A4", "E5"), 0.5, dur, end, rel, 0.38)
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.24, hall=1.6, close=0.2, sat=0.4, mud=-1.0)


def heart_opens():
    """Heart, opening: a slower heartbeat, then the warm synth opens on a new chord, D-flat."""
    end, rel, dur = 2.5, 1.1, 3.9
    x = stage(dur)
    place(x, thump(54, 1.0), 0.0)
    place(x, thump(61, 0.6), human(0.26, 3))
    score = []
    for note, at, s in zip(("G#3", "C#4", "F4", "G#4"), (0.62, 0.62, 0.74, 0.9), (0.7, 1.0, 0.8, 0.55)):
        for c in (-6, 0, 6):
            score.append((PAD, at, dur - at, (note, c), 0.22 * s, 0.5 + c / 20, end, rel, at + 0.15, 1.2, 0.02))
    score.append((PAD, 0.6, dur - 0.6, ("C#2", 0), 0.2, 0.5, end, rel, 0.8, 1.2, 0.15))
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.26, hall=2.1, close=0.12, sat=0.4, mud=-1.0)


def table_roll():
    """Fingers on the table: four fingertips roll on a wooden desk, then the felt piano and a
    low hum land together. E."""
    end, rel, dur = 2.3, 0.7, 3.5
    x = stage(dur)
    for i, (at, v) in enumerate(((0.0, 0.5), (0.07, 0.6), (0.13, 0.75), (0.18, 1.0))):
        place(x, knock(230 + i * 6, v) * 1.2, human(at, 3), -0.3 + i * 0.2)
    for i, (n, v) in enumerate((("E3", 0.45), ("B3", 0.7), ("G#4", 0.9), ("D#5", 0.4))):
        a = human(0.46 + i * 0.03, 4)
        place(x, felt_piano(n, dur - a, v, end - a, rel), a, (i - 1.5) * 0.2)
    score = []
    hummed(score, ("E3",), 0.46, dur, end, rel, 0.3)
    x += csound(score, dur, room=DRY)
    return finish(x, wet=0.22, hall=1.5, close=0.2, sat=0.4, mud=-1.5, air=0.8)


def breath_hum():
    """Close: a breath in, two hummed notes rising a sixth, the felt piano under them. B-flat."""
    end, rel, dur = 2.2, 1.0, 3.6
    x = stage(dur)
    place(x, breath(0.3, 1500, 1.2, 0.18) * 0.28, 0.0)
    score = []
    hummed(score, ("F4",), 0.32, dur, end, rel, 0.42)
    hummed(score, ("D5",), 0.6, dur, end, rel, 0.34)
    x += csound(score, dur, room=DRY)
    for i, (n, v) in enumerate((("A#2", 0.35), ("F4", 0.6), ("D5", 0.75))):
        a = human(0.6 + i * 0.03, 4)
        place(x, felt_piano(n, dur - a, v, end - a, 0.5), a, (i - 1) * 0.25)
    return finish(x, wet=0.26, hall=1.7, close=0.15, sat=0.35)


IDEAS = {"t1-knock-hum": knock_hum, "t2-heart-handpan": heart_handpan, "t3-thumb-piano": thumb_piano,
         "t4-tongue-drum": tongue, "t5-piano-lid": lid_and_keys, "t6-pop-and-pan": pop_and_pan,
         "t7-log-drum": log_drum, "t8-heart-opens": heart_opens, "t9-table-roll": table_roll,
         "t10-breath-hum": breath_hum}

if __name__ == "__main__":
    run(IDEAS)
