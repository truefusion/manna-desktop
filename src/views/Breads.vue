<template lang="html">
    <article class="breads">
        <nav class="navbar has-shadow">
            <b-navbar-item class="navbar-brand">The Bread</b-navbar-item>
            <b-select class="languages" v-model="Language">
                <option value="">All</option>
                <option :value="klng" v-for="(lng, klng) in Languages">{{lng.NativeName}} ({{lng.Name}})</option>
            </b-select>
            <b-button icon-right="sync" @click="reloadCache" />
        </nav>
        <section class="modules" ref="viewport">
            <ModuleCard :key="mod.Name" :module="mod" v-for="mod in ModuleListing" @open="loadModule"></ModuleCard>
        </section>
    </article>
</template>

<script>
    import ScrollBooster from 'scrollbooster';

    import Helpers from '../store/helpers';
    const {Languages, Modules} = Helpers;

    import ModuleCard from '../components/ModuleCard.vue';

    export default {
        mixins: [
            Languages,
            Modules,
        ],
        components: {
            ModuleCard,
        },
        data() {
            return {
                Language: '',
                ScrollBooster: null,
            };
        },
        computed: {
            BiblicalBook: {
                cache: false,
                get() {
                    var {Bible} = this.$store.state;
                    var {Book} = Bible;
                    return Book;
                },
            },
            BiblicalChapter: {
                cache: false,
                get() {
                    var {Bible} = this.$store.state;
                    var {Chapter} = Bible;
                    return Chapter;
                },
            },
            ModuleBook: {
                cache: false,
                get() {
                    var {BiblicalBook} = this;
                    return BiblicalBook;
                },
            },
            ModuleChapter: {
                cache: false,
                get() {
                    var {BiblicalChapter} = this;
                    return BiblicalChapter;
                },
            },
            ModuleListing: {
                cache: false,
                get() {
                    return this.Bibles.filter((mod) => {
                        var {Language} = this;
                        if (Language) {
                            if (mod.Language == Language) {
                                return true;
                            } else {
                                return false;
                            }
                        }
                        return true;
                    });
                },
            },
        },
        mounted() {
            var el = this.$refs.viewport;
            this.ScrollBooster = new ScrollBooster({
                viewport: el,
                content: el,
                scrollMode: 'native',
                direction: 'vertical',
                // textSelection: true,
            });
        },
        destroyed() {
            this.ScrollBooster.destroy();
        },
    }
</script>

<style lang="less">
    @import "../styles/base.less";

    #app {
        .breads {
            display: flex;
            flex-direction: column;

            nav {
                border-bottom: 1px solid @blue;
                color: @blue;
            }

            .modules {
                display: flex;
                flex-wrap: wrap;
                overflow-y: auto;
                padding: 0.5rem;

                .module.card {
                    margin: 0.5rem;
                    transition: all 0.25s;

                    &:hover {
                        // transform: scale(1.015);
                    }
                }
            }
        }
    }
</style>
