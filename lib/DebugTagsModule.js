import { AbstractModule } from 'adapt-authoring-core';
/**
* Adds tag utilities to the debug panel
* @extends debug
* @extends {AbstractModule}
*/
class DebugTagsModule extends AbstractModule {
  /** @override */
  async init() {
    const ui = await this.app.waitForModule('ui');
    ui.addUiPlugin(`${this.rootDir}/ui-plugins`);
  }
}

export default DebugTagsModule;