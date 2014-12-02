/**
 * Copyright (c) 2012 Memorial Sloan-Kettering Cancer Center.
 * This library is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; either version 2.1 of the License, or
 * any later version.
 * 
 * This library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  The software and
 * documentation provided hereunder is on an "as is" basis, and
 * Memorial Sloan-Kettering Cancer Center
 * has no obligations to provide maintenance, support,
 * updates, enhancements or modifications.  In no event shall
 * Memorial Sloan-Kettering Cancer Center
 * be liable to any party for direct, indirect, special,
 * incidental or consequential damages, including lost profits, arising
 * out of the use of this software and its documentation, even if
 * Memorial Sloan-Kettering Cancer Center
 * has been advised of the possibility of such damage.  See
 * the GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation,
 * Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA.
 * 
 * @author Hongxin ZHang
 * @date Nov. 2014
 * 
 */

var Table = function() {
    var divs = {},
        attr = [],
        arr = [],
        dataTable = '',
        callbacks = {},
        initStatus = false;
    
    function init(input) {
        initStatus = true;
        try {
            initData(input);
            initDiv();
            initTable(input.data);
            initDataTable();
            addEvents();
        }catch(e) {
            initStatus = false;
            throw e;
        }
        if(callbacks.hasOwnProperty('callback')) {
            callbacks.callback();
        }
    }
    
    function initData(input) {
        if(input.hasOwnProperty('opts') && input.opts.hasOwnProperty('parentId')) {
            var tableId = input.opts.hasOwnProperty('tableId')?input.opts.tableId:createTableId();

            divs.attachedId = input.opts.parentId;
            divs.mainId = tableId + '-main';
            divs.title = input.opts.title || 'Unknown';
            divs.titleId = tableId + '-title';
            divs.titleWrapperId = divs.titleId + '-wrapper';
            divs.deleteIconId = divs.titleId + '-delete';
            divs.tableId = tableId;
            divs.headerId = tableId + '-header';
            divs.reloadId = tableId + '-reload-icon';
            divs.downloadId = tableId + '-download-icon';
            divs.downloadWrapperId = tableId + '-download-icon-wrapper'
            divs.loaderId = tableId + '-loader';
        }else {
            initStatus = false;
        }
        
        if(input.hasOwnProperty('callbacks')) {
            callbacks = input.callbacks;
        }
    }
    
    function createTableId() {
        var randomId = 'special-table-' + Math.floor((Math.random() * 100) + 1);
        if($('#' + randomId).length === 0) {
            return randomId;
        }else {
            return createTableId();
        }
    }
    
    function initDiv() {
        var _div = "<div id='"+divs.mainId+"' class='study-view-dc-chart study-view-tables h1half w2'>"+
            "<div id='"+divs.headerId+"'style='height: 16px; width:100%; float:left; text-align:center;'>"+
                "<div class='titleWrapper' id='"+divs.titleWrapperId+"'>"+
                    "<img id='"+divs.reloadId+"' class='study-view-title-icon hidden hover' src='images/reload-alt.svg'/>"+    
//                    "<div id='"+divs.downloadWrapperId+"' class='study-view-download-icon'>" +
//                        "<img id='"+divs.downloadId+"' style='float:left' src='images/in.svg'/>"+
//                    "</div>"+
                    "<img class='study-view-drag-icon' src='images/move.svg'/>"+
                    "<span id='"+divs.deleteIconId+"' class='study-view-tables-delete'>x</span>"+
                "</div>"+
                "<chartTitleH4 id='"+divs.titleId+"'>"+divs.title+"</chartTitleH4>" +
            "</div>"+
            "<div id='"+divs.tableId+"'>"+
            "</div>"+
            "<div id='"+divs.loaderId+"' class='study-view-loader' style='top:30%;left:30%'><img src='images/ajax-loader.gif'/></div>"+
        "</div>"
        $('#' + divs.attachedId).append(_div);
    }
    
    function addEvents() {
        showHideDivision('#' + divs.mainId,['#' + divs.titleWrapperId],  0);
        chartDelete();
    }
    
    function chartDelete() {
        $('#'+ divs.deleteIconId).click(function() {
            if(callbacks.hasOwnProperty('deleteTable')) {
                callbacks.deleteTable(divs.mainId, divs.title);
            }else {
                $('#'+divs.mainId).remove();
            }
        });
    }
    
    function initTable(data) {
        var table = $('#' + divs.tableId);
        
        arr = data.arr;
        attr = data.attr;
    
        var tableHtml = '<table><thead><tr></tr></thead><tbody></tbody></table>';
        table.html(tableHtml);
        
        var tableHeader = table.find('table thead tr');
        
        //Append table header
        attr.forEach(function(e, i) {
            tableHeader.append('<th>'+ e.displayName +'</th>');
        });
        
        var tableBody = table.find('tbody');
        
        //Append table body
        arr.forEach(function(e, i){
            var _row= '<tr>';
            attr.forEach(function(e1, i1){
                _row += '<td>' + e[e1.name] + '</td>';
            });
            _row += '</tr>';
            tableBody.append(_row);
        });
    }
    
    function initDataTable() {
        var dataTableOpts = {
            "sDom": 'rt<f>',
            "sScrollY": '240',
            "bPaginate": false,
            "aaSorting": [],
            "bAutoWidth": true,
            "aoColumnDefs": [],
            "fnInitComplete": function(oSettings, json) {
                $('#'+ divs.tableId +' .dataTables_filter')
                        .find('label')
                        .contents()
                        .filter(function(){
                            return this.nodeType === 3;
                        }).remove();

                $('#'+ divs.tableId +' .dataTables_filter')
                        .find('input')
                        .attr('placeholder', 'Search...');
            }
        };
        
        var geneIndex = -1,
            altTypeIndex = -1,
            cytobandIndex = -1,
            mutatedSamplesIndex = -1;
        
        attr.forEach(function(e, i){
            if(e.name === 'gene') {
                geneIndex = i;
            }
            if(e.name === 'altType') {
                altTypeIndex = i;
            }
            if(e.name === 'cytoband') {
                cytobandIndex = i;
            }
            if(e.name === 'mutatedSamples') {
                mutatedSamplesIndex = i;
            }
        });
        
        if(mutatedSamplesIndex !== -1) {
            dataTableOpts.aaSorting.push([mutatedSamplesIndex, 'desc']); 
        }
        
        if(altTypeIndex !== -1) {
            dataTableOpts.aoColumnDefs.push({
                "aTargets": [altTypeIndex],
                "mDataProp": function(source,type) {
                    var _altType = source[altTypeIndex];
                    if (type==='display') {
                        var str = '';
                        if(_altType === 'AMP') {
                            str += '<span style="color:red;font-weight:bold">'+_altType+'</span>';
                        }else {
                            str += '<span style="color:blue;font-weight:bold">'+_altType+'</span>';
                        }
                        return str;
                    }
                    return _altType;
                }
            });
            dataTableOpts.aaSorting.push([3, 'desc']);
        }
        
        if(cytobandIndex !== -1) {
            dataTableOpts.aoColumnDefs.push({
                "aTargets": [cytobandIndex],
                "sType": 'cytoband-base',
                "mDataProp": function(source,type) {
                    var _cytoband = source[cytobandIndex];
                    if (type==='display') {
                        var str = '';
                        if(_cytoband.toString().length > 8) {
                            str += '<span class="hasQtip" qtip="'+_cytoband+'">'+_cytoband.substring(0,7) + '...'+'</span>';
                        }else {
                            str = _cytoband;
                        }
                        return str;
                    }
                    return _cytoband;
                }
            });
        }
        if(geneIndex !== -1) {
            dataTableOpts.aoColumnDefs.push({
                "aTargets": [geneIndex],
                "mDataProp": function(source,type) {
                    var _gene = source[geneIndex];
                    if (type==='display') {
                        var str = '';
                        if(_gene.toString().length > 8) {
                            str += '<span class="hasQtip" qtip="'+_gene+'">'+_gene.substring(0,5) + '...'+'</span>';
                        }else {
                            str = _gene;
                        }
                        return str;
                    }
                    return _gene;
                }
            });
              
            dataTableOpts.fnDrawCallback = function() {
                $('#'+ divs.tableId).find('span.hasQtip').each(function(e, i) {
                    $(this).qtip('destroy', true);
                    $(this).qtip({
                        content: {text: $(this).attr('qtip')},
                        hide: { fixed: true, delay: 100 },
                        style: { classes: 'qtip-light qtip-rounded qtip-shadow', tip: true },
                        position: {my:'center left',at:'center right',viewport: $(window)}
                    });
                });
            };
        }
        dataTable = $('#'+ divs.tableId +' table').dataTable(dataTableOpts);
    }
    
    function redraw(data, callback) {
        dataTable.api().destroy();
        $('#' + divs.tableId).empty();
        initTable(data);
        initDataTable();
        callback();
    }
    
    function showHideDivision(_listenedDiv, _targetDiv, _time){
        var _targetLength = _targetDiv.length;
        for ( var i = 0; i < _targetLength; i++) {
            $(_targetDiv[i]).css('display', 'none');
        }
        $(_listenedDiv).hover(function(){
            $(_listenedDiv).css('z-index', '1');
            for ( var i = 0; i < _targetLength; i++) {
                $(_targetDiv[i]).stop().fadeIn(_time, function(){
                    $(this).css('display', 'block');
                });
            }
        }, function(){
            $(_listenedDiv).css('z-index', '0');
            for ( var i = 0; i < _targetLength; i++) {
                $(_targetDiv[i]).stop().fadeOut(_time, function(){
                    $(this).css('display', 'none');
                });
            }
        });
    }
    
    return {
        init: init,
        getDataTable: function() {
            return dataTable;
        },
        redraw: redraw,
        getInitStatus: function(){
            return initStatus;
        },
        resize: function() {
            dataTable.fnAdjustColumnSizing();
        },
        startLoading: function() {
            $('#' + divs.loaderId).css('display', 'block');
            $('#' + divs.tableId).css('opacity', '0.3');
        },
        stopLoading: function() {
            $('#' + divs.loaderId).css('display', 'none');
            $('#' + divs.tableId).css('opacity', '1');
        }
    };
};