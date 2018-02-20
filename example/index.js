
'use strict';

require('./index.html');

const a = require('./img/ew3W8.jpg?presets[]=thumbnail&presets[]=prefetch');
const b = require('./img/ew3W8.jpg?presets[]=thumbnail&presets[]=prefetch');
const c = require('./img/ew3W8.jpg?{"presets":{"thumbnail":{"width": 400}}}');
const d = require('./img/visa.svg?height=100&format=png');
const e = require('./img/ew3W8.jpg?preset=thumbnail');
const f = require('./img/ew3W8.jpg?preset=thumbnail&width=60');
const g = require('./img/ew3W8.jpg?preset=thumbnail&height=300&emit=false');

console.log({ a, b, c, d, e, f });

const imgs = [
  { imgsData: a, qs: './img/ew3W8.jpg?presets[]=thumbnail&presets[]=prefetch' },
  { imgsData: b, qs: './img/ew3W8.jpg?presets[]=thumbnail&presets[]=prefetch' },
  { imgsData: c, qs: './img/ew3W8.jpg?{"presets":{"thumbnail":{"width": 400}}}' },
  { imgsData: d, qs: './img/visa.svg?height=100&format=png' },
  { imgsData: e, qs: './img/ew3W8.jpg?preset=thumbnail' },
  { imgsData: f, qs: './img/ew3W8.jpg?preset=thumbnail&width=60' },
  { imgsData: g, qs: './img/ew3W8.jpg?preset=thumbnail&height=300&emit=false' },
];

const main = document.createElement("main");

for (const { qs, imgsData } of imgs) {
  const div = document.createElement("div");

  div.style.backgroundColor = "lightblue"
  div.style.borderLeft      = "3px solid black";
  div.style.padding         = "5px";
  div.style.margin          = "60px 10px";

  div.innerHTML = `
    <p style="font-size: 1.6em; color: rgb(153, 0, 85); background-color: rgb(245, 242, 240);">${qs}</p>

    <pre style="max-height: 400px">
      <code class="language-json">${JSON.stringify(imgsData, null, 2)}</code>
    </pre>
  `
  for(const imgData of imgsData) {
    if (imgData == null)
      continue

    const imgDiv = document.createElement('div');

    console.log({ imgData });

    imgDiv.style.borderLeft = "2px solid black";
    imgDiv.style.padding    = "5px";
    imgDiv.style.margin     = "20px 5px";

    imgDiv.innerHTML = `
      <img src="${imgData.url}" style="display: block; margin: 10px auto; border: 1px dashed lightgray"/>
      <pre>
        <code class="language-json">${JSON.stringify(imgData, null, 2)}</code>
      </pre>
    `;

    div.appendChild(imgDiv);
  };

  main.appendChild(div);
}

document.getElementsByTagName('body')[0].appendChild(main);
