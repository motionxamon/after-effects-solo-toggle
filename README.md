# Solo Toggle for After Effects

[Русский](README.ru.md) · English

**Version 1.3 · After Effects 22.0 or later**

A single-button JSX script that isolates selected layers in both the Composition viewer and the Timeline. Run the same script again to restore the previous state.

Choose either independent distribution:

| File | Use |
| --- | --- |
| [Solo_Toggle.jsx](https://github.com/motionxamon/after-effects-solo-toggle/releases/download/v1.3/Solo_Toggle.jsx) | Run directly from a KBar or FT-Toolbar script button. |
| [Solo_Toggle_Panel.jsx](https://github.com/motionxamon/after-effects-solo-toggle/releases/download/v1.3/Solo_Toggle_Panel.jsx) | Dockable ScriptUI panel containing a single **S** icon button. |

<img src="assets/solo-s-40.png" width="40" height="40" alt="S panel button">

The generated PNG is embedded as binary image data in the panel JSX. No external icon, temporary image file, companion script or JSXBIN compilation is needed. Both files share the same state format: isolate through one and restore through the other.

## How it works

1. Open a composition and select the layers you want to isolate.
2. Run `Solo_Toggle.jsx`. Selected layers are enabled and unshied. Other layers are disabled and marked Shy, including locked layers. The composition's **Hide Shy Layers** button is enabled; native Solo flags are temporarily cleared.
3. Run the same script again. Original visibility, Solo, individual Shy flags and the composition's Hide Shy Layers setting are restored. No selection is needed to restore.

Layer locks are preserved. Each composition has its own saved state. The script uses persistent layer IDs, so renaming or reordering layers does not break restoration. Deleted layers are ignored; newly added layers keep their own switches.

State is stored in a small `[[SoloToggle:...]]` block in the composition comment. The script preserves other comment text, including notes appended while isolated. Changes are grouped into a single Undo step. No external dependency or script file/network permission is required.

## Installation

Download `Solo_Toggle.jsx` and keep it in your After Effects scripts folder or another permanent location.

- **KBar:** create a button using **Run JSX/JSXBIN File**, select `Solo_Toggle.jsx`, and name it `Solo`.
- **FT-Toolbar:** assign `Solo_Toggle.jsx` to a script button.
- **Without KBar:** choose **File → Scripts → Run Script File…** and select the file. Run the same file again to restore.

Do not change the button between isolation and restoration.

### Dockable S panel

Install **only** `Solo_Toggle_Panel.jsx` in After Effects' `Scripts/ScriptUI Panels` folder. Restart After Effects, open **Window → Solo_Toggle_Panel**, and dock the panel wherever you prefer. Click **S** to isolate; click it again to restore. Opening the panel does not toggle layers.

Alternatively use **File → Scripts → Install ScriptUI Panel…** if your AE version provides it. Running the panel file through **Run Script File…** opens a floating palette instead of a docked panel.

The panel stays compact with a fixed 44 × 44 button. If a host rejects in-memory PNG data, it falls back to a text **S** button. No files are written to display the icon.

### Quick demonstration

Create a composition with three layers, select one or two, and press **S** (or the toolbar script button). Other layers disappear from the viewer and Timeline. Press the same button again to restore. Try with a locked unselected layer as well. Layers hidden before isolation return to their original hidden state.

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
node tests/test-solo.cjs Solo_Toggle_Panel.jsx
node tests/test-panel.cjs
```

The tests cover **1,536 isolation/restoration cycles**: every enabled/Solo/Shy/locked combination for two layers, both initial Hide Shy Layers states, and every nonempty selection.

Additional cases include locked and disabled layers, restoration without selection, independent compositions, reordered/added/deleted layers, legacy v1 recovery, comment edits, malformed/copied state, failed switches with rollback and retry, and models of Undo/Redo and project reload.

Each distribution passes the 1,536-cycle suite. Panel tests also cover docked/floating UI models, one-button construction, no toggle on opening, exact embedded PNG bytes, toolbar/panel interoperability, text fallback and recovery of the button after a failed action.

These are tests against JavaScript models of AE and ScriptUI objects, including AE's restriction on assigning Solo to a disabled layer. **Version 1.3 has not yet been verified inside After Effects.** Real docking, image rendering, Undo/Redo, project save/reload and differences between AE layer types still need application testing.

## Version history

- **1.3:** Two independent distributions: KBar/FT-Toolbar script and a dockable one-button S panel with an embedded PNG. Shared build source, panel tests and cross-distribution state compatibility.

- **1.2:** Timeline isolation with Shy + Hide Shy Layers; restore original Shy settings; preserve appended comments; reject corrupt or copied state; expand regression coverage.
- **1.1:** Fix Solo assignment on disabled layers; avoid unnecessary switch assignments; summarize rollback errors.
- **1.0:** Initial viewer isolation and restoration using persistent layer IDs.

## API references

[CompItem.hideShyLayers](https://ae-scripting.docsforadobe.dev/item/compitem/#compitemhideshylayers) · [Layer.shy](https://ae-scripting.docsforadobe.dev/layer/layer/#layershy) · [Layer.id](https://ae-scripting.docsforadobe.dev/layer/layer/#layerid)

## Rebuilding

Run `python tools/build.py` with Python 3 to rebuild both JSX files from `src/solo-core.jsxinc` and `assets/solo-s-40.png`. No Python packages are required. Image-generation provenance and the prompt are in [assets/IMAGE_PROMPT.md](assets/IMAGE_PROMPT.md). The assets and source folders are not required for installation.
