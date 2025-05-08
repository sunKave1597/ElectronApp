const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getProducts: () => ipcRenderer.invoke('get-products'),
    addProduct: (name, sell, cost) => ipcRenderer.invoke('add-product', name, sell, cost),
    deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
    addIncome: (entry) => ipcRenderer.invoke('add-income', entry),
    getSummary: () => ipcRenderer.invoke('get-summary'),

});
