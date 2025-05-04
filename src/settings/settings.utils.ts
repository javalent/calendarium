import type { Version } from "src/schemas";
import { derived, type Readable, type Writable } from "svelte/store";

export function isOlder(older: Version, current: Version) {
    const olderTransformed = {
        major: older.major ?? Number.MIN_VALUE,
        minor: older.minor ?? Number.MIN_VALUE,
        patch: older.patch ?? Number.MIN_VALUE,
        beta: older.beta ?? Number.MIN_VALUE,
    };
    const currentTransformed = {
        major: current.major ?? Number.MIN_VALUE,
        minor: current.minor ?? Number.MIN_VALUE,
        patch: current.patch ?? Number.MIN_VALUE,
        beta: current.beta ?? Number.MAX_VALUE,
    };

    if (currentTransformed.major >= olderTransformed.major) return false;
    if (currentTransformed.minor >= olderTransformed.minor) return false;
    if (currentTransformed.patch >= olderTransformed.patch) return false;
    if (currentTransformed.beta >= olderTransformed.beta) return false;
    return true;
}

export enum MarkdownReason {
    NONE,
    NO_DATA = "No saved plugin data.",
    NOT_OBJECT = "Plugin data is not an object.",
    EMPTY = "Plugin data is an empty object.",
    TRANSITIONED = "Previous plugin data was transitioned correctly.",
    NO_VERSION = "No version information exists in plugin data.",
    NO_PATCH = "No patch version infromation exists in plugin data.",
    OLD_VERSION = "Plugin data is from a version prior to beta 26.",
}

export function shouldTransitionMarkdownSettings(pluginData: any) {
    /** No saved plugin data in data.json */
    if (pluginData == null) {
        return MarkdownReason.NO_DATA;
    }
    /** data.json is not an object??? */
    if (typeof pluginData !== "object") {
        return MarkdownReason.NOT_OBJECT;
    }
    /** data.json is an empty object. */
    if (Object.keys(pluginData)?.length == 0) {
        return MarkdownReason.EMPTY;
    }
    /** data.json was transitioned to markdown data */
    if ("transitioned" in pluginData) {
        return MarkdownReason.TRANSITIONED;
    }
    /** finally, check the version in data.json */
    if (!("version" in pluginData) || typeof pluginData.version !== "object") {
        return MarkdownReason.NO_VERSION;
    }

    const version = pluginData.version;
    /** In a post-beta 28 release. */
    if ("beta" in version) {
        return MarkdownReason.NONE;
    }
    /** No patch version to check */
    if (!("patch" in version) || version.patch == null) {
        return MarkdownReason.NO_PATCH;
    }
    if (typeof version.patch === "string") {
        let [, , beta] = version.patch.match(/(\d+)(?:\-b(\d+))?/) ?? [
            version.patch,
        ];
        if (isNaN(Number(beta)) || Number(beta) < 26) {
            return MarkdownReason.OLD_VERSION;
        }
    }

    return MarkdownReason.NONE;
}

export function transformed<T>(
    store: Writable<T>,
    transforms: { in: (value: T) => any; out: (value: any) => T }
) {
    const identity = (x: T) => x;
    const transformIn = transforms.in ?? identity;
    const transformOut = transforms.out ?? identity;

    const { subscribe } = derived(store, ($store) => transformIn($store));
    const set = (value: T) => store.set(transformOut(value));

    return { subscribe, set };
}
