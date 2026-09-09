# Circle share confirmation

`circle-shared.json` is adapted from the public LottieFiles **Successful** animation:
https://assets5.lottiefiles.com/packages/lf20_jbrw3hcz.json

The adaptation keeps the drawing tick and two circle layers, removes payment text,
centers the artwork on a square canvas, and uses Openheart's blue. It plays once
in about 1.57 seconds and holds the completed tick.

License: Lottie Simple License, https://lottiefiles.com/page/license.
The adapted animation remains under that license; see `LICENSE.lottiefiles.txt`.

Native uses the local JSON with Expo's compatible `lottie-react-native` 7.3.8.
Web uses the same animation in `public/animations/circle-shared.lottie`, a dotLottie
2.0 archive with `manifest.json` and `a/circle-shared.json`, via LottieFiles'
`@lottiefiles/dotlottie-react` player. The matching dotlottie-web 0.80.0 WASM runtime
is served locally from `public/vendor/dotlottie-player.wasm`.

When updating the player dependency, replace the WASM file with the matching
`node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm` file.
If changing the JSON, regenerate the animation inside the dotLottie archive too.

The animation mounts only after sharing completes. Closing/reopening the sheet
resets it. Reduced motion and player failures use a static Hugeicons tick.
