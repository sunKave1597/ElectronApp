const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getProducts: () => ipcRenderer.invoke('get-products'),
    addProduct: (name, sell, cost) => ipcRenderer.invoke('add-product', name, sell, cost),
    deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
    addIncome: (entry) => ipcRenderer.invoke('add-income', entry),
    getSummary: () => ipcRenderer.invoke('get-summary'),
    getDashboardData: (month) => ipcRenderer.invoke('get-dashboard-data', { month }),
    getTopProducts: (month) => ipcRenderer.invoke('get-top-products', { month })

});
