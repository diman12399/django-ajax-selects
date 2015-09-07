'use strict';

(function ($) {
  var extensionHandlers = {
        renderGoodPhotos: function(args) {
          var ul = args[0],
              item = args[1];

          return $('<li></li>')
            .data('item.autocomplete', item)
            .append('<a>' + item.name + ' ' + item.label + '</a>')
            .appendTo(ul);
        }
      },
      callbackHandlers = {
        selectGoodPhotos: function() {
          var $autocomplete = jQuery(this),
              $document = jQuery(document),
              args = Array.prototype.slice.call(arguments),
              context = args[0],
              params = args[1],
              data = args[2][1].item,
              photos = data.photos,
              instance = $autocomplete.data('uiAutocomplete'),
              menu = instance.menu.activeMenu,
              $photosMenu = jQuery('.JS-GoodPhotos').first().clone(),
              $photosItem = $photosMenu.find('.JS-GoodPhotos-Item').first().clone(),
              classPreloader = params.classPreloader || '';

          $photosMenu
            .css({
              top: menu.css('top'),
              left: menu.css('left'),
            });

          function setResult(pk, repr) {
            context.trigger('didAddPopup', [pk, repr]);

            return false;
          }

          function closePhotosMenu() {
            $photosMenu.remove();
          }

          function buildPhotoes() {
            var $content = jQuery(''),
                $switchers,
                $images,
                $switcher,
                $item,
                imgCount,
                img,
                i,
                l;

            for (i = 0, l = photos.length; i < l; i++) {
              img = '<img src="' + photos[i].src + '" />';
              $item = $photosItem.clone();
              $switcher = $item.find('.JS-GoodPhotos-Switcher').html(img);

              $switcher.data({
                pk: photos[i].pk,
                src: photos[i].src
              });

              $content = $content.add($item);
            }

            $photosMenu.html($content);

            $switchers = $photosMenu.find('.JS-GoodPhotos-Switcher');

            $switchers.on('click.selectGoodPhotos', function() {
              var $elem = jQuery(this),
                  pk = $elem.data('pk'),
                  repr = '<img src="' + $elem.data('src') + '"> <a href="' + data.link + '" target="_blank">' + data.name + '</a>, <i>' + data.value + '</i>';

              setResult(pk, repr);

              closePhotosMenu();
            });

            $autocomplete.on('input.selectGoodPhotos', function() {
              closePhotosMenu(true);
              $autocomplete.off('input.selectGoodPhotos');
            });

            $document.on('click.selectGoodPhotos', function(e) {
              if (!jQuery(e.target).closest($switchers.add(menu)).length) {
                closePhotosMenu();
                $document.off('click.selectGoodPhotos');
              }
            });

            $images = $switchers.find('img');
            imgCount = $images.length;

            $images.on('load error', function() {
              if (!(--imgCount)) {
                $photosMenu.removeClass(classPreloader);
              }
            });

            jQuery('body').append($photosMenu.show());
          }

          buildPhotoes();
        }
      };

  $.fn.autocompleteselect = function (options, callbacks, extensions, params) {
    return this.each(function () {
      var id = this.id,
          $this = $(this),
          $text = $('#' + id + '_text'),
          $deck = $('#' + id + '_on_deck'),
          instance,
          callbackItem,
          extensionItem;

      function receiveResult(event, ui) {
        if ($this.val()) {
          kill();
        }
        $this.val(ui.item.pk);
        $text.val('');
        addKiller(ui.item.repr, ui.item.pk);
        $deck.trigger('added', [ui.item.pk, ui.item]);
        $this.trigger('change');

        return false;
      }

      function addKiller(repr, pk) {
        var killer_id = 'kill_' + pk + id,
            killButton = '<span class="ui-icon ui-icon-trash" id="' + killer_id + '">X</span> ';
        if (repr) {
          $deck.empty();
          $deck.append('<div>' + killButton + repr + '</div>');
        } else {
          $('#' + id+'_on_deck > div').prepend(killButton);
        }
        $('#' + killer_id).click(function () {
          kill();
          $deck.trigger('killed', [pk]);
        });
      }

      function kill() {
        $this.val('');
        $deck.children().fadeOut(1.0).remove();
      }

      options.select = receiveResult;

      if (Object.keys(callbacks).length) {
        for (callbackItem in callbacks) {
          options[callbackItem] = function() {
            var args = Array.prototype.slice.call(arguments);

            callbackHandlers[callbacks[callbackItem]].apply(this, [$this, params, args]);
          }
        }
      }

      $text.autocomplete(options);

      if (Object.keys(extensions).length) {
        instance = $text.data('uiAutocomplete');

        for (extensionItem in extensions) {
          instance[extensionItem] = function() {
            var args = Array.prototype.slice.call(arguments);

            return extensionHandlers[extensions[extensionItem]](args);
          }
        }
      }

      if (options.initial) {
        addKiller(options.initial[0], options.initial[1]);
      }

      $this.bind('didAddPopup', function (event, pk, repr) {
        receiveResult(null, {item: {pk: pk, repr: repr}});
      });
    });
  };

  $.fn.autocompleteselectmultiple = function (options) {
    return this.each(function () {
      var id = this.id,
          $this = $(this),
          $text = $('#' + id+'_text'),
          $deck = $('#' + id+'_on_deck');

      function receiveResult(event, ui) {
        var pk = ui.item.pk,
            prev = $this.val();

        if (prev.indexOf('|'+pk+'|') === -1) {
          $this.val((prev ? prev : '|') + pk + '|');
          addKiller(ui.item.repr, pk);
          $text.val('');
          $deck.trigger('added', [ui.item.pk, ui.item]);
          $this.trigger('change');
        }
        return false;
      }

      function addKiller(repr, pk) {
        var killer_id = 'kill_' + pk + id,
            killButton = '<span class="ui-icon ui-icon-trash" id="' + killer_id + '">X</span> ';
        $deck.append('<div id="' + id + '_on_deck_' + pk + '">' + killButton + repr + ' </div>');

        $('#' + killer_id).click(function () {
          kill(pk);
          $deck.trigger('killed', [pk]);
        });
      }

      function kill(pk) {
        $this.val($this.val().replace('|' + pk + '|', '|'));
        $('#' + id+'_on_deck_'+pk).fadeOut().remove();
      }

      options.select = receiveResult;

      $text.autocomplete(options);

      if (options.initial) {
        $.each(options.initial, function (i, its) {
          addKiller(its[0], its[1]);
        });
      }

      $this.bind('didAddPopup', function (event, pk, repr) {
        receiveResult(null, {item: {pk: pk, repr: repr }});
      });
    });
  };

  function addAutoComplete (inp, callback) {
    var $inp = $(inp),
        html_id = inp.id,
        prefix_id = html_id,
        opts = JSON.parse($inp.attr('data-plugin-options')),
        extensions = JSON.parse($inp.attr('data-plugin-extensions') || '{}'),
        callbacks = JSON.parse($inp.attr('data-plugin-callbacks') || '{}'),
        params = JSON.parse($inp.attr('data-plugin-params') || '{}'),
        prefix = 0;

    /* detects inline forms and converts the html_id if needed */
    if (html_id.indexOf('__prefix__') !== -1) {
      // Some dirty loop to find the appropriate element to apply the callback to
      while ($('#' + html_id).length) {
        html_id = prefix_id.replace(/__prefix__/, prefix++);
      }
      html_id = prefix_id.replace(/__prefix__/, prefix - 2);
      // Ignore the first call to this function, the one that is triggered when
      // page is loaded just because the 'empty' form is there.
      if ($('#' + html_id + ', #' + html_id + '_text').hasClass('ui-autocomplete-input')) {
        return;
      }
    }

    callback($inp, opts, callbacks, extensions, params);
  }

  // allow html in the results menu
  // https://github.com/scottgonzalez/jquery-ui-extensions
  var proto = $.ui.autocomplete.prototype,
      initSource = proto._initSource;

  function filter(array, term) {
    var matcher = new RegExp($.ui.autocomplete.escapeRegex(term), 'i');
    return $.grep(array, function(value) {
      return matcher.test($('<div>').html(value.label || value.value || value).text());
    });
  }

  $.extend(proto, {
    _initSource: function() {
      if (this.options.html && $.isArray(this.options.source)) {
        this.source = function(request, response) {
          response(filter(this.options.source, request.term));
        };
      } else {
        initSource.call(this);
      }
    },
    _renderItem: function(ul, item) {
      var body = this.options.html ? item.match: item.label;
      return $('<li></li>')
        .data('item.autocomplete', item)
        .append($('<a></a>')[this.options.html ? 'html' : 'text' ](body))
        .appendTo(ul);
    }
  });

  /*  the popup handler
    requires RelatedObjects.js which is part of the django admin js
    so if using outside of the admin then you would need to include that manually */
  window.didAddPopup = function (win, newId, newRepr) {
    var name = window.windowname_to_id(win.name);
    $('#' + name).trigger('didAddPopup', [window.html_unescape(newId), window.html_unescape(newRepr)]);
    win.close();
  };

  // activate any on page
  $(window).bind('init-autocomplete', function () {
    $('input[data-ajax-select=autocomplete]').each(function (i, inp) {
      addAutoComplete(inp, function ($inp, opts) {
        opts.select =
            function (event, ui) {
              $inp.val(ui.item.value).trigger('added', [ui.item.pk, ui.item]);
              return false;
            };
        $inp.autocomplete(opts);
      });
    });

    $('input[data-ajax-select=autocompleteselect]').each(function (i, inp) {
      addAutoComplete(inp, function ($inp, opts, callbacks, extensions, params) {
        $inp.autocompleteselect(opts, callbacks, extensions, params);
      });
    });

    $('input[data-ajax-select=autocompleteselectmultiple]').each(function (i, inp) {
      addAutoComplete(inp, function ($inp, opts) {
        $inp.autocompleteselectmultiple(opts);
      });
    });

  });

  $(document).ready(function () {
    // if dynamically injecting forms onto a page
    // you can trigger them to be ajax-selects-ified:
    $(window).trigger('init-autocomplete');
    $(document).on('click', '.inline-group ul.tools a.add, .inline-group div.add-row a, .inline-group .tabular tr.add-row td a, .grp-dynamic-form a.grp-add-handler', function() {
      $(window).trigger('init-autocomplete');
    });
  });

})(window.jQuery);
