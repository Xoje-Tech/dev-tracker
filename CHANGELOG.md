# Changelog

All notable changes to dev-tracker are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1](https://github.com/Xoje-Tech/dev-tracker/compare/dev-tracker-v1.6.0...dev-tracker-v1.6.1) (2026-07-20)


### Bug Fixes

* **ci:** explicit tag_name in softprops/action-gh-release for workflow_dispatch ([f1e32f7](https://github.com/Xoje-Tech/dev-tracker/commit/f1e32f727b945a49df9c1f2d2f89d0e11d00db72))
* **ci:** explicit tag_name in softprops/action-gh-release for workflow_dispatch ([96d6a5d](https://github.com/Xoje-Tech/dev-tracker/commit/96d6a5dfead60b92fcf28c1b91370ad2453be9a7))

## [1.6.0](https://github.com/Xoje-Tech/dev-tracker/compare/dev-tracker-v1.5.0...dev-tracker-v1.6.0) (2026-07-20)


### Features

* **cli:** add dt doctor comprehensive health-check command ([11be0c9](https://github.com/Xoje-Tech/dev-tracker/commit/11be0c98d59abfa65f984fbdafb39ab66200b166))
* **cli:** inject DT_CLI_VERSION into production binaries via scripts/package.sh ([15ffce2](https://github.com/Xoje-Tech/dev-tracker/commit/15ffce22c4640aa99afc81b45372014a08d5e3c7))
* **ops:** dt doctor + DT_CLI_VERSION injection + workflow_dispatch (resolves [#90](https://github.com/Xoje-Tech/dev-tracker/issues/90), [#91](https://github.com/Xoje-Tech/dev-tracker/issues/91), [#92](https://github.com/Xoje-Tech/dev-tracker/issues/92)) ([18641de](https://github.com/Xoje-Tech/dev-tracker/commit/18641de8f271f5f8b9657ef30ac347840a4f5023))

## [1.5.0](https://github.com/Xoje-Tech/dev-tracker/compare/dev-tracker-v1.4.0...dev-tracker-v1.5.0) (2026-07-19)


### Features

* **cli:** add getCliVersion() helper that reads cli/package.json at runtime ([d3fca95](https://github.com/Xoje-Tech/dev-tracker/commit/d3fca950796d5ff1e3e98b10cb2938a717981610))
* **cli:** expose dt version, dt server status, and --yes flag for dt server update ([188e8d9](https://github.com/Xoje-Tech/dev-tracker/commit/188e8d92fed75ceb12922430131cc9bbfb7b9b5a))
* **cli:** expose dt version, dt server status, and --yes flag for dt server update ([970da7f](https://github.com/Xoje-Tech/dev-tracker/commit/970da7f71a3292df67e63cddddc3a0bd38f6c91b))

## [1.4.0](https://github.com/Xoje-Tech/dev-tracker/compare/dev-tracker-v1.3.0...dev-tracker-v1.4.0) (2026-07-19)


### Features

* **cli:** add milestone + sprint sub-commands (PR cli-mcp / Phase 4) ([064b8b9](https://github.com/Xoje-Tech/dev-tracker/commit/064b8b944f024b3ac13e0cf913faadb9895cb350))
* **cli:** implement M2M hardening — isTTY auto-detect, structured JSON errors ([c61c8f3](https://github.com/Xoje-Tech/dev-tracker/commit/c61c8f359322b8642f63b3ab30be8a67e1c03d9a))
* **cli:** M2M hardening — isTTY auto-detect + structured JSON errors ([0a061e0](https://github.com/Xoje-Tech/dev-tracker/commit/0a061e014d1b145f93b1716d28dcbf7b162271de))
* **mcp:** add 11 milestone/sprint tools (7 → 18 surface, PR cli-mcp / Phase 3) ([95c93d4](https://github.com/Xoje-Tech/dev-tracker/commit/95c93d42cdaa273a2934cd21c9273d46d8a45a99))
* **mcp:** add auto-configuration script for mcp setup ([#32](https://github.com/Xoje-Tech/dev-tracker/issues/32)) ([bf5c06b](https://github.com/Xoje-Tech/dev-tracker/commit/bf5c06b5352b1c833e2b51ee796ebc4068e46e6a))
* **mcp:** add auto-configuration script for mcp setup ([#32](https://github.com/Xoje-Tech/dev-tracker/issues/32)) ([b7b351a](https://github.com/Xoje-Tech/dev-tracker/commit/b7b351ac9f12e76862ce7d289752d3efade25055))
* **mcp:** add tailored mcp setup script for Hermes and OpenCode ([#32](https://github.com/Xoje-Tech/dev-tracker/issues/32)) ([2c151e8](https://github.com/Xoje-Tech/dev-tracker/commit/2c151e8e4cd2f672eef65a00e4014b895ad536ce))
* **mcp:** add update_task and delete_task tools to MCP server ([#71](https://github.com/Xoje-Tech/dev-tracker/issues/71)) ([b69a2aa](https://github.com/Xoje-Tech/dev-tracker/commit/b69a2aae62f85976b18357fec8cdc90159d4aec2))
* **mcp:** add update_task and delete_task tools to MCP server ([#71](https://github.com/Xoje-Tech/dev-tracker/issues/71)) ([db1a936](https://github.com/Xoje-Tech/dev-tracker/commit/db1a9366f2808c7f38250c1344db1c158cf9ca5d))
* **milestones:** domain value objects (MilestoneTitle, MilestoneStatus, transitions) ([061e15b](https://github.com/Xoje-Tech/dev-tracker/commit/061e15bf2d81a100facee7accd74ca87ff52ee04))
* **milestones:** GREEN archive-milestone cluster ([6fcd207](https://github.com/Xoje-Tech/dev-tracker/commit/6fcd2075924333a39c26f192f129a4688471c6e4))
* **milestones:** GREEN create-milestone ([ed50448](https://github.com/Xoje-Tech/dev-tracker/commit/ed5044824da702adcd2168b935d8a320043067c6))
* **milestones:** GREEN delete-milestone ([4d0a1da](https://github.com/Xoje-Tech/dev-tracker/commit/4d0a1dacc4f315d5cc94916197acb76fdd420af4))
* **milestones:** GREEN list-milestones cluster ([1d982fd](https://github.com/Xoje-Tech/dev-tracker/commit/1d982fd5192f4f4143ef401cd59fca8810135cd8))
* **milestones:** GREEN update-milestone ([5f20ece](https://github.com/Xoje-Tech/dev-tracker/commit/5f20ece193fe8f226260dada20b710e9c9db7943))
* **rest:** add GET /:id routes for milestones and sprints (PR cli-mcp / Phase 1) ([2ab719b](https://github.com/Xoje-Tech/dev-tracker/commit/2ab719b508d83d78f0a0ae2945c67bec1da24d82))
* **roadmap-and-sprints-ui:** add Vue 3 + Pinia surface for milestones (PR ui-milestones) ([cefb31d](https://github.com/Xoje-Tech/dev-tracker/commit/cefb31d41287ee50c3ea335bc3844250b78931a9))
* **roadmap-and-sprints-ui:** add Vue 3 + Pinia surface for sprints (PR ui-sprints) ([774773e](https://github.com/Xoje-Tech/dev-tracker/commit/774773e9a080a9e33c3683b8bdf700ba39191bc8))
* **roadmap-and-sprints:** add child-first clearDatabase helper ([262bd5a](https://github.com/Xoje-Tech/dev-tracker/commit/262bd5ac8a3029d53eea1229eaf2a379de483f1a))
* **roadmap-and-sprints:** add CLI + MCP surfaces for milestones/sprints (PR cli-mcp) ([37c5c94](https://github.com/Xoje-Tech/dev-tracker/commit/37c5c9495de898d187e4149ff39cadd30d1e8646))
* **roadmap-and-sprints:** add foundation (Milestone/Sprint schema, FK contract, helper ordering) ([aa19521](https://github.com/Xoje-Tech/dev-tracker/commit/aa1952192768b932650fb12f49e7f45cdd69270c))
* **roadmap-and-sprints:** add milestone and sprint schema ([c862fa4](https://github.com/Xoje-Tech/dev-tracker/commit/c862fa4eba8328954db2477c313dbb4deb01fd18))
* **roadmap-and-sprints:** add Milestones module (REST + tests) ([eed1828](https://github.com/Xoje-Tech/dev-tracker/commit/eed1828b449ccadd74b1108783cb6170e4dbfcf6))
* **roadmap-and-sprints:** add Sprints module (REST + tests) ([3e7b23f](https://github.com/Xoje-Tech/dev-tracker/commit/3e7b23f842e688a4c2377b58063c564fa9963790))
* **roadmap-and-sprints:** wire milestones + sprints routers in createApp() (PR D, final) ([a9b688c](https://github.com/Xoje-Tech/dev-tracker/commit/a9b688ccec3cd0264b19d8dcad0a3da573f8c72f))
* **sprints:** add path aliases + extract SPRINTS_ROUTES to domain/routes (PR ui-sprints / Phase 1) ([306880c](https://github.com/Xoje-Tech/dev-tracker/commit/306880c1baf59844004b1d1b40bc988af7019d61))
* **sprints:** GREEN create-sprint cluster ([63bd4d0](https://github.com/Xoje-Tech/dev-tracker/commit/63bd4d08d7150ce6d930d03174754173e94f4d6f))
* **sprints:** GREEN list-sprints cluster (impl committed earlier) ([8b399e6](https://github.com/Xoje-Tech/dev-tracker/commit/8b399e6d71ec138dbaa7295b4a42a4bd6de7b286))
* **sprints:** GREEN update + delete clusters ([4bb24d7](https://github.com/Xoje-Tech/dev-tracker/commit/4bb24d7a9b73703427ca59e0411659cf87f50090))
* **sprints:** wire update + delete controller methods and routes ([d81f464](https://github.com/Xoje-Tech/dev-tracker/commit/d81f4642d6d34d009574faa235a69a307b3e9420))
* **ui:** add MilestonesList organism + MilestonesView page (PR ui-milestones / Phase 4) ([178bb22](https://github.com/Xoje-Tech/dev-tracker/commit/178bb22a3ffbf6d8de277f062158f23308cc67ab))
* **ui:** add MilestoneStatusBadge, MilestoneCard, MilestoneForm (PR ui-milestones / Phase 3) ([75e4003](https://github.com/Xoje-Tech/dev-tracker/commit/75e4003c3f2aecf358ac2e2ee187b154bd8f1683))
* **ui:** add path aliases + shared BoardTabs molecule + PageHeader slot (PR ui-milestones / Phase 1) ([286a8ae](https://github.com/Xoje-Tech/dev-tracker/commit/286a8aef96fde02d090353b2d4feb5f079f3aaf8))
* **ui:** add SprintCard + SprintForm molecules (PR ui-sprints / Phase 3) ([e434d9f](https://github.com/Xoje-Tech/dev-tracker/commit/e434d9f38e165d51731a9a47ba32656745a651f4))
* **ui:** add SprintsList organism + SprintsView page (PR ui-sprints / Phase 4) ([bd279e2](https://github.com/Xoje-Tech/dev-tracker/commit/bd279e2f7cc39945174964b69deaab7b8d6653af))
* **ui:** add useMilestonesStore Pinia store (PR ui-milestones / Phase 2) ([806fd08](https://github.com/Xoje-Tech/dev-tracker/commit/806fd08010b65a8d8445a52a53d03aa419cf905f))
* **ui:** add useSprintsStore Pinia store (PR ui-sprints / Phase 2) ([2476f95](https://github.com/Xoje-Tech/dev-tracker/commit/2476f959602e46c2c67d46077d8f846b8aa75456))
* **ui:** mount milestones routes + BoardTabs in BoardView (PR ui-milestones / Phase 5) ([57e23d3](https://github.com/Xoje-Tech/dev-tracker/commit/57e23d31cff7af9fbc2de5a70376bbb19c52911d))
* **ui:** mount sprints routes + Sprints tab in BoardView (PR ui-sprints / Phase 5) ([8e24689](https://github.com/Xoje-Tech/dev-tracker/commit/8e246892fde238b1db896d62d407652c768883be))
* **wiring:** mount milestones + sprints routers in createApp() (PR D) ([47ef2aa](https://github.com/Xoje-Tech/dev-tracker/commit/47ef2aa0aecde0710ab1979294f23852fe01dccd))


### Bug Fixes

* **cli:** default API base URL port to 6789 ([#70](https://github.com/Xoje-Tech/dev-tracker/issues/70)) ([5ce43c3](https://github.com/Xoje-Tech/dev-tracker/commit/5ce43c33d06d7ff6e69256b38704f6893470fd07))
* **cli:** default API base URL port to 6789 to match production podman deployment ([#70](https://github.com/Xoje-Tech/dev-tracker/issues/70)) ([05f98e7](https://github.com/Xoje-Tech/dev-tracker/commit/05f98e772714908f7684c20ddade43adc046d769))
* **mcp/cli:** expose field-specific details on validation failures ([#72](https://github.com/Xoje-Tech/dev-tracker/issues/72)) ([655d520](https://github.com/Xoje-Tech/dev-tracker/commit/655d5204308773284656f7251f5096ea7f15f0e3))
* **mcp/cli:** expose field-specific details on validation failures ([#72](https://github.com/Xoje-Tech/dev-tracker/issues/72)) ([338a77d](https://github.com/Xoje-Tech/dev-tracker/commit/338a77d37f7e0b45f200c0ae536b6497ec497711))

## [1.3.0](https://github.com/Xoje-Tech/dev-tracker/compare/dev-tracker-v1.2.1...dev-tracker-v1.3.0) (2026-07-12)


### Features

* add mcp sdk and start script ([2d7ddb2](https://github.com/Xoje-Tech/dev-tracker/commit/2d7ddb2634aa6608cf2a66444947e0e1440f6dd1))
* **auth:** add unauthenticated local offline mode using fallback user ([4a3fce1](https://github.com/Xoje-Tech/dev-tracker/commit/4a3fce122228fd0f0096996d8410c6e3abc1e237))
* **auth:** add unauthenticated local offline mode using fallback user ([9b44484](https://github.com/Xoje-Tech/dev-tracker/commit/9b4448456415dae8cc3c6badcce6329f82c1f747))
* **cli:** add cache module with atomic write, mtime, age helpers ([f6a1b61](https://github.com/Xoje-Tech/dev-tracker/commit/f6a1b61220caecdb6a74650ec60857233b239990))
* **cli:** add gh CLI wrapper with spawn, ensureGh, error parsing ([67dff1e](https://github.com/Xoje-Tech/dev-tracker/commit/67dff1e40fd82631dcebb3a964c6c42a0a21f558))
* **cli:** add hand-rolled type-guard parsers for issue/pr/run/branch ([61574e0](https://github.com/Xoje-Tech/dev-tracker/commit/61574e0739b87ffe5b0f48f19e16a59f11e069d9))
* **cli:** add update and server update deploy commands ([43ef0d1](https://github.com/Xoje-Tech/dev-tracker/commit/43ef0d107b7fffefd55df004090a7dbdfc8620ee))
* **cli:** add update and server update deploy commands ([249d965](https://github.com/Xoje-Tech/dev-tracker/commit/249d96591f5acb004f7f6b17378c2eda753b496f))
* **cli:** dt github sync — foundation (PR 1 of 3) ([a601103](https://github.com/Xoje-Tech/dev-tracker/commit/a60110308c9fbf295090790a36d0ef1a6f2fa584))
* **client:** implement ProjectDetailView with sprint progress statistics ([fdd1cd1](https://github.com/Xoje-Tech/dev-tracker/commit/fdd1cd11bddce9c66107d0a27a2827cac8e36350))
* **client:** implement ProjectDetailView with sprint progress statistics ([891f0a1](https://github.com/Xoje-Tech/dev-tracker/commit/891f0a1c811c9e11c8e66d8c6ab816071fdfa75b))
* **client:** integrate Engram memory bank card in ProjectDetailView ([0df9e8e](https://github.com/Xoje-Tech/dev-tracker/commit/0df9e8eb1bbacdd5b5d3a015d7ff6bbce2933b67))
* **client:** integrate Engram memory bank card in ProjectDetailView ([78be2b5](https://github.com/Xoje-Tech/dev-tracker/commit/78be2b5d83b0ef4e315f9a2d10775640ccadb95a))
* **cli:** extract useJson(program) helper to output.ts for reuse ([d55bdc3](https://github.com/Xoje-Tech/dev-tracker/commit/d55bdc3815da6835ac9b14493b09d3efb3d2bf03))
* **cli:** GitHub sync (pull + push) for issues, PRs, branches and runs ([696c36d](https://github.com/Xoje-Tech/dev-tracker/commit/696c36d4c2a1ab83cca27c64638e966a23e96125))
* **cli:** GitHub sync (pull + push) for issues, PRs, branches and runs ([d058be2](https://github.com/Xoje-Tech/dev-tracker/commit/d058be2942b31e717c66f59893609a5d2f3992c0))
* **deploy:** production deployment configuration and orchestration scripts ([91c1793](https://github.com/Xoje-Tech/dev-tracker/commit/91c17937058f20427392b9dfd2b303472456ff06))
* **deploy:** production deployment configuration and orchestration scripts ([50ce906](https://github.com/Xoje-Tech/dev-tracker/commit/50ce906bf14ea7d4972c3739ab6ff186bc63538e))
* format error response for mcp ([c765cd3](https://github.com/Xoje-Tech/dev-tracker/commit/c765cd3efa9a04e41bbb3bb6ca6b6d6164658eb8))
* implement mcp server entrypoint and transport ([cc70a45](https://github.com/Xoje-Tech/dev-tracker/commit/cc70a45a32447185d7313f065155cecb40a2a635))
* implement mcp tool schemas and handlers ([258d6e2](https://github.com/Xoje-Tech/dev-tracker/commit/258d6e2f8f34a7c63740b6c0ad810bc452f6e9b1))
* implement McpClient wrapper ([da9c64a](https://github.com/Xoje-Tech/dev-tracker/commit/da9c64aefbcd414d791c52f89a6bce30b7680d6f))
* **mcp:** implement native mcp server ([96fd1e1](https://github.com/Xoje-Tech/dev-tracker/commit/96fd1e1512f0d8da2ee0e662864c2926371235e7))


### Bug Fixes

* build errors due to strict typescript checks ([40df9c8](https://github.com/Xoje-Tech/dev-tracker/commit/40df9c85323e2ea12adb7a1f6a11913db4108052))
* **ci:** trigger CLI release on dev-tracker component tag ([cb292d6](https://github.com/Xoje-Tech/dev-tracker/commit/cb292d6a6755498bd70dfa8ffcbdd70d382fbc84))
* **cli:** pass --json &lt;fields&gt; to gh so sync paths return JSON, not TSV ([9ce58c6](https://github.com/Xoje-Tech/dev-tracker/commit/9ce58c6117a33b6c252843e0cf55398ec963401a))
* **cli:** pass --json &lt;fields&gt; to gh so sync/refresh paths get JSON instead of TSV ([8ced09f](https://github.com/Xoje-Tech/dev-tracker/commit/8ced09f94c49e2c46dec58d0fac559ea4c61eb35))
* **docker:** add userns_mode to keep-id for podman volume write permissions ([d92398f](https://github.com/Xoje-Tech/dev-tracker/commit/d92398fbe858c736ce34c09d79eecfcc7e569b02))
* **docker:** correct production ports and env vars in compose ([c3d1e13](https://github.com/Xoje-Tech/dev-tracker/commit/c3d1e1322a7ec5f4a3d23a7a1aeb89fc0e01d6f7))
* **docker:** correct production ports and env vars in compose ([4554380](https://github.com/Xoje-Tech/dev-tracker/commit/4554380abb97f4b57128e86d0efb08b96aa5bd11))
* **docker:** resolve sqlite readonly error with podman volumes ([8ac38e3](https://github.com/Xoje-Tech/dev-tracker/commit/8ac38e330ad1888cdfd1a73b7730b4b820d9793b))
* **mcp:** align create_task route and move_task verb/body ([54c2357](https://github.com/Xoje-Tech/dev-tracker/commit/54c23573f7f6dd7c9b8a7a21ff7b277e7271a365))
* **mcp:** align create_task route and move_task verb/body ([28b063b](https://github.com/Xoje-Tech/dev-tracker/commit/28b063bfb85c6e67149c035ab64cdcb938602a29))
* **mcp:** make createTaskDto.order optional ([55fe344](https://github.com/Xoje-Tech/dev-tracker/commit/55fe344d6643c842f84f1b91ace3029e6cb08e4e))
* **mcp:** make createTaskDto.order optional ([3545a96](https://github.com/Xoje-Tech/dev-tracker/commit/3545a96af4128a80741509324a6a4aa2d10904ea))

## [1.2.1](https://github.com/Xoje-Tech/dev-tracker/compare/dev-tracker-v1.2.0...dev-tracker-v1.2.1) (2026-07-05)


### Bug Fixes

* **devops:** trigger GHCR publish on tag push instead of release published ([302e77f](https://github.com/Xoje-Tech/dev-tracker/commit/302e77f800dfb9a6270a1ccf6c1c43f70929a74e))
* **devops:** trigger GHCR publish on tag push instead of release published ([eabcc86](https://github.com/Xoje-Tech/dev-tracker/commit/eabcc861e63b158d06f242e0d0c00547cf998f72))

## [1.2.0](https://github.com/Xoje-Tech/dev-tracker/compare/dev-tracker-v1.1.0...dev-tracker-v1.2.0) (2026-07-05)


### Features

* **backend:** include tagIds in BoardTaskDto and TaskResponseDto ([8c638a8](https://github.com/Xoje-Tech/dev-tracker/commit/8c638a833862b003b0416b1bd501646322f7fdba))
* **ci:** automate CLI binary releases via GitHub Actions ([c85ade6](https://github.com/Xoje-Tech/dev-tracker/commit/c85ade69530623a945bbbcb532692890bc6c86ed))
* **ci:** automate version bumping and changelog with release-please ([ec4b008](https://github.com/Xoje-Tech/dev-tracker/commit/ec4b008c0e51ac264a7302d9a68d9606047c536e))
* **ci:** automate versioning with release-please ([a7263a2](https://github.com/Xoje-Tech/dev-tracker/commit/a7263a22de5e01dc9086664c217ea05a9e89273f))
* **cli:** add standalone packaging and global curl-to-bash installer (fixes [#9](https://github.com/Xoje-Tech/dev-tracker/issues/9)) ([143fa71](https://github.com/Xoje-Tech/dev-tracker/commit/143fa7188e1e130028ae6a96d7eb9d28380a3f5e))
* **cli:** add standalone packaging and global curl-to-bash installer (fixes [#9](https://github.com/Xoje-Tech/dev-tracker/issues/9)) ([8f06346](https://github.com/Xoje-Tech/dev-tracker/commit/8f06346341a51f5699e6e4d51b829000258029a7))
* **client/auth:** LoginView with atomic component layers ([01d051c](https://github.com/Xoje-Tech/dev-tracker/commit/01d051c63c895866870f69e27e48361973b9810c))
* **client/auth:** Pinia auth store + client path aliases ([705043e](https://github.com/Xoje-Tech/dev-tracker/commit/705043e4d3992ac2b69a7ed9ddbbe17db549adbd))
* **client/board:** BoardView wires board fetch, modals, and drag/drop ([37bc1ca](https://github.com/Xoje-Tech/dev-tracker/commit/37bc1ca1da565ce108a6edb3b0037b166a968016))
* **client/board:** domain types and Pinia store ([bfb92ca](https://github.com/Xoje-Tech/dev-tracker/commit/bfb92cae0d68ac6b895e32557726dc0fb303590a))
* **client/board:** KanbanColumn and KanbanBoard organisms with drag/drop ([1cb09f5](https://github.com/Xoje-Tech/dev-tracker/commit/1cb09f5a7f524cab7c7757b26ad94ed0b187f7e5))
* **client/board:** PriorityBadge atom + TaskCard/ColumnHeader/TaskForm molecules ([6cb279d](https://github.com/Xoje-Tech/dev-tracker/commit/6cb279dc87e9682890fe3e77b92aeda8971e185b))
* **client/board:** render tag pills on TaskCard ([af5eb10](https://github.com/Xoje-Tech/dev-tracker/commit/af5eb1014fc1cd9b4a08f0cc9062efdd51611b80))
* **client/board:** wire tag assignment in BoardView via TaskForm ([5dcd29e](https://github.com/Xoje-Tech/dev-tracker/commit/5dcd29ed5218903ffb478689bcad748cffee98a8))
* **client/projects:** domain types and Pinia store ([a720d7f](https://github.com/Xoje-Tech/dev-tracker/commit/a720d7fe4294a301ff46da4ce07a88343f0e7388))
* **client/projects:** ProjectCard and NewProjectForm molecules ([6b7f75f](https://github.com/Xoje-Tech/dev-tracker/commit/6b7f75fbc81ad03b4118adefaf3136b7cd58d3ea))
* **client/projects:** ProjectsView with grid and new-project modal ([e4b476c](https://github.com/Xoje-Tech/dev-tracker/commit/e4b476cb4dab3414d0338b1de08cedc68faf2006))
* **client/shared:** add FormField, EmptyState, PageHeader molecules ([22d2905](https://github.com/Xoje-Tech/dev-tracker/commit/22d29051628656e4e2de284bd3bf714a4e16d703))
* **client/shared:** add useApi composable and Base atoms ([fd31a3c](https://github.com/Xoje-Tech/dev-tracker/commit/fd31a3c502f03f626b581876bfe944684a668538))
* **client/shared:** expand atom library for upcoming modules ([a79ce97](https://github.com/Xoje-Tech/dev-tracker/commit/a79ce97526ac6a36c587b9c358ee15302a3da0e0))
* **client/tags:** domain types and Pinia store ([b9ed378](https://github.com/Xoje-Tech/dev-tracker/commit/b9ed378cfe1f58c1cc62d3dc8c44abfd6b2486ee))
* **client/tags:** TagsView with list and new-tag modal ([5fcbd08](https://github.com/Xoje-Tech/dev-tracker/commit/5fcbd087f8786223e379baaab0e33c99864ec5ae))
* **client:** AppLayout template + TopBarUser molecule ([8be24ee](https://github.com/Xoje-Tech/dev-tracker/commit/8be24eed0c4e3dd30b0e7d31a33f7f4e19a51f50))
* **client:** auth guard, routing, redirect post-login ([d255d76](https://github.com/Xoje-Tech/dev-tracker/commit/d255d767664764c6a12f82788e887b0892f9c345))
* **client:** wire router + close pending frontend setup ([5772a1b](https://github.com/Xoje-Tech/dev-tracker/commit/5772a1b72bacb5afa7ad1e9f5a0fae77cfce36d7))
* **cli:** scaffold dev-tracker-cli workspace package ([5aacc65](https://github.com/Xoje-Tech/dev-tracker/commit/5aacc65763f8c3d58aebd5b5f36a4e6c71cdbba8))
* **devops:** Containerizar servidor con Podman y publicar en GHCR ([6c3e4d0](https://github.com/Xoje-Tech/dev-tracker/commit/6c3e4d08f0155b430010e4d1453f72ae587c008d))
* **devops:** containerize server with Podman and GHCR workflow ([46a8c0b](https://github.com/Xoje-Tech/dev-tracker/commit/46a8c0b923917a652490a344c31839701f9c4a79)), closes [#25](https://github.com/Xoje-Tech/dev-tracker/issues/25)
* initial project scaffold ([8bd883f](https://github.com/Xoje-Tech/dev-tracker/commit/8bd883f9793db99d1101a6d194d5858b9e785c85))
* **projects,boards:** full implementation of Projects and Boards modules ([234c4fb](https://github.com/Xoje-Tech/dev-tracker/commit/234c4fbe0de5d4d533fc31b9cee934246fe8dc40))
* **projects:** add repoUrl to backend domain, dtos, and frontend types ([2f3107b](https://github.com/Xoje-Tech/dev-tracker/commit/2f3107b3cc6dac81b03e0edd0090d631335c334c))
* **projects:** add repoUrl to project model (fixes [#8](https://github.com/Xoje-Tech/dev-tracker/issues/8)) ([3ef1632](https://github.com/Xoje-Tech/dev-tracker/commit/3ef1632548d3d47912adfd866751e56224226af6))
* **projects:** render repoUrl link in ProjectCard and add input in NewProjectForm ([4bcf273](https://github.com/Xoje-Tech/dev-tracker/commit/4bcf273a3ce4656f6c39bbddd1a89a6e74dc8ed5))
* **tasks,tags:** full implementation with move algorithm and tag management ([a473a39](https://github.com/Xoje-Tech/dev-tracker/commit/a473a391d59d7919738a804116ee0f119e1a199a))


### Bug Fixes

* **auth:** set trust proxy and secure cookie auto in production to fix HTTP deploy cookies (fixes [#1](https://github.com/Xoje-Tech/dev-tracker/issues/1)) ([c921b52](https://github.com/Xoje-Tech/dev-tracker/commit/c921b5257e052de8523ecd6a2bfabb5ef32760d7))
* **backend:** add missing src/server entry point and fix dotenv override ([756145f](https://github.com/Xoje-Tech/dev-tracker/commit/756145f0c19c2eb525e273f88f4424e479dd2689))
* **build:** tsc-alias in build, correct dist path in start, SPA fallback in app ([45ed4fa](https://github.com/Xoje-Tech/dev-tracker/commit/45ed4faba6bda6c347f57623b8f128fa61a75426))
* **ci:** bump node version to 26 in release action to align with repo standard ([6f2729e](https://github.com/Xoje-Tech/dev-tracker/commit/6f2729ef13fea9fb43a9bd6eca90aabf4fae889e))
* **ci:** remove pnpm version conflict ([a07b5fb](https://github.com/Xoje-Tech/dev-tracker/commit/a07b5fb9393e205aef86911a890d9f931c5e234b))
* **ci:** remove pnpm version conflict in release action ([e25771d](https://github.com/Xoje-Tech/dev-tracker/commit/e25771ddd68b9614219b28419b67d0d29656df0a))
* **ci:** rename generated CLI binaries for install script ([523b5bc](https://github.com/Xoje-Tech/dev-tracker/commit/523b5bcf174084b20080ea04855905ba3bb7910c))
* **ci:** rename generated CLI binaries to match install script expectations ([989ff99](https://github.com/Xoje-Tech/dev-tracker/commit/989ff993fe7ece06194fda1003e0ec492340553e))
* **ci:** update node version to 22 ([d0a86c5](https://github.com/Xoje-Tech/dev-tracker/commit/d0a86c51378187075ea5736322909ea98443f75f))
* **ci:** update node version to 22 in release action ([d03bbc4](https://github.com/Xoje-Tech/dev-tracker/commit/d03bbc42b548a64d3de96d4a27120b8833c07694))
* **cli:** 401 hint, authMode cookie bug, rotate warning + test infra bootstrap ([6dd7b6a](https://github.com/Xoje-Tech/dev-tracker/commit/6dd7b6aa9c6a3404646782038a95bf9b6501a388))
* **cli:** add fallback for Set-Cookie header extraction in native fetch (fixes [#6](https://github.com/Xoje-Tech/dev-tracker/issues/6)) ([334b0f3](https://github.com/Xoje-Tech/dev-tracker/commit/334b0f3eab55fc3f74b0f89a13ad134225829168))
* **cli:** add missing --order option to tasks create ([62e2d7d](https://github.com/Xoje-Tech/dev-tracker/commit/62e2d7d27c33bf119f72efe4372ed97ca4fd9a4e))
* **client:** F4 auth polish, session-expired banner and error discrimination ([a96a1da](https://github.com/Xoje-Tech/dev-tracker/commit/a96a1dad5b515e6246690d33530d917973f1c71a))
* **cli:** switch from ESM to CommonJS to fix pkg module resolution ([540d1eb](https://github.com/Xoje-Tech/dev-tracker/commit/540d1ebb0fd68370e7ab9c5edcb9d4b89ce7bfe0))
* **cli:** switch to CommonJS for pkg compatibility ([22fb38f](https://github.com/Xoje-Tech/dev-tracker/commit/22fb38f9963ff874b8a863a6c50ac876266ffae0))
* **cli:** use direct cd in root cli scripts ([da7b733](https://github.com/Xoje-Tech/dev-tracker/commit/da7b733e965f7264ff6454fc60a05505d8e3934f))
* **config:** remove quotes from DATABASE_URL to support systemd and update SESSION_SECRET placeholder (fixes [#3](https://github.com/Xoje-Tech/dev-tracker/issues/3)) ([9cc179a](https://github.com/Xoje-Tech/dev-tracker/commit/9cc179af23e0a7ea88dc85182909d5b2353b78c0))
* **dev-tracker:** make Docker image build and run end-to-end ([d767d11](https://github.com/Xoje-Tech/dev-tracker/commit/d767d119431e4323c340886be2cc4c69f0314590))
* **dev-tracker:** production-ready persistence + NODE_ENV override ([8205f81](https://github.com/Xoje-Tech/dev-tracker/commit/8205f81f04c705fefb2733bbac2458dff22a4724))
* **devops:** map correct internal port 3000 in compose.yaml ([66b5e8d](https://github.com/Xoje-Tech/dev-tracker/commit/66b5e8db9902823c057b6f90caf15d945611eb7f))
* **docker:** correct path to compiled server entrypoint ([9c6ddc4](https://github.com/Xoje-Tech/dev-tracker/commit/9c6ddc48bb2eb4f571aef6dfdf0f54efcb57dff9))
* **server:** /api/auth/me returns full authResponseDtoSchema shape ([d903317](https://github.com/Xoje-Tech/dev-tracker/commit/d903317333678511a914fd9d34aae497915e4f15))
* **test:** exclude src/client from backend vitest config ([dfe2b1a](https://github.com/Xoje-Tech/dev-tracker/commit/dfe2b1aa09405de5990d8a1f80a39fc41ae0b892))
* **test:** handle string or array headers in cookie test to fix build ([3f312e5](https://github.com/Xoje-Tech/dev-tracker/commit/3f312e54a1ff7925dfd8324b1088de2317f80c6b))

## [1.1.0](https://github.com/Xoje-Tech/dev-tracker/compare/dev-tracker-v1.0.0...dev-tracker-v1.1.0) (2026-07-05)


### Features

* **backend:** include tagIds in BoardTaskDto and TaskResponseDto ([8c638a8](https://github.com/Xoje-Tech/dev-tracker/commit/8c638a833862b003b0416b1bd501646322f7fdba))
* **ci:** automate CLI binary releases via GitHub Actions ([c85ade6](https://github.com/Xoje-Tech/dev-tracker/commit/c85ade69530623a945bbbcb532692890bc6c86ed))
* **ci:** automate version bumping and changelog with release-please ([ec4b008](https://github.com/Xoje-Tech/dev-tracker/commit/ec4b008c0e51ac264a7302d9a68d9606047c536e))
* **ci:** automate versioning with release-please ([a7263a2](https://github.com/Xoje-Tech/dev-tracker/commit/a7263a22de5e01dc9086664c217ea05a9e89273f))
* **cli:** add standalone packaging and global curl-to-bash installer (fixes [#9](https://github.com/Xoje-Tech/dev-tracker/issues/9)) ([143fa71](https://github.com/Xoje-Tech/dev-tracker/commit/143fa7188e1e130028ae6a96d7eb9d28380a3f5e))
* **cli:** add standalone packaging and global curl-to-bash installer (fixes [#9](https://github.com/Xoje-Tech/dev-tracker/issues/9)) ([8f06346](https://github.com/Xoje-Tech/dev-tracker/commit/8f06346341a51f5699e6e4d51b829000258029a7))
* **client/auth:** LoginView with atomic component layers ([01d051c](https://github.com/Xoje-Tech/dev-tracker/commit/01d051c63c895866870f69e27e48361973b9810c))
* **client/auth:** Pinia auth store + client path aliases ([705043e](https://github.com/Xoje-Tech/dev-tracker/commit/705043e4d3992ac2b69a7ed9ddbbe17db549adbd))
* **client/board:** BoardView wires board fetch, modals, and drag/drop ([37bc1ca](https://github.com/Xoje-Tech/dev-tracker/commit/37bc1ca1da565ce108a6edb3b0037b166a968016))
* **client/board:** domain types and Pinia store ([bfb92ca](https://github.com/Xoje-Tech/dev-tracker/commit/bfb92cae0d68ac6b895e32557726dc0fb303590a))
* **client/board:** KanbanColumn and KanbanBoard organisms with drag/drop ([1cb09f5](https://github.com/Xoje-Tech/dev-tracker/commit/1cb09f5a7f524cab7c7757b26ad94ed0b187f7e5))
* **client/board:** PriorityBadge atom + TaskCard/ColumnHeader/TaskForm molecules ([6cb279d](https://github.com/Xoje-Tech/dev-tracker/commit/6cb279dc87e9682890fe3e77b92aeda8971e185b))
* **client/board:** render tag pills on TaskCard ([af5eb10](https://github.com/Xoje-Tech/dev-tracker/commit/af5eb1014fc1cd9b4a08f0cc9062efdd51611b80))
* **client/board:** wire tag assignment in BoardView via TaskForm ([5dcd29e](https://github.com/Xoje-Tech/dev-tracker/commit/5dcd29ed5218903ffb478689bcad748cffee98a8))
* **client/projects:** domain types and Pinia store ([a720d7f](https://github.com/Xoje-Tech/dev-tracker/commit/a720d7fe4294a301ff46da4ce07a88343f0e7388))
* **client/projects:** ProjectCard and NewProjectForm molecules ([6b7f75f](https://github.com/Xoje-Tech/dev-tracker/commit/6b7f75fbc81ad03b4118adefaf3136b7cd58d3ea))
* **client/projects:** ProjectsView with grid and new-project modal ([e4b476c](https://github.com/Xoje-Tech/dev-tracker/commit/e4b476cb4dab3414d0338b1de08cedc68faf2006))
* **client/shared:** add FormField, EmptyState, PageHeader molecules ([22d2905](https://github.com/Xoje-Tech/dev-tracker/commit/22d29051628656e4e2de284bd3bf714a4e16d703))
* **client/shared:** add useApi composable and Base atoms ([fd31a3c](https://github.com/Xoje-Tech/dev-tracker/commit/fd31a3c502f03f626b581876bfe944684a668538))
* **client/shared:** expand atom library for upcoming modules ([a79ce97](https://github.com/Xoje-Tech/dev-tracker/commit/a79ce97526ac6a36c587b9c358ee15302a3da0e0))
* **client/tags:** domain types and Pinia store ([b9ed378](https://github.com/Xoje-Tech/dev-tracker/commit/b9ed378cfe1f58c1cc62d3dc8c44abfd6b2486ee))
* **client/tags:** TagsView with list and new-tag modal ([5fcbd08](https://github.com/Xoje-Tech/dev-tracker/commit/5fcbd087f8786223e379baaab0e33c99864ec5ae))
* **client:** AppLayout template + TopBarUser molecule ([8be24ee](https://github.com/Xoje-Tech/dev-tracker/commit/8be24eed0c4e3dd30b0e7d31a33f7f4e19a51f50))
* **client:** auth guard, routing, redirect post-login ([d255d76](https://github.com/Xoje-Tech/dev-tracker/commit/d255d767664764c6a12f82788e887b0892f9c345))
* **client:** wire router + close pending frontend setup ([5772a1b](https://github.com/Xoje-Tech/dev-tracker/commit/5772a1b72bacb5afa7ad1e9f5a0fae77cfce36d7))
* **cli:** scaffold dev-tracker-cli workspace package ([5aacc65](https://github.com/Xoje-Tech/dev-tracker/commit/5aacc65763f8c3d58aebd5b5f36a4e6c71cdbba8))
* **devops:** Containerizar servidor con Podman y publicar en GHCR ([6c3e4d0](https://github.com/Xoje-Tech/dev-tracker/commit/6c3e4d08f0155b430010e4d1453f72ae587c008d))
* **devops:** containerize server with Podman and GHCR workflow ([46a8c0b](https://github.com/Xoje-Tech/dev-tracker/commit/46a8c0b923917a652490a344c31839701f9c4a79)), closes [#25](https://github.com/Xoje-Tech/dev-tracker/issues/25)
* initial project scaffold ([8bd883f](https://github.com/Xoje-Tech/dev-tracker/commit/8bd883f9793db99d1101a6d194d5858b9e785c85))
* **projects,boards:** full implementation of Projects and Boards modules ([234c4fb](https://github.com/Xoje-Tech/dev-tracker/commit/234c4fbe0de5d4d533fc31b9cee934246fe8dc40))
* **projects:** add repoUrl to backend domain, dtos, and frontend types ([2f3107b](https://github.com/Xoje-Tech/dev-tracker/commit/2f3107b3cc6dac81b03e0edd0090d631335c334c))
* **projects:** add repoUrl to project model (fixes [#8](https://github.com/Xoje-Tech/dev-tracker/issues/8)) ([3ef1632](https://github.com/Xoje-Tech/dev-tracker/commit/3ef1632548d3d47912adfd866751e56224226af6))
* **projects:** render repoUrl link in ProjectCard and add input in NewProjectForm ([4bcf273](https://github.com/Xoje-Tech/dev-tracker/commit/4bcf273a3ce4656f6c39bbddd1a89a6e74dc8ed5))
* **tasks,tags:** full implementation with move algorithm and tag management ([a473a39](https://github.com/Xoje-Tech/dev-tracker/commit/a473a391d59d7919738a804116ee0f119e1a199a))


### Bug Fixes

* **auth:** set trust proxy and secure cookie auto in production to fix HTTP deploy cookies (fixes [#1](https://github.com/Xoje-Tech/dev-tracker/issues/1)) ([c921b52](https://github.com/Xoje-Tech/dev-tracker/commit/c921b5257e052de8523ecd6a2bfabb5ef32760d7))
* **backend:** add missing src/server entry point and fix dotenv override ([756145f](https://github.com/Xoje-Tech/dev-tracker/commit/756145f0c19c2eb525e273f88f4424e479dd2689))
* **build:** tsc-alias in build, correct dist path in start, SPA fallback in app ([45ed4fa](https://github.com/Xoje-Tech/dev-tracker/commit/45ed4faba6bda6c347f57623b8f128fa61a75426))
* **ci:** bump node version to 26 in release action to align with repo standard ([6f2729e](https://github.com/Xoje-Tech/dev-tracker/commit/6f2729ef13fea9fb43a9bd6eca90aabf4fae889e))
* **ci:** remove pnpm version conflict ([a07b5fb](https://github.com/Xoje-Tech/dev-tracker/commit/a07b5fb9393e205aef86911a890d9f931c5e234b))
* **ci:** remove pnpm version conflict in release action ([e25771d](https://github.com/Xoje-Tech/dev-tracker/commit/e25771ddd68b9614219b28419b67d0d29656df0a))
* **ci:** rename generated CLI binaries for install script ([523b5bc](https://github.com/Xoje-Tech/dev-tracker/commit/523b5bcf174084b20080ea04855905ba3bb7910c))
* **ci:** rename generated CLI binaries to match install script expectations ([989ff99](https://github.com/Xoje-Tech/dev-tracker/commit/989ff993fe7ece06194fda1003e0ec492340553e))
* **ci:** update node version to 22 ([d0a86c5](https://github.com/Xoje-Tech/dev-tracker/commit/d0a86c51378187075ea5736322909ea98443f75f))
* **ci:** update node version to 22 in release action ([d03bbc4](https://github.com/Xoje-Tech/dev-tracker/commit/d03bbc42b548a64d3de96d4a27120b8833c07694))
* **cli:** 401 hint, authMode cookie bug, rotate warning + test infra bootstrap ([6dd7b6a](https://github.com/Xoje-Tech/dev-tracker/commit/6dd7b6aa9c6a3404646782038a95bf9b6501a388))
* **cli:** add fallback for Set-Cookie header extraction in native fetch (fixes [#6](https://github.com/Xoje-Tech/dev-tracker/issues/6)) ([334b0f3](https://github.com/Xoje-Tech/dev-tracker/commit/334b0f3eab55fc3f74b0f89a13ad134225829168))
* **cli:** add missing --order option to tasks create ([62e2d7d](https://github.com/Xoje-Tech/dev-tracker/commit/62e2d7d27c33bf119f72efe4372ed97ca4fd9a4e))
* **client:** F4 auth polish, session-expired banner and error discrimination ([a96a1da](https://github.com/Xoje-Tech/dev-tracker/commit/a96a1dad5b515e6246690d33530d917973f1c71a))
* **cli:** switch from ESM to CommonJS to fix pkg module resolution ([540d1eb](https://github.com/Xoje-Tech/dev-tracker/commit/540d1ebb0fd68370e7ab9c5edcb9d4b89ce7bfe0))
* **cli:** switch to CommonJS for pkg compatibility ([22fb38f](https://github.com/Xoje-Tech/dev-tracker/commit/22fb38f9963ff874b8a863a6c50ac876266ffae0))
* **cli:** use direct cd in root cli scripts ([da7b733](https://github.com/Xoje-Tech/dev-tracker/commit/da7b733e965f7264ff6454fc60a05505d8e3934f))
* **config:** remove quotes from DATABASE_URL to support systemd and update SESSION_SECRET placeholder (fixes [#3](https://github.com/Xoje-Tech/dev-tracker/issues/3)) ([9cc179a](https://github.com/Xoje-Tech/dev-tracker/commit/9cc179af23e0a7ea88dc85182909d5b2353b78c0))
* **dev-tracker:** make Docker image build and run end-to-end ([d767d11](https://github.com/Xoje-Tech/dev-tracker/commit/d767d119431e4323c340886be2cc4c69f0314590))
* **dev-tracker:** production-ready persistence + NODE_ENV override ([8205f81](https://github.com/Xoje-Tech/dev-tracker/commit/8205f81f04c705fefb2733bbac2458dff22a4724))
* **devops:** map correct internal port 3000 in compose.yaml ([66b5e8d](https://github.com/Xoje-Tech/dev-tracker/commit/66b5e8db9902823c057b6f90caf15d945611eb7f))
* **docker:** correct path to compiled server entrypoint ([9c6ddc4](https://github.com/Xoje-Tech/dev-tracker/commit/9c6ddc48bb2eb4f571aef6dfdf0f54efcb57dff9))
* **server:** /api/auth/me returns full authResponseDtoSchema shape ([d903317](https://github.com/Xoje-Tech/dev-tracker/commit/d903317333678511a914fd9d34aae497915e4f15))
* **test:** exclude src/client from backend vitest config ([dfe2b1a](https://github.com/Xoje-Tech/dev-tracker/commit/dfe2b1aa09405de5990d8a1f80a39fc41ae0b892))
* **test:** handle string or array headers in cookie test to fix build ([3f312e5](https://github.com/Xoje-Tech/dev-tracker/commit/3f312e54a1ff7925dfd8324b1088de2317f80c6b))

## [Unreleased]

## [1.0.0] - 2026-06-30

First stable release. Internal deployment — not yet on a public registry.

### Highlights
- Kanban-style project management: projects, boards (4 columns: Backlog / In Progress / Review / Done), tasks, tags
- Dual auth: session cookies (browser) + API keys (CLI/scripts), sharing the same backend
- CLI tool (`dt`) for scripting and automation
- Vue 3 SPA frontend with atomic design components
- One-command Docker deployment: `docker compose up -d`
- Data persists across upgrades via named volume
- Pre-upgrade backup + automated upgrade script

### Added
- **Functional core**: projects, boards, tasks, tags modules (hexagonal backend + Vue 3 frontend)
- **Auth**: register, login, logout, session-based auth, API key rotation
- **CLI**: `pnpm cli -- auth/projects/tasks/...` commands with auto-rotate API key on first use
- **Production Docker image**: multi-stage Dockerfile (`node:26` build → `node:26-slim` runtime, non-root, healthcheck, named volume for SQLite)
- **docker-compose.yml**: one-command startup, required `SESSION_SECRET` (loud-fail if missing)
- **`scripts/upgrade.sh`**: automated upgrade with backup, git pull, image rebuild, restart, healthcheck verification
- **README**: quickstart (Docker + manual `pnpm`), config table, CLI, backup/restore, upgrade, troubleshooting
- **E2E smoke**: Playwright test covering register → login → create project → create task → drag to Done
- **Test suite**: 154 unit tests passing (backend + frontend + CLI)

### Changed
- **Node target: 26.0.0** (was 20.0.0 / 22.0.0) — canonical across all Xoje-Tech projects. Node 26 is "Current" until Oct 2026, then becomes LTS.
- **pnpm 11.9.0** as the canonical package manager (`packageManager` field pins it; corepack enforces)
- **pnpm 11 settings**: moved from `pnpm.field` in package.json to `pnpm-workspace.yaml` (`allowBuilds` map)
- **`prisma`** moved from `devDependencies` to `dependencies` — needed at runtime by the entrypoint for `db push`

### Fixed
- **TS path resolution**: `tsc-alias` added to build; `start` script fixed from `dist/server/index.js` to `dist/src/server/index.js`
- **SPA fallback**: `src/app.ts` now serves `dist/client/index.html` for non-API routes (previously returned `{"error":"Not found"}`)
- **Session persistence**: `connect-sqlite3` sessions.db was at `/app/sessions.db` (lost on restart); now lives in the named volume via `SESSIONS_DIR=/app/data`
- **Data persistence**: `DATABASE_URL: file:./data/dev.db` was resolved relative to schema.prisma dir (baked into image!) — fixed to absolute path `file:/app/data/dev.db`
- **`pnpm prune` in Docker**: needed `CI=true` to avoid TTY prompt
- **`corepack enable`** in `node:26` image — added `npm install -g corepack@latest` first
- **F4 auth polish**: 9 fixes across frontend/CLI/backend (session-expired banner, invalid-credentials UX, 401 discrimination, etc.)

### Security
- Helmet middleware (CSP, HSTS, X-Frame-Options, etc.)
- `httpOnly` cookies, `secure` in production (HTTPS required)
- bcryptjs password hashing
- Prisma parameterized queries (no SQL injection surface)
- `SESSION_SECRET` validation: minimum 16 chars, must be set explicitly in production

### Technical Notes
- **Internal-only deployment**: not pushed to a public registry. Q1 (CI → ghcr.io) is deferred until after v1.0 ships.
- **No migration path needed**: this is the first tagged release; 0.x.y commits are pre-1.0 WIP.
- **Upgrade path from 0.x**: no upgrade script exists (only `upgrade.sh` for same-version or future versions). 0.x → 1.0 is a fresh install.

### Deferred (not in v1.0)
- TUI installer wizard → v1.1
- systemd unit / launchd plist → v1.2
- SEA binary distribution → v2.0
- Q1 (CI → ghcr.io on `v*` tags) → post-v1.0

## [0.x] - Pre-release history

The 0.x line was iterative WIP. Key milestones during this phase:
- Initial project scaffold (TypeScript, Express, Prisma, Vue 3, Vite, Tailwind 4)
- Hexagonal backend reorganization
- CLI scaffolding
- Auth polish (F4)
- E2E smoke test (F2)
- Production build verification (F3)
- Docker support (D1+D2+D3)
- Cross-project Node 26 migration

These are not individually tagged — see `git log --oneline` for the commit-by-commit history.
