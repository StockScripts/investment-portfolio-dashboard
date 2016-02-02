var the_sum = 100000;
var groupsColors = ['#fb8c00', '#1976d2'];

function drawDonutChart(container_id) {
  var chart = anychart.pie();
  chart.interactivity('single');
  chart.legend(false);
  chart.radius('40%');
  chart.innerRadius('60%');
  chart.padding(0);
  chart.margin(0);
  chart.explode(0);
  chart.labels(false);
  var dataset = anychart.data.set();
  chart.data(dataset);
  var stage = anychart.graphics.create(container_id);
  chart.container(stage);
  var path = stage.path().stroke(null).zIndex(10);
  chart.draw();
  return {'chart': chart, 'path': path, 'dataset': dataset};
}

function updateDonutListeners(donutData, instrumentsTable){
  var groupIndexes = [];
  donutData['chart'].listen('pointshover', function (e) {
        drawHoverArc(e.point, donutData['chart'], donutData['data'], donutData['path']);
        groupIndexes = [];
        var colorFill = '#ffa760';
        if (donutData['data'][e.point.index]['group'] == 'bonds') colorFill = '#6fc0fe';
        if ($('#table-container').is(':visible')) {
          groupIndexes = [e.point.index];
          highLightRowInTable(groupIndexes, instrumentsTable, colorFill + ' 0.3')
        }
      });
  donutData['chart'].listen('mouseout', function (e) {
        if ($('#table-container').is(':visible')) highLightRowInTable(groupIndexes, instrumentsTable, null);
      });

  function createChartLabel(index, anchor, groupName, groupColor) {
    var label = donutData['chart'].label(index).useHtml(true);
    label.position('center');
    label.fontColor(groupColor);
    label.anchor(anchor);
    label.offsetY(-10);
    label.offsetX(10);
    label.hAlign('center');
    label.listen('mouseOver', function () {
      document.body.style.cursor = 'pointer';
      groupIndexes = [];
      for (i = 0; i < donutData['data'].length; i++){
        if (donutData['data'][i]["group"] == groupName) groupIndexes.push(i)
      }
      if ($('#table-container').is(':visible')) highLightRowInTable(groupIndexes, instrumentsTable, groupColor + ' 0.3');

      donutData['chart'].unhover();
      donutData['chart'].hover(groupIndexes);
      donutData['path'].clear();
      for (var i = 0; i < groupIndexes.length; i++){
        drawHoverArc(donutData['chart'].getPoint(groupIndexes[i]), donutData['chart'], donutData['data'], donutData['path'], true);
      }
    });
    label.listen('mouseOut', function () {
      document.body.style.cursor = '';
      donutData['chart'].unhover();
      donutData['path'].clear();
      if ($('#table-container').is(':visible')) highLightRowInTable(groupIndexes, instrumentsTable, null);
    });
  }
  createChartLabel(0, 'left', 'stocks', '#ffa760');
  createChartLabel(1, 'right', 'bonds', '#6fc0fe');
}

function drawForecastChart(container_id) {
  var chart = anychart.area();
  chart.tooltip().useHtml(true);
  var lineDataset = anychart.data.set();
  chart.spline(lineDataset).stroke('#64b5f6').tooltip()
    .textFormatter(function(){
      return '<span style="color: #d9d9d9">Forecast:</span> $' + this.value.toLocaleString();
  });
  var rangeDataset = anychart.data.set();
  chart.rangeSplineArea(rangeDataset).fill('#64b5f6 0.3').highStroke(null).lowStroke(null).hoverMarkers(null).tooltip()
    .textFormatter(function(){
      return '<br/><span style="color: #d9d9d9">High:</span> $' + this.high.toLocaleString() +
          '<br/><span style="color: #d9d9d9">Low:</span> $' + this.low.toLocaleString();
  });
  chart.tooltip().displayMode('union');
  chart.yAxis().labels().textFormatter(function(){return '$' + this.value.toLocaleString()});
  chart.container(container_id);
  chart.draw();
  return {'chart': chart, 'lineDataset': lineDataset, 'rangeDataset': rangeDataset};
}

function updateForecastData(forecastData){
  var time_data = [];
  var approximate_data = [];
  var year = new Date().getFullYear();
  for (var i = 0; i <= forecastData['length']; i++){
    var item = 0;
    for (var j = 0; j < forecastData['data'].length; j++){
      item = item + forecastData['data'][j]['value'] * Math.pow((1 + forecastData['data'][j]['coefficient'] / 100), i);
    }
    time_data.push({x: year + i, value: item.toFixed(2)});
    var shadow = i / 200;
    approximate_data.push({x: year + i, low: item.toFixed(2) * (1 - shadow), high: item.toFixed(2) * (1 + shadow)});
  }
  if (forecastData['length'] > 0) forecastData['chart'].xScale().ticks().interval(1);
  if (forecastData['length'] > 10) forecastData['chart'].xScale().ticks().interval(2);
  if (forecastData['length'] >= 20) forecastData['chart'].xScale().ticks().interval(5);
  forecastData['lineDataset'].data(time_data);
  forecastData['rangeDataset'].data(approximate_data);
}

function drawTable(container_id){
  var table = anychart.ui.table();
  table.container(container_id);
  table.cellBorder(null);
  table.cellBorder().bottom('1px #dedede');
  table.fontSize(12).vAlign('middle').hAlign('left').fontColor('#212121');
  table.contents([['Name', 'Ticker', 'Percent', 'Price', 'Amount', 'Total Sum']]);
  table.getCol(0).fontSize(11);
  table.getRow(0).cellBorder().bottom('2px #dedede').fontColor('#7c868e').height(50).fontSize(12);
  table.getCol(1).width(60);
  table.getCol(2).width(60);
  table.getCol(3).width(75);
  table.getCol(4).width(60);
  table.getCol(5).width(90);
  table.draw();
  return table;
}

function updateTableData(table, data){
  var contents = [
    ['Name', 'Ticker', 'Percent', 'Price', 'Amount', 'Total Sum']
  ];
  for (var i = 0; i < data.length; i++){
    contents.push([
        data[i]['name'],
        data[i]['ticker'],
        data[i]['percent'] + '%',
        '$' + parseFloat(data[i]['price']).toLocaleString(),
        data[i]['amount'],
        '$' + parseFloat(data[i]['value']).toLocaleString()
    ]);
  }
  table.contents(contents);
  table.draw();
}

function highLightRowInTable(indexes, table, color){
  if (!indexes) return;
  for (var i = 0; i < indexes.length; i++){
    table.getRow(indexes[i] + 1).cellFill(color);
  }
}

function drawStockChart(container_id, data){
  var stock = anychart.stock();
  var plot = stock.plot();
  plot.yAxis(1).orientation('right');
  //plot.yScale('log');
  stock.padding(0, 80, 0, 80);
  stock.container(container_id);

  var mainTable = anychart.data.table('date');
  var mainMapping = mainTable.mapAs({value: {column: 'value', type: 'close'}});
  plot.line(mainMapping).name('Portfolio').stroke('2 #64b5f6');

  var SP500Table = anychart.data.table('date');
  var SP500Mapping = SP500Table.mapAs({value: {column: 'value', type: 'close'}});
  var SP500Series = plot.line(SP500Mapping).name('S&P 500').stroke('1.5 #ef6c00');
  SP500Table.addData(data['S&P 500']);

  var DowTable = anychart.data.table('date');
  var DowMapping = DowTable.mapAs({value: {column: 'value', type: 'close'}});
  var DowSeries = plot.line(DowMapping).name('Dow').stroke('1.5 #ffa000');
  DowTable.addData(data['Dow']);

  var NasdaqTable = anychart.data.table('date');
  var NasdaqMapping = NasdaqTable.mapAs({value: {column: 'value', type: 'close'}});
  var NasdaqSeries = plot.line(NasdaqMapping).name('NASDAQ').stroke('1.5 #ffd54f');
  NasdaqTable.addData(data['NASDAQ']);

  stock.scroller().line(mainMapping);
  stock.draw();
  return {'stock': stock, 'mainTable': mainTable, 'SP500': SP500Series, 'Dow': DowSeries, 'NASDAQ': NasdaqSeries};
}

function changeStockChart(stockData){
  stockData['mainTable'].remove();
  stockData['mainTable'].addData(stockData['mainData']);
}

function drawHoverArc(point, chart, data, path, needClear){
  var colorFill = '#ffa760';
  if (data[point.index]['group'] == 'bonds') colorFill = '#6fc0fe';
  drawArc(point, chart, colorFill, path, !needClear)
}

function getDataInProportion(data, proportion){
  var sum_1 = (the_sum * proportion[0][0])/(proportion[0][0] + proportion[1][0]);
  proportion[0][2] = sum_1/proportion[0][0];
  proportion[1][2] = (the_sum - sum_1)/proportion[1][0];
  var result = {"data": [], "proportion": proportion};
  for (var j = 0; j < proportion.length; j++) {
    var group_palette = anychart.palettes.distinctColors(anychart.color.singleHueProgression(groupsColors[j], proportion[j][0] + 1));
    for (var i = 0; i < proportion[j][0]; i++) {
      var point = {};
      point['price'] = data[proportion[j][1]][i]['value'];
      point['amount'] = parseInt(proportion[j][2]/point['price']);
      point['value'] = parseFloat((point['amount'] * point['price']).toFixed(2));
      point['percent'] = parseFloat((point['value'] * 100 / the_sum).toFixed(2));
      point['coefficient'] = data[proportion[j][1]][i]['coefficient'];
      point['ticker'] = data[proportion[j][1]][i]['ticker'];
      point['group'] = proportion[j][1];
      point['name'] = data[proportion[j][1]][i]['name'];
      point['fill'] = group_palette.colorAt(proportion[j][0] - i);
      point['hoverFill'] = anychart.color.lighten(anychart.color.lighten(group_palette.colorAt(proportion[j][0] - i)));
      point['stroke'] = null;
      point['hoverStroke'] = null;
      result["data"].push(point)
    }
  }
  return result
}

anychart.onDocumentReady(function () {
  var donutData, forecastData, instrumentsTable, stockData;

  var updateDonutData = function(data, stocks_amount, bonds_amount){
    var updateLabel = function (index) {
      donutData['chart'].label(index).text(
          '<span style="font-size: 24px;">' + donutData['proportion'][index][0] + '</span><br/>' +
          '<span style="font-size: 14px; font-weight: normal">' + donutData['proportion'][index][1].toUpperCase() + '</span>');
    };
    var updated_data = getDataInProportion(data, [[stocks_amount, "stocks"], [bonds_amount, "bonds"]]);
    donutData['data'] = updated_data['data'];
    donutData['proportion'] = updated_data['proportion'];
    donutData['dataset'].data(updated_data['data']);
    updateLabel(0);
    updateLabel(1);
  };

  var proportionsChange = function () {
    var stocks = parseInt($('#proportionsSlider .slider-track .max-slider-handle').attr('aria-valuemax')) +
        proportionsResult.getValue();
    var bonds = donutData['initial_data']['stocks'].length - stocks;
    if (proportionsResult.getValue() == 0) {
      stocks = donutData['initial_data']['stocks'].length/2;
      bonds = donutData['initial_data']['stocks'].length/2;
    }
    updateDonutData(donutData['initial_data'], stocks, bonds);
    forecastData['length'] = timeLine.getValue();
    forecastData['data'] = donutData['data'];
    updateForecastData(forecastData);
    updateTableData(instrumentsTable, donutData['data']);
    stockData['mainData'] = calculateDataForStock(donutData['data'], stockData['historical']);
    changeStockChart(stockData);
  };
  var proportionsResult = $('#proportionsSlider').slider().on('change', proportionsChange).data('slider');

  var timeLineChange = function () {
    forecastData['length'] = timeLine.getValue();
    updateForecastData(forecastData);
  };
  var timeLine = $('#timeLineSlider').slider().on('change', timeLineChange).data('slider');

  donutData = drawDonutChart('donut-chart-container');
  forecastData = drawForecastChart('forecast-chart-container');
  forecastData['length'] = timeLine.getValue();
  instrumentsTable = drawTable('table-container');

  $.getJSON("./src/data/financialQuotes.json", function (parsed_data) {
    stockData = drawStockChart('stock-container', parsed_data);
  });
  $.getJSON("./src/data/StocksViaBonds.json", function (parsed_data) {
    donutData['initial_data'] = parsed_data;
    updateDonutListeners(donutData, instrumentsTable);
    updateDonutData(parsed_data, 5, 5);
    forecastData['data'] = donutData['data'];
    updateForecastData(forecastData);
    updateTableData(instrumentsTable, donutData['data']);
    $.getJSON("./src/data/historical.json", function (parsed_data) {
      stockData['historical'] = parsed_data;
      stockData['mainData'] = calculateDataForStock(donutData['data'], parsed_data);
      changeStockChart(stockData);
    });
  });

  $('.tabsMenu li a').on('click', function(){
    $('.tab-dependent').hide();
    $('.visible-' + $(this).attr('id')).show();
  });

  $('.stock_quotes input[type=checkbox]').on('click', function(){
    if ($(this).attr('id') == 'log'){
      if ($(this).prop('checked')) {
        stockData['stock'].plot().yScale('log');
        //console.log('log', stockData['stock'].plot())
      }
      else {
        stockData['stock'].plot().yScale('linear');
        //console.log('linear', stockData['stock'].plot())
      }
    } else {
      var series = stockData[$(this).attr('id')];
      series.enabled($(this).prop('checked'));
    }

  });
});

// helper function to draw a beauty arc
function drawArc(point, chart, fillColor, path, needClear) {
    if (needClear) path.clear();
    if (!point.hovered()) return true;
    path.fill(fillColor);
    var start = point.getStartAngle();
    var sweep = point.getEndAngle() - start;
    var radius = chart.getPixelRadius();
    var explodeValue = chart.getPixelExplode();
    var exploded = point.exploded();
    var cx = chart.getCenterPoint().x;
    var cy = chart.getCenterPoint().y;
    var innerR = radius + 3;
    var outerR = innerR + 5;
    var ex = 0;
    var ey = 0;
    if (exploded) {
        var angle = start + sweep / 2;
        var cos = Math.cos(toRadians(angle));
        var sin = Math.sin(toRadians(angle));
        ex = explodeValue * cos;
        ey = explodeValue * sin;
    }
    acgraph.vector.primitives.donut(path, cx + ex, cy + ey, outerR, innerR, start, sweep);
}

// helper function to convert degrees to radians
function toRadians(angleDegrees) {
    return angleDegrees * Math.PI / 180;
}

// helper function to calculate price of our portfolio based on historical prices for each instrument
function calculateDataForStock(proportion_data, historical_data){
    var result = historical_data[proportion_data[0]['ticker']];
    for (var i = 0; i < result.length; i++){
        var sum = 0;
        for (var j = 0; j < proportion_data.length; j++){
            sum = sum + (proportion_data[j]['amount'] * historical_data[proportion_data[j]['ticker']][i]['value'])
        }
        result[i]['value'] = sum;
    }
    return result
}