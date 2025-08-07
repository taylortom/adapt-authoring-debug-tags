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
        
        await Promise.all([tags.fetch(), courses.fetch(), assets.fetch()]);

        let unused = 0;
        
        this.model.set('tags', tags.models
          .sort((t1, t2) => t1.get('title').localeCompare(t2.get('title')))
          .map(t => {
            const types = ['assets', 'courses'];
            const data = Object.assign({}, t.attributes, { assets, courses });
            types.forEach(type => {
              data[type] = data[type].models
                .map(item => item.attributes)
                .filter(item => {
                  try { 
                    return item.get('tags').includes(t.get('_id')) 
                  } catch(e) { return false } 
                })
            });
            data.unused = types.every(type => !data[type].length);
            if(data.unused) unused++;
            return data;
          }));
        this.model.set('unused', unused);

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
          icon: 'question',
          inputValue: tagData.title,
          showCancelButton: true,
          callback: async data => {
            if(data.isDismissed) {
              return
            }
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
        Origin.Notify.alert({
          input: 'select',
          title: 'Choose destination tag',
          text: 'All items using the tag will be transferred to the destination tag',
          icon: 'question',
          showCancelButton: true,
          inputOptions: this.model.get('tags').reduce((tagMemo, tag) => {
            return Object.assign(tagMemo, { [tag._id]: tag.title })
          }, {}),
          callback: async data => {
            if(data.isDismissed) {
              return
            }
            const destTag = this.model.get('tags').find(t => t._id === data.value)
            await $.ajax(`api/tags/transfer/${tagData._id}?deleteSourceTag=false`, { method: 'POST', contentType: 'application/json', data: JSON.stringify({ destId: destTag._id }) });
            Origin.Notify.toast({ type: 'success', text: `Reassigned courses and assets tagged with '${tagData.title}' to '${destTag.title}'`})
            this.fetch();
          }
        })
      } catch(e) {
        Origin.Notify.alert({ type: 'error', title: 'Failed to transfer tag', text: e.message })
      }
    },
    
    deleteTag: async function(e) {
      try {
        const tagData = this.getTagData(e);
        await $.ajax(`api/tags/${tagData._id}`, { method: 'DELETE' });
        Origin.Notify.toast({ type: 'success', text: `Deleted '${tagData.title}'`})
        this.fetch();
      } catch(e) {
        Origin.Notify.alert({ type: 'error', title: 'Failed to delete tag', text: e.message })
      }
    },
    
    deleteUnusedTags: async function(e) {
      try {
        await Promise.all(this.get('tags').map(t => {
          if(t.unused) {
            return $.ajax(`api/tags/${tagData._id}`, { method: 'DELETE' });
          }
        }));
        Origin.Notify.toast({ type: 'success', text: `Deleted '${tagData.title}'`})
        this.fetch();
      } catch(e) {
        Origin.Notify.alert({ type: 'error', title: 'Failed to delete tag', text: e.message })
      }
    }
  }, {
    template: 'tags'
  });

  return TagsView;
});
