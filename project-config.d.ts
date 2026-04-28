declare module '*.svg' {
  import * as React from 'react'
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string; titleId?: string }
  >
  const url: string
  export default url
}

declare module '*.svg?react' {
  import * as React from 'react'
  const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string; titleId?: string }
  >
  export default ReactComponent
}

declare module '*.mp3' {
  const src: string
  export default src
}

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}
