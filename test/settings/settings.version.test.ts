/**
 * @vitest-environment happy-dom
 */
import { vi, test, expect } from "vitest";
import { isOlderVersion } from "../../src/settings/settings.utils";

const current = {
    major: 3,
    minor: 15,
    patch: 22,
    beta: 3,
};
const older = {
    major: 2,
    minor: 14,
    patch: 21,
    beta: 2,
};
test("Older Version", () => {
    expect(isOlderVersion(older, current)).toBeTruthy();
});
test("Older Minor Version", () => {
    older.major = current.major;
    expect(isOlderVersion(older, current)).toBeTruthy();
});
test("Older Patch Version", () => {
    older.minor = current.minor;
    expect(isOlderVersion(older, current)).toBeTruthy();
});
test("Older Beta Version", () => {
    older.patch = current.patch;
    expect(isOlderVersion(older, current)).toBeTruthy();
});
test("Same Version", () => {
    older.beta = current.beta;
    expect(isOlderVersion(older, current)).toBeFalsy();
});
