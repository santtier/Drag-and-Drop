/* eslint-env browser */
// ========================
// Polyfills
// ========================
/**
 * Element.before
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/before
 */
;(function (arr) {
  arr.forEach(function (item) {
    /* eslint-disable */
    if (item.hasOwnProperty('before')) return
    /* eslint-enable */

    Object.defineProperty(item, 'before', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function before () {
        const argArr = Array.prototype.slice.call(arguments)
        const docFrag = document.createDocumentFragment()

        argArr.forEach(function (argItem) {
          const isNode = argItem instanceof Node
          docFrag.appendChild(
            isNode ? argItem : document.createTextNode(String(argItem))
          )
        })

        this.parentNode.insertBefore(docFrag, this)
      }
    })
  })
})([Element.prototype, CharacterData.prototype, DocumentType.prototype])

/**
 * Element.after polyfill
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/after
 */
;(function (arr) {
  arr.forEach(function (item) {
    /* eslint-disable */
    if (item.hasOwnProperty('after')) return
    /* eslint-enable */

    Object.defineProperty(item, 'after', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function after () {
        const argArr = Array.prototype.slice.call(arguments)
        const docFrag = document.createDocumentFragment()

        argArr.forEach(function (argItem) {
          const isNode = argItem instanceof Node
          docFrag.appendChild(
            isNode ? argItem : document.createTextNode(String(argItem))
          )
        })

        this.parentNode.insertBefore(docFrag, this.nextSibling)
      }
    })
  })
})([Element.prototype, CharacterData.prototype, DocumentType.prototype])

// ========================
// Variables
// ========================
const draggables = document.querySelectorAll('[data-draggable]')

// ========================
// Functions
// ========================
const getDropzone = element => {
  const { left, top } = element.getBoundingClientRect()
  const hitTest = document.elementFromPoint(left, top)
  if (!hitTest) return
  return hitTest.closest('[data-dropzone]')
}

function getCurrentPreviewPosition (dropzone, preview) {
  return [...dropzone.children].findIndex(element => {
    return element === preview
  })
}

function getDesiredPreviewPosition (dropzone, element) {
  const { left, top } = element.getBoundingClientRect()

  const positions = [...dropzone.children].map(element =>
    element.getBoundingClientRect()
  )

  return positions.findIndex(pos => {
    return (
      pos.left < left && left < pos.right && pos.top < top && top < pos.bottom
    )
  })
}

// ========================
// Execution
// ========================
draggables.forEach(draggable => {
  draggable.addEventListener('pointerdown', event => {
    event.preventDefault()

    const target = event.target
    const box = target.getBoundingClientRect()
    let prevScreenX = event.screenX
    let prevScreenY = event.screenY

    const preview = target.cloneNode()
    preview.classList.add('preview')
    target.before(preview)

    document.body.append(target)
    target.dataset.dragging = true

    target.style.left = `${box.left}px`
    target.style.top = `${box.top}px`
    target.style.width = `${box.width}px`
    target.style.height = `${box.height}px`

    target.setPointerCapture(event.pointerId)
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)

    function move (event) {
      // Get movementX and movementY to calculate amount the mouse moves
      // Need this because Safari doesn't support movementX and movementY
      const movementX = event.screenX - prevScreenX
      const movementY = event.screenY - prevScreenY
      prevScreenX = event.screenX
      prevScreenY = event.screenY

      // Change position of target element
      const left = parseFloat(target.style.left)
      const top = parseFloat(target.style.top)
      target.style.left = `${left + movementX}px`
      target.style.top = `${top + movementY}px`

      // Detect dropzone
      const dropzone = getDropzone(target)
      if (!dropzone) return

      // Adds preview into dropzone if it's not there
      let previewPos = getCurrentPreviewPosition(dropzone, preview)
      if (previewPos === -1) {
        dropzone.append(preview)
        previewPos = dropzone.children.length - 1
      }

      // Switches preview to desired position
      const position = getDesiredPreviewPosition(dropzone, target)
      if (position === -1) return

      const elem = dropzone.children[position]
      if (position > previewPos) {
        elem.after(preview)
      } else {
        elem.before(preview)
      }
    }

    function up (event) {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.releasePointerCapture(event.pointerId)

      target.dataset.dragging = false

      preview.before(target)
      preview.remove()
    }
  })
})
