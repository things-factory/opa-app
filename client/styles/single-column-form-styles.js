import { css } from 'lit-element'

export const SingleColumnFormStyles = css`
  :host {
    overflow: auto;
  }

  .single-column-form {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-gap: var(--form-grid-gap);
    grid-auto-rows: minmax(24px, auto);
    max-width: var(--form-max-width);
    margin: var(--form-margin);
  }
  .single-column-form fieldset {
    display: contents;
  }
  .single-column-form legend {
    grid-column: span 12;
    text-transform: capitalize;

    padding: var(--legend-padding);
    font: var(--legend-font);
    color: var(--legend-text-color);
    border-bottom: var(--legend-border-bottom);
  }

  .single-column-form label {
    grid-column: span 3;
    text-align: right;
    text-transform: capitalize;

    color: var(--label-color);
    font: var(--label-font);
  }

  .single-column-form input,
  .single-column-form table,
  .single-column-form select,
  .single-column-form textarea {
    grid-column: span 8;

    border: var(--input-field-border);
    border-radius: var(--input-field-border-radius);
    padding: var(--input-field-padding);
    font: var(--input-field-font);
  }

  .single-column-form input[type='checkbox'],
  .single-column-form input[type='radio'] {
    justify-self: end;
    align-self: start;
    grid-column: span 3 / auto;
    position: relative;
    left: 17px;
  }

  .single-column-form input[type='checkbox'] + label,
  .single-column-form input[type='radio'] + label {
    padding-left: 17px;
    text-align: left;
    grid-column: span 9 / auto;

    font: var(--form-sublabel-font);
    color: var(--form-sublabel-color);
  }

  input:focus {
    outline: none;
    border: 1px solid var(--focus-background-color);
  }
  input[type='checkbox'] {
    margin: 0;
  }

  @media screen and (max-width: 400px) {
    .single-column-form {
      max-width: 90%;
      grid-gap: 5px;
    }
    .single-column-form label {
      grid-column: span 12;
      text-align: left;
      align-self: end;
    }
    .single-column-form input,
    .single-column-form table,
    .single-column-form select,
    .single-column-form textarea {
      grid-column: span 12;
    }
    .single-column-form input[type='checkbox'],
    .single-column-form input[type='radio'] {
      justify-self: start;
      align-self: center;
      grid-column: span 1 / auto;
    }

    .single-column-form input[type='checkbox'] + label,
    .single-column-form input[type='radio'] + label {
      grid-column: span 11 / auto;
      align-self: center;
    }
  }
`
