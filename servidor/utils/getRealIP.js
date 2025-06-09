const os = require("os");

function getRealWirelessIP() {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (
                    iface.address.startsWith('192.168.') ||
                    iface.address.startsWith('172.16.') ||
                    iface.address.startsWith('10.')
                ) {
                    return iface.address;
                }
            }
        }
    }
    return 'localhost';
}

module.exports = { getRealWirelessIP };
