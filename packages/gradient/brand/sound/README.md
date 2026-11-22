# Shades sound

The sonic logo of Shades Media Group and, once a direction is chosen, the sounds every Shades product plays. All of it is synthesised by [render.py](render.py): no samples, no generated audio, so we own every note. Rules: the rulebook's Sound chapter.

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

## Files

`directions/shades-logo-<version>-<seconds>s.{wav,m4a,mp3}`: 48 kHz, 24-bit WAV master, AAC 256 kb/s, MP3 256 kb/s. `directions/audit.json` holds each file's measurements.

## Rebuild

```bash
python3 -m venv .venv && .venv/bin/pip install numpy scipy pyloudnorm
.venv/bin/python render.py
```

Levels: −16 LUFS integrated, true peak under −1 dBTP, checked by the script and by `ffmpeg -i <file> -af ebur128=peak=true -f null -`.
