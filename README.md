react-tpl
---

(not published, just work in progress)

an experiment with templates. for react. 

```jsx
function App(props){      
  // some suspense calls, hooks, whatever
  let count = visitors.read(); 
  return tpl`
    <style>
      h1 { color:red; }
    </style>
    <h1>welcome to my homepage!</h1>
    <div>
        you are vistor number ${count}
        ${<ConstructionGif />}
    </div>
  `
}
```

"but why?!" I hear you screaming at your monitor. 

I'm not sure, to be honest. I got bothered by the disclaimer on [aframe-react](https://github.com/ngokevin/aframe-react), and wondered if there was a better way to construct long (not necessarily deep), mostly static component trees, without all that ceremony. I've been eyeing `<template>` nodes and shadow dom for a while, and figured it would be a good fit. Like `lit-html`, but I wanted to use react's, well, everything else.  

how does it work?
---

By using tagged template literals, we can define trees that separate the static and dynamic parts naturally. We leverage custom-elements and `<template>` nodes to make 'shells' for the static bits, and uses react-dom to feed the dynamic bits as and when they change. That's... mostly it.

some nice things 
---

- react compatible™️
- uses the flatporm
- tiny! fast! <sup>citation needed</sup>
- built for compilation/static extraction

works 
---

(as of now, a runtime version is mostly functional)

- interpolating children (components or dom), attributes
- scoped css via shadow dom  
- regular 'web components'

doesn't work (yet)
--- 
 
- event handlers (workaround: interpolate an actual react element)
- object props (same workaround)
- svg 
- a babel macro for zero runtime (!!!)
- css-in-js 
- partial attribute interpolation (eg - `style='color:${props.color}'`)
- ssr 
- older browsers 
- hot reloading 
- not sure how event propogation works 

future work 
--- 

- a barebones renderer that uses only this
- analyze react/mdx trees and convert them to this form 

great! should I use this?
---

for work? probably not. for fun? definitely! 