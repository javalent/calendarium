# Changelog

## [1.0.3](https://github.com/javalent/calendarium/compare/1.0.2...1.0.3) (2024-02-22)


### Bug Fixes

* Fixes issue where events & categories couldn't be added in the creator ([2f81b43](https://github.com/javalent/calendarium/commit/2f81b433b991941314d73aee51d6306ea9473efc))

## [1.0.2](https://github.com/javalent/calendarium/compare/1.0.1...1.0.2) (2024-02-22)


### Bug Fixes

* "Today" color no longer leaks to event flags ([db069d4](https://github.com/javalent/calendarium/commit/db069d4dcb37e3653930e1469e1c550784ac275d))
* Allow long event names to wrap ([69e2c5b](https://github.com/javalent/calendarium/commit/69e2c5b470c309dd634d3fbbe644e905fd2d4296))
* several appearance improvements for full-view calendar ([3efb014](https://github.com/javalent/calendarium/commit/3efb014f1e218bf50f29a47e3e20bf36ef19e9e8))

## [1.0.1](https://github.com/javalent/calendarium/compare/1.0.0...1.0.1) (2024-02-21)


### Bug Fixes

* Cleanup to prepare for community release ([bbe8d78](https://github.com/javalent/calendarium/commit/bbe8d7886bebe1a0abf61748d734438a283ec206))
* poke ([da731c6](https://github.com/javalent/calendarium/commit/da731c642716a856bfcd345c53326836a6f25b2f))

## [1.0.0](https://github.com/javalent/the-calendarium/compare/1.0.0-b32...1.0.0) (2024-02-21)


### Features

* Enable range events in event cache ([c75fbfc](https://github.com/javalent/the-calendarium/commit/c75fbfce71d0bc9784dfd1ecefa49e54f38925c3))
* New Calendar Creator experience on Desktop / Tablets ([5f04a0a](https://github.com/javalent/the-calendarium/commit/5f04a0a801af44de77cfab490164f39342f990d2))
* New Quick Creator functionality for users that only use presets ([79ea92c](https://github.com/javalent/the-calendarium/commit/79ea92c9f844b7fa1eea2b5031552240f3809325))


### Bug Fixes

* Added icons to Calendar Creator sections ([eba9cc6](https://github.com/javalent/the-calendarium/commit/eba9cc6d560109d7f5ee62af3066819dd9418e93))
* Aligns Show on Calendar icon with Obsidian standard ([1aef033](https://github.com/javalent/the-calendarium/commit/1aef033b8c645297d013ee691a8b8a975c30035b))
* Better Leap Day feedback when no months are defined ([5e5546e](https://github.com/javalent/the-calendarium/commit/5e5546ef176f1c0254ce2c366ad02341bc3a072a))
* Can now edit/delete events in the day view context menu ([c61c827](https://github.com/javalent/the-calendarium/commit/c61c8276cce3d4cb2719eca1e0f7b1c9c8acd5f2))
* Fixes inspecting tags for span events ([d5a600f](https://github.com/javalent/the-calendarium/commit/d5a600f49457659db0025b3be6f7058aa23df966))
* Fixes instance where an overflow week would not be shown if the last day of the month fell on the last weekday ([7ec9c08](https://github.com/javalent/the-calendarium/commit/7ec9c089df6906c8c1dc8e1042d7649c66eb9f69))
* Fixes misalignment of event dots on calendar ([ae46b51](https://github.com/javalent/the-calendarium/commit/ae46b51d0bfed3cf09d7403977a1a063caf074e8))
* Fixes moon hover ([bbfdf08](https://github.com/javalent/the-calendarium/commit/bbfdf083a377821a62f856658ed806aedef1dfd5))
* Improved visual styling of Add New component ([0d16316](https://github.com/javalent/the-calendarium/commit/0d16316ee67b12c962d87fc76c6cdef7ca1d4bc2))
* Improves Day View styling ([d760dab](https://github.com/javalent/the-calendarium/commit/d760dab5f4e3a4c19935660ed56c10aa86e4fffc))
* Re-added ability to add events to a day from the day view screen ([0d107e9](https://github.com/javalent/the-calendarium/commit/0d107e9cd1ba116c4f4acfb32867f45272e90995))


### Miscellaneous Chores

* release 1.0.0 ([2420e06](https://github.com/javalent/the-calendarium/commit/2420e06eb90ac761c7d6e533d9c21d8021dcc68e))

## [1.0.0-b32](https://github.com/javalent/the-calendarium/compare/1.0.0-b30...1.0.0-b32) (2024-02-10)


### Features

* **api:** Parse date ([#86](https://github.com/javalent/the-calendarium/issues/86)) ([778c51f](https://github.com/javalent/the-calendarium/commit/778c51fdb7fe5b2077a334317574272d3c28405d))


### Bug Fixes

* Filter out old note-based events when migrationg FC data ([8b8caac](https://github.com/javalent/the-calendarium/commit/8b8caac651b0f2c841b4739e0c0bb1e10333a9e1))
* Fixes month offset from calendars imported from FC ([9ee67cd](https://github.com/javalent/the-calendarium/commit/9ee67cd05c1c2c949a9d6bec3c34e0e890c7c0af))
* Improve leapday offset coalescence ([262bf7f](https://github.com/javalent/the-calendarium/commit/262bf7fa1249053b9f59c222dcc5c11d35993528))
* Look at calendar-specific inline events tag as well as global ([2edfb9c](https://github.com/javalent/the-calendarium/commit/2edfb9c3d4ce043c86893cfc853da4f5f594699b))
* Save when setting current date (close [#84](https://github.com/javalent/the-calendarium/issues/84)) ([20458ea](https://github.com/javalent/the-calendarium/commit/20458ea9a85e72b56f8a5b31e85e88a7014c5bb5))


### Miscellaneous Chores

* release 1.0.0-b31 ([e4977da](https://github.com/javalent/the-calendarium/commit/e4977dad12144197a6457919f4a2fda23a6928b4))
* release 1.0.0-b32 ([ad02593](https://github.com/javalent/the-calendarium/commit/ad025935e4836f9caa9cdee2ab78679e1ce2e497))

## [1.0.0-b30](https://github.com/javalent/the-calendarium/compare/1.0.0-b29...1.0.0-b30) (2023-10-03)


### Features

* Can now specify calendar for `&lt;span&gt;` events using `data-calendar` ([32e1bfd](https://github.com/javalent/the-calendarium/commit/32e1bfd7439f1df79509f7e87976156132a4ece8))
* New event parsing path experience ([e5f429e](https://github.com/javalent/the-calendarium/commit/e5f429e4b705b85d86d7edd1c8441a646778d04c))


### Bug Fixes

* Some new API hooks ([44209e5](https://github.com/javalent/the-calendarium/commit/44209e58be50f8bd05bdda0a3ece67fae3fa5ae8))


### Miscellaneous Chores

* release 1.0.0-b30 ([0243f67](https://github.com/javalent/the-calendarium/commit/0243f67e0277e2a7f24c6e87a98918146bf48ddc))

## [1.0.0-b29](https://github.com/javalent/the-calendarium/compare/1.0.0-b28...1.0.0-b29) (2023-09-26)


### Bug Fixes

* moved Show Intercalary Dates setting to individual calendars ([6a8b35e](https://github.com/javalent/the-calendarium/commit/6a8b35e78a9ff5e7305990ec8a3b62d6f28adcd6))
* significantly improve the markdown data file transition ([7f9b7b1](https://github.com/javalent/the-calendarium/commit/7f9b7b1e32dc276f401a6e70cd97a1a66e8cdc63))
* significantly improve the sync watching experience ([27718b3](https://github.com/javalent/the-calendarium/commit/27718b35c2c24c4067ec6efbbe0ca9fb2d5c9529))


### Miscellaneous Chores

* release 1.0.0-b29 ([a13d70d](https://github.com/javalent/the-calendarium/commit/a13d70d96181c7066ef2e8d7cd313762cddbc3a0))

## [1.0.0-b28](https://github.com/javalent/the-calendarium/compare/1.0.0-b27...1.0.0-b28) (2023-09-25)


### Bug Fixes

* Can now Cmd (Mac) / Control (PC) click the Calendarium ribbon icon to open in the main Obsidian window ([a8ae97b](https://github.com/javalent/the-calendarium/commit/a8ae97babc0f4b388f824acee5e245c005d12ff5))
* custom token for releasing ([50ec6a1](https://github.com/javalent/the-calendarium/commit/50ec6a1b64b1c2ee14f6f11b4daebb05e5b5c4e6))
* update release to include testing ([db26175](https://github.com/javalent/the-calendarium/commit/db261754d8a3404f0ad2f7177a9631046a1dcec7))


### Miscellaneous Chores

* release 1.0.0-b28 ([52c4c1b](https://github.com/javalent/the-calendarium/commit/52c4c1b7a7ae0473e530f688a8e4f40db78c7344))

## [1.0.0-b27](https://github.com/javalent/the-calendarium/compare/1.0.0-b26...1.0.0-b27) (2023-09-20)


### Bug Fixes

* adds ability to import old data file if it doesn't migrate correctly for some reason ([b043802](https://github.com/javalent/the-calendarium/commit/b04380244cab332f1fc436090faad9cd1c222922))


### Miscellaneous Chores

* release 1.0.0-b27 ([4faed5a](https://github.com/javalent/the-calendarium/commit/4faed5a0d3c1692a374a08dfc5981ff0e136f0bd))

## [1.0.0-b26](https://github.com/javalent/the-calendarium/compare/1.0.1-b25...1.0.0-b26) (2023-09-20)


### Features

* Can now specify weekday abbreviations (close [#45](https://github.com/javalent/the-calendarium/issues/45)) ([96cd824](https://github.com/javalent/the-calendarium/commit/96cd82431a7b42d6914fcc2f7958076ac9f0fbfa))
* Enables restoration of deleted calendars for up to 7 days ([96cd824](https://github.com/javalent/the-calendarium/commit/96cd82431a7b42d6914fcc2f7958076ac9f0fbfa))
* Enables undo/redo history in the Creator ([96cd824](https://github.com/javalent/the-calendarium/commit/96cd82431a7b42d6914fcc2f7958076ac9f0fbfa))
* When using a sync service, the plugin will monitor the data file and prompt for reloading data ([96cd824](https://github.com/javalent/the-calendarium/commit/96cd82431a7b42d6914fcc2f7958076ac9f0fbfa))


### Bug Fixes

* Fixes drag-and-drop causing the Creator to jump (close [#49](https://github.com/javalent/the-calendarium/issues/49)) ([96cd824](https://github.com/javalent/the-calendarium/commit/96cd82431a7b42d6914fcc2f7958076ac9f0fbfa))


### Miscellaneous Chores

* release 1.0.0-b26 ([b311e22](https://github.com/javalent/the-calendarium/commit/b311e22bcdc8c3c7bf494515e11921ee6b558122))

## [1.0.1-b25](https://github.com/javalent/the-calendarium/compare/1.0.0-b25...1.0.1-b25) (2023-09-12)


### Bug Fixes

* poke ([fabf477](https://github.com/javalent/the-calendarium/commit/fabf47795390c48f62f87ad2e7c240f1efa937ad))

## [1.0.0-b25](https://github.com/javalent/the-calendarium/compare/1.0.0-b24...1.0.0-b25) (2023-09-12)


### Features

* Can now specify Weekday Abbreviations ([#45](https://github.com/javalent/the-calendarium/issues/45)) ([ac5928f](https://github.com/javalent/the-calendarium/commit/ac5928f1ba9aa9d3412af53f03515f9a4b12fe14))


### Bug Fixes

* Better date formatting behavior ([9d8bea1](https://github.com/javalent/the-calendarium/commit/9d8bea1e07f6f8daf089ebedbaf564233a097db5))
* fix typings of Day and LeapDay to avoid unnecessary number field ([1792393](https://github.com/javalent/the-calendarium/commit/1792393d629bd9ff0dc7e9c4e703f626f2276236))


### Miscellaneous Chores

* release 1.0.0-b25 ([a118912](https://github.com/javalent/the-calendarium/commit/a1189121e9e5ba590ac96cf4bb862bd9708d5c7e))

## [1.0.0-b24](https://github.com/javalent/the-calendarium/compare/1.0.0-b23...1.0.0-b24) (2023-09-07)


### Features

* `translate` now takes a CalendarAPI instead of string ([2d66c4f](https://github.com/javalent/the-calendarium/commit/2d66c4f6b37bb0d78b2d70bcb33b29b437004549))
* Add style settings for displaying span data ([67be760](https://github.com/javalent/the-calendarium/commit/67be760d637c25e0d18bedb9954c649669bc17fa))
* Adds `translate` method to plugin API ([e9fbfa5](https://github.com/javalent/the-calendarium/commit/e9fbfa5445edec66d234326ef15f09c9a93fd440))
* Adds compare function to API ([cfb2cd9](https://github.com/javalent/the-calendarium/commit/cfb2cd9787df5a64ac8bd8626d3a29d78199cd69))


### Miscellaneous Chores

* release 1.0.0-b24 ([ed2a63f](https://github.com/javalent/the-calendarium/commit/ed2a63fb2fc0cce4f067f1fa341c283ade07d148))

## [1.0.0-b23](https://github.com/javalent/the-calendarium/compare/1.0.0-b22...1.0.0-b23) (2023-09-01)


### Bug Fixes

* fix double calendar saving ([d413cfe](https://github.com/javalent/the-calendarium/commit/d413cfe3b90678ac35a3e23f9d7a587c8075e60a))
* Fixes some issues with the importer not following new schemas ([d0f0d67](https://github.com/javalent/the-calendarium/commit/d0f0d67eaf4ed2b5b1642db87d007c7d04babeb3))
* remove Create Note option for events (this might return) ([02439b4](https://github.com/javalent/the-calendarium/commit/02439b413ca55a206df1a0d87e5a3a284da7f28b))


### Miscellaneous Chores

* release 1.0.0-b23 ([15bf107](https://github.com/javalent/the-calendarium/commit/15bf107e558025b76eaee7c8c9fb9ce9cea115a8))

## [1.0.0-b22](https://github.com/javalent/the-calendarium/compare/1.0.0-b21...1.0.0-b22) (2023-08-30)


### Features

* can now specify multiple calendar event paths ([4d2ee83](https://github.com/javalent/the-calendarium/commit/4d2ee83a88ead7658a043d32de834751bcf31205))


### Bug Fixes

* fixes issue where events can be added to calendars despite not being in the path when modifying notes ([81bfbd4](https://github.com/javalent/the-calendarium/commit/81bfbd44c2e5f81f327bf4404a86e14d5bdf8a5c))


### Miscellaneous Chores

* release 1.0.0-b22 ([1fddfc9](https://github.com/javalent/the-calendarium/commit/1fddfc9516cbbe76adf4c336340f1941f7a78670))

## [1.0.0-b21](https://github.com/javalent/the-calendarium/compare/1.0.0-b20...1.0.0-b21) (2023-08-30)


### Features

* Calendars will now auto-generate categories if they don't exist for events defined in notes ([e78a9ce](https://github.com/javalent/the-calendarium/commit/e78a9ce41c6310ab6b365f2255e7812ff45d7cad))


### Bug Fixes

* fixes issue where category would persist incorrectly in span events ([02d0107](https://github.com/javalent/the-calendarium/commit/02d010771847be1e1f2bdf4f48111427f769973a))
* fixes issue where some events would not color correctly ([#44](https://github.com/javalent/the-calendarium/issues/44)) ([ccc191d](https://github.com/javalent/the-calendarium/commit/ccc191d309ca09d4de56cc239fb09dbf5dfccb76))
* key flags by events so they refresh when empty ([#44](https://github.com/javalent/the-calendarium/issues/44)) ([b79b233](https://github.com/javalent/the-calendarium/commit/b79b233f52330f46fb95e7e2883273b07bfcd2f9))
* pass component to render markdown ([#44](https://github.com/javalent/the-calendarium/issues/44)) ([ecde883](https://github.com/javalent/the-calendarium/commit/ecde883b8c0b40e4a66d2015d31617874b399edf))


### Miscellaneous Chores

* release 1.0.0-b21 ([ad3fc64](https://github.com/javalent/the-calendarium/commit/ad3fc648c330cb2b8e5613ce203fd964ec8aae62))

## [1.0.0-b20](https://github.com/javalent/the-calendarium/compare/1.0.0-b19...1.0.0-b20) (2023-08-29)


### Bug Fixes

* fixes tests ([4b6c95b](https://github.com/javalent/the-calendarium/commit/4b6c95ba9cebf9a92455095c1b33c9fe177c110e))


### Miscellaneous Chores

* release 1.0.0-b20 ([258c657](https://github.com/javalent/the-calendarium/commit/258c657b73a8c55abc4d6a168b3b9dc034303d71))

## [1.0.0-b19](https://github.com/javalent/the-calendarium/compare/1.0.0-b18...1.0.0-b19) (2023-08-29)


### Bug Fixes

* Event management has been rewritten, events from notes now appear on calendar correctly ([1c16209](https://github.com/javalent/the-calendarium/commit/1c16209c30b343c6d870642e989fdd345196adac))


### Miscellaneous Chores

* release 1.0.0-b19 ([fdad374](https://github.com/javalent/the-calendarium/commit/fdad374da3f443ff6d2489cecd7b73c86f493b63))

## [1.0.0-b18](https://github.com/javalent/the-calendarium/compare/1.0.0-b17...1.0.0-b18) (2023-08-26)


### Bug Fixes

* Added getCurrentDate to API ([9d48d6b](https://github.com/javalent/the-calendarium/commit/9d48d6b83e834c17d9c442198bf3b1c9cfc9818b))


### Miscellaneous Chores

* release 1.0.0-b18 ([a82ce43](https://github.com/javalent/the-calendarium/commit/a82ce4372356de5b3243dad58b4dd8c739c46119))

## [1.0.0-b17](https://github.com/javalent/the-calendarium/compare/1.0.0-b16...1.0.0-b17) (2023-08-25)


### Bug Fixes

* use name to get calendar API vs id ([9f2a3e3](https://github.com/javalent/the-calendarium/commit/9f2a3e3c56aa698711b4f9afdcdecfbbbaf85a7f))


### Miscellaneous Chores

* release 1.0.0-b17 ([b7226ab](https://github.com/javalent/the-calendarium/commit/b7226ab0abc69bf70efb1278c64b1f5dde544a48))

## [1.0.0-b16](https://github.com/javalent/the-calendarium/compare/1.0.0-b15...1.0.0-b16) (2023-08-25)


### Features

* Initial API definition started (just events for now) ([4a7f85b](https://github.com/javalent/the-calendarium/commit/4a7f85b22720ba1fe49195c340258a992f3e0c77))


### Miscellaneous Chores

* release 1.0.0-b16 ([a9b3e77](https://github.com/javalent/the-calendarium/commit/a9b3e77da006db9a498a6be9f21623ee2a862a35))

## [1.0.0-b15](https://github.com/javalent/the-calendarium/compare/1.0.0-b14...1.0.0-b15) (2023-08-25)


### Bug Fixes

* exit sorting events if no sort object on events ([6a9b690](https://github.com/javalent/the-calendarium/commit/6a9b690eb6c2678b0e148c462933206cae456d17))
* Fix conflict with Default New Tab plugin ([137de2a](https://github.com/javalent/the-calendarium/commit/137de2a49af6a61d2847d38b9903b3a8bfd804f7))


### Miscellaneous Chores

* release 1.0.0-b15 ([b260f78](https://github.com/javalent/the-calendarium/commit/b260f78fa15e8d6d5d546536555350011e9121a1))

## [1.0.0-b14](https://github.com/javalent/the-calendarium/compare/1.0.0-b13...1.0.0-b14) (2023-06-24)


### Bug Fixes

* remove day view, tests pass ([ddc9f9d](https://github.com/javalent/the-calendarium/commit/ddc9f9dd699dd279329aa04686140d1a54ba7351))


### Miscellaneous Chores

* release 1.0.0-b14 ([05f6831](https://github.com/javalent/the-calendarium/commit/05f683191abb19acc7389ee4d5a1991e8ab907ae))

## [1.0.0-b13](https://github.com/javalent/the-calendarium/compare/1.0.0-b12...1.0.0-b13) (2023-06-24)


### Bug Fixes

* Improves Calendar Creator appearance & behavior ([af90c16](https://github.com/javalent/the-calendarium/commit/af90c167e40c6ffe7699de9e03dc650f657d6971))


### Miscellaneous Chores

* release 1.0.0-b13 ([22d12bf](https://github.com/javalent/the-calendarium/commit/22d12bf020d9ace47a9468191875bd1c14b98e31))

## [1.0.0-b12](https://github.com/javalent/the-calendarium/compare/1.0.0-b11...1.0.0-b12) (2023-06-20)


### Bug Fixes

* null guard event sorting ([3fc8276](https://github.com/javalent/the-calendarium/commit/3fc8276bc49d4f78304abb38cfa5850ddb56e18c))


### Miscellaneous Chores

* release 1.0.0-b12 ([653181e](https://github.com/javalent/the-calendarium/commit/653181e7fe2ebde4d9f5449c73774dd6b4881070))

## [1.0.0-b11](https://github.com/javalent/the-calendarium/compare/1.0.1-b10...1.0.0-b11) (2023-06-18)


### Features

* very basic in-note code block `calendarium` ([957a358](https://github.com/javalent/the-calendarium/commit/957a358dc851ee3a4a8ccf468f5dd549ee0f2155))


### Bug Fixes

* sticky nav panel (close [#38](https://github.com/javalent/the-calendarium/issues/38)) ([5ef60df](https://github.com/javalent/the-calendarium/commit/5ef60df3d54b4ec91d795119a3ef7cf341bdc082))


### Miscellaneous Chores

* release 1.0.0-b11 ([53ce634](https://github.com/javalent/the-calendarium/commit/53ce634abb5cc792da9faa212161996521d01908))

## [1.0.1-b10](https://github.com/javalent/the-calendarium/compare/1.0.0-b10...1.0.1-b10) (2023-06-17)


### Bug Fixes

* fixes week navigation ([fe20d7a](https://github.com/javalent/the-calendarium/commit/fe20d7a92a97ce05eb5977ae76bf343e7b40f830))
* re-enable week numbers ([e050603](https://github.com/javalent/the-calendarium/commit/e050603071295e25687f81241a26b3e1e696560f))

## [1.0.0-b10](https://github.com/javalent/the-calendarium/compare/1.0.0-b9...1.0.0-b10) (2023-06-02)


### Bug Fixes

* fixes presets ([5e66035](https://github.com/javalent/the-calendarium/commit/5e66035ccd5af26e51d6e10d9abb7e62640165ac))


### Miscellaneous Chores

* release 1.0.0-b10 ([c4551c4](https://github.com/javalent/the-calendarium/commit/c4551c455dde4cc35d5a4d79db0f169f491a19f0))

## [1.0.0-b9](https://github.com/javalent/the-calendarium/compare/1.0.0-b8...1.0.0-b9) (2023-06-02)


### Bug Fixes

* load Fantasy Calendar markdown file if user is on beta ([eb94669](https://github.com/javalent/the-calendarium/commit/eb946691f1009f8149c693232182a5ccd0b75ea7))
* shows intercalary days correctly ([b2fe5c7](https://github.com/javalent/the-calendarium/commit/b2fe5c700664c0f815a82893a7c5c60f3f22629c))


### Miscellaneous Chores

* release 1.0.0-b9 ([c07ee4c](https://github.com/javalent/the-calendarium/commit/c07ee4c7e83f558f9deffefce338808202f8f68b))

## [1.0.0-b8](https://github.com/javalent/the-calendarium/compare/1.0.0-b7...1.0.0-b8) (2023-06-01)


### Features

* Settings migration from Fantasy Calendar plugin ([017d727](https://github.com/javalent/the-calendarium/commit/017d7270928fb53f83eb91a16fb8dadc8460f471))


### Miscellaneous Chores

* release 1.0.0-b8 ([6161c31](https://github.com/javalent/the-calendarium/commit/6161c311fb38d61db05864b4e97efca8ff4aef0a))

## [1.0.0-b7](https://github.com/javalent/the-calendarium/compare/1.0.0-b6...1.0.0-b7) (2023-06-01)


### Bug Fixes

* Code cleanup, switch to Week component ([83705a0](https://github.com/javalent/the-calendarium/commit/83705a06edbdbb0b6c2d00ff327e1a272be2b1ad))


### Miscellaneous Chores

* release 1.0.0-b7 ([5642e1c](https://github.com/javalent/the-calendarium/commit/5642e1c2f1c8f8d7b702911bdce239ae9cc29877))

## [1.0.0-b6](https://github.com/javalent/the-calendarium/compare/v1.0.0-b5...1.0.0-b6) (2023-05-31)


### Bug Fixes

* dot overflow ([f8695ca](https://github.com/javalent/the-calendarium/commit/f8695ca3a340b4d088ef1e5b945444b43b34a5d8))
* Fix component import path ([a35b947](https://github.com/javalent/the-calendarium/commit/a35b947d5a28bcffcd8d5bcc3fdd9e9d5538b58e))
* fixes dot overflow ([e93cedf](https://github.com/javalent/the-calendarium/commit/e93cedf1b22038f5b1f4c93670871208a0779ac8))
* fixes event file path in modal creator ([6f63478](https://github.com/javalent/the-calendarium/commit/6f63478a6f794332d8817b158f1876a656f9c7b6))
* flag opens notes correctly if there is no file extension ([f8695ca](https://github.com/javalent/the-calendarium/commit/f8695ca3a340b4d088ef1e5b945444b43b34a5d8))
* flags overflow properly ([82052da](https://github.com/javalent/the-calendarium/commit/82052daa39a8cf4b24279d9b71fedbe564a8e8de))
* switch to grid layout for better consistency ([e95baba](https://github.com/javalent/the-calendarium/commit/e95baba1a42b469cdbe8000e3f8887ada9bdcdf7))
* timelineEvent -&gt; inlineEvent; parse .md files ([#25](https://github.com/javalent/the-calendarium/issues/25)) ([8629425](https://github.com/javalent/the-calendarium/commit/86294254d9a0aa236b142c99069cef9bdb2cf8a5))


### Miscellaneous Chores

* release 1.0.0-b5 ([86e2b2b](https://github.com/javalent/the-calendarium/commit/86e2b2b696fbfac4420b1b22544fd0ae9d945f89))
* release 1.0.0-b6 ([4442b27](https://github.com/javalent/the-calendarium/commit/4442b275e1c38c85ff0b9f7fa49e71b3be42cc97))

## [1.0.0-b5](https://github.com/javalent/the-calendarium/compare/1.0.0-b4...1.0.0-b5) (2023-05-31)


### Bug Fixes

* dot overflow ([f8695ca](https://github.com/javalent/the-calendarium/commit/f8695ca3a340b4d088ef1e5b945444b43b34a5d8))
* fixes dot overflow ([e93cedf](https://github.com/javalent/the-calendarium/commit/e93cedf1b22038f5b1f4c93670871208a0779ac8))
* fixes event file path in modal creator ([6f63478](https://github.com/javalent/the-calendarium/commit/6f63478a6f794332d8817b158f1876a656f9c7b6))
* flag opens notes correctly if there is no file extension ([f8695ca](https://github.com/javalent/the-calendarium/commit/f8695ca3a340b4d088ef1e5b945444b43b34a5d8))
* flags overflow properly ([82052da](https://github.com/javalent/the-calendarium/commit/82052daa39a8cf4b24279d9b71fedbe564a8e8de))
* switch to grid layout for better consistency ([e95baba](https://github.com/javalent/the-calendarium/commit/e95baba1a42b469cdbe8000e3f8887ada9bdcdf7))
* timelineEvent -&gt; inlineEvent; parse .md files ([#25](https://github.com/javalent/the-calendarium/issues/25)) ([8629425](https://github.com/javalent/the-calendarium/commit/86294254d9a0aa236b142c99069cef9bdb2cf8a5))


### Miscellaneous Chores

* release 1.0.0-b5 ([86e2b2b](https://github.com/javalent/the-calendarium/commit/86e2b2b696fbfac4420b1b22544fd0ae9d945f89))

## [1.0.0-b4](https://github.com/javalent/the-calendarium/compare/1.0.0-b3...1.0.0-b4) (2023-05-26)


### Bug Fixes

* allow scrolling again, oops ([e92c624](https://github.com/javalent/the-calendarium/commit/e92c624af2eea2e0c353b557f1f625afd206cc6a))
* better ephemeral state persistance ([0839738](https://github.com/javalent/the-calendarium/commit/08397385cd1d9f062d97010170d2d6cac9fce6d1))
* fixes issue with html IDs for some month names ([fff519f](https://github.com/javalent/the-calendarium/commit/fff519fcf75c55de0c3c413e16a1623f44e13a98))
* make ephemeral stores separate again ([af2c4d2](https://github.com/javalent/the-calendarium/commit/af2c4d284d71ac59ed4e58a0337c5b4340793468))
* view state persists properly ([d981542](https://github.com/javalent/the-calendarium/commit/d981542ad684efea5f8745fedb9139ab3daaaa8e))


### Miscellaneous Chores

* release 1.0.0-b4 ([0d6fa40](https://github.com/javalent/the-calendarium/commit/0d6fa407e95764a7fdea823a481d335e03400f65))

## [1.0.0-b3](https://github.com/javalent/the-calendarium/compare/1.0.0-b2...1.0.0-b3) (2023-05-26)


### Features

* partial state recovery ([9d3d785](https://github.com/javalent/the-calendarium/commit/9d3d7852ed38c51c7cd9d7f90edfbacedf2cd63c))
* Persistent view state ([567255c](https://github.com/javalent/the-calendarium/commit/567255c42dee5206718fced84e00d7367becb13d))


### Bug Fixes

* preset months; window moment for tests; span data attributes ([#23](https://github.com/javalent/the-calendarium/issues/23)) ([6aaea42](https://github.com/javalent/the-calendarium/commit/6aaea426867e9766dfd26ee0c2586d018b8644ee))


### Miscellaneous Chores

* release 1.0.0-b3 ([2d41827](https://github.com/javalent/the-calendarium/commit/2d41827204b74625f2d821afda699e4a99a846b4))
* release 1.0.0-b3 ([e0e3169](https://github.com/javalent/the-calendarium/commit/e0e31695c377c182314738404931206ef019da5b))

## [1.0.0-b2](https://github.com/javalent/the-calendarium/compare/1.0.0-b1...1.0.0-b2) (2023-05-24)


### Features

* adds full year view ([9792d6e](https://github.com/javalent/the-calendarium/commit/9792d6eecc705752603079e5cdd1aeb69fc955bf))
* **Publish:** Added Images of Right Sidebar ([8571516](https://github.com/javalent/the-calendarium/commit/857151639a2b797ca502b2be0679fcf74550278a))


### Bug Fixes

* Large Month view works... still need flags ([52719bf](https://github.com/javalent/the-calendarium/commit/52719bf2442a6e16d5cfe125bdf8dcfb822cc5df))
* settings can be closed, improves settings styling ([2f1f345](https://github.com/javalent/the-calendarium/commit/2f1f345b94c979f9ee6dc5ecd144a5d455aac3f6))


### Miscellaneous Chores

* release 1.0.0-b2 ([fbfc1f0](https://github.com/javalent/the-calendarium/commit/fbfc1f07d2a1a6aa139a5ea0f6f2d7f0a0d70c4f))

## [1.0.0-b1](https://github.com/javalent/the-calendarium/compare/1.0.0...1.0.0-b1) (2023-05-17)


### Bug Fixes

* adds manifest, oops ([7843349](https://github.com/javalent/the-calendarium/commit/7843349803e9ed3c7f672c838d05480b1c1058bd))

## [1.0.0](https://github.com/javalent/the-calendarium/compare/v1.0.0...1.0.0) (2023-05-17)


### Features

* The Calendarium ([a7ed326](https://github.com/javalent/the-calendarium/commit/a7ed3269197409ea3e6a8afab29e5987f7535126))


### Bug Fixes

* Reset ephemeral store when changing calendars ([34c2723](https://github.com/javalent/the-calendarium/commit/34c272391dc91ed7262f21551213c3c7c7b0fd1f))
