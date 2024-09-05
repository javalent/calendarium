<script lang="ts">
    import { getContext, onDestroy } from "svelte";
    import { TextAreaComponent } from "obsidian";
    import { EditorView } from "@codemirror/view";
    import Details from "../../../Utilities/Details.svelte";
    import { editorFromTextArea } from "src/utils/editor/editor";

    const calendar = getContext("store");

    $: cal = $calendar;
    let editor: EditorView;
    const textarea = (node: HTMLDivElement) => {
        const component = new TextAreaComponent(node).setValue(
            cal.static.dayDisplayCallback ?? "",
        );
        editor = editorFromTextArea(
            component.inputEl,
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    cal.static.dayDisplayCallback = update.state.doc.toString();
                }
            }),
        );
    };

    onDestroy(() => {
        editor.destroy();
    });
</script>

<Details name={"Day Callback"}>
    <p>Use this to override what is displayed for a given day.</p>
    <p>
        Your callback will receive the <code>day</code> and
        <code>calendar</code>
        parameters and <b>must</b> return a <code>string</code> or
        <code>number</code>
    </p>
    <div use:textarea />
</Details>

<style scoped>
    div :global(.cm-editor) {
        height: 200px;
    }
</style>
