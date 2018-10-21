/*
 * Client-Side (cs) script for the Sentiment Analytics webpage.
 */

// JQUERY FUNCTIONS
(function($) {

  /*** GLOBAL VARIABLES / 'MODEL' VARIABLES (Use capital first letter for globals): ***/

  // Filter variables:
  var QuestionNum;
  var Gender;
  var AgeRange;
  var EmployStatus;
  var StartDate;
  var EndDate;

  // Result Variables:
  var NumResponses;
  var PercentCompleted;
  var AveCharCount;
  var MaxCharCount;
  var NationalAveSentiment;
  var OrgAveSentiment;
  var FirstDate;
  var QuestionArray = [];
  var ScoreFreqArray = [];

  var responseScore;

  var indexOfResponse = 0;
  var checkflag = false;
  var ResponseInfo;

  //timeLine
  var TimeSeries;
  var TimeSeriesX = [];
  var TimeSeriesY = [];
  var WeekAveX = [];
  var WeekAveY = [];

  var NationalAverage = [];

  // Sentiment colour scale end a middle points:
  var RedColor = [204, 69, 40];
  var GreyColor = [188, 191, 191];
  var GreenColor = [52, 143, 104];

  window.onload = function() {

    // Set initial filter values:
    QuestionNum = 1;
    Gender = 'all';
    AgeRange = 'all';
    EmployStatus = 'all';
    StartDate = new Date(2016,0,17); // first date for Glassdoor Honeywell data
    // TODO: run a separate query when page loads
    EndDate = new Date(); // i.e. today

    loadResults(QuestionNum, Gender, AgeRange, EmployStatus,
               toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));

    updateTimeSeries(QuestionNum, Gender, AgeRange, EmployStatus,
               toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));


    document.getElementById("questionList").addEventListener('change',function(){
      QuestionNum = document.getElementById("questionList").value;
      cleanTimeSeries();
      updateTimeSeries(QuestionNum, Gender, AgeRange, EmployStatus,
                 toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));
      });
    document.getElementById("gender").addEventListener('change',function(){
      Gender = document.getElementById("gender").value;
      cleanTimeSeries();
      updateTimeSeries(QuestionNum, Gender, AgeRange, EmployStatus,
                 toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));
    });
    document.getElementById("ageRange").addEventListener('change',function(){
      AgeRange = document.getElementById("ageRange").value;
      cleanTimeSeries();
      updateTimeSeries(QuestionNum, Gender, AgeRange, EmployStatus,
                 toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));
    });
    document.getElementById("employStatus").addEventListener('change',function(){
      EmployStatus = document.getElementById("employStatus").value;
      cleanTimeSeries();
      updateTimeSeries(QuestionNum, Gender, AgeRange, EmployStatus,
                 toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));
    });
    document.getElementById("startDateBox").addEventListener('change',function(){
      StartDate = document.getElementById("startDateBox").value;
      cleanTimeSeries();
      updateTimeSeries(QuestionNum, Gender, AgeRange, EmployStatus,
                 toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));
    });
    document.getElementById("endDateBox").addEventListener('change',function(){
      EndDate = new Date(document.getElementById("endDateBox").valueAsDate);
      cleanTimeSeries();
      updateTimeSeries(QuestionNum, Gender, AgeRange, EmployStatus,
                 toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));
    });

    // Event Listener for Fetch Results button:
    document.getElementById('fetchResults').addEventListener('click', function() {
      loadResults(QuestionNum, Gender, AgeRange, EmployStatus,
                  toYYYY_MM_DD(StartDate), toYYYY_MM_DD(EndDate));
    });

    // When resetting filters, reset start date and end date to overall range start and range end:
    document.getElementById('resetFilters').addEventListener('click', function() {
      document.getElementById("gender").value = 'all';
      document.getElementById("ageRange").value = 'all';
      document.getElementById("employStatus").value = 'all';
      document.getElementById('startDateBox').valueAsDate = FirstDate;
      document.getElementById('endDateBox').valueAsDate = new Date();

      // Reset the handles on the date slider:
      var startDateObj = FirstDate;
      var endDateObj = new Date();
      var slider = document.getElementById('dateSlider');
      slider.noUiSlider.set([startDateObj.getTime(), endDateObj.getTime()]);
    });
  };

  // Convert a JavaScript Date object to a string of form YYYY-MM-DD e.g. 2018-01-27
  function toYYYY_MM_DD(dateObj) {
    return "" +  dateObj.getFullYear() + "-" + padZero((dateObj.getMonth() + 1)) + "-" + padZero(dateObj.getDate());
  }

  // Add a padding zero to the string if the number contained is less than 10
  // (used for to ensure day and month date values have two digits, e.g. 2018-01-07)
  function padZero(integer) {
    var paddedString = "";
    if(integer < 10) {
      paddedString += "0" + integer;
    } else {
      paddedString += integer;
    }
    return paddedString;
  }

  // jQuery AJAX function to fetch and load results from the database
  function loadResults(questionNum, gender, ageRange, employStatus, startYYYY_MM_DD, endYYYY_MM_DD) {
    $.ajax({
      url: "/load-results",   // i.e. [Nodejs app]/app_server/controllers/load-results.js
      data: { // data to send to load-results.js controller
        "questionNum" : questionNum,
        "gender" : gender,
        "ageRange" : ageRange,
        "employStatus" : employStatus,
        "startDate" : startYYYY_MM_DD,
        "endDate" : endYYYY_MM_DD
      },
      method: "POST",
      dataType: 'JSON',
      success: function (data) { // data is the JSON object returned from SQL via controller
        // for(property in data) {
        //   console.log("" + property + ": " + data[property]);
        // }
        NumResponses = data.numResponses;
        PercentCompleted = data.percentCompleted;
        AveCharCount = data.aveCharCount;
        MaxCharCount = data.maxCharCount;
        NationalAveSentiment = data.nationalAveSentiment;
        OrgAveSentiment = data.orgAveSentiment;
        FirstDate = new Date(data.firstDate.slice(0,10));
        QuestionArray = data.questionArray;
        ScoreFreqArray = data.scoreFreqArray;
        ResponseDate = data.responseDate;
        ResponseScore = data.responseScore;
        ResponseText = data.responseText;
      /*  TimeSeries = data.timeSeries;
        //timeSeries

        for (i=0; i<TimeSeries.length; i++){
          TimeSeriesX.push(TimeSeries[i].ds.slice(0,10));
          TimeSeriesY.push(TimeSeries[i].avgOs);
        } */


        // If loading the page for the first time:
        if(document.getElementById("questionList").innerHTML == "") {
          setFilterInputs();
          renderDateSlider();
        }
        //renderSentiTimeSeries();
        renderAveSentimentDial();
        renderCompareSentimentChart();
        renderHistogramByScore();
        fillSummaryTable();
        fillResponseDetails();

      },
      error: function (data) {
        console.log("Could not fetch data.");
      }
    });
  }


//updateTimeSeries
  function updateTimeSeries(questionNum, gender, ageRange, employStatus, startYYYY_MM_DD, endYYYY_MM_DD) {
    $.ajax({
      url: "/time-series",   // i.e. [Nodejs app]/app_server/controllers/time-series.js
      data: { // data to send to load-results.js controller
        "questionNum" : questionNum,
        "gender" : gender,
        "ageRange" : ageRange,
        "employStatus" : employStatus,
        "startDate" : startYYYY_MM_DD,
        "endDate" : endYYYY_MM_DD
      },
      method: "POST",
      dataType: 'JSON',
      success: function (data) { // data is the JSON object returned from SQL via controller
        // for(property in data) {
        //   console.log("" + property + ": " + data[property]);
        // }
        //console.log(data.timeSeries);
        TimeSeries = data.timeSeries;
        //timeSeries
        for (i=0; i<TimeSeries.length; i++){
          TimeSeriesX.push(TimeSeries[i].ds.slice(0,10));
          TimeSeriesY.push(TimeSeries[i].avgOs);
        }
        //console.log("10 处以 5",10/5);
        for(i=0;i<TimeSeries.length;i+=4){
          WeekAveY.push((TimeSeriesY[i]+TimeSeriesY[i+1]+TimeSeriesY[i+2]+TimeSeriesY[i+3])/4);
          WeekAveX.push(TimeSeriesX[i]);
        }

        for(i=0; i<WeekAveX.length; i++) {
          NationalAverage.push(NationalAveSentiment);
        }
        //console.log(WeekAveY);
        renderSentiTimeSeries();
      },
      error: function (data) {
        console.log("Could not fetch data.");
      }
    });
  }

  function cleanTimeSeries() {
    TimeSeriesX = [];
    TimeSeriesY = [];
    WeekAveX = [];
    WeekAveY = [];
  }



  // Set the filter DOM inputs to the values returned from the loadResults method
  // (which have been saved to global variables)
  function setFilterInputs() {
    var html = "";
    for(var i = 0; i < QuestionArray.length; i++) {
      html += "<option value='" + (i+1) + "'>" + QuestionArray[i] + "</option>";
    }
    document.getElementById("questionList").innerHTML = html;
    document.getElementById("questionList").value = QuestionNum;
    document.getElementById("gender").value = Gender;
    document.getElementById("ageRange").value = AgeRange;
    document.getElementById("employStatus").value = EmployStatus;
  }


  function renderDateSlider() {

    var firstDay = FirstDate.getDate();
    var firstMonth = FirstDate.getMonth();
    var firstYear = FirstDate.getFullYear();
    document.getElementById('firstDateSpan').innerHTML = padZero(firstDay) + '/' + padZero(firstMonth + 1) + "/" + firstYear;

    var today = new Date();
    document.getElementById("todaysDate").innerHTML = padZero(today.getDate()) + "/" + padZero((today.getMonth() + 1)) + "/" + today.getFullYear();

    // Overall date range for slider
    // (remains fixed even if filter range sliders/boxes is changed by the user)
    var rangeStart = FirstDate;
    var rangeEnd = today;

    document.getElementById('startDateBox').valueAsDate = StartDate;
    document.getElementById('endDateBox').valueAsDate = EndDate;

    var rangeStart_ms = rangeStart.getTime();
    var rangeEnd_ms = rangeEnd.getTime();
    var startDate_ms = StartDate.getTime();
    var endDate_ms = EndDate.getTime();

    var slider = document.getElementById('dateSlider');
    noUiSlider.create(slider, {
      // Create two timestamps to define a range.
      range: {
          min: rangeStart_ms,
          max: rangeEnd_ms
      },

      // Steps of one day
      step: 1 * 24 * 60 * 60 * 1000,

      // Two more timestamps indicate the handle starting positions.
      start: [startDate_ms, endDate_ms]
    });

    var dateValues = [
      document.getElementById('startDateBox'),
      document.getElementById('endDateBox')
    ];

    slider.noUiSlider.on('update', function (values, handle) {
        dateValues[handle].valueAsDate = new Date(+values[handle]);
    });
  }

  function fillSummaryTable() {
    document.getElementById("numResponses").innerHTML = NumResponses;
    document.getElementById("percentCompleted").innerHTML = PercentCompleted;
    document.getElementById("aveCharCount").innerHTML = AveCharCount;
    document.getElementById("maxCharCount").innerHTML = MaxCharCount;
  }

  //sentiTimeSeries

  function renderSentiTimeSeries() {

  //var dayByDay = {
  //  mode: "lines",
  //  name: 'average sentiment score',
  //  x: TimeSeriesX,
  //  y: TimeSeriesY,
  //  line: {color: '#17BECF'}
  //}

  var trace1 = {
    mode: "lines",
    name: 'National Average Score',
    x: WeekAveX,
    y: NationalAverage,
    line: {
      dash: 'dot',
      width: 2,
      color: 'red'
    }
  }

  var weekly = {
    mode: "lines",
    name: 'Weekly Average Score',
    x: WeekAveX,
    y: WeekAveY,
    line: {color: '#17BECF'}
  }

  var data = [trace1,weekly];

  var layout = {
    title: 'Time Series',
    xaxis: {
      autorange: true,
      range: [WeekAveX[0], WeekAveX[WeekAveX.length - 1]],
      rangeselector: {buttons: [
          {
            count: 1,
            label: '1m',
            step: 'month',
            stepmode: 'backward'
          },
          {
            count: 6,
            label: '6m',
            step: 'month',
            stepmode: 'backward'
          },
          {step: 'all'}
        ]},

      rangeslider: {range: [WeekAveX[0], WeekAveX[WeekAveX.length - 1]]},
      color: 'black',
      type: 'date'
    },
    yaxis: {
      autorange: true,
      range: [-10,10],
      type: 'linear'
    }
  };
  var timeLine = document.getElementById('sentiTimeSeriesContainer');
  Plotly.newPlot(timeLine, data, layout);
  }



  function renderAveSentimentDial() {

    var canvasWidth = 500;
    var canvasHeight = 280;
    var needleRadius = 180;

    var canvasContainerDOM = document.getElementById("dialCanvasContainer");
    var html = "<canvas id='dialCanvas' width='" + canvasWidth + "' height='" + canvasHeight + "' >";
    html += "Your browser does not support the HTML5 canvas tag. </canvas>";
    canvasContainerDOM.innerHTML = html; // (re-) insert the canvas into the DOM
    var canvasDOM = document.getElementById("dialCanvas");
    var ctx = canvasDOM.getContext("2d");
    var img = document.getElementById("dialImg");

    var angle = ((10 - OrgAveSentiment) * Math.PI) / 20;
    var needleBaseX = canvasWidth / 2 - 8;
    var needleBaseY = canvasHeight - 30;
    var needleTipX = needleBaseX + needleRadius * Math.cos(angle);
    var needleTipY = needleBaseY - needleRadius * Math.sin(angle);

    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight - 20);
    ctx.beginPath();
    ctx.moveTo(needleBaseX, needleBaseY);
    ctx.lineTo(needleTipX, needleTipY);
    ctx.scale(5,5);
    ctx.strokeStyle='red';
    ctx.stroke();

    document.getElementById('aveSentimentSpan').innerHTML = Math.round(OrgAveSentiment * 10) / 10;
  }

  function renderCompareSentimentChart() {

    // (Re-)create canvas DOM element
    // (otherwise duplicate canvases will form on fetching new results)
    var canvasContainerDOM = document.getElementById("compareAveSentContainer");
    var html = "<canvas id='compareAveSentCanvas'>";
    html += "Your browser does not support the HTML5 canvas tag. </canvas>";
    canvasContainerDOM.innerHTML = html; // (re-) insert the canvas into the DOM
    var canvasDOM = document.getElementById("compareAveSentCanvas");

    var industryAve = OrgAveSentiment * 0.8; // use until industry field added to DB

    var myChart = canvasDOM.getContext('2d');
    var compareSentChart = new Chart(myChart, {
      type: 'bar',
      data: {
        labels: ['Your Organization', 'Industry Average', 'National Average'],
        datasets: [{
          data: [OrgAveSentiment, industryAve, NationalAveSentiment],
          backgroundColor: [
            getColor((OrgAveSentiment + 10) / 20),
            getColor((industryAve + 10) / 20),
            getColor((NationalAveSentiment + 10) / 20),
          ],
          borderWidth: 1,
          borderColor: '#777',
          hoverBorderWidth: 6,
          hoverBorderColor: 'red'
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              min: -10,
              max: 10
            },
          }],
        },
        title: {
          display: false
        },
        legend: {
          display: false,
        },
        layout: {
          padding: {
            left: 50,
            right: 0,
            bottom: 0,
            top: 0
          }
        },
        tooltips: {
          enabled: true
        }
      }
    });
  }

  function renderHistogramByScore () {

    // (Re-)create canvas DOM element:
    // (otherwise duplicate overlaying canvases will form on fetching new results)
    var canvasContainerDOM = document.getElementById("histogramByScoreContainer");
    var html = "<canvas id='histogramByScoreCanvas'>";
    html += "Your browser does not support the HTML5 canvas tag. </canvas>";
    canvasContainerDOM.innerHTML = html; // (re-) insert the canvas into the DOM
    var canvasDOM = document.getElementById("histogramByScoreCanvas");

    var ctx = canvasDOM.getContext('2d');
    var xData = [];
    var yData = [];
    var fillColor = [];
    var tiers = 20;

    // Populate data and bar colours
    for (var i = 0; i < tiers + 1; i++)
    {
      xData.push(i - tiers/2);
      yData.push(ScoreFreqArray[i]);
      fillColor.push(getColor(i/tiers));
    }

    var data = {
      labels: xData,
      datasets: [
        {
          fill: true,
          backgroundColor: fillColor,
          data: yData,
          //hoverBorderWidth: 2,
        //  hoverBorderColor: 'red'
        //  bacborderColor: 'red',
        }
      ]
    };

    var histogramChart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        defaultFontFamily: Chart.defaults.global.defaultFontFamily = "'Roboto Condensed'",
        defaultFontSize:  Chart.defaults.global.defaultFontSize = 16,
        legend: {
          display: false
        },
        scales: {
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Frequency"
            },
            ticks : {
              beginAtZero : true
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Overall Sentiment Score"
            },
            barPercentage: 0.9,
            categoryPercentage: 1.0
          }]
        },
        tooltips: {
          enabled: false,
          borderColor: 'red',
        }
      }
    });

// this was canvasDOM.onclick , Jc changed to
    var previousClickedBar = -1;
    canvasDOM.onclick = function(event) {
      checkflag = true;


      var activeElement = histogramChart.getElementAtEvent(event)[0];
       responseScore = histogramChart.data.labels[activeElement._index];
      if(responseScore!=previousClickedBar){
        indexOfResponse = 0;
        previousClickedBar = responseScore;
        //histogramChart.data.datasets[0].backgroundColor = 'red';
        //histogramChart.data.labels.xData = responseScore+10;
      $.ajax({
        url: "/response-details",
        // i.e. [Nodejs app]/app_server/controllers/response-details.js
        data: { // data to send to controller
          "score": previousClickedBar,
          "questionNum": QuestionNum,
          "gender": Gender,
          "ageRange": AgeRange,
          "employStatus": EmployStatus,
          "startDate": toYYYY_MM_DD(StartDate),
          "endDate": toYYYY_MM_DD(EndDate)
        },
        method: "POST",
        dataType: 'JSON',
        success: function (data) { // data is the JSON object returned from SQL via controller
          // for(property in data) {
          //   console.log("" + property + ": " + data[property]);
          // }
          ResponseInfo = data.responseResult;

          fillResponseDetails();


        },
        error: function (data) {
          console.log("Could not fetch data.");
        }

      });
    }else{
      //清楚之前颜色的function
      //histogramChart.data.datasets[0].backgroundColor = fillColor;
      nextResponse();
    }
    };

  //  canvasDOM.addEventListener('click',function(event) {
    //  nextResponse();
    //})

    function nextResponse() {
  //  var next = document.getElementById("nextButton");
    //next.onclick = function () {
      if (checkflag == false) {
        alert("Please select a bar of responses first.");
        return;
      }
      if (indexOfResponse == ResponseInfo.length - 1) {
        alert("This is already the last response.");
        return;
      }
      indexOfResponse++;
      fillResponseDetails();
    };
  //};


/*
    var previous = document.getElementById("previousButton");
    previous.onclick = function () {
      if (checkflag == false) {
        alert("Please select a bar of responses first.");
        return;
      }
      if (indexOfResponse == 0) {
        alert("This is already the first response.");
        return;
      }
      indexOfResponse--;
      fillResponseDetails();
    };


    var first = document.getElementById("firstButton");
    first.onclick = function () {
      if (checkflag == false) {
        alert("Please select a bar of responses first.");
        return;
      }
      indexOfResponse = 0;
      fillResponseDetails();
    };

    var last = document.getElementById("lastButton");
    last.onclick = function () {
      if (checkflag == false) {
        alert("Please select a bar of responses first.");
        return;
      }
      indexOfResponse = ResponseInfo.length - 1;
      fillResponseDetails();
    }; */
  }

  function fillResponseDetails() {

    var date = ResponseInfo[indexOfResponse].submitDate.slice(0,10);
    document.getElementById('responseDateSpan').innerHTML = date;
    document.getElementById('responseScoreSpan').innerHTML = responseScore;
    document.getElementById('responseText').innerHTML ="''" + ResponseInfo[indexOfResponse].responseDetail+"''";
    var responseIndex = indexOfResponse + 1;
    document.getElementById('responseIndex').innerHTML =responseIndex+' '; //+ ResponseInfo.length;
    document.getElementById('responseIndex').style = 'font-weight:bold; font-size:17px;';
    document.getElementById('totalResponse').innerHTML = ResponseInfo.length;
  }

  /* Returns an rgb(x,y,z) string based on factor from 0 to 1 of how far along the
   * specified colour spectrum the output colour should be.
   */

  function getColor(factor) {
    var rgbStart = RedColor;
    var rgbMiddle = GreyColor;
    var rgbEnd = GreenColor;
    var r, g, b;
    if (factor <= 0.5) {
      r = lerp(rgbStart[0], rgbMiddle[0], factor * 2);
      g = lerp(rgbStart[1], rgbMiddle[1], factor * 2);
      b = lerp(rgbStart[2], rgbMiddle[2], factor * 2);
    } else {
      r = lerp(rgbMiddle[0], rgbEnd[0], (factor - 0.5) * 2);
      g = lerp(rgbMiddle[1], rgbEnd[1], (factor - 0.5) * 2);
      b = lerp(rgbMiddle[2], rgbEnd[2], (factor - 0.5) * 2);
    }
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }

  // Helper function for getColor()
  function lerp(a, b, factor) {
    var delta = b - a;
    return a + delta * factor;
  }

})(jQuery);
