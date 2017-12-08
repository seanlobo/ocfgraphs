/**
 * Override the reset function, we don't need to hide the tooltips and crosshairs.
 */
Highcharts.Pointer.prototype.reset = function() {
  return undefined;
};

/**
 * Highlight a point by showing tooltip, setting hover state and draw crosshair
 */
Highcharts.Point.prototype.highlight = function(event) {
  this.onMouseOver(); // Show the hover marker
  this.series.chart.tooltip.refresh(this); // Show the tooltip
  this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
};

/**
 * Synchronize zooming through the setExtremes event handler.
 */
function syncExtremes(e) {
  var thisChart = this.chart;

  if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
    Highcharts.each(Highcharts.charts, function(chart) {
      if (chart !== thisChart) {
        if (chart.xAxis[0].setExtremes) { // It is null while updating
          chart.xAxis[0].setExtremes(e.min, e.max, undefined, false, {
            trigger: 'syncExtremes'
          });
        }
      }
    });
  }
}

function chartContains(user) {
  var chart1 = $("[data-highcharts-chart='0'").highcharts();
  for (var i = 0; i < chart1.series.length; i++) {
    if (chart1.series[i].name === user) {
      return true;
    }
  }
  return false;
}

function isStaff(user) {
  return listOfStaff.includes(user);
}

function addChart(user) {
  user = typeof user !== 'undefined' ? user : $("#addStaff").val();

  if (!isStaff(user) || chartContains(user)) {
    return;
  }

  addUserEntry(user);

  var chart1 = $("[data-highcharts-chart='0'").highcharts();
  var chart2 = $("[data-highcharts-chart='1'").highcharts();

  $.get("/" + user + "/data/logins_over_time/", function(activity) {
    var len = chart1.series.length;
    var data1 = activity.datasets[0];
    var assignedColor = borrowColor();
    chart1.addSeries({
      data: data1.data,
      name: data1.name,
      pointStart: Date.UTC(data1.year, data1.month, data1.day),
      pointInterval: 24 * 3600 * 1000,
      type: data1.type,
      color: assignedColor,
      fillOpacity: 0.3,
      tooltip: {
        valueSuffix: ' ' + data1.unit
      }
    });

    var data2 = activity.datasets[1];
    chart2.addSeries({
      data: data2.data,
      name: data2.name,
      pointStart: Date.UTC(data2.year, data2.month, data2.day),
      pointInterval: 24 * 3600 * 1000,
      type: data2.type,
      color: assignedColor,
      fillOpacity: 0.3,
      tooltip: {
        valueSuffix: ' ' + data2.unit
      }
    });

    sortCharts();
  });
}

function removeChart(user) {
  var chart1 = $("[data-highcharts-chart='0'").highcharts();
  var chart2 = $("[data-highcharts-chart='1'").highcharts();

  for (var i = 0; i < chart1.series.length; i++) {
    if (chart1.series[i].name === user) {
      // remove this chart
      returnColor(chart1.series[i].color);
      chart1.series[i].remove();
      chart2.series[i].remove();
      return;
    }
  }
}

function sortCharts() {
  function compareChartEntries(a, b) {
    if (a.name > b.name) {
      return 1;
    } else if (a.name < b.name) {
      return -1;
    } else {
      return 0;
    }
  }
  var chart1 = $("[data-highcharts-chart='0'").highcharts()
  chart1.series.sort(compareChartEntries);
  chart1.legend.render(); // Legend refreshes its order a timestep after tooltip and thus needs to be manually re-rendered
  var chart2 = $("[data-highcharts-chart='1'").highcharts()
  chart2.series.sort(compareChartEntries);
  chart2.legend.render(); // Legend refreshes its order a timestep after tooltip and thus needs to be manually re-rendered
}

function addUserEntry(user) {
  if (isStaff(user) && !chartContains(user)) {
    var $userEntry = $("<div>", {
      id: user + '-entry',
      class: "btn-group user-entry",
      role: "group",
    }).append(
      $("<li>", {
        class: "list-group-item",
        text: user,
      }),
      $("<button>", {
        class: "btn btn-danger",
        text: "X",
        click: function() {
          removeChart(user);
          $('#' + user + '-entry').remove();
        },
      })
    );
    $("#userEntries").append($userEntry);
    sortUserEntries();
    $userEntry.children('li').effect("highlight", {
      color: "#5cb85c"
    }, 2000);

    $('#addStaff').val(''); // Clear username field after successfully adding user
  }
}

function sortUserEntries() {
  var userEntriesSorted = $("#userEntries").children("div");
  userEntriesSorted.sort(function(a, b) {
    var a_id = a.getAttribute("id"),
        b_id = b.getAttribute("id");
    if (a_id > b_id) {
      return 1;
    } else if (a_id < b_id) {
      return -1;
    } else {
      return 0;
    }
  });
  userEntriesSorted.detach().appendTo($("#userEntries"));
}

document.getElementById('addStaff').onkeypress = function(e) {
  var event = e || window.event;
  var charCode = event.which || event.keyCode;

  if (charCode == '13') {
    // Enter pressed
    addChart();
  }
}

function setChart() {
  for (var i = 0; i < 2; i++) {
    $('<div class="chart">')
      .appendTo('#graph-container')
      .highcharts({
        chart: {
          marginLeft: 40, // Keep all charts left aligned
          spacingTop: 20,
          spacingBottom: 20,
          zoomType: 'x'
        },
        title: {
          text: i ? 'Daily lab usage in minutes' : 'Cumulative lab usage in minutes',
          align: 'left',
          margin: 0,
          x: 30
        },
        credits: {
          enabled: false
        },
        legend: {
          enabled: true
        },
        xAxis: {
          crosshair: true,
          events: {
            setExtremes: syncExtremes
          },
          dateTimeLabelFormats: {
            second: '%l:%M:%S %p',
            minute: '%l:%M %p<br/>%m/%d/%Y',
            hour: '%l:%M %p<br/>%m/%d/%Y',
            day: '%l:%M %p<br/>%m/%d/%Y',
            week: '%l:%M %p<br/>%m/%d/%Y',
            month: '%l:%M %p<br/>%m/%d/%Y',
            year: '%l:%M %p<br/>%m/%d/%Y'
          },
          type: 'datetime',
        },
        yAxis: {
          title: {
            text: null
          }
        },
        tooltip: {
          shared: true,
          enabled: true
        },
        exporting: {
          sourceWidth: 1600,
          sourceHeight: 400,
        },
      });
  }
};

$.getJSON("/staff_members/", function(staff) {
  $('.selector').autocomplete({
    focus: function(event, ui) {
      var user = ui.item.value;
      validateUser(user);
    },
    select: function(event, ui) {
      var user = ui.item.value;
      addChart(user);
      return false; // So changes to username field persist, specifically if it's cleared
    },
    source: staff,
    delay: 0,
  });
});

colorPool = [
  "#4c4c4c", // dark grey
  "#e2e2e2", // very light grey/ white
  "#000000", // Black
  "#FF8000", // Orange
  "#800000", // Brown
  "#FF8080", // Pink
  "#FF00FF", // Magenta
  "#00FF00", // Green
  "#FF0000", // Red
  "#0000FF", // Blue
];

function borrowColor() {
  return colorPool.pop();
}

function returnColor(color) {
  colorPool.push(color);
}

// Quick validate
function validateUser(user) {
  var addStaffDiv = $("#addStaff-form-group");
  if (!isStaff(user) || chartContains(user)) {
    addStaffDiv.removeClass("has-success")
	             .addClass("has-warning");
  } else {
    addStaffDiv.removeClass("has-warning")
	             .addClass("has-success");
  }
}
$("#addStaff").on("input", function() {
  validateUser($("#addStaff").val());
});
