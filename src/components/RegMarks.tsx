/** Registration crosshairs at the four corners of a frame.
 *  DESIGN.md § Signature devices 2: corner marks bound a frame. The parent
 *  needs `position: relative` and must not clip its overflow. */
export default function RegMarks() {
  return (
    <>
      <span className="regmark regmark--tl" aria-hidden="true" />
      <span className="regmark regmark--tr" aria-hidden="true" />
      <span className="regmark regmark--bl" aria-hidden="true" />
      <span className="regmark regmark--br" aria-hidden="true" />
    </>
  )
}
