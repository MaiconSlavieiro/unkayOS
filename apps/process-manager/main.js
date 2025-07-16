import eventBus from '../../core/eventBus.js';
import { BaseApp } from '../../core/BaseApp.js';

export default class ProcessManagerApp extends BaseApp {
  constructor(appCore, apis) {
    super(appCore, apis);
    this.appCore = appCore;
    this.apis = apis;
    this.renderTable = this.renderTable.bind(this);
    this.waitForAppManagerAndRender = this.waitForAppManagerAndRender.bind(this);
  }

  onRun() {
    // Garante que só inicializa após o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.waitForAppManagerAndRender);
    } else {
      this.waitForAppManagerAndRender();
    }
  }

  waitForAppManagerAndRender() {
    if (window.appManager && window.appManager.runningApps) {
      this.renderTable();
      document.getElementById('refreshBtn').addEventListener('click', this.renderTable);
// Adiciona classe de ícone do DS ao botão de refresh
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn && !refreshBtn.querySelector('.material-icons')) {
  refreshBtn.innerHTML = '<span class="material-icons-round" aria-label="Atualizar" title="Atualizar">refresh</span>';
}
      eventBus.on('app:started', this.renderTable);
      eventBus.on('app:stopped', this.renderTable);
    } else {
      setTimeout(this.waitForAppManagerAndRender, 150);
    }
  }

  getRunningApps() {
    const appManager = window.appManager;
    if (!appManager || !appManager.runningApps) return [];
    const apps = [];
    for (const [instanceId, appInfo] of appManager.runningApps.entries()) {
      if (!appInfo || !appInfo.appCoreInstance) continue;
      const core = appInfo.appCoreInstance;
      apps.push({
        instanceId,
        appId: core.id,
        appName: core.app_name,
        mode: core.mode,
        status: appInfo.appUIInstance && appInfo.appUIInstance.isMinimized ? 'Minimizado' : 'Ativo',
        canStop: core.mode !== 'desktop_ui',
      });
    }
    return apps;
  }

  renderTable() {
    const tableBody = document.querySelector('#processTable tbody');
    const emptyMsg = document.getElementById('emptyMsg');
    const apps = this.getRunningApps();

    tableBody.innerHTML = '';
    if (apps.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }
    emptyMsg.style.display = 'none';

    for (const app of apps) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${app.appName}</td>
        <td>${app.mode}</td>
        <td>${app.instanceId}</td>
        <td>${app.status}</td>
        <td>
          <button class="action-btn" data-instance="${app.instanceId}" ${!app.canStop ? 'disabled' : ''} aria-label="Parar processo" title="Parar processo">
            <span class="material-icons-round">stop_circle</span>
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    }

    tableBody.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const instanceId = btn.dataset.instance;
        if (instanceId) {
          eventBus.emit('app:stop', { instanceId });
          setTimeout(this.renderTable, 200);
        }
      });
    });
  }
}

