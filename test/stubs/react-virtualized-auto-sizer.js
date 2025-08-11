const React = require('../../apps/web/node_modules/react');

module.exports = function AutoSizer({ className, children }) {
  return React.createElement(
    'div',
    { className },
    children({ width: 800, height: 600 })
  );
};
