var currentPlugin = null;
var filterHiddenSrc = [];
var filterCategory = '';
var filterInstalled = false;
var filterNotInstalled = false;
var currentSearchValue = '';

// Point d'entrée du script
$(document).ready(function () {
    refresh();
    initFilters();
});

/**
 * Initialise les évènements des filtres
 */
function initFilters() {
    $('#market-filter-src button').click(function () {
        var github = $(this).data('github');
        if (isActive($(this))) {
            filterHiddenSrc.push(github);
            setActive($(this), false);
        }
        else {
            var itemIndex = -1;
            for (var index = 0; index < filterHiddenSrc.length; ++index) {
                if (filterHiddenSrc[index] == github) {
                    itemIndex = index;
                }
            }
            if (itemIndex > -1) {
                filterHiddenSrc.splice(itemIndex, 1);
            }
            setActive($(this), true);
        }
        updateFilteredList();
    });
    $('#market-filter-category').change(function () {
        var selectedCategory = $("#market-filter-category option:selected").val();
        if (selectedCategory != 'all') {
            filterCategory = selectedCategory;
        }
        else {
            filterCategory = '';
        }
        updateFilteredList();
    });
    $('#market-filter-installed').click(function () {
        if (isActive($(this))) {
            filterInstalled = true;
            setActive($(this), false);
            if (filterNotInstalled) {
                setActive($('#market-filter-notinstalled'), true);
                filterNotInstalled = false;
            }
        }
        else {
            filterInstalled = false;
            setActive($(this), true);
        }
        updateFilteredList();
    });
    $('#market-filter-notinstalled').click(function () {
        if (isActive($(this))) {
            filterNotInstalled = true;
            setActive($(this), false);
            if (filterInstalled) {
                setActive($('#market-filter-installed'), true);
                filterInstalled = false;
            }
        }
        else {
            filterNotInstalled = false;
            setActive($(this), true);
        }
        updateFilteredList();
    });
    $('#market-search').keyup(function() {
        currentSearchValue = $(this).val();
        updateFilteredList();
    });
    $('#refresh-markets').click(function () {
        refresh(true);
    });
    $('#configure-markets').click(function () {
        showConfigModal();
    });
}

/**
 * Test si un bouton est actif
 *
 * @param button Bouton à tester
 *
 * @returns {boolean} True si le bouton est actif
 */
function isActive(button) {
    var result = false;
    if (button.hasClass('btn-primary')) {
        result = true;
    }
    return result;
}

/**
 * Change l'état d'activation d'un bouton
 *
 * @param button Bouton à changer
 * @param activate Etat à changer
 */
function setActive(button, activate) {
    if (activate) {
        button.removeClass('btn-secondary');
        button.addClass('btn-primary');
    }
    else {
        button.removeClass('btn-primary');
        button.addClass('btn-secondary');
    }
}

/**
 * Met à jour la liste des éléments affichés
 */
function updateFilteredList() {
    $('#market-div>div').each(function () {
        var hide = false;
        var dataGitUser = $(this).data('gituser');
        var dataCategory = $(this).data('category');
        var dataInstalled = $(this).data('installed');
        if (filterHiddenSrc.indexOf(dataGitUser) !== -1) {
            hide = true;
        }
        if (filterCategory != '' && filterCategory != dataCategory) {
            hide = true;
        }
        if (filterInstalled && dataInstalled == true) {
            hide = true;
        }
        if (filterNotInstalled && dataInstalled == false) {
            hide = true;
        }
        if (!hide && currentSearchValue.length > 1 && $(this).find('h4').text().indexOf(currentSearchValue) == -1) {
            hide = true;
        }
        if (hide) {
            $(this).slideUp();
        }
        else {
            $(this).slideDown();
        }
    });
}

/**
 * Rafraichit les éléments affichés
 */
function refresh(force) {
    var params = 'list';
    if (typeof force !== undefined && force === true) {
        params = 'list-force';
    }
    $.post({
        url: 'plugins/AlternativeMarketForJeedom/core/ajax/AlternativeMarketForJeedom.ajax.php',
        data: {
            action: 'refresh',
            params: params,
            data: gitsList
        },
        dataType: 'json',
        success: function (data, status) {
            // Test si l'appel a échoué
            if (data.state !== 'ok' || status !== 'success') {
                $('#div_alert').showAlert({message: data.result, level: 'danger'});
            }
            else {
                refreshItems();
            }
        },
        error: function (request, status, error) {
            handleAjaxError(request, status, error);
        }
    });
}

/**
 * Rafraichit un elément
 */
function refreshItems() {
    $.post({
        url: 'plugins/AlternativeMarketForJeedom/core/ajax/AlternativeMarketForJeedom.ajax.php',
        data: {
            action: 'get',
            params: 'list',
            data: gitsList
        },
        dataType: 'json',
        success: function (data, status) {
            // Test si l'appel a échoué
            if (data.state !== 'ok' || status !== 'success') {
                $('#div_alert').showAlert({message: data.result, level: 'danger'});
            }
            else {
                showItems(data['result']);
            }
        },
        error: function (request, status, error) {
            handleAjaxError(request, status, error);
        }
    });
}

/**
 * Affiche les élements
 *
 * @param items Liste des éléments
 */
function showItems(items) {
    var container = $('#market-div');
    container.empty();
    for (var index = 0; index < items.length; ++index) {
        container.append(getItemHtml(items[index]));
    }
    $('.media').click(function () {
        showPluginModal($(this).data('plugin'));
    });

}

/**
 * Obtenir le code HTML d'un élément
 *
 * @param item Informations de l'élément à créer
 *
 * @returns {string} Code HTML
 */
function getItemHtml(item) {
    var title = item['name'];
    if (title !== null) {
        title = title.replace(/([a-z])([A-Z][a-z])/g, '\$1 \$2');
    }
    var pluginData = JSON.stringify(item);
    pluginData = pluginData.replace(/"/g, '&quot;');
    var result = '' +
        '<div class="media-container col-xs-12 col-sm-6 col-md-4" data-gituser="' + item['gitUser'] + '" data-category="' + item['category'] + '" data-installed="'+item['installed']+'">' +
        '<div class="media" data-plugin="' + pluginData + '">';
    if (item['installed']) {
        result += '<div class="installed-marker"><i class="fa fa-check"></i></div>';
    }
    result += '' +
        '<div class="media-left media-middle">' +
        '<img src="' + item['iconPath'] + '"/>' +
        '</div>' +
        '<div class="media-body">' +
        '<h4 class="media-heading">' + title + '</h4>' +
        '<p>' + item['description'] + '</p>' +
        '<button>'+ 'Plus d\'informations' +'</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    return result;
}

/**
 * Affiche la fenêtre d'un plugin
 */
function showPluginModal(pluginData) {
    $('#md_modal').dialog({title: pluginData['name']});
    $('#md_modal').load('index.php?v=d&plugin=AlternativeMarketForJeedom&modal=plugin.AlternativeMarketForJeedom').dialog('open');
    currentPlugin = pluginData;
}

/**
 * Affiche la fenêtre de configuration
 */
function showConfigModal() {
    $('#md_modal').dialog({title: 'Configuration'});
    $('#md_modal').load('index.php?v=d&plugin=AlternativeMarketForJeedom&modal=config.AlternativeMarketForJeedom').dialog('open');
}
