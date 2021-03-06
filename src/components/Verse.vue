<template lang="html">
    <div class="verse-wrapper">
        <div class="verse-heading" v-if="Headings && TextHeading">
            {{TextHeading.Text}}
        </div>
        <div class="verse" @contextmenu.prevent="$refs.menu.open">
            <span class="verse-number" v-if="VerseNumbers">{{Verse}}.</span>
            <vue-context ref="menu">
                <li v-for="action in Actions">
                    <a @click="action.Action(self)">
                        <b-icon :icon="action.Icon" />
                        {{action.Label}}
                    </a>
                </li>
            </vue-context>
            <div class="verse-text" :dir="Direction">
                <template v-for="t in Text">
                    <span v-if="t.Type == 'text'">{{t.Text}}</span>
                    <i :class="t.Type" v-if="t.Type == 'added-text'">{{t.Text}}</i>
                    <template v-if="t.Type == 'morph'">
                        <span :class="{ 'verse-morph': ShowStrongs }" :data-lemma="t.Lemma" :data-morph="t.Morph">
                            <span>{{t.Text}}</span>
                            <sup v-if="ShowStrongs">{{parseLemma(t.Lemma)}}</sup>
                        </span>
                    </template>
                    <span :class="t.Type" v-else-if="t.Type == 'divine-name'">{{t.Text}}</span>
                    <sup class="verse-note" @click="triggerNote(t)" v-else-if="ShowNotes && t.Type == 'note'">*</sup>
                    <br :class="t.Type" v-else-if="t.Type == 'new-line' && WhiteSpace">
                    <p :class="t.Type" v-else-if="t.Type == 'paragraph' && WhiteSpace"><br></p>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
    import {VueContext} from 'vue-context';

    import Self from '../store/helpers/self.js';

    const puncuation = '[\\:\\;\\,\\.\\—\\!\\"\'\\”\\[\\]\\s\\`\\’\\?]';
    const punc_end   = new RegExp('[\\“\\‘\\—]$');
    const punc_start = new RegExp('^' + puncuation);

    export default {
        components: {
            VueContext,
        },
        mixins: [
            Self,
        ],
        props: {
            struct: {
                type: Object,
                default() {
                    return {};
                },
            },
            value: {
                type: Object,
                default() {
                    return {};
                },
            },
        },
        computed: {
            Actions: {
                cache: false,
                get() {
                    var actions = this.$store.getters['Plugins/VerseMenu'];
                    return [
                        {
                            Action: this.onCopy,
                            Label: 'Copy Verse',
                            Icon: 'clipboard-text',
                        },
                        ...actions,
                    ];
                },
            },
            Book: {
                cache: false,
                get() {
                    var {struct} = this;
                    var {Book} = struct;
                    return Book;
                },
            },
            Chapter: {
                cache: false,
                get() {
                    var {struct} = this;
                    var {Chapter} = struct;
                    return Chapter;
                },
            },
            Direction: {
                cache: false,
                get() {
                    var {value} = this;
                    var {Direction} = value;
                    return Direction;
                },
            },
            Headings: {
                cache: false,
                get() {
                    var {value} = this;
                    var {Headings} = value;
                    return Headings;
                },
            },
            PlainText: {
                cache: false,
                get() {
                    return this.Text.reduce((ret, t) => {
                        if (!['heading', 'note'].includes(t.Type)) {
                            ret += t.Text;
                        }
                        return ret;
                    }, '');
                },
            },
            ShowNotes: {
                cache: false,
                get() {
                    var {value} = this;
                    var {ShowNotes} = value;
                    return ShowNotes;
                },
            },
            ShowStrongs: {
                cache: false,
                get() {
                    var {value} = this;
                    var {ShowStrongs} = value;
                    return ShowStrongs;
                },
            },
            Text: {
                cache: false,
                get() {
                    var {struct} = this;
                    var {Text} = struct;
                    var ret = [];
                    var div = document.createElement('div');
                    Text.forEach((node, idx) => {
                        switch (node.Type) {
                            case 'node': {
                                switch (node.Tag) {
                                    case 'chapter': {
                                        // Do nothing...
                                        break;
                                    }
                                    case 'div': {
                                        let attrs = node.Attributes;
                                        let {eID, sID, type} = attrs;
                                        switch (type) {
                                            case 'section':
                                            case 'subSection': {
                                                break;
                                            }
                                            case 'x-p': {
                                                if (idx && eID) {
                                                    ret.push({
                                                        Text: '\n\n',
                                                        Type: 'paragraph',
                                                    });
                                                }
                                                break;
                                            }
                                            case 'paragraph':
                                            case 'x-milestone': {
                                                if (idx && sID) {
                                                    ret.push({
                                                        Text: '\n\n',
                                                        Type: 'paragraph',
                                                    });
                                                }
                                                break;
                                            }
                                            default: {
                                                console.log(node);
                                            }
                                        }
                                        break;
                                    }
                                    case 'divineName': {
                                        let childNode = this.findText(node)
                                        if (childNode) {
                                            ret.push({
                                                Text: childNode.Text,
                                                Type: 'divine-name',
                                            });
                                        }
                                        break;
                                    }
                                    case 'h1':
                                    case 'h2':
                                    case 'h3':
                                    case 'h4':
                                    case 'h5':
                                    case 'h6':
                                    case 'title': {
                                        let childNode = this.findText(node);
                                        if (childNode) {
                                            ret.push({
                                                Text: childNode.Text,
                                                Type: 'heading',
                                            });
                                        }
                                        break;
                                    }
                                    case 'hi': {
                                        let childNode = this.findText(node)
                                        ret.push({
                                            Text: childNode.Text,
                                            Type: 'added-text',
                                        });
                                        break;
                                    }
                                    case 'l': {
                                        let attrs = node.Attributes;
                                        let {eID} = attrs;
                                        if (eID) {
                                            ret.push({
                                                Type: 'new-line',
                                            });
                                        }
                                        break;
                                    }
                                    case 'lb': {
                                        break;
                                    }
                                    case 'lg': {
                                        ret.push({
                                            Type: 'paragraph',
                                        });
                                        break;
                                    }
                                    case 'milestone': {
                                        let attrs = node.Attributes;
                                        let {subType, type} = attrs;
                                        if (type == 'line') {
                                            if (subType == 'x-PO') {
                                                ret.push({
                                                    Type: 'new-line',
                                                });
                                            } else {
                                                ret.push({
                                                    Type: 'paragraph',
                                                });
                                            }
                                        }
                                        break;
                                    }
                                    case 'note': {
                                        let attrs = node.Attributes;
                                        let {n} = attrs || {
                                            n: null,
                                        };
                                        ret.push({
                                            Children: node.Children,
                                            Ref: n,
                                            Type: 'note',
                                        });
                                        break;
                                    }
                                    case 'p': {
                                        ret.push({
                                            Text: '\n\n',
                                            Type: 'paragraph',
                                        });
                                        let childNode = this.findText(node);
                                        if (childNode) {
                                            ret.push({
                                                Text: childNode.Text,
                                                Type: 'text',
                                            });
                                        }
                                        break;
                                    }
                                    case 'transChange': {
                                        let attrs = node.Attributes;
                                        let childNode = this.findText(node);
                                        let {type} = attrs || {
                                            type: 'added',
                                        };
                                        if (type == 'added') {
                                            ret.push({
                                                Text: childNode.Text,
                                                Type: 'added-text',
                                            });
                                        }
                                        break;
                                    }
                                    case 'w': {
                                        let attrs = node.Attributes;
                                        let {lemma, morph} = attrs;
                                        let childNode = this.findText(node);
                                        if (lemma || morph) {
                                            ret.push({
                                                Lemma: lemma,
                                                Morph: morph,
                                                Text: childNode.Text,
                                                Type: 'morph'
                                            });
                                        }
                                        break;
                                    }
                                    default: {
                                        console.log(node);
                                    }
                                }
                                break;
                            }
                            case 'text': {
                                div.innerHTML = node.Text;
                                ret.push({
                                    Text: div.innerText,
                                    Type: 'text',
                                });
                                break;
                            }
                        }
                    });
                    // console.log(struct.Verse, ret);
                    // Remove redundant paragraphs!
                    ret = ret.reduce((ret, item, idx, arr) => {
                        if (item.Type == 'paragraph') {
                            let prev = arr[idx-1];
                            if (!prev || (prev && prev.Type == 'paragraph')) {
                                return ret;
                            }
                        }
                        ret.push(item);
                        return ret;
                    }, []);
                    ret = ret.reduce((ret, item, idx, arr) => {
                        item.Text = String(item.Text).trim();
                        if (idx && item.Type != 'paragraph' && !item.Text.match(punc_start) && !arr[idx-1].Text.match(punc_end)) {
                            ret.push({
                                Text: ' ',
                                Type: 'text',
                            });
                        }
                        ret.push(item);
                        return ret;
                    }, []);
                    return ret;
                },
            },
            TextEnding: {
                cache: false,
                get() {
                    var {Text} = this;
                    var ending = Text.slice(0).pop();
                    return ending.Type == 'paragraph' ? ending : null;
                },
            },
            TextHeading: {
                cache: false,
                get() {
                    var {TextHeadings} = this;
                    return TextHeadings[0];
                },
            },
            TextHeadings: {
                cache: false,
                get() {
                    var {Text} = this;
                    return Text.filter((t) => {
                        return t.Type == 'heading';
                    });
                },
            },
            Verse: {
                cache: false,
                get() {
                    var {struct} = this;
                    var {Verse} = struct;
                    return Verse;
                },
            },
            VerseNumbers: {
                cache: false,
                get() {
                    var {value} = this;
                    var {VerseNumbers} = value;
                    return VerseNumbers;
                },
            },
            WhiteSpace: {
                cache: false,
                get() {
                    var {value} = this;
                    var {WhiteSpace} = value;
                    return WhiteSpace;
                },
            },
        },
        methods: {
            findText(node) {
                var ret = [];
                if (node.Type == 'text') {
                    ret.push(node);
                } else {
                    let {Children} = node;
                    if (Array.isArray(Children)) {
                        Children.forEach((child) => {
                            ret = ret.concat(this.findText(child));
                        });
                    }
                }
                return ret.reduce((ret, node, idx, arr) => {
                    node.Text = String(node.Text).trim();
                    ret.Text += idx && !node.Text.match(punc_start) && !arr[idx-1].Text.match(punc_end) ? ' ' + node.Text : node.Text;
                    return ret;
                }, {
                    Text: '',
                    Type: 'text',
                });
            },
            onCopy() {
                var {clipboard} = window.require('electron');
                clipboard.writeText(this.PlainText);
            },
            parseLemma(lemma) {
                return '[' + String(lemma).replace(/strong:H/gi, '').replace(/\s+/g, ',') + ']';
            },
        },
    }
</script>

<style lang="less">
    @import "../styles/base.less";

    #app {
        .verse {
            .verse-note {
                color: @grey200;
                cursor: pointer;
                // font-size: small;

                &:hover {
                    color: @pale-blue;
                    text-decoration: underline;
                    text-decoration-color: @red;
                }
            }

            .verse-number {
                display: inline-block;
                margin-right: 0.5rem;
                min-width: 2.5rem;
                text-align: right;
            }

            .verse-text {
                display: inline;

                &::after {
                    content: " ";
                }

                .added-text {
                    color: @grey200;
                }

                .divine-name {
                    font-variant: small-caps;
                }

                .verse-morph {
                    cursor: pointer;
                    display: inline-flex;
                    flex-direction: column;

                    &:hover {
                        :first-child {
                            text-decoration-line: underline;
                            text-decoration-color: @red;
                            text-decoration-style: solid;
                        }

                        :last-child {
                            color: @black !important;
                        }
                    }

                    *:last-child:not(:first-child) {
                        align-self: center;
                        color: @grey200;
                    }
                }
            }
        }
    }

    .verse-heading {
        font-size: x-large;
        font-weight: bold;
    }

    .verse-wrapper {
        display: inline;
    }
</style>
