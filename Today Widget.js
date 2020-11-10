// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: calendar-alt;

// OpenWeatherAPI Widget highly modified from:
// https://gist.github.com/ImGamez/a8f9d77bf660d7703cc96fee87cdc4b0

// Events/Calendar Widget highly modified from:
// https://github.com/rudotriton/scriptable-calendar-widget

// API KEY, you need an Open Weather API Key
// You can get one for free at: https://home.openweathermap.org/api_keys    (account needed).
const API_KEY = "2b6de734150dbe49a10f8a0bbb8e3dfd";

// Latitude and Longitude of the location you want to get the weather of.
// You can get those from the Open Weather website while searching for a city, etc.
const LAT = "51.2143";
const LON = "-0.7959";
const LOCATION_NAME = "Farnham";

// units : string > Defines the unit used to measure the tempatures: "imperial" for Fahrenheit, "metric" for Celcius (Default: "metric").
const units = "metric";
// twelveHours : true|false > Defines if the hours are displayed in a 12h format, use false for 24h format. (Default: true)
const twelveHours = true;
// roundedGraph : true|false > true (Use rounded values to draw the graph) | false (Draws the graph using decimal values, this can be used to draw an smoother line).
const roundedGraph = true;
// roundedTemp : true|false > true (Displays the temps rounding the values (29.8 = 30 | 29.3 = 29).
const roundedTemp = true;
// hoursToShow : number > Number of predicted hours to show
const hoursToShow = 11;
// spaceBetweenDays : number > Size of the space between the temps in the graph in pixels
const spaceBetweenDays = 45;
// accentColor : hexString > Defines color of accented elements eg: graph lines / current date circle. (Default: #0986f)
const accentColor = "#0986fe";
// fontColor : hexString > Defines the color used for all text on the widget
const textColor = "#ffffff";
// fontColor : number > Defines the transparency of "secondary" text on the widget
const opacity = 0.7;
// fontSizes... : number > Defines the size of fonts used throughout the widget
const smallFontSize = 11;
const mediumFontSize = 12;
const largeFontSize = 14;
// numberOfWeeks : number > Defines the number of weeks to fetch future events for
const numberOfWeeks = 4;
// showAllDayEvents : true|false > Defines if "All Day" events should be shown in the events list.
const showAllDayEvents = true;
// showCallendarBullet : true|false > Defines if bullet points should be shown in front of events with their respective calendar color
const showCalendarBullet = true;
// showCalendarIcons : true|false > Defines if calendar icons should be shown in front of events (eg: cake for birthdays)
const showCalendarIcons = true;
// backgroundtColor : color > Defines the color that is overlayed over the background of the widget (Default: #2c2c2e, 0.35)
const backgroundColor = new Color("#2c2c2e", 0.5);

/**
 * Builds the events view
 *
 * @param    {WidgetStack} stack - onto which the events view is built
 */
async function buildEventsView(stack) {
  const leftStack = stack.addStack();
  leftStack.url = "x-apple-reminderkit://";
  leftStack.setPadding(0, 0, 0, 0);

  leftStack.layoutVertically();

  const date = new Date();

  // Find future events that aren't all day and aren't canceled
  const currentDate = new Date();
  const events = await CalendarEvent.between(
    currentDate,
    new Date(currentDate.getTime() + numberOfWeeks * 604800000),
    []
  );
  const futureEvents = [];
  for (const event of events) {
    if (
      (showAllDayEvents && event.isAllDay) ||
      (event.startDate.getTime() > date.getTime() &&
        !event.title.startsWith("Canceled:"))
    ) {
      futureEvents.push(event);
    }
  }

  // if we have events in the next X weeks; else if we don't
  if (futureEvents.length !== 0) {
    // show the next 3 events at most
    const numEvents = futureEvents.length > 3 ? 3 : futureEvents.length;
    for (let i = 0; i < numEvents; i += 1) {
      formatEvent(leftStack, futureEvents[i], textColor, opacity);
      // don't add a spacer after the last event
      if (i < numEvents - 1) {
        leftStack.addSpacer(8);
      }
    }
  } else {
    addWidgetTextLine(leftStack, "No Events this Month", {
      color: textColor,
      opacity,
      font: Font.regularSystemFont(largeFontSize),
      align: "left"
    });
  }

  // for centering
  leftStack.addSpacer();
}

/**
 * Builds the calendar view
 *
 * @param    {WidgetStack} stack - onto which the calendar is built
 */
function buildCalendarView(stack) {
  const rightStack = stack.addStack();
  rightStack.url = "calshow://";
  rightStack.layoutVertically();
  rightStack.setPadding(0, 16, 0, 0);

  const date = new Date();
  const dateFormatter = new DateFormatter();
  dateFormatter.dateFormat = "MMMM";

  // Current month line
  const monthLine = rightStack.addStack();
  // since dates are centered in their squares we need to add some space
  monthLine.addSpacer(4);
  addWidgetTextLine(monthLine, dateFormatter.string(date).toUpperCase(), {
    color: textColor,
    textSize: largeFontSize,
    font: Font.boldSystemFont(largeFontSize)
  });

  // between the month name and the calender grid
  rightStack.addSpacer(5);

  const calendarStack = rightStack.addStack();
  calendarStack.spacing = 2;

  function buildMonthVertical() {
    const date = new Date();
    const firstDayStack = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayStack = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const month = [["M"], ["T"], ["W"], ["T"], ["F"], ["S"], ["S"]];

    let dayStackCounter = 0;

    for (let i = 1; i < firstDayStack.getDay(); i += 1) {
      month[i - 1].push(" ");
      dayStackCounter = (dayStackCounter + 1) % 7;
    }

    for (let date = 1; date <= lastDayStack.getDate(); date += 1) {
      month[dayStackCounter].push(`${date}`);
      dayStackCounter = (dayStackCounter + 1) % 7;
    }

    const length = month.reduce(
      (acc, dayStacks) => (dayStacks.length > acc ? dayStacks.length : acc),
      0
    );
    month.forEach((dayStacks, index) => {
      while (dayStacks.length < length) {
        month[index].push(" ");
      }
    });

    return month;
  }

  const month = buildMonthVertical();

  for (let i = 0; i < month.length; i += 1) {
    let weekdayStack = calendarStack.addStack();
    weekdayStack.layoutVertically();

    for (let j = 0; j < month[i].length; j += 1) {
      let dayStack = weekdayStack.addStack();
      dayStack.size = new Size(21, 21);
      dayStack.centerAlignContent();

      if (month[i][j] === date.getDate().toString()) {
        const drawing = new DrawContext();
        drawing.respectScreenScale = true;
        const size = 50;
        drawing.size = new Size(size, size);
        drawing.opaque = false;
        drawing.setFillColor(new Color(accentColor));
        drawing.fillEllipse(new Rect(1, 1, size - 2, size - 2));
        drawing.setFont(Font.boldSystemFont(25));
        drawing.setTextAlignedCenter();
        drawing.setTextColor(new Color("#ffffff"));
        drawing.drawTextInRect(
          date.getDate().toString(),
          new Rect(0, 10, size, size)
        );
        dayStack.addImage(drawing.getImage());
      } else {
        addWidgetTextLine(dayStack, `${month[i][j]}`, {
          color: textColor,
          opacity: i > 4 ? opacity : 1,
          font: Font.boldSystemFont(10),
          align: "center"
        });
      }
    }
  }
}

/**
 *
 * Builds a vertical view with text on opposite sides
 *
 * @param {WidgetStack} stack    the stack which content is built on
 * @param {string} leftText the text which is placed on the left side
 * @param {string} rightText the text which is placed on the right side
 * @param {Font} font the font which is used for the label
 * @param {Color} color the color to make the text
 */
function buildTextView(stack, leftText, rightText, font, color) {
  // function used to set global properties
  function setProperties(object) {
    object.textColor = color;
    object.font = font;
  }

  // left text
  const leftWidgetText = stack.addText(leftText);
  setProperties(leftWidgetText);
  leftWidgetText.leftAlignText();

  // seperator in between text
  stack.addSpacer();

  // right text
  const rightWidgetText = stack.addText(rightText);
  setProperties(rightWidgetText);
  rightWidgetText.rightAlignText();
}

/**
 * Builds the middle weather details view
 *
 * @param {WidgetStack} stack the stack which content is built onto
 * @param {object} weatherData a JSON object which contains information about the weather
 */
function buildMiddleView(stack) {
  stack.layoutVertically();

  const topStack = stack.addStack();
  buildTextView(
    topStack,
    LOCATION_NAME,
    "Feels like " + getWeatherFeelsLike(),
    Font.boldSystemFont(mediumFontSize),
    new Color(textColor)
  );

  const bottomStack = stack.addStack();
  buildTextView(
    bottomStack,
    getWeatherOverview(),
    "Updated: " + formatTime(epochToDate(weatherData.current.dt)),
    Font.regularSystemFont(mediumFontSize),
    new Color(textColor, opacity)
  );
}

async function buildWeatherGraphImage() {
  // function used in graph drawing to draw text at Point(x,y)
  function drawTextC(text, x, y, color) {
    drawContext.setFont(Font.semiboldSystemFont(20));
    drawContext.setTextColor(color);
    drawContext.drawTextInRect(
      new String(text).toString(),
      new Rect(x, y, 52, 21)
    );
  }

  // function used to determine rounding of numbers in graph
  function shouldRound(should, value) {
    return should ? Math.round(value) : value;
  }

  // function used in graph drawing to draw line from Point(x1,y1) to Point(x2,y2)
  function drawLine(x1, y1, x2, y2, width, color) {
    const path = new Path();
    path.move(new Point(x1, y1));
    path.addLine(new Point(x2, y2));
    drawContext.addPath(path);
    drawContext.setStrokeColor(color);
    drawContext.setLineWidth(width);
    drawContext.strokePath();
  }

  // function used to load images used in graph
  async function loadImage(imgName) {
    if (fm.fileExists(fm.joinPath(cachePath, imgName))) {
      await fm.downloadFileFromiCloud(fm.joinPath(cachePath, imgName));
      return Image.fromData(Data.fromFile(fm.joinPath(cachePath, imgName)));
    } else {
      let imgdata = await new Request(
        "https://openweathermap.org/img/wn/" + imgName + ".png"
      ).load();
      let img = Image.fromData(imgdata);
      fm.write(fm.joinPath(cachePath, imgName), imgdata);
      return img;
    }
  }

  let drawContext = new DrawContext();
  drawContext.size = new Size(555, 180);
  drawContext.opaque = false;
  drawContext.setTextAlignedCenter();

  // Find graph min/max
  let min, max, diff;
  for (let i = 0; i <= hoursToShow; i++) {
    let temp = shouldRound(roundedGraph, weatherData.hourly[i].temp);
    min = temp < min || min == undefined ? temp : min;
    max = temp > max || max == undefined ? temp : max;
  }
  diff = max - min;

  // Render the graph
  for (let i = 0; i <= hoursToShow; i++) {
    let hourData = weatherData.hourly[i];
    let nextHourTemp = shouldRound(
      roundedGraph,
      weatherData.hourly[i + 1].temp
    );
    let hour = epochToDate(hourData.dt).getHours();
    if (twelveHours)
      hour =
        hour > 12 ? hour - 12 : hour == 0 ? "12" : hour == 12 ? "12" : hour;
    let temp = i == 0 ? weatherData.current.temp : hourData.temp;
    let delta = diff > 0 ? (shouldRound(roundedGraph, temp) - min) / diff : 0.5;
    let nextDelta = diff > 0 ? (nextHourTemp - min) / diff : 0.5;

    // draw lines between points on graph
    if (i < hoursToShow) {
      drawLine(
        spaceBetweenDays * i + 30,
        125 - 50 * delta,
        spaceBetweenDays * (i + 1) + 30,
        125 - 50 * nextDelta,
        4,
        hourData.dt > weatherData.current.sunset
          ? new Color(textColor, opacity)
          : new Color(accentColor)
      );
    }

    // draw temperature numbers on graph
    drawTextC(
      shouldRound(roundedTemp, temp) + "°",
      spaceBetweenDays * i + 10,
      80 - 50 * delta,
      new Color(textColor)
    );

    // draw weather icons on graph
    drawContext.drawImageAtPoint(
      await loadImage(
        i == 0 ? weatherData.current.weather[0].icon : hourData.weather[0].icon
      ),
      new Point(spaceBetweenDays * i + 5, 100 - 50 * delta)
    );

    // draw timescale along bottom of graph
    drawTextC(
      i == 0 ? "Now" : hour,
      spaceBetweenDays * i + 5,
      152,
      new Color(textColor, opacity)
    );
  }

  // return finished graph
  return drawContext.getImage();
}

// Get temperature that weather "feels like" with units
function getWeatherFeelsLike() {
  return (
    Math.round(weatherData.current.feels_like) +
    "°" +
    (units == "metric" ? "C" : "F")
  );
}

// Get short weather description eg: "Mild Clouds"
function getWeatherOverview() {
  // capitalise first letter of each word on the string
  const capitalisationRegex = /\b([a-z])/g;
  return weatherData.current.weather[0].description.replace(
    capitalisationRegex,
    function (x) {
      return x.toUpperCase();
    }
  );
}

function epochToDate(epoch) {
  return new Date(epoch * 1000);
}

/**
 * formats the event times into just hours
 *
 * @param    {Date} date
 *
 * @returns {string} time
 */
function formatTime(date) {
  let dateFormatter = new DateFormatter();
  dateFormatter.useNoDateStyle();
  dateFormatter.useShortTimeStyle();
  return dateFormatter.string(date);
}
function formatDate(date) {
  let dateFormatter = new DateFormatter();
  dateFormatter.dateFormat = "E, MMM d";
  return dateFormatter.string(date).toUpperCase();
}

/**
 * Adds a event name along with start and end times to widget stack
 *
 * @param    {WidgetStack} stack - onto which the event is added
 * @param    {CalendarEvent} event - an event to add on the stack
 * @param    {number} opacity - text opacity
 */
function formatEvent(stack, event, color, opacity) {
  let dateLine = stack.addStack();
  let eventLine = stack.addStack();

  // event date
  addWidgetTextLine(dateLine, formatDate(event.startDate), {
    color: event.calendar.color.hex,
    font: Font.boldSystemFont(smallFontSize)
  });
  if (showCalendarBullet) {
    // show calendar bulet in front of event name
    addWidgetTextLine(eventLine, "● ", {
      color: event.calendar.color.hex,
      font: Font.mediumSystemFont(mediumFontSize)
    });
    // show birthday icon
    if (showCalendarIcons) {
      if (event.calendar.title == "Birthdays") {
        addWidgetTextLine(eventLine, "🎂", {
          color: event.calendar.color.hex,
          font: Font.regularSystemFont(mediumFontSize)
        });
      }
    }
  }
  // event title
  let title = event.title;
  // Shorten event title if it's a birthday
  if (event.calendar.title == "Birthdays") {
    title = event.title.replace(/\’s.*/, "");
  }
  // append event title to event list view
  addWidgetTextLine(eventLine, title, {
    color,
    font: Font.semiboldSystemFont(mediumFontSize)
  });
  // event duration
  let time;
  if (event.isAllDay) {
    time = "All Day";
  } else {
    time = `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`;
  }
  addWidgetTextLine(stack, time, {
    color,
    opacity,
    font: Font.regularSystemFont(mediumFontSize)
  });
}

function addWidgetTextLine(
  widget,
  text,
  { color = textColor, textSize = 12, opacity = 1, align, font = "" }
) {
  // compact text so it's doesn't overflow
  if (text.length > 21) {
    text = text.substring(0, 21) + "...";
  }
  // add text and set properties
  let textLine = widget.addText(text);
  textLine.textColor = new Color(color);
  if (typeof font === "string") {
    textLine.font = new Font(font, textSize);
  } else {
    textLine.font = font;
  }
  textLine.textOpacity = opacity;
  switch (align) {
    case "left":
      textLine.leftAlignText();
      break;
    case "center":
      textLine.centerAlignText();
      break;
    case "right":
      textLine.rightAlignText();
      break;
    default:
      textLine.leftAlignText();
      break;
  }
}

// fetch from iCloud
var fm = FileManager.iCloud();
// generate/load cache path for weather icons
var cachePath = fm.joinPath(fm.documentsDirectory(), "weatherCache");
if (!fm.fileExists(cachePath)) {
  fm.createDirectory(cachePath);
}

// fetch weather
let weatherData;
try {
  weatherData = await new Request(
    "https://api.openweathermap.org/data/2.5/onecall?lat=" +
      LAT +
      "&lon=" +
      LON +
      "&exclude=daily,minutely,alerts&units=" +
      units +
      "&lang=en&appid=" +
      API_KEY
  ).loadJSON();
  fm.writeString(
    fm.joinPath(cachePath, "lastread" + "_" + LAT + "_" + LON),
    JSON.stringify(weatherData)
  );
} catch (e) {
  console.log("Offline mode");
  try {
    await fm.downloadFileFromiCloud(
      fm.joinPath(cachePath, "lastread" + "_" + LAT + "_" + LON)
    );
    let raw = fm.readString(
      fm.joinPath(cachePath, "lastread" + "_" + LAT + "_" + LON)
    );
    weatherData = JSON.parse(raw);
  } catch (e2) {
    console.log("Error: No offline data cached");
  }
}

// FINAL WIDGET BUILD
// ==================

// create main widget object
let widget = new ListWidget();

// set widget properties
widget.setPadding(0, 0, 0, 0);
widget.backgroundImage = Image.fromFile(
  fm.joinPath(fm.documentsDirectory(), "widgetWallpaper.jpg")
);

// create global stack that holds all children
const globalStack = widget.addStack();
globalStack.layoutVertically();
globalStack.backgroundColor = backgroundColor;

// ensure content is centered
globalStack.addSpacer();

// create topStack (events / calendar)
const topStack = globalStack.addStack();
topStack.setPadding(16, 16, 16, 16);
// create stacks inside topStack
await buildEventsView(topStack);
topStack.addSpacer();
buildCalendarView(topStack);

// create middleStack (weather details)
const middleStack = globalStack.addStack();
middleStack.setPadding(0, 16, 0, 16);
middleStack.url = "scriptable:///run/Widget%20Background";
// create text stacks inside middleStack
buildMiddleView(middleStack);

// create bottomStack (weather graph)
const bottomStack = globalStack.addStack();
bottomStack.setPadding(0, 0, 16, 0);
bottomStack.addSpacer();
bottomStack.addImage(await buildWeatherGraphImage());
bottomStack.addSpacer();

// ensure content is centered
globalStack.addSpacer();

// preview widget
Script.setWidget(widget);
widget.presentLarge();
Script.complete();
