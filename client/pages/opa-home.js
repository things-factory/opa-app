import { PageView } from '@things-factory/shell'
import { html } from 'lit-element'

class OpaHome extends PageView {
  render() {
    return html`
      <h2>OPA Home</h2>
    `
  }
}

window.customElements.define('opa-home', OpaHome)
