# Changelog

All notable changes to dev-tracker are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
