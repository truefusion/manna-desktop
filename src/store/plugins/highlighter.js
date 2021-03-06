export default class Highlighter {
    constructor({Vue, Paths}) {
    }

    get is() {
        return 'Highlighter';
    }

    onHighlight() {}

    get Type() {
        return [
            'Verse',
        ];
    }

    get VerseMenu() {
        return {
            Action: this.onHighlight,
            Label: 'Highlight Verse',
            Icon: 'marker',
        };
    }
}
