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
  var chart1 = $("[data-highcharts-chart='0'").highcharts();var chart1 = $("[data-highcharts-chart='0'").highcharts();
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
  sortUserEntries();

  var chart1 = $("[data-highcharts-chart='0'").highcharts();
  var chart2 = $("[data-highcharts-chart='1'").highcharts();

  $.get("/" + user + "/data/logins_over_time/", function(activity) {
    var len = chart1.series.length;
    var data1 = activity.datasets[0];
    chart1.addSeries({
      data: data1.data,
      name: data1.name,
      pointStart: Date.UTC(data1.year, data1.month, data1.day),
      pointInterval: 24 * 3600 * 1000,
      type: data1.type,
      color: getColor(len),
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
      color: getColor(len),
      fillOpacity: 0.3,
      tooltip: {
        valueSuffix: ' ' + data2.unit
      }
    });
  });
};

function addUserEntry(user) {
  if (isStaff(user) && !chartContains(user)) {
    $("#userEntries").append(
        $("<div>", {
          id: user + '-entry',
          class: "btn-group",
          role: "group",
        }).append(
          $("<li>", {
            class: "list-group-item",
            text: user,
            style: 'padding: 8px; width: 90%;'
          }),
          $("<button>", {
            class: "btn btn-danger",
            text: "X",
            click: function() {
              removeChart(user);
              $('#' + user + '-entry').remove();
            },
          })
        )
    );
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

function removeChart(user) {
  var chart1 = $("[data-highcharts-chart='0'").highcharts();
  var chart2 = $("[data-highcharts-chart='1'").highcharts();

  for (var i = 0; i < chart1.series.length; i++) {
    if (chart1.series[i].name === user) {
      // remove this chart
      chart1.series[i].remove();
      chart2.series[i].remove();
      return;
    }
  }
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
    select: function(event, ui) {
      var user = ui.item.value;
      validateUser(user);
      addChart(user);
    },
    source: staff,
    delay: 0,
  });
});


function getColor(index) {
  // Generate unique colors
  // http://stackoverflow.com/questions/470690/how-to-automatically-generate-n-distinct-colors

  // below colors are modified Bonynton optomized from: http://jsfiddle.net/k8NC2/1/
  var colorList = [
    "#0000FF", // Blue
    "#FF0000", // Red
    "#00FF00", // Green
    "#FF00FF", // Magenta
    "#FF8080", // Pink
    "#800000", // Brown
    "#FF8000", // Orange


    "#000000", // Black
    "#4c4c4c", // dark grey
    "#e2e2e2", // very light grey/ white
  ];

  return colorList[index % colorList.length];
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
