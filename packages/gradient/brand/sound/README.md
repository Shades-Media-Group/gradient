# Shades sound

The sonic logo of Shades Media Group and, once a direction is chosen, the sounds every Shades product plays. All of it is synthesised by [render.py](render.py), [ideas.py](ideas.py) and [orchestra.orc](orchestra.orc) (Csound): no samples, no generated audio, so we own every note. Rules: the rulebook's Sound chapter.

## The brief

Shades is ink and paper with one true red. The mark is three bars at full, three-quarter and half strength. The spectrum runs blue, violet, red, orange.

**Traits in sound**

1. **Calm and expert.** Few notes, played once, with room around them. No riser, no whoosh, no build.
2. **Precise.** Clean attacks, exact timing, notes that are tuned and stop where they should.
3. **Three steps.** Three notes, at the three strengths of the bars: 100, 75 and 50 %. The tune is the mark heard.
4. **Warm underneath.** Rounded tones, no harsh highs, a soft low root where it helps.
5. **Made by hand.** One voice per sound, not a stack of presets.

**Never:** a chord swell with no tune, an effect in place of notes, more than three notes, a rhythm or interval close to a known logo.

## Versions

Round 1 tried three directions. The Owner kept only B, Spectrum, and rejected struck glass and plucked string outright. Round 2 makes five new versions of Spectrum; the round 1 B stays as the reference.

Every version is a warm tone held while its filter opens, dark blue to warm orange, with the three notes at 100, 75 and 50 %.

| | Notes | What changes |
| --- | --- | --- |
| **Spectrum** | F♯4, B4, C♯5, short-short-long | Round 1 B, the reference. |
| **Wide** | F♯4, B4, C♯5 | Five detuned strings instead of three, slower bloom, a deeper floor. |
| **Arc** | F♯4, C♯5, B4: up a fifth, a step down | Ends at home on B instead of leaning forward. |
| **Bloom** | B3, F♯4, C♯5 | No attack: the notes swell in and open as one chord. Calmest; quietest on a phone. |
| **Stroke** | F♯4, B4, C♯5 | One voice glides through the notes; each note it passes stays behind, fading like the bars. |
| **Cinema** | F♯4, B4, C♯5 over a low B swell | 3.8 s, for the TV open: the colour opens further and longer. |

### Round 3: eight ideas

The Owner asked for sounds that feel produced, not raw, and for ideas as far apart as possible. Round 3 works like a foley artist: each idea is built from a voice, the mouth or an object, then finished like a studio take.

| | Made from | Seconds |
| --- | --- | --- |
| **Hum** (i1) | A breath in, two hummed takes layered; the lips open from mm to oo | 4.3 |
| **Choir** (i2) | Sixteen formant voices on a wide B chord, oo opening to ah | 4.6 |
| **Whistle** (i3) | A finger snap, then the three notes whistled with slides and wobble | 3.4 |
| **Bottles** (i4) | Three blown bottles, one after another, held as a chord | 4.3 |
| **Glass** (i5) | Three rubbed wine glasses, beating gently | 4.7 |
| **Ink and paper** (i6) | A sheet slides, a pen clicks, a felt piano rolls the notes over a low B | 3.9 |
| **Mouth** (i7) | Three cheek pops at the three notes, then a hummed low B | 3.9 |
| **Spectrum, produced** (i8) | Spectrum with a felt piano under each note, printed to tape | 4.4 |

**The finish chain**, the same for every idea: human timing and pitch drift, tape saturation with a little wow, EQ (55 Hz high-pass, a dip at 280 Hz, presence at 3.2 kHz, air at 9 kHz), glue compression at 2.2:1, a close room and a hall. Every file has a designed start and a tail that fades out; none stops dead.

### Round 4: one sound you could name

Round 4 follows what makes the best-known product sounds stick. Each one opens on a single physical sound you could name with your eyes shut. The chord blooms out of it after a short rest. Each uses few parts, one timbre that stays in the ear, and a real ending. More takes were made than are shown; weak ones were dropped.

| | Made from | Seconds |
| --- | --- | --- |
| **Knock** (r1) | Two knocks on a wooden door; the chord swells up backwards out of the wood and lands on a felt piano | 4.1 |
| **Three taps** (r2) | Three wood taps at the bars' strengths, a rest, then felt piano and a hummed fifth | 4.2 |
| **Tuning in** (r3) | Radio hiss narrows through resonators until it becomes a choir on the chord | 4.3 |
| **Heartbeat** (r4) | Two low heartbeats, then the Spectrum pad opens note by note | 4.3 |
| **Match** (r5) | A match strikes and catches; strings swell with the flame | 4.2 |
| **Shutter** (r6) | A camera shutter, then the three notes on an electric piano over a low B | 4.0 |

A marimba roll was tried and dropped: it sat 4 dB quieter on a phone speaker and was mostly low end.

The glue compressor now starts at the first gain instead of at silence; before, it muffled the first 120 ms of a take. The round 3 files were rendered before this fix.

### The orchestra round

Five ensemble versions (e1 to e5) from the Csound physical models: bowed strings, horn, flute, electric piano, an analog pad and a sine floor, in one hall. Spectrum (b) stays as the reference.

### Round 5: new instruments

Every earlier take shared the same three notes (F♯, B, C♯), the B chord ending, the felt piano and the same hall. Round 5 drops all four. Each idea has its own instrument, key and room. Three stay close to Mouth and Ink and paper; four go somewhere new. Mouth (i7) and Ink and paper (i6) stay as they are.

| | Made from | Seconds |
| --- | --- | --- |
| **Mm-hm** (s1) | Three tongue clocks, then a hummed "mm-hm" that falls; key of D | 3.9 |
| **Typewriter** (s2) | Three keys, the carriage return, then a clarinet slurring A4 to E5 | 4.1 |
| **Water** (s3) | Three drops, a plunge, then rising bubbles; E major | 3.7 |
| **Talking drum** (s4) | A drum bending up, a tap, a long bend down, with a shaker; D | 3.7 |
| **Handpan** (s5) | A low D ding, then a roll up the D minor scale | 4.3 |
| **Harmonica** (s6) | Blow, draw, then a held C chord | 3.9 |
| **Snap, clap, stomp** (s7) | The body alone: a snap, four hands clapping, a foot on a wooden floor | 3.3 |

A drum machine take was dropped: it sat at −26 LUFS on a phone speaker.

### Round 6: the liked family

Built from the takes the Owner liked: a knock, wood, a heartbeat, a hum, the mouth, a handpan and the felt piano. Nothing from the disliked side (hiss, water, flame, machines, reeds, choirs, busy percussion). Each idea has its own key; three use new instruments from the same family.

| | Made from | Seconds |
| --- | --- | --- |
| **Knock and answer** (t1) | Two knocks on a door, and someone inside hums back; E-flat | 4.3 |
| **Heart and steel** (t2) | One heartbeat, then a handpan answers; F | 4.4 |
| **Thumb piano** (t3) | Three tines plucked upward, the box humming under the last; G | 4.2 |
| **Tongue drum** (t4) | A felt mallet walks up A minor, then the low A rings | 4.5 |
| **Piano lid** (t5) | Two knuckle taps on the wood, then a wide felt piano chord; A-flat | 4.1 |
| **Mouth and steel** (t6) | Two cheek pops, and a handpan picks up their pitch; C | 4.2 |
| **Log drum** (t7) | Two slit drum tones, then a hummed fifth; A | 4.2 |
| **Heart, opening** (t8) | A slower heartbeat, then the warm synth opens; D-flat | 4.6 |
| **Fingers on the table** (t9) | Four fingertips roll on a desk, then piano and hum land together; E | 4.2 |
| **Breath and hum** (t10) | A breath in, two hummed notes rising a sixth, piano under them; B-flat | 4.3 |

### Round 7: what makes a sound logo iconic

The Owner scored Heart, opening (t8) 10 of 10. The sound logos people remember share a few habits: one sound you can name with your eyes shut, then a bloom; a tune short enough to hum, on open intervals; weight underneath; one signature trick; about three seconds before the tail. Round 7 keeps t8's core, a heartbeat and the warm chord opening in D-flat, and tests one habit per take.

| | Made from | Seconds |
| --- | --- | --- |
| **Three beats** (u1) | Three heartbeats at the bars' strengths, then the chord opens | 4.5 |
| **Heart, sung** (u2) | A hummed three-note tune over the heartbeat and chord: up a fifth, down a third | 4.6 |
| **Heart, short** (u3) | The sting: the same idea in two and a half seconds | 3.3 |
| **Knock, opening** (u4) | Two knocks on a door instead of the heartbeat; E-flat | 4.5 |
| **Fingers, opening** (u5) | Fingertips roll on a desk, then the chord; E | 4.5 |
| **Heart and piano** (u6) | The felt piano plays the tune over the chord | 4.6 |
| **One strike** (u7) | One beat and the whole chord struck together, like one note | 3.8 |
| **Drawn in** (u8) | The chord's echo reversed draws in to the heartbeat | 4.7 |
| **Pops, opening** (u9) | Three cheek pops on the tune, then the chord | 4.5 |
| **Heart, wide** (u10) | The chord opens slowly and travels left to right over a low floor | 4.9 |

## Files

`directions/shades-logo-<version>-<seconds>s.{wav,m4a,mp3}`: 48 kHz, 24-bit WAV master, AAC 256 kb/s, MP3 256 kb/s. `directions/audit.json` holds each file's measurements.

## Rebuild

```bash
python3 -m venv .venv && .venv/bin/pip install numpy scipy pyloudnorm
brew install csound   # 7.x, for orchestra.orc
.venv/bin/python render.py   # Spectrum versions and the orchestra round
.venv/bin/python ideas.py    # round 3; or name some: ideas.py i1-hum i5-glass
.venv/bin/python round4.py   # round 4; or name some: round4.py r1-knock
.venv/bin/python round5.py   # round 5; or name some: round5.py s3-water
.venv/bin/python round6.py   # round 6; or name some: round6.py t3-thumb
.venv/bin/python round7.py   # round 7; or name some: round7.py u3
```

Levels: −16 LUFS integrated, true peak under −1 dBTP, checked by the script and by `ffmpeg -i <file> -af ebur128=peak=true -f null -`.
