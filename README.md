# Solo Toggle for After Effects

[Русский](README.ru.md) · English

**Version 1.2 · After Effects 22.0 or later**

A single-button JSX script that isolates selected layers in both the Composition viewer and the Timeline. Run the same script again to restore the previous state.

## How it works

1. Open a composition and select the layers you want to isolate.
2. Run `Solo_Toggle.jsx`. Selected layers are enabled and unshied. Other layers are disabled and marked Shy, including locked layers. The composition's **Hide Shy Layers** button is enabled; native Solo flags are temporarily cleared.
3. Run the same script again. Original visibility, Solo, individual Shy flags and the composition's Hide Shy Layers setting are restored. No selection is needed to restore.

Layer locks are preserved. Each composition has its own saved state. The script uses persistent layer IDs, so renaming or reordering layers does not break restoration. Deleted layers are ignored; newly added layers keep their own switches.

State is stored in a small `[[SoloToggle:...]]` block in the composition comment. The script preserves other comment text, including notes appended while isolated. Changes are grouped into a single Undo step. No ScriptUI panel, external dependency or script file/network permission is required.

## Installation

Download `Solo_Toggle.jsx` and keep it in your After Effects scripts folder or another permanent location.

- **KBar:** create a button using **Run JSX/JSXBIN File**, select `Solo_Toggle.jsx`, and name it `Solo`.
- **Without KBar:** choose **File → Scripts → Run Script File…** and select the file. Run the same file again to restore.

Do not change the button between isolation and restoration.

## Limitations and edge cases

- Restoration returns to the **previous state**. Layers already hidden before isolation stay hidden afterward. Previous Shy and Hide Shy Layers settings are also restored.
- This is a button-operated toggle, not a live monitor. Layers added while isolated are not automatically isolated and retain their current switches on restoration.
- Exit isolation before duplicating a composition or importing a project. Saved state refers to composition and layer IDs. If the composition ID has changed, the script stops with a short message rather than applying someone else's settings.
- Do not delete or edit the `[[SoloToggle:...]]` state block in the composition comment while isolated. Damaged, duplicate or mismatched state blocks stop the operation without changing layers.
- Disabling unselected cameras, lights, track mattes or adjustment layers can change the appearance of selected layers. Include required dependencies in your selection when needed. The script isolates exactly the selected layers.
- `audioEnabled` is not changed. Clearing existing native Solo flags can still change which audio layers are heard.
- Persistent layer IDs require After Effects **22.0+**. Earlier versions are rejected before switching layers.
- State from script versions 1.0/1.1 is supported. If an older isolation is active, the first run restores it; the following run uses the new Shy behavior. Old state has no saved Shy settings, so current Shy settings are retained during that one restoration.
- If switching a layer fails, the script attempts to restore affected switches, locks, the composition button and comment. If rollback also fails, use **Undo**. Error details are summarized instead of filling the screen with repeated messages.

## Verification

Run the included tests with Node.js:

```sh
node tests/test-solo.cjs
```

The tests cover **1,536 isolation/restoration cycles**: every enabled/Solo/Shy/locked combination for two layers, both initial Hide Shy Layers states, and every nonempty selection.

Additional cases include locked and disabled layers, restoration without selection, independent compositions, reordered/added/deleted layers, legacy v1 recovery, comment edits, malformed/copied state, failed switches with rollback and retry, and models of Undo/Redo and project reload.

These are tests against a JavaScript model of AE objects, including AE's restriction on assigning Solo to a disabled layer. **Version 1.2 has not yet been verified inside After Effects.** Real Undo/Redo, project save/reload and differences between AE layer types still need application testing.

## Version history

- **1.2:** Timeline isolation with Shy + Hide Shy Layers; restore original Shy settings; preserve appended comments; reject corrupt or copied state; expand regression coverage.
- **1.1:** Fix Solo assignment on disabled layers; avoid unnecessary switch assignments; summarize rollback errors.
- **1.0:** Initial viewer isolation and restoration using persistent layer IDs.

## API references

[CompItem.hideShyLayers](https://ae-scripting.docsforadobe.dev/item/compitem/#compitemhideshylayers) · [Layer.shy](https://ae-scripting.docsforadobe.dev/layer/layer/#layershy) · [Layer.id](https://ae-scripting.docsforadobe.dev/layer/layer/#layerid)
