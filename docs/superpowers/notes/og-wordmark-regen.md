# Regenerating the OG wordmark PNG

`src/assets/og/wordmark.png` is a transparent, pre-rendered PNG of the real
digibop **EchoText** `napochaan.` wordmark. Satori (used by `next/og`) cannot
embed the Typekit-loaded EchoText typeface at render time, so the wordmark is
baked into a transparent PNG and passed to the card renderer as an `<img>`.

Re-generate this asset **only when the wordmark design changes** (typeface,
glyphs, weight, or the "napochaan." text itself).

## Procedure

1. **Isolate the wordmark on a chroma field.** On `https://stg.napochaan.com/`,
   locate the rendered wordmark element:

   ```
   span[role="img"][aria-label*="napochaan"]
   ```

   Temporarily set its surrounding background to pure green (`#00ff00`) so the
   transparent areas key cleanly. (A pure, fully-saturated color the wordmark
   itself never uses; green is the convention here.)

2. **Screenshot the element at DPR 2.** Capture just that element's bounding box
   at `deviceScaleFactor: 2` so the baked glyphs stay crisp at the 344px render
   width used in the card. The source capture is ~1549×379.

3. **Green-key + despill + crop.** Run the keying script (PIL):
   - Treat near-`#00ff00` pixels as transparent (key out the green field).
   - Despill: reduce residual green fringing on anti-aliased glyph edges.
   - Crop to the wordmark's tight alpha bounding box.

   The keying script (`reports/og-mockups/key.py`) is **not committed** to the
   repo — it is a throwaway one-off. If you need it, reconstruct it from this
   description: load the DPR-2 screenshot, for each pixel compute green
   dominance, set alpha from the green distance, subtract spill from the R/B
   channels, then `img.getbbox()` + `img.crop()`.

4. **Output.** Save the keyed result as `reports/og-mockups/echo-wordmark.png`
   (RGBA, ~1549×379, with a real alpha channel), then copy it into source:

   ```bash
   cp reports/og-mockups/echo-wordmark.png src/assets/og/wordmark.png
   ```

## Verify

```bash
file src/assets/og/wordmark.png
# Expected: PNG image data, ~1549 x 379, 8-bit/color RGBA
```
