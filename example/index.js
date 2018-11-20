import React, { useState, useEffect } from "react";
import { render } from "react-dom";

function useTimer(period) {
  let [initial] = useState(new Date());
  let [past, setPast] = useState(0);
  useEffect(() => {
    let interval = setInterval(() => setPast(new Date() - initial), period);
    return () => clearInterval(interval);
  }, []);
  return past;
}

function App() {
  let time = useTimer(2000);

  return tpl`
    <div style="${`color: ${
      Math.random() > 0.5 ? "blue" : "red"
    }`}">${time.toString()}</div>
    <div style="${`color: ${
      Math.random() > 0.5 ? "blue" : "red"
    }`}">${time.toString()}</div>
    123
  `;
}

import doHash from "./hash";

const templates = {};

function parse(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  return doc;
}

function attrObj(attributes) {
  let ret = [];
  for (let i = 0; i < attributes.length; i++) {
    ret.push(attributes[i].name);
  }
  return ret;
}

function serialize(node) {
  let ret = "";

  if (node.nodeType === 3) {
    // #text
    if (/\$tpl\-var\-[0-9]+\$/.exec(node.textContent)) {

      return node.textContent.replace(
        /\$tpl\-var\-([0-9]+)\$/g,
        (match, p1, p2, p3) => `<slot name="slot:${p1}"/>`
      );
    } else {
      return node.textContent;
    }
  }

  ret += `<${node.localName} `;
  attrObj(node.attributes).forEach(attrib => {
    const match = node.getAttribute(attrib).match(/\$tpl\-var\-([0-9]+)\$/);
    if (match) {
      ret += `data-tpl-prop-${match[1]}="${attrib}" `;
    } else {
      ret += `${attrib}="${node.getAttribute(attrib)}" `;
    }
  });
  ret += ">";
  ret += [...node.childNodes].map(serialize).join("");
  ret += `</${node.localName}>`;  

  return ret;
}

function getAttributes(node) {
  let ret = {};
  if (node.nodeType === 3) {
    return ret;
  }

  attrObj(node.attributes).forEach(attrib => {
    const match = node.getAttribute(attrib).match(/\$tpl\-var\-([0-9]+)\$/);
    if (match) {
      ret[match[1]] = `tpl-prop-${match[1]}`;
    }
  });
  [...node.childNodes].forEach(child => {
    ret = { ...ret, ...getAttributes(child) };
  });
  return ret;
}

function getChildren(node) {
  let ret = [];
  if (node.nodeType === 3) {
    const regex = /\$tpl\-var\-([0-9]+)\$/g;
    let match;
    while ((match = regex.exec(node.textContent))) {
      ret.push(match[1])
    }
    return ret 
  }
  [...node.childNodes].forEach(child => {
    ret = ret.concat(...getChildren(child)) //{ ...ret, ...getAttributes(child) };
  });
  return ret;
}

function tpl(strings, ...expressions) {
  let hash = doHash(strings.join("")).toString(36);
  let Tag, attribs, children ;

  if (templates[hash]) {
    const template = templates[hash];
    Tag = template.Tag;
    attribs = template.attribs;
    children = template.children
  } else {
    let html = "";
    for (let i = 0; i < strings.length; i++) {
      html += strings[i];
      if (i < expressions.length) {
        html += `$tpl-var-${i}$`;
      }
    }
    const parsed = parse(html);
    const tplContent = [...parsed.body.childNodes].map(serialize).join("");
    const tplEle = document.createElement("template");
    tplEle.id = `tpl-${hash}`;
    tplEle.innerHTML = tplContent;
    document.body.appendChild(tplEle);

    Tag = "tpl-wrap-" + hash;
    attribs = getAttributes(parsed.body);
    children = getChildren(parsed.body)

    class Tpl extends HTMLElement {
      constructor() {
        super();
        let template = document.getElementById(`tpl-${hash}`);
        let templateContent = template.content;
        let element = templateContent.cloneNode(true);
        this.attachShadow({ mode: "open" }).appendChild(element); // todo - does this work for 'fragments'?
        this.applyAttributes();
      }

      static get observedAttributes() {
        return [...Object.values(attribs)];
      }

      applyAttributes() {
        for (let attrib of Tpl.observedAttributes) {
          this.applyAttribute(attrib);
        }
      }

      applyAttribute(attrib) {
        this.shadowRoot
          .querySelectorAll(`[data-${attrib}]`)
          .forEach(element =>
            element.setAttribute(
              element.getAttribute(`data-${attrib}`),
              this.getAttribute(attrib)
            )
          );
      }
      attributeChangedCallback(name, oldValue, newValue) {
        this.applyAttribute(name); // does this use the new value? or previous value?
      }
    }

    customElements.define(Tag, Tpl);
    templates[hash] = { Tag, attribs, children };
  }

  const props = Object.keys(attribs).reduce((obj, index) => {
    obj[attribs[index]] = expressions[index];
    return obj;
  }, {});

  return (
    <Tag {...props}>
      {children.map(child => (
        <tpl-child key={child} slot={`slot:${child}`}>
          {expressions[child]}
        </tpl-child>
      ))}
    </Tag>
  );
}

class TplChild extends HTMLElement {}

customElements.define("tpl-child", TplChild);

render(<App />, window.app);
