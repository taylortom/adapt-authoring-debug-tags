// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var ApiCollection = require('core/collections/apiCollection');
  var Backbone = require('backbone');
  var ContentCollection = require('core/collections/contentCollection');
  var Origin = require('core/origin');
  var OriginView = require('core/views/originView');
  var TagsCollection = require('core/collections/tagsCollection');

  var TagsView = OriginView.extend({
    tagName: 'div',
    className: 'tags',
    events: {
      'change': 'fetchPage',
      'click button.rename': 'renameTag',
      'click button.transfer': 'transferTag',
      'click button.delete': 'deleteTag',
    },

    initialize: async function(options) {
      OriginView.prototype.initialize.apply(this, arguments);
      this.model = new Backbone.Model();
      this.fetch();
    },

    fetch: async function(options) {
      try {
        const tags = new TagsCollection(options);
        const courses = new ContentCollection(undefined, { _type: 'course' });
        const assets = new ApiCollection(undefined, { url: 'api/assets' });
        
        await Promise.all([tags.fetch(), courses.fetch(), assets.fetch()])

        this.model.set('tags', tags.models
          .sort((t1, t2) => t1.get('title').localeCompare(t2.get('title')))
          .map(t => {
            const data = {
              ...t.attributes,
              courses: courses.models
                .filter(c => c.get('tags').includes(t.get('_id')))
                .map(c => c.attributes),
              assets: assets.models
                .filter(a => a.get('tags').includes(t.get('_id')))
                .map(a => a.attributes)
            };
            data.unused = !data.courses.length && !data.assets.length;
            return data;
          }));
        this.render();
      } catch(e) {
        console.log(e);
      }
    },

    getTagId(e) {
      return $(e.currentTarget).closest('tr').attr('data-id');
    },

    getTagData(e) {
      const id = this.getTagId(e);
      return this.model.get('tags').find(t => t._id === id);
    },

    renameTag: async function(e) {
      try {
        const tagData = this.getTagData(e);
        Origin.Notify.alert({
          type: 'input',
          title: 'Choose new name',
          inputValue: tagData.title,
          callback: async data => {
            const r = await $.ajax(`api/tags/${tagData._id}`, { method: 'PATCH', data: { title: data.value } });
            Origin.Notify.toast({ type: 'success', text: `Tag '${tagData.title}' successfully renamed to '${data.value}'`})
            this.fetch();
          }
        })
      } catch(e) {
        Origin.Notify.alert({ type: 'error', title: 'Failed to update tag', text: e.message })
      }
    },

    transferTag: async function(e) {
      try {
        const tagData = this.getTagData(e);
        await Promise.all([...tagData.courses, ...Promise.tagData.assets].map(d => {
          return $.ajax(`api/${d._type === 'course' ? 'content' : 'asset'}/${d._id}`, { method: 'PATCH', body: {
            tags: d.tags.filter(t => t._id !== tagData._id).concat(targetTag._id)
          } });
        }))
        await $.ajax(`api/tags/${tagData._id}`, { method: 'DELETE' });
        Origin.Notify.toast({ type: 'success', text: `Reassigned courses and assets tagged with '${tagData.title}' to '${targetTag.title}'`})
      } catch(e) {
        Origin.Notify.alert({ type: 'error', title: 'Failed to transfer tag', text: e.message })
      }
    },
    
    deleteTag: async function(e) {
      try {
        const tagData = this.getTagData(e);
        await $.ajax(`api/tags/${tagData._id}`, { method: 'DELETE' });
        Origin.Notify.toast({ type: 'success', text: `Deleted '${tagData.title}'`})
      } catch(e) {
        Origin.Notify.alert({ type: 'error', title: 'Failed to delete tag', text: e.message })
      }
    }
  }, {
    template: 'tags'
  });

  return TagsView;
});
