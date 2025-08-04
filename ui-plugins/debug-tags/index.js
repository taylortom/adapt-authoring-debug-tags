// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
  const Origin = require('core/origin');
  const TagsView = require('./views/tagsView');

  Origin.on('debug:ready', () => {
    Origin.trigger(`debug:addView`, { 
      name: 'tags', 
      icon: 'tags', 
      title: Origin.l10n.t('app.tags'), 
      view: TagsView
    })
  })
});
