/**
 * @vitest-environment happy-dom
 */
import { vi, test, expect } from "vitest";
import { isOlder } from "../../src/settings/settings.utils";

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
    expect(isOlder(older, current)).toBeFalsy();
});
test("Older Minor Version", () => {
    older.major = current.major;
    expect(isOlder(older, current)).toBeFalsy();
});
test("Older Patch Version", () => {
    older.minor = current.minor;
    expect(isOlder(older, current)).toBeFalsy();
});
test("Older Beta Version", () => {
    older.patch = current.patch;
    expect(isOlder(older, current)).toBeFalsy();
});
test("Same Version", () => {
    older.beta = current.beta;
    expect(isOlder(older, current)).toBeFalsy();
});
test("Older Version", () => {
    const older = {
        major: 3,
        minor: 15,
        patch: 22,
        beta: 3,
    };
    const current = {
        major: 2,
        minor: 14,
        patch: 21,
        beta: 2,
    };
    expect(isOlder(older, current)).toBeTruthy();
});
