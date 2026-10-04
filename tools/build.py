"""Build two independent JSX distributions from the same core and embedded PNG."""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
core = (root / 'src/solo-core.jsxinc').read_text(encoding='utf-8').rstrip()
header = '/** Solo Toggle 1.3 — AE 22.0+. Independent single-file distribution. */\n'
(root / 'Solo_Toggle.jsx').write_text(header + '(function () {\n' + core + '\n})();\n', encoding='utf-8')
data = (root / 'assets/solo-s-40.png').read_bytes()
chunks = ['"' + ''.join('\\x%02x' % b for b in data[i:i+80]) + '"' for i in range(0, len(data), 80)]
encoded = ' +\n        '.join(chunks)
ui = '''
    // PNG bytes are embedded in memory: no asset path or temporary image file.
    var iconBytes = ICON_DATA;
    var root = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Solo Toggle", undefined, {resizeable:true});
    root.orientation = "column";
    root.alignChildren = ["center", "center"];
    root.margins = 6;
    root.spacing = 0;
    root.minimumSize = [56, 56];
    root.preferredSize = [56, 56];
    var button;
    try {
        var icon = ScriptUI.newImage(iconBytes);
        button = root.add("iconbutton", undefined, icon, {style:"toolbutton"});
    } catch (imageError) {
        // Some hosts reject binary image strings. Keep the single S button usable.
        button = root.add("button", undefined, "S");
    }
    button.minimumSize = [44, 44];
    button.maximumSize = [44, 44];
    button.preferredSize = [44, 44];
    button.helpTip = "Solo / Restore selected layers + Shy\\nИзолировать / восстановить слои и Shy";
    button.onClick = function () {
        if (!button.enabled) return;
        button.enabled = false;
        try { toggleSolo(); }
        catch (error) { alert("Solo Toggle: " + error.toString()); }
        finally { button.enabled = true; }
    };
    root.onResizing = root.onResize = function () { this.layout.resize(); };
    root.layout.layout(true);
    if (root instanceof Window) { root.center(); root.show(); }
'''.replace('ICON_DATA', encoded)
panel = header + '(function (thisObj) {\n    function toggleSolo() {\n        /* CORE START */\n' + core + '\n        /* CORE END */\n    }\n' + ui + '\n})(this);\n'
(root / 'Solo_Toggle_Panel.jsx').write_text(panel, encoding='utf-8')
print('Built standalone script and panel; embedded PNG: %d bytes.' % len(data))
