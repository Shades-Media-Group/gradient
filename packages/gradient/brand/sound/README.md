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

## Three directions

Each one keeps the idea (three notes, falling in strength like the bars) and tries a different tune and voice. One will be chosen; the others are dropped.

| | Notes | Voice | Feels like |
| --- | --- | --- | --- |
| **A. Steps** | E5, B5, F♯6: three rising fifths, evenly spaced | Struck glass | Precise and open. Each note a lighter shade, climbing. Ends unresolved, looking forward. |
| **B. Spectrum** | F♯4, B4, C♯5, short-short-long, then held together | Warm synth whose filter opens as it holds | The spectrum in sound: starts dark and blue, opens to warm orange. The most cinematic, built for the TV open. |
| **C. Ink** | C♯5, G♯4, A4: down a fourth, then a half-step home | Plucked string with a dry paper tick on each note | Ink on paper. Human and warm; the half-step lands like a full stop. |

## Files

`directions/shades-logo-<direction>-<seconds>s.{wav,m4a,mp3}`: 48 kHz, 24-bit WAV master, AAC 256 kb/s, MP3 256 kb/s. `directions/audit.json` holds each file's measurements.

## Rebuild

```bash
python3 -m venv .venv && .venv/bin/pip install numpy scipy pyloudnorm
.venv/bin/python render.py
```

Levels: −16 LUFS integrated, true peak under −1 dBTP, checked by the script and by `ffmpeg -i <file> -af ebur128=peak=true -f null -`.
