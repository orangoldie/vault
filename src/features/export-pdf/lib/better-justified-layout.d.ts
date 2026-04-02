declare module "better-justified-layout" {
  interface Box {
    aspectRatio: number
    top: number
    left: number
    width: number
    height: number
    row: number
  }

  interface Options {
    containerWidth?: number
    containerPadding?: number | { top: number; right: number; bottom: number; left: number }
    boxSpacing?: number | { horizontal: number; vertical: number }
    targetRowHeight?: number
    targetRowHeightTolerance?: number
    maxNumRows?: number
    forceAspectRatio?: boolean | number
    showWidows?: boolean
    fullWidthBreakoutRowCadence?: boolean | number
  }

  interface Result {
    containerHeight: number
    widowCount: number
    boxes: Box[]
  }

  export default function justifiedLayout(
    input: number[] | Array<{ width: number; height: number }>,
    options?: Options,
  ): Result
}
