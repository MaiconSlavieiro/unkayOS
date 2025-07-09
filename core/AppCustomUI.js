export class AppCustomUI {
    constructor(core) {
      this.core = core;
      this.init();
    }
  
    async init() {
      if (this.core.dirApp) {
        window.location.href = this.core.dirApp; // ou criar um container fullscreen se for single page
      }
  
      await this.core.runLogic();
    }
  }
  

  //deve implementar instanciamento no desktop dom (futuro "screen")