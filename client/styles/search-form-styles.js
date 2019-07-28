import { css } from 'lit-element'

export const SearchFormStyles = css`
  :host {
    overflow: auto;
    background-color: var(--search-form-background-color);
  }

  .search-form {
    position: relative;
    display: grid;
    grid-template-columns: repeat(24, 1fr);
    grid-gap: var(--form-grid-gap);
    grid-auto-rows: minmax(24px, auto);
    padding: var(--search-form-box-padding);
    box-shadow: var(--search-form-box-shadow);
  }
  .search-form label {
    grid-column: span 3;
    text-align: right;
    align-self: center;
    text-transform: capitalize;

    color: var(--label-color);
    font: var(--label-font);
  }

  .search-form input,
  .search-form select {
    grid-column: span 9;

    border: var(--input-field-border);
    border-radius: var(--input-field-border-radius);
    padding: var(--input-field-padding);
    font: var(--input-field-font);
    max-width: 85%;
  }

  .search-form input[type='checkbox'],
  .search-form input[type='radio'] {
    justify-self: end;
    align-self: center;
    grid-column: span 3 / auto;
    position: relative;
    left: 17px;
  }

  .search-form input[type='checkbox'] + label,
  .search-form input[type='radio'] + label {
    padding-left: 17px;
    text-align: left;
    align-self: center;
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

  [search] {
    position: absolute;
    right: 1%;
    bottom: 15px;
    color: var(--search-form-icon-color);
  }

  @media screen and (max-width: 460px) {
    .search-form {
      grid-template-columns: repeat(12, 1fr);
      grid-gap: 10px 5px;
      background-color: var(--search-form-narrow-background-color);

      max-height: 54px;
      overflow-y: auto;
    }
    .search-form label {
      grid-column: span 3;
      padding-right: 5px;
      align-self: center;
      color: var(--search-form-narrow-text-color);
    }
    .search-form input,
    .search-form select {
      grid-column: span 9;
      max-width: 85%;
    }
    .search-form input[type='checkbox'],
    .search-form input[type='radio'] {
      justify-self: end;
      align-self: center;
      grid-column: span 3 / auto;
    }

    .search-form input[type='checkbox'] + label,
    .search-form input[type='radio'] + label {
      grid-column: span 8 / auto;
      align-self: center;
      position: relative;
      left: 5px;
      color: var(--search-form-narrow-text-color);
    }

    [search] {
      right: 3%;
      color: var(--search-form-narrow-text-color);
    }
  }

  @media screen and (min-width: 1201px) and (max-width: 2000px) {
    .search-form {
      grid-template-columns: repeat(36, 1fr);
    }
    .search-form input,
    .search-form select {
      max-width: 90%;
    }
  }

  @media screen and (min-width: 2001px) {
    .search-form {
      grid-template-columns: repeat(48, 1fr);
    }
    .search-form input,
    .search-form select {
      max-width: 90%;
    }
    [search] {
      right: 0.8%;
    }
  }
`
