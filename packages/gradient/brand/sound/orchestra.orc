; Shades sound: the ensemble. Every instrument is synthesised (physical models, FM, analog-style
; oscillators); no samples. Rendered offline by render.py through Csound 7.
;
; Shared p-fields:  p4 Hz  p5 amplitude  p6 pan (0 left .. 1 right)
;                   p7 outro start (s from note start)  p8 outro length (s)
;                   p9 colour opens at (s from note start)  p10 opening time (s)
;                   p11 attack (s)
; The colour is a ladder filter on every voice: it opens from dark (blue) to bright (orange),
; then closes back during the outro, so every instrument follows the same spectrum.

sr = 48000
ksmps = 16
nchnls = 2
0dbfs = 1
seed 23

giSine ftgen 0, 0, 65536, 10, 1
gaRevL init 0
gaRevR init 0

opcode Shape, kk, iiiiiii
  ; returns amplitude envelope and colour 0..1
  iatt, iend, irel, iopen, iopenT, idur, idummy xin
  isus = max(iend - iatt, 0.001)
  kamp transeg 0, iatt, -2, 1, isus, 0, 1, irel, 2.5, 0, 1, 0, 0
  kop linseg 0, max(iopen, 0.001), 0, iopenT, 1, max(idur - iopen - iopenT, 0.001), 1
  kop = kop ^ 1.5
  kcl linseg 0, max(iend, 0.001), 0, irel, 0.8, 1, 0.8
  kcol = kop * (1 - kcl)
  xout kamp, kcol
endop

; 1. Bowed string (waveguide). Bow pressure rises as the colour opens: the tone brightens.
instr 1
  kamp, kcol Shape p11, p7, p8, p9, p10, p3, 0
  kpres = 2.4 + 1.6 * kcol
  kvib linseg 0, 0.35, 0, 0.5, 0.0035
  asig wgbow 0.6, p4, kpres, 0.127236, 5.1, kvib, giSine, 40
  kcut = p4 * (1.5 + 9 * kcol)
  asig moogladder asig, limit(kcut, 60, 18000), 0.1
  asig dcblock2 asig
  aL, aR pan2 asig * kamp * p5, p6
  outs aL, aR
  gaRevL += aL
  gaRevR += aR
endin

; 2. Brass (waveguide horn), soft: lip tension low, a warm horn colour.
instr 2
  kamp, kcol Shape p11, p7, p8, p9, p10, p3, 0
  asig wgbrass 0.8, p4, 0.4, 0.15, 4.6, 0.002, giSine, 40
  kcut = p4 * (1.2 + 6 * kcol)
  asig moogladder asig, limit(kcut, 60, 16000), 0.05
  asig dcblock2 asig
  aL, aR pan2 asig * kamp * p5, p6
  outs aL, aR
  gaRevL += aL
  gaRevR += aR
endin

; 3. Flute (waveguide), breath noise low.
instr 3
  kamp, kcol Shape p11, p7, p8, p9, p10, p3, 0
  kvib linseg 0, 0.3, 0, 0.6, 0.004
  asig wgflute 0.45, p4, 0.32, 0.08, 0.1, 0.03, 5, kvib, giSine, 0
  kcut = p4 * (2 + 8 * kcol)
  asig moogladder asig, limit(kcut, 60, 18000), 0.05
  asig dcblock2 asig
  aL, aR pan2 asig * kamp * p5, p6
  outs aL, aR
  gaRevL += aL
  gaRevR += aR
endin

; 4. Electric piano (FM). Struck: its own decay, the outro only shortens the tail.
instr 4
  kamp, kcol Shape 0.004, p7, p8, p9, p10, p3, 0
  kdec expseg 1, p3, 0.02
  asig fmrhode 1.25, p4, 5, 0.3 + 0.7 * kcol, 0.002, 4.5, giSine, giSine, giSine, giSine, giSine
  asig dcblock2 asig
  aL, aR pan2 asig * kamp * kdec * p5, p6
  outs aL, aR
  gaRevL += aL
  gaRevR += aR
endin

; 5. Analog pad: three detuned saws through the ladder filter: the Spectrum voice.
instr 5
  kamp, kcol Shape p11, p7, p8, p9, p10, p3, 0
  a1 vco2 0.33, p4 * 0.9965
  a2 vco2 0.33, p4
  a3 vco2 0.33, p4 * 1.0035
  kcut = p4 * (1.3 + 8 * kcol)
  asig moogladder a1 + a2 + a3, limit(kcut, 60, 16000), 0.15
  aL, aR pan2 asig * kamp * p5, p6
  outs aL, aR
  gaRevL += aL
  gaRevR += aR
endin

; 6. Sine floor (home).
instr 6
  kamp, kcol Shape p11, p7, p8, p9, p10, p3, 0
  asig poscil 0.25, p4, giSine  ; a floor sits 12 dB under the instruments
  aL, aR pan2 asig * kamp * p5, p6
  outs aL, aR
  gaRevL += aL * 0.5
  gaRevR += aR * 0.5
endin

; 99. The room: one hall for the whole ensemble. p4 send level, p5 feedback, p6 damping Hz.
instr 99
  aL, aR reverbsc gaRevL, gaRevR, p5, p6
  outs aL * p4, aR * p4
  clear gaRevL, gaRevR
endin
